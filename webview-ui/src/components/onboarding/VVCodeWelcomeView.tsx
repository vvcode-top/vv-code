import { Button } from "@/components/ui/button"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { StateServiceClient } from "@/services/grpc-client"

const VVCodeWelcomeView = () => {
	const { setShowWelcome, hideSettings, hideAccount } = useExtensionState()

	const handleGetStarted = async () => {
		// 标记欢迎页面已完成
		await StateServiceClient.setWelcomeViewCompleted({ value: true }).catch(() => {})
		setShowWelcome(false)
		hideSettings()
		hideAccount()
	}

	return (
		<div className="fixed inset-0 p-0 flex flex-col w-full">
			<div className="h-full px-5 overflow-auto flex flex-col gap-6 items-center justify-center">
				{/* Logo 区域 - 可以替换成你自己的 Logo */}
				<div className="size-20 rounded-full bg-button-background flex items-center justify-center">
					<span className="text-3xl font-bold text-white">VV</span>
				</div>

				{/* 标题 */}
				<h1 className="text-2xl font-bold text-foreground">欢迎使用 VV Code</h1>

				{/* 描述 */}
				<p className="text-foreground/70 text-center max-w-md">
					VV Code 是一个强大的 AI 编程助手，帮助你更高效地完成开发工作。
				</p>

				{/* 功能特点 */}
				<div className="flex flex-col gap-3 max-w-md w-full">
					<div className="flex items-center gap-3 p-3 rounded-md bg-input-background/50">
						<span className="text-lg">🚀</span>
						<span className="text-sm text-foreground">智能代码生成与补全</span>
					</div>
					<div className="flex items-center gap-3 p-3 rounded-md bg-input-background/50">
						<span className="text-lg">💡</span>
						<span className="text-sm text-foreground">代码解释与重构建议</span>
					</div>
					<div className="flex items-center gap-3 p-3 rounded-md bg-input-background/50">
						<span className="text-lg">🔧</span>
						<span className="text-sm text-foreground">自动化开发工作流</span>
					</div>
				</div>

				{/* 开始按钮 */}
				<Button className="w-full max-w-md mt-4" onClick={handleGetStarted} variant="default">
					开始使用
				</Button>

				{/* 底部提示 */}
				<p className="text-xs text-foreground/50 text-center">点击开始后，你可以随时在设置中调整配置</p>
			</div>
		</div>
	)
}

export default VVCodeWelcomeView
