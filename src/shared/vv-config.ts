import type { ApiProvider } from "./api"

export const VV_DEFAULT_BACKEND_BASE_URL = "https://vvcode.top"

const VV_PROVIDER_ALIAS_MAP: Record<string, ApiProvider> = {
	anthropic: "anthropic",
	"anthropic-api": "anthropic",
	claude: "anthropic",
	openai: "openai",
	"open-ai": "openai",
	open_ai: "openai",
	"openai-compatible": "openai",
	openaicompatible: "openai",
}

export function normalizeVvBackendBaseUrl(raw: string | undefined, fallback = VV_DEFAULT_BACKEND_BASE_URL): string {
	if (!raw) {
		return fallback
	}

	const trimmed = raw.trim().replace(/^"+|"+$/g, "")
	if (!trimmed || trimmed === "undefined") {
		return fallback
	}

	// Compatibility: historically VV_API_BASE_URL could include the `/api` suffix.
	const withoutTrailingSlash = trimmed.replace(/\/+$/, "")
	return withoutTrailingSlash.replace(/\/api$/i, "") || fallback
}

export function normalizeVvGroupApiProvider(
	rawProvider: string | undefined,
	fallback: ApiProvider = "anthropic",
): { provider: ApiProvider; matched: boolean } {
	const normalized = rawProvider?.trim().toLowerCase()
	if (!normalized || normalized === "undefined") {
		return { provider: fallback, matched: false }
	}

	const provider = VV_PROVIDER_ALIAS_MAP[normalized]
	if (provider) {
		return { provider, matched: true }
	}

	return { provider: fallback, matched: false }
}
