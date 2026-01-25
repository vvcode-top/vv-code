// VVCode Customization: Inline completion provider
// Completely refactored based on Continue's architecture
// Implements standard FIM model completion flow

import OpenAI from "openai"
import { v4 as uuidv4 } from "uuid"
import * as vscode from "vscode"
import type { Controller } from "@/core/controller"
import { fetch } from "@/shared/net"
import { postprocessCompletion } from "./filters"
import { MultilineCompletionMode, shouldCompleteMultiline } from "./multiline"
import { shouldSkipCompletion } from "./prefiltering"
import { processSingleLineCompletion } from "./processSingleLineCompletion"
import { getTemplateForModel } from "./vvAutocompleteTemplate"
import { VvCompletionStreamer } from "./vvCompletionStreamer"
import { VvHelperVars } from "./vvHelperVars"

interface CompletionOutcome {
	completionId: string
	completion: string
}

export class VvCompletionProvider implements vscode.InlineCompletionItemProvider {
	private displayedCompletions = new Map<string, CompletionOutcome>()
	private completionStreamer = new VvCompletionStreamer()

	constructor(private readonly controller: Controller) {}

	async provideInlineCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		context: vscode.InlineCompletionContext,
		token: vscode.CancellationToken,
	): Promise<vscode.InlineCompletionItem[] | vscode.InlineCompletionList | null> {
		try {
			// ====================================================================
			// PREPARATION PHASE (Continue's prepareLlm + initial checks)
			// ====================================================================

			// Check if completion is enabled
			const enabled = this.controller.stateManager.getGlobalSettingsKey("vvInlineCompletionEnabled")
			if (!enabled || token.isCancellationRequested) {
				return null
			}

			console.log("[VvCompletion] 触发补全", document.fileName, `行 ${position.line + 1}, 列 ${position.character + 1}`)

			// Skip for certain schemes
			if (document.uri.scheme === "vscode-scm" || document.uri.scheme === "output") {
				return null
			}

			// Don't autocomplete with multi-cursor
			const editor = vscode.window.activeTextEditor
			if (!editor || editor.selections.length > 1) {
				return null
			}

			// ====================================================================
			// PREFILTERING (Continue's shouldPrefilter)
			// ====================================================================

			if (shouldSkipCompletion(document, position)) {
				console.log("[VvCompletion] ⏭️  跳过：预过滤")
				return null
			}

			// ====================================================================
			// HELPER VARS CREATION (Continue's HelperVars.create)
			// ====================================================================

			// Get VV group configuration
			const vvGroupConfig = this.controller.stateManager.getGlobalStateKey("vvGroupConfig")
			if (!vvGroupConfig || vvGroupConfig.length === 0) {
				console.error("[VvCompletion] 未找到 VV 组配置")
				return null
			}

			const defaultGroup = vvGroupConfig.find((group) => group.isDefault)
			if (!defaultGroup) {
				console.error("[VvCompletion] 未找到默认组")
				return null
			}

			// Note: API uses "FIM" as the model name for completion
			// But we need to know the actual model type for template selection
			const actualModelType = "qwen"
			const apiModelName = "FIM"

			// Create helper variables (caches commonly used data)
			// Use actualModelType for template selection
			const helper = VvHelperVars.create(document, position, context.selectedCompletionInfo, actualModelType)

			console.log("[VvCompletion] 前缀长度:", helper.prunedPrefix.length, "后缀长度:", helper.prunedSuffix.length)

			// ====================================================================
			// MULTILINE CLASSIFICATION (Continue's shouldCompleteMultiline)
			// ====================================================================

			const multilineMode: MultilineCompletionMode = "auto" // Could be made configurable
			const isMultiline = shouldCompleteMultiline(helper, multilineMode)
			console.log("[VvCompletion] 多行模式:", isMultiline)

			// ====================================================================
			// TEMPLATE RENDERING (Continue's renderPromptWithTokenLimit)
			// ====================================================================

			// Get FIM template for model
			const template = getTemplateForModel(helper.modelName)

			console.log("[VvCompletion] 使用模板:", template.template.substring(0, 50))
			console.log("[VvCompletion] 停止令牌:", template.stopTokens)

			// ====================================================================
			// LLM PREPARATION (Continue's _prepareLlm)
			// ====================================================================

			const apiKey = defaultGroup.apiKey
			let baseUrl = defaultGroup.apiBaseUrl || ""

			if (!apiKey) {
				console.error("[VvCompletion] 未配置 API key")
				return null
			}

			// Ensure base URL ends with /v1
			if (!baseUrl.endsWith("/v1")) {
				baseUrl = baseUrl.replace(/\/+$/, "") + "/v1"
			}

			console.log("[VvCompletion] ", {
				apiKey,
				baseUrl,
			})

			// Create OpenAI client
			const client = new OpenAI({
				apiKey,
				baseURL: baseUrl,
				fetch, // Use configured fetch with proxy support
			})

			// ====================================================================
			// STREAMING COMPLETION (Continue's streamCompletionWithFilters)
			// ====================================================================

			const completionId = uuidv4()
			const abortController = new AbortController()

			token.onCancellationRequested(() => {
				abortController.abort()
			})

			// Determine max tokens based on multiline
			const maxTokens = isMultiline ? 128 : 64

			// Stream completion with filters
			// Note: Use "FIM" as the API model name
			let rawCompletion = ""
			const completionStream = this.completionStreamer.streamCompletionWithFilters(
				abortController.signal,
				client,
				apiModelName, // Use "FIM" for API
				helper.prunedPrefix,
				helper.prunedSuffix,
				maxTokens,
				template.stopTokens,
				helper,
			)

			for await (const chunk of completionStream) {
				rawCompletion += chunk
			}

			// Check if aborted
			if (token.isCancellationRequested) {
				console.log("[VvCompletion] 请求已取消")
				return null
			}

			console.log("[VvCompletion] 流式生成完成，长度:", rawCompletion.length)

			if (!rawCompletion) {
				console.log("[VvCompletion] 没有返回补全")
				return null
			}

			// ====================================================================
			// POSTPROCESSING (Continue's postprocessCompletion)
			// ====================================================================

			const processed = postprocessCompletion(rawCompletion, helper.prunedPrefix, helper.prunedSuffix)

			if (!processed) {
				console.log("[VvCompletion] ⛔ 补全被后处理过滤")
				return null
			}

			console.log("[VvCompletion] 后处理通过，长度:", processed.length)

			// ====================================================================
			// RENDERING BLOCK (VSCode-specific, from original Continue)
			// ====================================================================

			// Handle selectedCompletionInfo (VSCode native autocomplete)
			let completionText = processed
			if (context.selectedCompletionInfo) {
				completionText = context.selectedCompletionInfo.text + completionText
				console.log("[VvCompletion] 添加 selectedCompletionInfo:", context.selectedCompletionInfo.text)
			}

			// Use selectedCompletionInfo's range start if available, otherwise use cursor position
			const startPos = context.selectedCompletionInfo?.range.start ?? position
			let range = new vscode.Range(startPos, startPos)

			const isSingleLineCompletion = completionText.split("\n").length <= 1

			console.log("[VvCompletion] 是否单行补全:", isSingleLineCompletion)

			if (isSingleLineCompletion) {
				// Single-line completion processing (using diff algorithm)
				const lastLineOfCompletionText = completionText.split("\n").pop() || ""
				const currentText = document.lineAt(startPos).text.substring(startPos.character)

				const result = processSingleLineCompletion(lastLineOfCompletionText, currentText, startPos.character)

				if (result === undefined) {
					console.log("[VvCompletion] 单行处理返回 undefined")
					return null
				}

				completionText = result.completionText
				if (result.range) {
					range = new vscode.Range(
						new vscode.Position(startPos.line, result.range.start),
						new vscode.Position(startPos.line, result.range.end),
					)
				}
			} else {
				// Multi-line completion: extend range to end of line
				range = new vscode.Range(startPos, document.lineAt(startPos).range.end)
			}

			// ====================================================================
			// COMPLETION OUTCOME (Continue's AutocompleteOutcome)
			// ====================================================================

			const outcome: CompletionOutcome = {
				completionId,
				completion: completionText,
			}

			this.displayedCompletions.set(completionId, outcome)

			// Create completion item
			const item = new vscode.InlineCompletionItem(completionText, range, {
				title: "Accept VV Completion",
				command: "vv.acceptCompletion",
				arguments: [completionId],
			})

			// Enable bracket pair completion
			;(item as any).completeBracketPairs = true

			console.log("[VvCompletion] ✅ 成功生成补全")
			console.log("[VvCompletion]    补全文本完整长度:", completionText.length)
			console.log("[VvCompletion]    补全文本前50字符:", JSON.stringify(completionText.substring(0, 50)))
			console.log("[VvCompletion]    补全文本完整内容:", JSON.stringify(completionText))
			console.log(
				"[VvCompletion]    替换范围:",
				`行 ${range.start.line}:${range.start.character} 到 行 ${range.end.line}:${range.end.character}`,
			)
			console.log("[VvCompletion]    当前光标位置:", `行 ${position.line}:${position.character}`)

			return [item]
		} catch (error) {
			console.error("[VvCompletion] 补全错误:", error)
			return null
		}
	}

	public acceptCompletion(completionId: string) {
		const outcome = this.displayedCompletions.get(completionId)
		if (outcome) {
			console.log("[VvCompletion] 接受补全:", completionId)
			this.displayedCompletions.delete(completionId)
		}
	}
}
