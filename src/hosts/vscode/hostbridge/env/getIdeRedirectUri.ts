// VVCode Customization: 修改为 VVCode 的 extension ID
import { EmptyRequest, String } from "@shared/proto/cline/common"
import * as vscode from "vscode"

// VVCode extension ID: publisher.name from package.json
const VVCODE_EXTENSION_ID = "PiuQiuPiaQia.vvcode"

export async function getIdeRedirectUri(_: EmptyRequest): Promise<String> {
	const uriScheme = vscode.env.uriScheme || "vscode"
	const url = `${uriScheme}://${VVCODE_EXTENSION_ID}`
	return { value: url }
}
