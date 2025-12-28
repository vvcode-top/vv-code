// VVCode Customization: VVCode 认证状态订阅处理器
// Created: 2025-12-20

import { EmptyRequest } from "@shared/proto/cline/common"
import { VvAuthState } from "@shared/proto/cline/vv_account"
import { VvAuthService } from "@/services/auth/vv/VvAuthService"
import { Controller } from ".."
import { StreamingResponseHandler } from "../grpc-handler"

/**
 * 订阅 VVCode 认证状态更新
 * 当用户登录/登出时，WebView 会收到实时通知
 *
 * @param controller Controller 实例
 * @param request 空请求
 * @param responseStream 响应流
 * @param requestId 请求 ID（可选）
 * @returns Promise<void>
 */
export async function vvSubscribeToAuthStatusUpdate(
	controller: Controller,
	request: EmptyRequest,
	responseStream: StreamingResponseHandler<VvAuthState>,
	requestId?: string,
): Promise<void> {
	VvAuthService.getInstance().subscribeToAuthStatusUpdate(controller, request, responseStream)
}
