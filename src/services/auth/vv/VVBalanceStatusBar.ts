// VVCode Customization: VVCode 余额状态栏
// Created: 2025-12-23

import * as vscode from "vscode"
import { VVAuthService } from "./VVAuthService"

/**
 * VVCode 余额状态栏管理器
 */
export class VVBalanceStatusBar {
	private static instance: VVBalanceStatusBar | null = null
	private statusBarItem: vscode.StatusBarItem | null = null
	private refreshTimer: NodeJS.Timeout | null = null
	private lastRefreshTime: number = 0
	private isRefreshing: boolean = false

	private constructor() {}

	/**
	 * 获取单例实例
	 */
	public static getInstance(): VVBalanceStatusBar {
		if (!VVBalanceStatusBar.instance) {
			VVBalanceStatusBar.instance = new VVBalanceStatusBar()
		}
		return VVBalanceStatusBar.instance
	}

	/**
	 * 初始化状态栏
	 */
	public initialize(context: vscode.ExtensionContext): void {
		// 创建状态栏项
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
		this.statusBarItem.command = "vvcode.refreshBalance"
		this.statusBarItem.tooltip = "点击刷新余额"

		context.subscriptions.push(this.statusBarItem)

		// 初始化显示
		this.updateDisplay()

		// 设置定时刷新（10分钟）
		this.startAutoRefresh()
	}

	/**
	 * 更新显示
	 */
	public updateDisplay(): void {
		if (!this.statusBarItem) {
			return
		}

		try {
			const authService = VVAuthService.getInstance()
			const userInfo = authService.getUserInfo()

			if (!userInfo || userInfo.quota === undefined) {
				this.statusBarItem.hide()
				return
			}

			// 格式化余额显示
			const balance = (userInfo.quota / 500000).toFixed(2)
			this.statusBarItem.text = `$(credit-card) VVCode $${balance}`
			this.statusBarItem.show()
		} catch (error) {
			console.error("[VVBalanceStatusBar] Failed to update display:", error)
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
			console.log("[VVBalanceStatusBar] Refresh throttled")
			return
		}

		this.isRefreshing = true
		this.lastRefreshTime = now

		try {
			const authService = VVAuthService.getInstance()
			await authService.refreshUserInfo()
			this.updateDisplay()
		} catch (error) {
			console.error("[VVBalanceStatusBar] Failed to refresh balance:", error)
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
