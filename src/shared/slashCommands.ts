export interface SlashCommand {
	name: string
	description?: string
	section?: "default" | "custom"
	cliCompatible?: boolean
	type?: "builtin" | "workflow" | "skill" // Type identifier for slash command source
}

export const BASE_SLASH_COMMANDS: SlashCommand[] = [
	{
		name: "newtask",
		description: "Create a new task with context from the current task",
		section: "default",
		cliCompatible: true,
		type: "builtin",
	},
	{
		name: "smol",
		description: "Condenses your current context window",
		section: "default",
		cliCompatible: true,
		type: "builtin",
	},
	{
		name: "newrule",
		description: "Create a new Cline rule based on your conversation",
		section: "default",
		cliCompatible: true,
		type: "builtin",
	},
	{
		name: "reportbug",
		description: "Create a Github issue with Cline",
		section: "default",
		cliCompatible: true,
		type: "builtin",
	},
	{
		name: "deep-planning",
		description: "Create a comprehensive implementation plan before coding",
		section: "default",
		cliCompatible: true,
		type: "builtin",
	},
	{
		name: "subagent",
		description: "Invoke a Cline CLI subagent for focused research tasks",
		section: "default",
		cliCompatible: true,
		type: "builtin",
	},
]

// VS Code-only slash commands
export const VSCODE_ONLY_COMMANDS: SlashCommand[] = [
	{
		name: "explain-changes",
		description: "Explain code changes between git refs (PRs, commits, branches, etc.)",
		section: "default",
		type: "builtin",
	},
]
