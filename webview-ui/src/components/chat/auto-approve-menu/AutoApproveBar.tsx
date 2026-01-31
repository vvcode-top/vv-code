import { useRef, useState } from "react"
import { useExtensionState } from "@/context/ExtensionStateContext"
import { getAsVar, VSC_TITLEBAR_INACTIVE_FOREGROUND } from "@/utils/vscStyles"
import AutoApproveModal from "./AutoApproveModal"
import { ACTION_METADATA } from "./constants"

interface AutoApproveBarProps {
	style?: React.CSSProperties
}

const AutoApproveBar = ({ style }: AutoApproveBarProps) => {
	const { autoApprovalSettings, yoloModeToggled, navigateToSettings } = useExtensionState()

	const [isModalVisible, setIsModalVisible] = useState(false)
	const buttonRef = useRef<HTMLDivElement>(null)

	const handleNavigateToFeatures = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		navigateToSettings("features")
	}

	const getEnabledActionsText = () => {
		const baseClasses = isModalVisible
			? "text-foreground truncate"
			: "text-muted-foreground group-hover:text-foreground truncate"
		const enabledActionsNames = Object.keys(autoApprovalSettings.actions).filter(
			(key) => autoApprovalSettings.actions[key as keyof typeof autoApprovalSettings.actions],
		)
		const enabledActions = enabledActionsNames.map((action) => {
			return ACTION_METADATA.flatMap((a) => [a, a.subAction]).find((a) => a?.id === action)
		})

		// Filter out parent actions if their subaction is also enabled (show only subaction)
		const actionsToShow = enabledActions.filter((action) => {
			if (!action?.shortName) {
				return false
			}

			// If this is a parent action and its subaction is enabled, skip it
			if (action.subAction?.id && enabledActionsNames.includes(action.subAction.id)) {
				return false
			}

			return true
		})

		if (actionsToShow.length === 0) {
			return <span className={baseClasses}>None</span>
		}

		return (
			<span className={baseClasses}>
				{actionsToShow.map((action, index) => (
					<span key={action?.id}>
						{action?.shortName}
						{index < actionsToShow.length - 1 && ", "}
					</span>
				))}
			</span>
		)
	}

	const toggleModal = () => {
		setIsModalVisible((prev) => !prev)
	}

	const borderColor = `color-mix(in srgb, ${getAsVar(VSC_TITLEBAR_INACTIVE_FOREGROUND)} 20%, transparent)`
	const borderGradient = `linear-gradient(to bottom, ${borderColor} 0%, transparent 50%)`
	const bgColor = `color-mix(in srgb, var(--vscode-sideBar-background) 98%, white)`

	// If YOLO mode is enabled, show disabled message
	if (yoloModeToggled) {
		return (
			<div
				className="mx-3.5 select-none break-words relative"
				style={{
					borderTop: `0.5px solid ${borderColor}`,
					borderRadius: "4px 4px 0 0",
					background: bgColor,
					opacity: 0.5,
					...style,
				}}>
				{/* Left border gradient */}
				<div
					className="absolute left-0 pointer-events-none"
					style={{
						width: 0.5,
						top: 3,
						height: "100%",
						background: borderGradient,
					}}
				/>
				{/* Right border gradient */}
				<div
					className="absolute right-0 top-0 pointer-events-none"
					style={{
						width: 0.5,
						top: 3,
						height: "100%",
						background: borderGradient,
					}}
				/>

				<div className="pt-4 pb-3.5 px-3.5">
					<div className="text-sm mb-1">Auto-approve: YOLO</div>
					<div className="text-muted-foreground text-xs">
						YOLO mode is enabled.{" "}
						<span className="underline cursor-pointer hover:text-foreground" onClick={handleNavigateToFeatures}>
							Disable it in Settings
						</span>
						.
					</div>
				</div>
			</div>
		)
	}

	// Collapsed state - show only icon on the right (floating)
	if (!isModalVisible) {
		return (
			<div
				className="absolute top-0 right-0 z-10 pointer-events-none"
				style={{ transform: "translateY(-100%)", paddingRight: "14px", paddingBottom: "1px", ...style }}>
				<div
					aria-label="Open auto-approve settings"
					className="cursor-pointer rounded hover:opacity-100 transition-all pointer-events-auto"
					onClick={toggleModal}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault()
							e.stopPropagation()
							toggleModal()
						}
					}}
					ref={buttonRef}
					style={{
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						padding: "6px 8px",
						minWidth: "32px",
						minHeight: "28px",
						color: "var(--vscode-foreground)",
						backgroundColor: bgColor,
						opacity: 0.95,
						boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
					}}
					tabIndex={0}>
					<span className="codicon codicon-fold-up" style={{ fontSize: "16px" }} />
				</div>

				<AutoApproveModal
					ACTION_METADATA={ACTION_METADATA}
					buttonRef={buttonRef}
					isVisible={isModalVisible}
					setIsVisible={setIsModalVisible}
				/>
			</div>
		)
	}

	// Expanded state - show full bar with actions
	return (
		<div
			className="mx-3.5 select-none break-words relative"
			style={{
				borderTop: `0.5px solid ${borderColor}`,
				borderRadius: "4px 4px 0 0",
				background: bgColor,
				...style,
			}}>
			{/* Left border gradient */}
			<div
				className="absolute left-0 pointer-events-none"
				style={{
					width: 0.5,
					top: 3,
					height: "100%",
					background: borderGradient,
				}}
			/>
			{/* Right border gradient */}
			<div
				className="absolute right-0 top-0 pointer-events-none"
				style={{
					width: 0.5,
					top: 3,
					height: "100%",
					background: borderGradient,
				}}
			/>

			<div
				aria-label="Close auto-approve settings"
				className="group cursor-pointer pt-3 pb-3.5 pr-2 px-3.5 flex items-center justify-between gap-0"
				onClick={toggleModal}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault()
						e.stopPropagation()
						toggleModal()
					}
				}}
				ref={buttonRef}
				tabIndex={0}>
				<div className="flex flex-nowrap items-center gap-1 min-w-0 flex-1">
					<span className="whitespace-nowrap">Auto-approve:</span>
					{getEnabledActionsText()}
				</div>
				<span className="codicon codicon-chevron-down" />
			</div>

			<AutoApproveModal
				ACTION_METADATA={ACTION_METADATA}
				buttonRef={buttonRef}
				isVisible={isModalVisible}
				setIsVisible={setIsModalVisible}
			/>
		</div>
	)
}

export default AutoApproveBar
