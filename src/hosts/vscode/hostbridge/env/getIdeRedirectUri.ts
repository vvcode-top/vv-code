// VVCode Customization: 修改为 VVCode 的 extension ID
import { EmptyRequest, String } from "@shared/proto/cline/common"
import * as vscode from "vscode"

// VVCode extension ID: publisher.name from package.json
const VVCODE_EXTENSION_ID = "PiuQiuPiaQia.vvcode"

export async function getIdeRedirectUri(_: EmptyRequest): Promise<String> {
	if (vscode.env.uiKind === vscode.UIKind.Web) {
		// In VS Code Web (code serve-web), the auth callback is handled by an HTTP server
		// (AuthHandler). Returning empty here means the success page won't try to redirect
		// to a vscode:// URI (which would open the desktop app instead of the web tab).
		return { value: "" }
	}
	const uriScheme = vscode.env.uriScheme || "vscode"
	const url = `${uriScheme}://${VVCODE_EXTENSION_ID}`
	return { value: url }
}
