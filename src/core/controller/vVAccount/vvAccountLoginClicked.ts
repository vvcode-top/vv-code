// VVCode Customization: VVCode 登录处理器
// Created: 2025-12-20

import { EmptyRequest, String as ProtoString } from "@shared/proto/cline/common"
import { VvAuthService } from "@/services/auth/vv/VvAuthService"
import { Controller } from "../index"

/**
 * 处理用户点击登录按钮
 * 生成 PKCE 参数，打开浏览器跳转到 vvcode.top
 *
 * @param controller Controller 实例
 * @returns 登录 URL 字符串
 */
export async function vvAccountLoginClicked(_controller: Controller, _: EmptyRequest): Promise<ProtoString> {
	const authUrl = await VvAuthService.getInstance().createAuthRequest()
	return ProtoString.create({ value: authUrl })
}
