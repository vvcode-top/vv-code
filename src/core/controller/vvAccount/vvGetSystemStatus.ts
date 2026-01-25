// VVCode Customization: VVCode 获取系统状态处理器
// Created: 2026-01-15

import { EmptyRequest } from "@shared/proto/cline/common"
import { VvAnnouncement, VvSystemStatus } from "@shared/proto/cline/vv_account"
import { Logger } from "@shared/services/Logger"
import { VvAuthService } from "@/services/auth/vv/VvAuthService"
import { Controller } from "../index"

/**
 * 获取 VVCode 系统状态（包含公告等信息）
 *
 * @param controller Controller 实例
 * @returns 系统状态信息
 */
export async function vvGetSystemStatus(_controller: Controller, _: EmptyRequest): Promise<VvSystemStatus> {
	try {
		const systemStatus = await VvAuthService.getInstance().getSystemStatus()

		// 映射公告数据
		const announcements: VvAnnouncement[] = (systemStatus.announcements || []).map((item: any) => ({
			content: item.content,
			publishDate: item.publishDate,
			type: item.type,
			extra: item.extra,
		}))

		return VvSystemStatus.create({
			announcementsEnabled: systemStatus.announcements_enabled || false,
			announcements,
			version: systemStatus.version,
			systemName: systemStatus.system_name,
		})
	} catch (error) {
		Logger.error("[VVAuth] Failed to get system status in handler:", error)
		// 返回默认值
		return VvSystemStatus.create({
			announcementsEnabled: false,
			announcements: [],
		})
	}
}
