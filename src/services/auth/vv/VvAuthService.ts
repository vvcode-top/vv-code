// VVCode Customization: VVCode 认证服务
// Created: 2025-12-20

import type { Controller } from "@/core/controller"
import type { StreamingResponseHandler } from "@/core/controller/grpc-handler"
import { AuthHandler } from "@/hosts/external/AuthHandler"
import { HostProvider } from "@/hosts/host-provider"
import type { VvGroupConfig, VvGroupItem, VvGroupType, VvUserConfig, VvUserInfo } from "@/shared/storage/state-keys"
import { generateCodeChallenge, generateCodeVerifier, generateState } from "@/shared/vv-crypto"
import { openExternal } from "@/utils/env"
import { type VvAuthInfo, VvAuthProvider } from "./providers/VvAuthProvider"

/**
 * VVCode 认证服务
 * 使用 VSCode URI Handler + PKCE 实现安全的 OAuth2 认证流程
 */
export class VvAuthService {
	private static instance: VvAuthService | null = null
	private _controller: Controller | null = null
	private _provider: VvAuthProvider
	private _authenticated: boolean = false
	private _activeAuthStatusUpdateSubscriptions = new Set<{
		controller: Controller
		responseStream: StreamingResponseHandler<VvAuthState>
	}>()

	// 防止重复请求的标记
	private _processingAuthCallback: boolean = false
	private _lastProcessedCode: string | null = null

	// 认证配置
	private readonly PUBLISHER = "PiuQiuPiaQia" // package.json 中的 publisher
	private readonly EXTENSION_ID = "vvcode" // package.json 中的 name

	// API 地址配置（支持开发环境）
	private readonly API_BASE_URL: string
	private readonly AUTH_PAGE_URL: string

	private constructor() {
		// 检测开发环境（仅通过 IS_DEV 环境变量）
		const isDevelopment = process.env.IS_DEV === "true"
		const devBaseUrl = process.env.DEV_BASE_URL || "http://127.0.0.1:3000"

		// 支持通过环境变量自定义 API 地址（必须是非空字符串）
		const customApiUrl = process.env.VV_API_BASE_URL
		if (customApiUrl && customApiUrl.trim() !== "" && customApiUrl !== "undefined") {
			this.API_BASE_URL = customApiUrl
			this.AUTH_PAGE_URL = `${customApiUrl.replace("/api", "")}/oauth/vscode/login`
		} else if (isDevelopment) {
			// 开发环境默认使用本地地址
			this.API_BASE_URL = `${devBaseUrl}/api`
			this.AUTH_PAGE_URL = `${devBaseUrl}/oauth/vscode/login`
		} else {
			// 生产环境
			this.API_BASE_URL = "https://vvcode.top/api"
			this.AUTH_PAGE_URL = "https://vvcode.top/oauth/vscode/login"
		}

		this._provider = new VvAuthProvider(this.API_BASE_URL)
	}

	private requireController(): Controller {
		if (!this._controller) {
			throw new Error("Controller has not been initialized")
		}
		return this._controller
	}

	/**
	 * 初始化单例
	 */
	public static initialize(controller: Controller): VvAuthService {
		if (!VvAuthService.instance) {
			VvAuthService.instance = new VvAuthService()
		}
		VvAuthService.instance._controller = controller

		// 如果用户已登录，主动获取分组配置
		VvAuthService.instance.initGroupConfigIfAuthenticated()

		return VvAuthService.instance
	}

	/**
	 * 获取单例实例
	 */
	public static getInstance(): VvAuthService {
		if (!VvAuthService.instance || !VvAuthService.instance._controller) {
			throw new Error("VvAuthService not initialized. Call VvAuthService.initialize(controller) first.")
		}
		return VvAuthService.instance
	}

	/**
	 * 获取当前认证状态
	 */
	public getInfo(): VvAuthState {
		const controller = this.requireController()
		const user = controller.stateManager.getGlobalStateKey("vvUserInfo")

		return {
			user: user || undefined,
		}
	}

	/**
	 * 是否已认证
	 */
	public get isAuthenticated(): boolean {
		const controller = this.requireController()
		const accessToken = controller.stateManager.getSecretKey("vv:accessToken")
		return !!accessToken
	}

	/**
	 * 初始化时检查登录状态并获取分组配置
	 * 注意：WebView 初始化时会再次调用 refreshGroupConfig，确保状态同步
	 */
	private async initGroupConfigIfAuthenticated(): Promise<void> {
		if (!this.isAuthenticated) {
			return
		}

		try {
			await this.refreshGroupConfig()
		} catch (error) {
			console.warn("[VVAuth] Failed to init group config on startup:", error)
		}
	}

	/**
	 * 创建登录请求（打开浏览器）
	 */
	public async createAuthRequest(): Promise<string> {
		const controller = this.requireController()

		// 1. 生成 PKCE 参数
		const state = generateState()
		const codeVerifier = generateCodeVerifier()
		const codeChallenge = generateCodeChallenge(codeVerifier)

		// 2. 保存到 GlobalState（临时使用，因为 Secrets 可能在扩展重载时丢失）
		controller.stateManager.setGlobalState("vv:authState", state)
		controller.stateManager.setGlobalState("vv:codeVerifier", codeVerifier)

		// 3. 强制立即持久化到磁盘
		await controller.stateManager.flushPendingState()

		// 4. 验证保存成功
		const savedState = controller.stateManager.getGlobalStateKey("vv:authState")
		const savedVerifier = controller.stateManager.getGlobalStateKey("vv:codeVerifier")

		if (!savedState || !savedVerifier) {
			throw new Error("Failed to save authentication state. Please try again.")
		}

		// 5. 构建回调 URI（使用 HostProvider 获取回调 URL）
		const callbackHost = await HostProvider.get().getCallbackUrl()
		const callbackUri = `${callbackHost}/vv-callback`

		// 6. 构建授权 URL
		const authUrl = new URL(this.AUTH_PAGE_URL)
		authUrl.searchParams.set("state", state)
		authUrl.searchParams.set("code_challenge", codeChallenge)
		authUrl.searchParams.set("redirect_uri", callbackUri)

		// 7. 打开浏览器
		await openExternal(authUrl.toString())

		return authUrl.toString()
	}

	/**
	 * 创建备用登录请求（使用本地回环）
	 * 当 URI Handler 无法正常工作时，使用本地 HTTP 服务器接收回调
	 */
	public async createFallbackAuthRequest(): Promise<string> {
		const controller = this.requireController()

		// 1. 生成 PKCE 参数
		const state = generateState()
		const codeVerifier = generateCodeVerifier()
		const codeChallenge = generateCodeChallenge(codeVerifier)

		// 2. 保存到 GlobalState（临时使用，因为 Secrets 可能在扩展重载时丢失）
		controller.stateManager.setGlobalState("vv:authState", state)
		controller.stateManager.setGlobalState("vv:codeVerifier", codeVerifier)

		// 3. 强制立即持久化到磁盘
		await controller.stateManager.flushPendingState()

		// 4. 验证保存成功
		const savedState = controller.stateManager.getGlobalStateKey("vv:authState")
		const savedVerifier = controller.stateManager.getGlobalStateKey("vv:codeVerifier")

		if (!savedState || !savedVerifier) {
			throw new Error("Failed to save authentication state. Please try again.")
		}

		// 5. 启用 AuthHandler 并获取本地回环 URL
		AuthHandler.getInstance().setEnabled(true)
		const callbackHost = await AuthHandler.getInstance().getCallbackUrl()
		const callbackUri = `${callbackHost}/vv-callback`

		// 6. 构建授权 URL
		const authUrl = new URL(this.AUTH_PAGE_URL)
		authUrl.searchParams.set("state", state)
		authUrl.searchParams.set("code_challenge", codeChallenge)
		authUrl.searchParams.set("redirect_uri", callbackUri)

		// 7. 打开浏览器
		await openExternal(authUrl.toString())

		return authUrl.toString()
	}

	/**
	 * 处理认证回调
	 * @param code 授权码
	 * @param state CSRF 防护 state
	 */
	public async handleAuthCallback(code: string, state: string): Promise<void> {
		const controller = this.requireController()

		// 防止重复处理同一个授权码
		if (this._processingAuthCallback) {
			return
		}

		if (this._lastProcessedCode === code) {
			return
		}

		this._processingAuthCallback = true

		try {
			// 1. 验证 state（优先从 StateManager 读取，fallback 到直接读取 context）
			let storedState = controller.stateManager.getGlobalStateKey("vv:authState")

			// 如果 StateManager 缓存中没有，尝试直接从 context 读取
			if (!storedState) {
				storedState = controller.context.globalState.get<string>("vv:authState")
			}

			if (!storedState) {
				throw new Error(
					"Authentication state not found. This may happen if the extension was reloaded. Please try logging in again.",
				)
			}

			if (state !== storedState) {
				throw new Error("Invalid state parameter - possible CSRF attack")
			}

			// 2. 获取 code_verifier
			let codeVerifier = controller.stateManager.getGlobalStateKey("vv:codeVerifier")
			if (!codeVerifier) {
				codeVerifier = controller.context.globalState.get<string>("vv:codeVerifier")
			}
			if (!codeVerifier) {
				throw new Error("Code verifier not found. Please try logging in again.")
			}

			// 3. 使用 code 交换 access_token
			const authInfo: VvAuthInfo = await this._provider.exchangeCodeForToken(code, codeVerifier, state)

			// 4. 存储 access_token 和 user_id
			controller.stateManager.setSecret("vv:accessToken", authInfo.accessToken)
			controller.stateManager.setSecret("vv:userId", authInfo.userId.toString())

			// 5. 获取用户详细信息
			const userInfo = await this._provider.getUserInfo(authInfo.accessToken, authInfo.userId)
			controller.stateManager.setGlobalState("vvUserInfo", userInfo)

			// 6. 获取用户配置（可选）
			try {
				const userConfig = await this._provider.getUserConfig(authInfo.accessToken, authInfo.userId)
				controller.stateManager.setGlobalState("vvUserConfig", userConfig)
			} catch (error) {
				console.warn("[VVAuth] Failed to fetch user config:", error)
			}

			// 7. 清除旧的 API 配置，获取分组配置并自动应用默认分组
			try {
				// 先清除旧的 API 配置，确保使用最新的服务器配置
				controller.stateManager.setSecret("apiKey", undefined)
				controller.stateManager.setGlobalState("anthropicBaseUrl", undefined)
				controller.stateManager.setGlobalState("vvGroupConfig", undefined)
				controller.stateManager.setGlobalState("vvNeedsWebInit", undefined)

				let groupConfig = await this._provider.getGroupTokens(authInfo.accessToken, authInfo.userId)

				// 检查是否有分组没有 apiKey，如果有则调用初始化接口
				const hasEmptyApiKey = groupConfig.some((g) => !g.apiKey)
				if (hasEmptyApiKey) {
					console.log("[VVAuth] Some groups have no API key, initializing...")
					try {
						groupConfig = await this._provider.initGroupTokens(authInfo.accessToken, authInfo.userId)
					} catch (initError) {
						// 初始化失败，引导用户去 web 端
						console.warn("[VVAuth] Failed to init group tokens, need web init:", initError)
						controller.stateManager.setGlobalState("vvGroupConfig", groupConfig)
						controller.stateManager.setGlobalState("vvNeedsWebInit", true)
						// 继续执行后续流程，不抛出错误
					}
				}

				// 再次检查是否还有空的 apiKey
				const stillHasEmptyApiKey = groupConfig.some((g) => !g.apiKey)
				console.log("[VVAuth] After init, groupConfig:", JSON.stringify(groupConfig, null, 2))
				console.log("[VVAuth] stillHasEmptyApiKey:", stillHasEmptyApiKey)
				if (stillHasEmptyApiKey) {
					controller.stateManager.setGlobalState("vvNeedsWebInit", true)
				}

				controller.stateManager.setGlobalState("vvGroupConfig", groupConfig)

				// 选择并应用分组配置
				const groupToApply = this.selectGroupToApply(groupConfig)
				if (groupToApply) {
					await this.applyGroupConfig(groupToApply)

					// 只在用户没有选择过分组时，才设置默认值（首次登录）
					const currentSelection = controller.stateManager.getGlobalStateKey("vvSelectedGroupType")
					if (!currentSelection) {
						controller.stateManager.setGlobalState("vvSelectedGroupType", groupToApply.type as VvGroupType)
					}
				}
			} catch (error) {
				console.warn("[VVAuth] Failed to fetch group config:", error)
				// 获取分组配置失败，引导用户去 web 端
				controller.stateManager.setGlobalState("vvNeedsWebInit", true)
			}

			// 8. 立即持久化用户数据
			await controller.stateManager.flushPendingState()

			// 9. 清理临时存储
			controller.stateManager.setGlobalState("vv:authState", undefined)
			controller.stateManager.setGlobalState("vv:codeVerifier", undefined)
			await controller.stateManager.flushPendingState()

			// 10. 记录已处理的授权码
			this._lastProcessedCode = code

			// 11. 先同步完整状态到 WebView（确保 vvGroupConfig 在认证状态更新前已推送）
			await controller.postStateToWebview()

			// 12. 再更新认证状态并广播（此时 WebView 已有最新的 vvGroupConfig）
			this._authenticated = true
			this.sendAuthStatusUpdate()

			// 13. 更新状态栏显示
			this.updateBalanceStatusBar()
		} catch (error) {
			// 清理临时存储
			controller.stateManager.setGlobalState("vv:authState", undefined)
			controller.stateManager.setGlobalState("vv:codeVerifier", undefined)
			await controller.stateManager.flushPendingState()

			const errorMessage = error instanceof Error ? error.message : String(error)
			if (errorMessage.includes("Too Many Requests") || errorMessage.includes("429")) {
				throw new Error("Authentication rate limit exceeded. Please wait a moment and try logging in again.")
			}

			throw new Error(`Authentication failed: ${errorMessage}`)
		} finally {
			this._processingAuthCallback = false
		}
	}

	/**
	 * 登出
	 */
	public async handleDeauth(): Promise<void> {
		const controller = this.requireController()

		// 1. 获取当前 token
		const accessToken = controller.stateManager.getSecretKey("vv:accessToken")

		// 2. 调用登出 API（撤销令牌）
		if (accessToken) {
			try {
				await this._provider.logout(accessToken)
			} catch (error) {
				console.warn("Logout API call failed:", error)
			}
		}

		// 3. 清除所有本地存储
		controller.stateManager.setSecret("vv:accessToken", undefined)
		controller.stateManager.setSecret("vv:refreshToken", undefined)
		controller.stateManager.setGlobalState("vvUserInfo", undefined)
		controller.stateManager.setGlobalState("vvUserConfig", undefined)

		// 4. 清理临时存储（globalState 中的临时认证数据）
		controller.stateManager.setGlobalState("vv:authState", undefined)
		controller.stateManager.setGlobalState("vv:codeVerifier", undefined)

		// 5. 立即持久化所有清理操作
		await controller.stateManager.flushPendingState()

		// 6. 更新认证状态
		this._authenticated = false

		// 7. 广播状态更新
		this.sendAuthStatusUpdate()
	}

	/**
	 * 订阅认证状态更新
	 */
	public subscribeToAuthStatusUpdate(
		controller: Controller,
		_request: any,
		responseStream: StreamingResponseHandler<VvAuthState>,
	): () => void {
		const subscription = { controller, responseStream }
		this._activeAuthStatusUpdateSubscriptions.add(subscription)

		// 立即发送当前状态
		responseStream(this.getInfo(), false).catch((error) => {
			console.error("Failed to send initial auth status:", error)
		})

		// 返回取消订阅函数
		return () => {
			this._activeAuthStatusUpdateSubscriptions.delete(subscription)
		}
	}

	/**
	 * 广播认证状态更新
	 */
	private sendAuthStatusUpdate(): void {
		const authState = this.getInfo()

		for (const subscription of this._activeAuthStatusUpdateSubscriptions) {
			try {
				subscription.responseStream(authState, false).catch((error) => {
					console.error("Failed to send auth status update:", error)
					this._activeAuthStatusUpdateSubscriptions.delete(subscription)
				})
			} catch (error) {
				console.error("Failed to send auth status update:", error)
				this._activeAuthStatusUpdateSubscriptions.delete(subscription)
			}
		}
	}

	/**
	 * 获取访问令牌
	 */
	public getAccessToken(): string | undefined {
		const controller = this.requireController()
		return controller.stateManager.getSecretKey("vv:accessToken")
	}

	/**
	 * 获取用户信息
	 */
	public getUserInfo(): VvUserInfo | undefined {
		const controller = this.requireController()
		return controller.stateManager.getGlobalStateKey("vvUserInfo")
	}

	/**
	 * 获取用户配置
	 */
	public getUserConfig(): VvUserConfig | undefined {
		const controller = this.requireController()
		return controller.stateManager.getGlobalStateKey("vvUserConfig")
	}

	/**
	 * 获取分组配置
	 */
	public getGroupConfig(): VvGroupConfig | undefined {
		const controller = this.requireController()
		return controller.stateManager.getGlobalStateKey("vvGroupConfig")
	}

	/**
	 * 切换分组
	 * @param groupType 分组类型（discount、daily、performance）
	 */
	public async switchGroup(groupType: string): Promise<void> {
		const controller = this.requireController()
		const groupConfig = controller.stateManager.getGlobalStateKey("vvGroupConfig")

		if (!groupConfig) {
			throw new Error("Group config not found. Please login first.")
		}

		const targetGroup = groupConfig.find((g) => g.type === groupType)
		if (!targetGroup) {
			throw new Error(`Group "${groupType}" not found`)
		}

		if (!targetGroup.apiKey) {
			throw new Error(`Group "${groupType}" has no API key configured. Please configure it first.`)
		}

		// 更新 isDefault 标记
		const updatedConfig = groupConfig.map((g) => ({
			...g,
			isDefault: g.type === groupType,
		}))
		controller.stateManager.setGlobalState("vvGroupConfig", updatedConfig)

		// 保存用户选中的分组类型，用于刷新后恢复选中状态
		controller.stateManager.setGlobalState("vvSelectedGroupType", groupType as VvGroupType)

		// 应用分组配置
		await this.applyGroupConfig(targetGroup)

		// 持久化并广播状态更新
		await controller.stateManager.flushPendingState()
		this.sendAuthStatusUpdate()
	}

	/**
	 * 根据用户选择和默认配置决定应该使用哪个分组
	 * @param groupConfig 分组配置列表
	 * @returns 应该使用的分组，如果没有可用分组则返回 undefined
	 */
	private selectGroupToApply(groupConfig: VvGroupConfig): VvGroupItem | undefined {
		const controller = this.requireController()

		// 获取用户上次选中的分组类型
		const selectedGroupType = controller.stateManager.getGlobalStateKey("vvSelectedGroupType")

		// 如果有上次选中的分组，优先使用该分组；否则使用服务器返回的默认分组
		if (selectedGroupType) {
			const selectedGroup = groupConfig.find((g) => g.type === selectedGroupType)
			// 只有当上次选中的分组存在且有 apiKey 时，才使用该分组
			if (selectedGroup && selectedGroup.apiKey) {
				return selectedGroup
			}
		}

		// 如果没有保存的选择或选择无效，使用默认分组
		return groupConfig.find((g) => g.isDefault && g.apiKey)
	}

	/**
	 * 应用分组配置到 API 设置
	 * @param group 分组配置
	 */
	private async applyGroupConfig(group: VvGroupItem): Promise<void> {
		const controller = this.requireController()
		const isDev = process.env.IS_DEV === "true"
		const devBaseUrl = process.env.DEV_BASE_URL || "http://127.0.0.1:3000"

		// 设置 Anthropic API Key
		controller.stateManager.setSecret("apiKey", group.apiKey)

		// 设置默认模型（Plan 和 Act 模式都使用相同的模型）
		controller.stateManager.setGlobalState("planModeApiModelId", group.defaultModelId)
		controller.stateManager.setGlobalState("actModeApiModelId", group.defaultModelId)

		// 设置 baseUrl（开发环境强制使用本地地址）
		const baseUrl = isDev ? devBaseUrl : group.apiBaseUrl
		if (baseUrl) {
			controller.stateManager.setGlobalState("anthropicBaseUrl", baseUrl)
		}

		// 立即刷新状态确保生效
		await controller.stateManager.flushPendingState()
	}

	/**
	 * 刷新分组配置
	 */
	public async refreshGroupConfig(): Promise<VvGroupConfig | undefined> {
		const controller = this.requireController()
		const accessToken = controller.stateManager.getSecretKey("vv:accessToken")
		const userId = controller.stateManager.getSecretKey("vv:userId")

		if (!accessToken || !userId) {
			// 未登录时设置为空数组，表示已加载但没有配置
			controller.stateManager.setGlobalState("vvGroupConfig", [])
			controller.stateManager.setGlobalState("vvNeedsWebInit", undefined)
			await controller.stateManager.flushPendingState()
			return []
		}

		try {
			const groupConfig = await this._provider.getGroupTokens(accessToken, parseInt(userId, 10))

			controller.stateManager.setGlobalState("vvGroupConfig", groupConfig)

			// 检查是否还有空的 apiKey
			const hasEmptyApiKey = groupConfig.some((g) => !g.apiKey)
			if (hasEmptyApiKey) {
				controller.stateManager.setGlobalState("vvNeedsWebInit", true)
			} else {
				// 配置完整，清除需要初始化的标记
				controller.stateManager.setGlobalState("vvNeedsWebInit", undefined)
			}

			// 选择并应用分组配置
			const groupToApply = this.selectGroupToApply(groupConfig)
			if (groupToApply) {
				await this.applyGroupConfig(groupToApply)

				// 只在用户没有选择过分组时，才设置默认值
				const currentSelection = controller.stateManager.getGlobalStateKey("vvSelectedGroupType")
				if (!currentSelection) {
					controller.stateManager.setGlobalState("vvSelectedGroupType", groupToApply.type as VvGroupType)
				}
			}

			await controller.stateManager.flushPendingState()
			this.sendAuthStatusUpdate()
			return groupConfig
		} catch (error) {
			console.error("[VVAuth] Failed to refresh group config:", error)
			// API 调用失败时设置为空数组，避免一直显示"正在加载"
			controller.stateManager.setGlobalState("vvGroupConfig", [])
			await controller.stateManager.flushPendingState()
			return []
		}
	}

	/**
	 * 重置并刷新配置
	 * 清除旧的 API 配置缓存，重新从服务器获取最新配置
	 */
	public async resetAndRefreshConfig(): Promise<void> {
		const controller = this.requireController()

		// 1. 清除旧的 API 配置（包括 model 设置）
		controller.stateManager.setSecret("apiKey", undefined)
		controller.stateManager.setGlobalState("anthropicBaseUrl", undefined)
		controller.stateManager.setGlobalState("planModeApiModelId", undefined)
		controller.stateManager.setGlobalState("actModeApiModelId", undefined)
		controller.stateManager.setGlobalState("vvGroupConfig", undefined)
		await controller.stateManager.flushPendingState()

		// 2. 重新获取最新分组配置
		await this.refreshGroupConfig()

		console.log("[VVAuth] Config reset and refreshed")
	}

	/**
	 * 刷新用户信息（包括余额）
	 */
	public async refreshUserInfo(): Promise<VvUserInfo | undefined> {
		const controller = this.requireController()
		const accessToken = controller.stateManager.getSecretKey("vv:accessToken")
		const userId = controller.stateManager.getSecretKey("vv:userId")

		if (!accessToken || !userId) {
			return undefined
		}

		try {
			const userInfo = await this._provider.getUserInfo(accessToken, parseInt(userId, 10))
			controller.stateManager.setGlobalState("vvUserInfo", userInfo)
			await controller.stateManager.flushPendingState()
			this.sendAuthStatusUpdate()
			this.updateBalanceStatusBar()
			return userInfo
		} catch (error) {
			console.error("[VVAuth] Failed to refresh user info:", error)
			return undefined
		}
	}

	/**
	 * 更新状态栏显示
	 */
	private updateBalanceStatusBar(): void {
		try {
			// 动态导入避免循环依赖
			import("@hosts/vscode/VvBalanceStatusBar")
				.then(({ VvBalanceStatusBar }) => {
					VvBalanceStatusBar.getInstance().updateDisplay()
				})
				.catch((error) => {
					console.error("[VVAuth] Failed to update balance status bar:", error)
				})
		} catch (error) {
			console.error("[VVAuth] Failed to update balance status bar:", error)
		}
	}
}

/**
 * VVCode 认证状态
 */
export interface VvAuthState {
	user?: VvUserInfo
}
