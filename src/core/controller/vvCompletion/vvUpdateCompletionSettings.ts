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

	const updates = {
		vvInlineCompletionEnabled: request.enabled,
		vvInlineCompletionProvider: request.provider || "anthropic",
		vvInlineCompletionModelId: request.modelId || "claude-3-5-haiku-20241022",
		vvInlineCompletionDebounceMs: request.debounceMs || 400,
		vvInlineCompletionUseGroupApiKey: request.useGroupApiKey ?? true,
	}

	// Keep global and current task settings in sync so completion switches apply immediately.
	stateManager.setGlobalState("vvInlineCompletionEnabled", updates.vvInlineCompletionEnabled)
	stateManager.setGlobalState("vvInlineCompletionProvider", updates.vvInlineCompletionProvider)
	stateManager.setGlobalState("vvInlineCompletionModelId", updates.vvInlineCompletionModelId)
	stateManager.setGlobalState("vvInlineCompletionDebounceMs", updates.vvInlineCompletionDebounceMs)
	stateManager.setGlobalState("vvInlineCompletionUseGroupApiKey", updates.vvInlineCompletionUseGroupApiKey)

	if (controller.task?.taskId) {
		stateManager.setTaskSettingsBatch(controller.task.taskId, updates)
	}

	// Flush state to disk
	await stateManager.flushPendingState()

	// Post updated state to webview
	await controller.postStateToWebview()

	return Empty.create()
}
