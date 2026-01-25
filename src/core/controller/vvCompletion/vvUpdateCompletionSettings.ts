// VVCode Customization: Update inline completion settings
// Created: 2025-12-29

import { Empty } from "@shared/proto/cline/common"
import { VvCompletionSettings } from "@shared/proto/cline/vv_completion"
import type { Controller } from "@/core/controller"

/**
 * Update VVCode inline completion settings
 * @param controller Controller instance
 * @param request Completion settings
 * @returns Empty response
 */
export async function vvUpdateCompletionSettings(controller: Controller, request: VvCompletionSettings): Promise<Empty> {
	const stateManager = controller.stateManager

	// Update settings
	stateManager.setGlobalState("vvInlineCompletionEnabled", request.enabled)
	stateManager.setGlobalState("vvInlineCompletionProvider", request.provider || "anthropic")
	stateManager.setGlobalState("vvInlineCompletionModelId", request.modelId || "claude-3-5-haiku-20241022")
	stateManager.setGlobalState("vvInlineCompletionDebounceMs", request.debounceMs || 400)
	stateManager.setGlobalState("vvInlineCompletionUseGroupApiKey", request.useGroupApiKey ?? true)

	// Flush state to disk
	await stateManager.flushPendingState()

	// Post updated state to webview
	await controller.postStateToWebview()

	return Empty.create()
}
