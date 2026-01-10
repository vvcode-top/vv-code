// VVCode Customization: VVCode 认证 Hook
// Created: 2025-12-20

import { EmptyRequest } from "@shared/proto/cline/common"
import type { VvAuthState, VvUserInfo } from "@shared/proto/cline/vv_account"
import { useCallback, useEffect, useRef, useState } from "react"
import { VvAccountServiceClient } from "@/services/grpc-client"

/**
 * VVCode 认证 Hook
 *
 * 功能：
 * - 订阅认证状态（单一数据源）
 * - 提供登录/登出方法
 * - 自动处理认证状态变化
 */
export function useVvAuth() {
	const [user, setUser] = useState<VvUserInfo | null>(null)
	const [ready, setReady] = useState(false)
	const [isLoggingIn, setIsLoggingIn] = useState(false)

	const initialReceivedRef = useRef(false)
	const unmountedRef = useRef(false)
	const loginTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	const isAuthenticated = !!user?.uid

	/**
	 * 触发登录流程
	 * 会打开浏览器跳转到 vvcode.top
	 */
	const login = useCallback(async () => {
		setIsLoggingIn(true)

		// 清除之前的超时定时器
		if (loginTimeoutRef.current) {
			clearTimeout(loginTimeoutRef.current)
		}

		// 设置 60 秒超时
		loginTimeoutRef.current = setTimeout(() => {
			console.warn("VVCode login timeout: no response after 60s")
			setIsLoggingIn(false)
			loginTimeoutRef.current = null
		}, 60000)

		try {
			await VvAccountServiceClient.vvAccountLoginClicked(EmptyRequest.create())
		} catch (error) {
			console.error("VVCode login failed:", error)
			// 发生错误时清除 loading 状态和超时定时器
			if (loginTimeoutRef.current) {
				clearTimeout(loginTimeoutRef.current)
				loginTimeoutRef.current = null
			}
			setIsLoggingIn(false)
		}
	}, [])

	/**
	 * 备用登录（使用本地回环）
	 * 当 URI Handler 无法正常工作时使用
	 */
	const fallbackLogin = useCallback(async () => {
		setIsLoggingIn(true)

		// 清除之前的超时定时器
		if (loginTimeoutRef.current) {
			clearTimeout(loginTimeoutRef.current)
		}

		// 设置 60 秒超时
		loginTimeoutRef.current = setTimeout(() => {
			console.warn("VVCode fallback login timeout: no response after 60s")
			setIsLoggingIn(false)
			loginTimeoutRef.current = null
		}, 60000)

		try {
			await VvAccountServiceClient.vvAccountFallbackLogin(EmptyRequest.create())
		} catch (error) {
			console.error("VVCode fallback login failed:", error)
			// 发生错误时清除 loading 状态和超时定时器
			if (loginTimeoutRef.current) {
				clearTimeout(loginTimeoutRef.current)
				loginTimeoutRef.current = null
			}
			setIsLoggingIn(false)
		}
	}, [])

	/**
	 * 登出
	 */
	const logout = useCallback(async () => {
		try {
			await VvAccountServiceClient.vvAccountLogoutClicked(EmptyRequest.create())
		} catch (error) {
			console.error("VVCode logout failed:", error)
		}
	}, [])

	/**
	 * 订阅认证状态更新
	 */
	useEffect(() => {
		unmountedRef.current = false

		const cancel = VvAccountServiceClient.vvSubscribeToAuthStatusUpdate(EmptyRequest.create(), {
			onResponse: (response: VvAuthState) => {
				if (unmountedRef.current) {
					return
				}

				const nextUser = response?.user?.uid ? (response.user as VvUserInfo) : null
				setUser(nextUser)

				// 清除超时定时器和 loading 状态
				if (loginTimeoutRef.current) {
					clearTimeout(loginTimeoutRef.current)
					loginTimeoutRef.current = null
				}
				setIsLoggingIn(false)

				if (!initialReceivedRef.current) {
					initialReceivedRef.current = true
					setReady(true)
				}
			},
			onError: (err: Error) => {
				if (!unmountedRef.current) {
					console.error("VVCode auth subscription error:", err)

					// 清除超时定时器和 loading 状态
					if (loginTimeoutRef.current) {
						clearTimeout(loginTimeoutRef.current)
						loginTimeoutRef.current = null
					}
					setIsLoggingIn(false)

					if (!initialReceivedRef.current) {
						initialReceivedRef.current = true
						setReady(true)
					}
				}
			},
			onComplete: () => {
				// no-op
			},
		})

		return () => {
			unmountedRef.current = true
			// 清理超时定时器
			if (loginTimeoutRef.current) {
				clearTimeout(loginTimeoutRef.current)
				loginTimeoutRef.current = null
			}
			cancel()
		}
	}, [])

	/**
	 * 监听窗口焦点变化
	 * 当用户从浏览器回到 VSCode 时，给 10 秒时间等待认证回调
	 */
	useEffect(() => {
		const handleFocus = () => {
			if (isLoggingIn && loginTimeoutRef.current) {
				// 用户回到了 VSCode，缩短超时时间到 10 秒
				clearTimeout(loginTimeoutRef.current)
				loginTimeoutRef.current = setTimeout(() => {
					console.warn("VVCode login timeout: user returned but no callback received")
					setIsLoggingIn(false)
					loginTimeoutRef.current = null
				}, 10000)
			}
		}

		window.addEventListener("focus", handleFocus)
		return () => {
			window.removeEventListener("focus", handleFocus)
		}
	}, [isLoggingIn])

	return {
		user,
		isAuthenticated,
		ready,
		isLoggingIn,
		login,
		fallbackLogin,
		logout,
	}
}
