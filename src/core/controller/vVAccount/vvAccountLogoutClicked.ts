// VVCode Customization: VVCode 登出处理器
// Created: 2025-12-20

import { Empty, EmptyRequest } from "@shared/proto/cline/common"
import { VvAuthService } from "@/services/auth/vv/VvAuthService"
import { Controller } from "../index"

/**
 * 处理用户点击登出按钮
 * 清除所有认证信息和用户状态
 *
 * @param controller Controller 实例
 * @returns 空响应
 */
export async function vvAccountLogoutClicked(_controller: Controller, _: EmptyRequest): Promise<Empty> {
	await VvAuthService.getInstance().handleDeauth()
	return Empty.create()
}
