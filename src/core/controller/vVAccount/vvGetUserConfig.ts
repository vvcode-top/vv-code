// VVCode Customization: VVCode 获取用户配置处理器
// Created: 2025-12-20

import { EmptyRequest } from "@shared/proto/cline/common"
import { VvUserConfig } from "@shared/proto/cline/vv_account"
import { VvAuthService } from "@/services/auth/vv/VvAuthService"
import { Controller } from "../index"

/**
 * 获取 VVCode 用户配置
 *
 * @param controller Controller 实例
 * @returns 用户配置
 */
export async function vvGetUserConfig(_controller: Controller, _: EmptyRequest): Promise<VvUserConfig> {
	const config = VvAuthService.getInstance().getUserConfig()

	return VvUserConfig.create({
		settings: config?.settings || [],
		features: config?.features || [],
		apiBaseUrl: config?.apiBaseUrl,
	})
}
