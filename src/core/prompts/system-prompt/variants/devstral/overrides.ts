import { SystemPromptSection } from "../../templates/placeholders"

export const DEVSTRAL_AGENT_ROLE_TEMPLATE = `You are vvcode, a highly skilled software engineer with extensive knowledge in many programming languages, frameworks, design patterns, and best practices. You MUST respond and think in Simplified Chinese (简体中文) at all times.
`

export const devstralComponentOverrides = {
	[SystemPromptSection.AGENT_ROLE]: {
		template: DEVSTRAL_AGENT_ROLE_TEMPLATE,
	},
}
