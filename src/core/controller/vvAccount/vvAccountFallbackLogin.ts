// VVCode Customization: VVCode 备用登录处理器（本地回环）
// Created: 2025-01-10

import { EmptyRequest, String as ProtoString } from "@shared/proto/cline/common"
import { VvAuthService } from "@/services/auth/vv/VvAuthService"
import { Controller } from "../index"

/**
 * 处理用户点击备用登录按钮
 * 使用本地 HTTP 服务器接收回调，而不是 URI Handler
 * 用于解决某些 Windows 电脑无法正确接收 URI Handler 回调的问题
 *
 * @param controller Controller 实例
 * @returns 登录 URL 字符串
 */
export async function vvAccountFallbackLogin(_controller: Controller, _: EmptyRequest): Promise<ProtoString> {
	const authUrl = await VvAuthService.getInstance().createFallbackAuthRequest()
	return ProtoString.create({ value: authUrl })
}
