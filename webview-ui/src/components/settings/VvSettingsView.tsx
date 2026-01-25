// VVCode Customization: 自定义简化版设置页面
// Original: 基于 HistoryView.tsx 的布局结构
// Modified: 2025-12-20

import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { useVvAuth } from "@/hooks/useVvAuth"
import { VvAccountServiceClient } from "@/services/grpc-client"
import { getEnvironmentColor } from "@/utils/environmentColors"
import { VvCompletionSettings } from "./VvCompletionSettings"

interface VvSettingsViewProps {
	onDone: () => void
}

/**
 * VV 自定义设置页面
 */
const VvSettingsView = ({ onDone }: VvSettingsViewProps) => {
	const { environment, navigateToSettings } = useExtensionState()
	const { user, isAuthenticated, logout } = useVvAuth()
	const clickCountRef = useRef(0)
	const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const lastRefreshTimeRef = useRef<number>(0)

	// 统一刷新函数（刷新余额和配置）
	const handleRefresh = useCallback(async () => {
		// 节流：5秒内只允许刷新一次
		const now = Date.now()
		if (now - lastRefreshTimeRef.current < 5000) {
			console.log("Refresh throttled, please wait...")
			return
		}
		lastRefreshTimeRef.current = now

		setIsRefreshing(true)
		try {
			// 同时刷新用户信息和配置
			await Promise.all([VvAccountServiceClient.vvRefreshUserInfo({}), VvAccountServiceClient.vvResetAndRefreshConfig({})])
		} catch (error) {
			console.error("Failed to refresh:", error)
		} finally {
			setIsRefreshing(false)
		}
	}, [])

	// 十分钟自动刷新
	useEffect(() => {
		if (!isAuthenticated) return

		// 立即刷新一次
		handleRefresh()

		// 设置定时器，每10分钟刷新一次
		const interval = setInterval(
			() => {
				handleRefresh()
			},
			10 * 60 * 1000,
		) // 10分钟

		return () => clearInterval(interval)
	}, [isAuthenticated, handleRefresh])

	// 打开充值页面（使用 a 标签而不是 window.open）
	const topupUrl = "https://vvcode.top/console/topup"

	// 格式化余额显示
	const formatQuota = (quota: number) => {
		return (quota / 500000).toFixed(2)
	}

	// 连点5下用户名打开Cline设置
	const handleUsernameClick = useCallback(() => {
		clickCountRef.current += 1
		if (clickTimerRef.current) {
			clearTimeout(clickTimerRef.current)
		}
		if (clickCountRef.current >= 5) {
			clickCountRef.current = 0
			navigateToSettings()
		} else {
			clickTimerRef.current = setTimeout(() => {
				clickCountRef.current = 0
			}, 500)
		}
	}, [navigateToSettings])

	return (
		<div className="fixed overflow-hidden inset-0 flex flex-col">
			{/* Header */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					padding: "10px 17px 10px 20px",
				}}>
				<h3
					style={{
						color: getEnvironmentColor(environment),
						margin: 0,
					}}>
					设置
				</h3>
				<VSCodeButton onClick={() => onDone()}>Done</VSCodeButton>
			</div>

			{/* Content */}
			<div style={{ padding: "5px 17px 6px 20px", flex: 1, overflow: "auto" }}>
				<div style={{ maxWidth: "600px" }}>
					{/* 未登录状态 */}
					{!isAuthenticated && (
						<div className="mb-6">
							<h4 className="text-sm font-medium mb-3">账户</h4>
							<div className="p-4 border border-input-border rounded bg-input-background">
								<p className="text-sm text-description">请先登录 VVCode 账户</p>
							</div>
						</div>
					)}

					{/* 账户信息 */}
					{isAuthenticated && user && (
						<div className="mb-6">
							<h4 className="text-sm font-medium mb-3">账户</h4>
							<div className="p-4 border border-input-border rounded bg-input-background">
								<p className="text-sm font-medium cursor-pointer select-none mb-2" onClick={handleUsernameClick}>
									{user.username}
								</p>

								{/* 余额显示 */}
								{user.quota !== undefined && (
									<div className="mb-3 p-3 bg-vscode-editor-background rounded">
										<div className="flex justify-between items-center mb-1">
											<span className="text-xs text-description">当前余额</span>
										</div>
										<div className="text-lg font-semibold mb-1">¥{formatQuota(user.quota)}</div>
										{user.usedQuota !== undefined && (
											<div className="text-xs text-description">已使用: ¥{formatQuota(user.usedQuota)}</div>
										)}
									</div>
								)}

								<div className="flex gap-2 flex-wrap">
									<a
										href={topupUrl}
										rel="noopener noreferrer"
										style={{
											textDecoration: "none",
										}}
										target="_blank">
										<VSCodeButton appearance="primary">充值</VSCodeButton>
									</a>
									<VSCodeButton appearance="secondary" disabled={isRefreshing} onClick={handleRefresh}>
										{isRefreshing ? "刷新中..." : "刷新"}
									</VSCodeButton>
									<VSCodeButton appearance="secondary" onClick={logout}>
										退出登录
									</VSCodeButton>
								</div>
							</div>
						</div>
					)}

					{/* 代码补全设置 - 仅在已登录时显示 */}
					{isAuthenticated && (
						<div className="mb-6">
							<VvCompletionSettings />
						</div>
					)}

					<p
						style={{
							fontSize: "13px",
							marginTop: "15px",
							color: "var(--vscode-descriptionForeground)",
						}}>
						更多设置项即将推出
					</p>
				</div>
			</div>
		</div>
	)
}

export default VvSettingsView
