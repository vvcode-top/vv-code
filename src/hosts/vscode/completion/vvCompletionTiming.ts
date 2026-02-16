export type VvCompletionTimingOutcome = "success" | "cancelled" | "empty" | "filtered" | "error"

export interface VvCompletionLatencyTrackerOptions {
	requestId: string
	lastUserInputAtMs?: number
	now?: () => number
}

function formatMs(value: number | undefined): string {
	return value === undefined ? "unknown" : `${value}ms`
}

export class VvCompletionLatencyTracker {
	private readonly requestStartedAtMs: number
	private readonly now: () => number
	private llmStartedAtMs?: number
	private llmDoneAtMs?: number
	private renderReadyAtMs?: number

	constructor(private readonly options: VvCompletionLatencyTrackerOptions) {
		this.now = options.now ?? Date.now
		this.requestStartedAtMs = this.now()
	}

	markLlmStart() {
		this.llmStartedAtMs ??= this.now()
	}

	markLlmDone() {
		this.llmDoneAtMs ??= this.now()
	}

	markRenderReady() {
		this.renderReadyAtMs ??= this.now()
	}

	buildSummary(outcome: VvCompletionTimingOutcome): string {
		const requestEndAt = this.renderReadyAtMs ?? this.now()
		const stopInputToRequest =
			this.options.lastUserInputAtMs === undefined ? undefined : this.requestStartedAtMs - this.options.lastUserInputAtMs
		const requestToLlmDone = this.llmDoneAtMs === undefined ? undefined : this.llmDoneAtMs - this.requestStartedAtMs
		const llm =
			this.llmStartedAtMs === undefined || this.llmDoneAtMs === undefined
				? undefined
				: this.llmDoneAtMs - this.llmStartedAtMs
		const llmDoneToRenderReady =
			this.llmDoneAtMs === undefined || this.renderReadyAtMs === undefined
				? undefined
				: this.renderReadyAtMs - this.llmDoneAtMs
		const requestToRenderReady = requestEndAt - this.requestStartedAtMs
		const stopInputToRenderReady =
			this.options.lastUserInputAtMs === undefined ? undefined : requestEndAt - this.options.lastUserInputAtMs

		return [
			"[VvCompletionTiming]",
			`req=${this.options.requestId}`,
			`outcome=${outcome}`,
			`stopInput->request=${formatMs(stopInputToRequest)}`,
			`request->llmDone=${formatMs(requestToLlmDone)}`,
			`llm=${formatMs(llm)}`,
			`llmDone->renderReady=${formatMs(llmDoneToRenderReady)}`,
			`request->renderReady=${formatMs(requestToRenderReady)}`,
			`stopInput->renderReady=${formatMs(stopInputToRenderReady)}`,
		].join(" ")
	}
}
