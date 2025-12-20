// VVCode Customization: 自定义简化版设置页面
// Original: 基于 HistoryView.tsx 的布局结构
// Modified: 2025-12-20

import { VSCodeButton } from "@vscode/webview-ui-toolkit/react"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { getEnvironmentColor } from "@/utils/environmentColors"

interface VVSettingsViewProps {
	onDone: () => void
}

/**
 * VV 自定义设置页面
 */
const VVSettingsView = ({ onDone }: VVSettingsViewProps) => {
	const { environment } = useExtensionState()

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
					<p
						style={{
							fontSize: "13px",
							marginTop: "15px",
							color: "var(--vscode-descriptionForeground)",
						}}>
						暂无可配置项
					</p>
				</div>
			</div>
		</div>
	)
}

export default VVSettingsView
