// VVCode Customization: VVCode 余额状态栏
// Created: 2025-12-23
// Updated: 2025-12-28 - 整合选中代码提示功能

import { VvAuthService } from "@services/auth/vv/VvAuthService"
import { Logger } from "@shared/services/Logger"
import * as vscode from "vscode"

/**
 * VVCode 余额状态栏管理器
 * 功能：
 * 1. 无选中文本时：显示账户余额
 * 2. 有选中文本时：显示选中提示和快捷键
 */
export class VvBalanceStatusBar {
	private static instance: VvBalanceStatusBar | null = null
	private statusBarItem: vscode.StatusBarItem | null = null
	private refreshTimer: NodeJS.Timeout | null = null
	private lastRefreshTime: number = 0
	private isRefreshing: boolean = false
	private hasTextSelection: boolean = false

	private constructor() {}

	/**
	 * 获取单例实例
	 */
	public static getInstance(): VvBalanceStatusBar {
		if (!VvBalanceStatusBar.instance) {
			VvBalanceStatusBar.instance = new VvBalanceStatusBar()
		}
		return VvBalanceStatusBar.instance
	}

	/**
	 * 初始化状态栏
	 */
	public initialize(context: vscode.ExtensionContext): void {
		// 创建状态栏项
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)

		context.subscriptions.push(this.statusBarItem)

		// 监听编辑器选中变化
		context.subscriptions.push(
			vscode.window.onDidChangeTextEditorSelection(() => {
				this.updateSelectionState()
			}),
			vscode.window.onDidChangeActiveTextEditor(() => {
				this.updateSelectionState()
			}),
		)

		// 初始化显示
		this.updateSelectionState()
		this.updateDisplay()

		// 设置定时刷新（10分钟）
		this.startAutoRefresh()
	}

	/**
	 * 更新选中状态
	 */
	private updateSelectionState(): void {
		const editor = vscode.window.activeTextEditor
		const hasSelection = !!(editor && !editor.selection.isEmpty)

		// 更新状态
		this.hasTextSelection = hasSelection

		// 每次都更新显示（因为选中的行数可能变化）
		this.updateDisplay()
	}

	/**
	 * 获取快捷键（根据平台）
	 */
	private getShortcutKey(): string {
		return process.platform === "darwin" ? "Cmd+'" : "Ctrl+'"
	}

	/**
	 * 更新显示
	 */
	public updateDisplay(): void {
		if (!this.statusBarItem) {
			return
		}

		try {
			// 优先显示选中代码提示
			if (this.hasTextSelection) {
				const editor = vscode.window.activeTextEditor
				if (editor) {
					const lineCount = editor.selection.end.line - editor.selection.start.line + 1
					const shortcutKey = this.getShortcutKey()

					this.statusBarItem.text = `$(lightbulb) 已选中 ${lineCount} 行 | 按 ${shortcutKey} 添加到VVCode`
					this.statusBarItem.tooltip = `点击或按 ${shortcutKey} 将选中的代码添加到VVCode对话框`
					this.statusBarItem.command = "vvcode.addToChat"
					this.statusBarItem.show()
					return
				}
			}

			// 无选中时显示余额
			const authService = VvAuthService.getInstance()
			const userInfo = authService.getUserInfo()

			if (!userInfo || userInfo.quota === undefined) {
				this.statusBarItem.hide()
				return
			}

			// 格式化余额显示
			const balance = (userInfo.quota / 500000).toFixed(2)
			this.statusBarItem.text = `$(credit-card) VVCode $${balance}`
			this.statusBarItem.tooltip = "点击刷新余额"
			this.statusBarItem.command = "vvcode.refreshBalance"
			this.statusBarItem.show()
		} catch (error) {
			Logger.error("[VvBalanceStatusBar] Failed to update display:", error)
			this.statusBarItem.hide()
		}
	}

	/**
	 * 刷新余额
	 */
	public async refreshBalance(): Promise<void> {
		// 节流：5秒内只允许刷新一次
		const now = Date.now()
		if (this.isRefreshing || now - this.lastRefreshTime < 5000) {
			Logger.log("[VvBalanceStatusBar] Refresh throttled")
			return
		}

		this.isRefreshing = true
		this.lastRefreshTime = now

		try {
			const authService = VvAuthService.getInstance()
			await authService.refreshUserInfo()
			this.updateDisplay()
		} catch (error) {
			Logger.error("[VvBalanceStatusBar] Failed to refresh balance:", error)
		} finally {
			this.isRefreshing = false
		}
	}

	/**
	 * 启动自动刷新
	 */
	private startAutoRefresh(): void {
		// 清除旧的定时器
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer)
		}

		// 设置新的定时器（10分钟）
		this.refreshTimer = setInterval(
			() => {
				this.refreshBalance()
			},
			10 * 60 * 1000,
		)
	}

	/**
	 * 停止自动刷新
	 */
	private stopAutoRefresh(): void {
		if (this.refreshTimer) {
			clearInterval(this.refreshTimer)
			this.refreshTimer = null
		}
	}

	/**
	 * 销毁状态栏
	 */
	public dispose(): void {
		this.stopAutoRefresh()
		if (this.statusBarItem) {
			this.statusBarItem.dispose()
			this.statusBarItem = null
		}
	}
}
