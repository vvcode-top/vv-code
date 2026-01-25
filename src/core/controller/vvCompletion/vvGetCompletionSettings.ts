// VVCode Customization: Get inline completion settings
// Created: 2025-12-29

import { EmptyRequest } from "@shared/proto/cline/common"
import { VvCompletionSettings } from "@shared/proto/cline/vv_completion"
import type { Controller } from "@/core/controller"

/**
 * Get VVCode inline completion settings
 * @param controller Controller instance
 * @param request Empty request
 * @returns Current completion settings
 */
export async function vvGetCompletionSettings(controller: Controller, request: EmptyRequest): Promise<VvCompletionSettings> {
	const stateManager = controller.stateManager

	return VvCompletionSettings.create({
		enabled: stateManager.getGlobalSettingsKey("vvInlineCompletionEnabled") ?? false,
		provider: stateManager.getGlobalSettingsKey("vvInlineCompletionProvider") ?? "anthropic",
		modelId: stateManager.getGlobalSettingsKey("vvInlineCompletionModelId") ?? "claude-3-5-haiku-20241022",
		debounceMs: stateManager.getGlobalSettingsKey("vvInlineCompletionDebounceMs") ?? 400,
		useGroupApiKey: stateManager.getGlobalSettingsKey("vvInlineCompletionUseGroupApiKey") ?? true,
	})
}
