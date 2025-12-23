import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { useVVAuth } from "@/hooks/useVVAuth"
import VVUsageGuideView from "./VVUsageGuideView"

// VVCode logo - stylized double V with theme-aware background
const VVLogo = () => (
	<svg className="size-full" viewBox="0 0 100 100">
		<rect className="fill-primary" height="100" rx="20" width="100" />
		<path
			d="M20 28 L35 72 L50 28 M50 28 L65 72 L80 28"
			fill="none"
			stroke="white"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="8"
		/>
	</svg>
)

const VV_CREATE_TOKEN_URL = "https://vvcode.top/console/start"

type OnboardingStep = "welcome" | "usageGuide"

const VVWelcomeView = () => {
	const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome")
	const { isAuthenticated, isLoggingIn, login, user } = useVVAuth()
	const { vvGroupConfig, vvNeedsWebInit } = useExtensionState()

	// 检查是否有可用的 API Key
	// undefined 表示还在加载中，空数组或所有分组都没有 apiKey 表示需要创建
	const isLoadingConfig = vvGroupConfig === undefined
	const hasApiKey = vvGroupConfig?.some((g) => g.apiKey && g.apiKey.trim() !== "") ?? false

	// 欢迎页
	if (currentStep === "welcome") {
		return (
			<div className="fixed inset-0 p-0 flex flex-col w-full bg-background">
				<div className="h-full flex flex-col items-center justify-center px-6">
					{/* Logo */}
					<div className="size-24 mb-6 shadow-lg rounded-2xl overflow-hidden">
						<VVLogo />
					</div>

					{/* 品牌名称 */}
					<h1 className="text-3xl font-normal text-foreground mb-3">VV Code</h1>

					{/* 品牌介绍 */}
					<p className="text-sm text-foreground/50 text-center mb-8">AI 驱动的智能编程助手</p>

					{/* 登录状态/按钮 */}
					{isAuthenticated && user ? (
						<div className="w-full max-w-xs">
							<p className="text-sm text-foreground/70 text-center mb-4">
								欢迎，<span className="font-medium">{user.username}</span>
							</p>
							{isLoadingConfig ? (
								<div className="flex items-center justify-center gap-2 text-sm text-foreground/50 py-4">
									<i className="codicon codicon-loading codicon-modifier-spin"></i>
									<span>正在加载配置...</span>
								</div>
							) : vvNeedsWebInit ? (
								<div className="p-4 rounded-lg border border-[var(--vscode-input-border)] bg-[var(--vscode-input-background)]">
									<p className="text-sm text-foreground/60 text-center mb-3">请在网页端完成初始化</p>
									<a className="block w-full" href={VV_CREATE_TOKEN_URL} rel="noreferrer" target="_blank">
										<Button className="w-full" variant="default">
											<i className="codicon codicon-globe mr-2"></i>
											前往网页端
											<i className="codicon codicon-link-external ml-2 text-xs opacity-60"></i>
										</Button>
									</a>
									<p className="text-xs text-foreground/40 text-center mt-3">完成后将自动刷新</p>
								</div>
							) : !hasApiKey ? (
								<a className="block w-full" href={VV_CREATE_TOKEN_URL} rel="noreferrer" target="_blank">
									<Button className="w-full" variant="outline">
										<i className="codicon codicon-key mr-2"></i>
										创建分组以开始使用
									</Button>
								</a>
							) : (
								<Button className="w-full" onClick={() => setCurrentStep("usageGuide")} variant="default">
									开始体验
								</Button>
							)}
						</div>
					) : (
						<Button className="px-8 py-5" disabled={isLoggingIn} onClick={login} variant="default">
							{isLoggingIn ? (
								<>
									<i className="codicon codicon-loading codicon-modifier-spin mr-2"></i>
									正在跳转...
								</>
							) : (
								"登录账号"
							)}
						</Button>
					)}
				</div>
			</div>
		)
	}

	// 使用指南页
	return <VVUsageGuideView />
}

export default VVWelcomeView
