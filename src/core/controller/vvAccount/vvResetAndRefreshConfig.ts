// VVCode Customization: 重置并刷新配置处理器
// Created: 2025-12-22

import { Empty, EmptyRequest } from "@shared/proto/cline/common"
import { VvAuthService } from "@/services/auth/vv/VvAuthService"
import { Controller } from "../index"

/**
 * 处理重置并刷新配置请求
 * 清除旧的 API 配置缓存，重新从服务器获取最新配置
 * @param controller Controller 实例
 */
export async function vvResetAndRefreshConfig(controller: Controller, _request: EmptyRequest): Promise<Empty> {
	await VvAuthService.getInstance().resetAndRefreshConfig()
	await controller.postStateToWebview()

	return Empty.create()
}
