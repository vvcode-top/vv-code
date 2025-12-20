import AccountView from "./components/account/AccountView"
import ChatView from "./components/chat/ChatView"
import HistoryView from "./components/history/HistoryView"
import McpView from "./components/mcp/configuration/McpConfigurationView"
import VVWelcomeView from "./components/onboarding/VVWelcomeView"
import SettingsView from "./components/settings/SettingsView"
import VVSettingsView from "./components/settings/VVSettingsView" // VVCode Customization: 添加 VV 设置页面
import { useClineAuth } from "./context/ClineAuthContext"
import { useExtensionState } from "./context/ExtensionStateContext"
import { Providers } from "./Providers"

const AppContent = () => {
	const {
		didHydrateState,
		showWelcome,
		showMcp,
		mcpTab,
		showSettings,
		settingsTargetSection,
		showHistory,
		showAccount,
		showVVSettings, // VVCode Customization: 添加 VV 设置页面状态
		closeMcpView,
		hideSettings,
		hideHistory,
		hideAccount,
		hideVVSettings, // VVCode Customization: 添加 VV 设置页面隐藏函数
	} = useExtensionState()

	const { clineUser, organizations, activeOrganization } = useClineAuth()

	if (!didHydrateState) {
		return null
	}

	if (showWelcome) {
		return <VVWelcomeView />
	}

	return (
		<div className="flex h-screen w-full flex-col">
			{showSettings && <SettingsView onDone={hideSettings} targetSection={settingsTargetSection} />}
			{showHistory && <HistoryView onDone={hideHistory} />}
			{showMcp && <McpView initialTab={mcpTab} onDone={closeMcpView} />}
			{showAccount && (
				<AccountView
					activeOrganization={activeOrganization}
					clineUser={clineUser}
					onDone={hideAccount}
					organizations={organizations}
				/>
			)}
			{/* VVCode Customization: 添加 VV 设置页面 */}
			{showVVSettings && <VVSettingsView onDone={hideVVSettings} />}
			{/* Do not conditionally load ChatView, it's expensive and there's state we don't want to lose (user input, disableInput, askResponse promise, etc.) */}
			<ChatView isHidden={showSettings || showHistory || showMcp || showAccount || showVVSettings} />
		</div>
	)
}

const App = () => {
	return (
		<Providers>
			<AppContent />
		</Providers>
	)
}

export default App
