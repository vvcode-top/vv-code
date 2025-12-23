// VVCode Customization: 刷新用户信息处理器
// Created: 2025-12-23

import { Empty, EmptyRequest } from "@shared/proto/cline/common"
import { VVAuthService } from "@/services/auth/vv/VVAuthService"
import { Controller } from "../index"

/**
 * 处理刷新用户信息请求（包括余额）
 * @param controller Controller 实例
 */
export async function vvRefreshUserInfo(controller: Controller, _request: EmptyRequest): Promise<Empty> {
	await VVAuthService.getInstance().refreshUserInfo()
	await controller.postStateToWebview()

	return Empty.create()
}
