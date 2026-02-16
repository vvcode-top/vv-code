import type { VvGroupConfig, VvGroupItem, VvGroupType } from "@/shared/storage/state-keys"

function hasApiKey(group: VvGroupItem): boolean {
	return Boolean(group.apiKey && group.apiKey.trim())
}

export function resolveCompletionGroup(
	groupConfig: VvGroupConfig | undefined,
	selectedGroupType?: VvGroupType,
): VvGroupItem | undefined {
	if (!groupConfig?.length) {
		return undefined
	}

	if (selectedGroupType) {
		const selected = groupConfig.find((group) => group.type === selectedGroupType && hasApiKey(group))
		if (selected) {
			return selected
		}
	}

	const defaultGroup = groupConfig.find((group) => group.isDefault && hasApiKey(group))
	if (defaultGroup) {
		return defaultGroup
	}

	return groupConfig.find((group) => hasApiKey(group))
}
