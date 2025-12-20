import { useState } from "react"
import { Button } from "@/components/ui/button"
import VVUsageGuideView from "./VVUsageGuideView"

type OnboardingStep = "welcome" | "usageGuide"

const VVWelcomeView = () => {
	const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome")

	// 欢迎页
	if (currentStep === "welcome") {
		return (
			<div className="fixed inset-0 p-0 flex flex-col w-full bg-background">
				<div className="h-full flex flex-col items-center justify-center">
					{/* Logo - 极简设计，更大的尺寸 */}
					<div className="size-32 rounded-full bg-button-background flex items-center justify-center mb-16 shadow-sm">
						<span className="text-5xl font-light tracking-wider text-white">VV</span>
					</div>

					{/* 品牌名称 - 简洁优雅 */}
					<h1 className="text-4xl font-extralight text-foreground mb-8 tracking-wide">VV Code</h1>

					{/* 品牌介绍 - 极简文案 */}
					<p className="text-base font-light text-foreground/60 text-center max-w-sm mb-16 leading-relaxed">
						AI 驱动的智能编程助手
					</p>

					{/* 开始按钮 - 简洁设计 */}
					<Button
						className="px-12 py-6 text-base font-normal rounded-full"
						onClick={() => setCurrentStep("usageGuide")}
						variant="default">
						开始体验
					</Button>
				</div>
			</div>
		)
	}

	// 使用指南页
	return <VVUsageGuideView />
}

export default VVWelcomeView
