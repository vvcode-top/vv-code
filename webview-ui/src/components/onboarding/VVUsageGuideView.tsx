import { useEffect } from "react"
import { useVVAuth } from "@/hooks/useVVAuth"
import { StateServiceClient } from "@/services/grpc-client"

const VVUsageGuideView = () => {
	const { isAuthenticated, user } = useVVAuth()

	useEffect(() => {
		// 页面加载时自动标记欢迎流程完成
		StateServiceClient.setWelcomeViewCompleted({ value: true }).catch(() => {})
	}, [])

	return (
		<div className="fixed inset-0 p-0 flex flex-col w-full bg-background">
			<div className="h-full flex flex-col items-center justify-center px-6">
				{/* 标题 */}
				<h1 className="text-2xl font-normal text-foreground mb-4">快速开始</h1>

				{/* 描述 */}
				<p className="text-sm text-foreground/50 text-center max-w-sm mb-8">
					{isAuthenticated && user ? `你好，${user.username}，我是你的 AI 编程助手` : "AI 驱动的智能编程助手"}
				</p>

				{/* 使用指南 */}
				<div className="w-full max-w-xs space-y-5">
					<div className="flex items-center gap-4">
						<div className="w-8 h-8 rounded-lg bg-[var(--vscode-input-background)] flex items-center justify-center flex-shrink-0">
							<i className="codicon codicon-comment-discussion text-foreground/70" />
						</div>
						<div>
							<p className="text-sm text-foreground">输入需求</p>
							<p className="text-xs text-foreground/40">在聊天框描述你想要完成的任务</p>
						</div>
					</div>

					<div className="flex items-center gap-4">
						<div className="w-8 h-8 rounded-lg bg-[var(--vscode-input-background)] flex items-center justify-center flex-shrink-0">
							<i className="codicon codicon-eye text-foreground/70" />
						</div>
						<div>
							<p className="text-sm text-foreground">审核方案</p>
							<p className="text-xs text-foreground/40">查看 AI 提供的解决方案</p>
						</div>
					</div>

					<div className="flex items-center gap-4">
						<div className="w-8 h-8 rounded-lg bg-[var(--vscode-input-background)] flex items-center justify-center flex-shrink-0">
							<i className="codicon codicon-check text-foreground/70" />
						</div>
						<div>
							<p className="text-sm text-foreground">确认执行</p>
							<p className="text-xs text-foreground/40">批准后自动应用更改</p>
						</div>
					</div>
				</div>

				{/* 提示 */}
				<p className="text-xs text-foreground/30 mt-8">在下方输入框开始对话</p>
			</div>
		</div>
	)
}

export default VVUsageGuideView
