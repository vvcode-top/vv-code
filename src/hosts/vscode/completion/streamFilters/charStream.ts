// VVCode Customization: Character-level stream filters
// Ported from Continue's charStream.ts
// Filters completion stream at character level

import { Logger } from "@shared/services/Logger"

/**
 * Stop generation when encountering any stop token
 */
export async function* stopAtStopTokens(stream: AsyncGenerator<string>, stopTokens: string[]): AsyncGenerator<string> {
	if (stopTokens.length === 0) {
		for await (const char of stream) {
			yield char
		}
		return
	}

	const maxStopTokenLength = Math.max(...stopTokens.map((token) => token.length))
	let buffer = ""

	for await (const chunk of stream) {
		buffer += chunk

		while (buffer.length >= maxStopTokenLength) {
			let found = false
			for (const stopToken of stopTokens) {
				if (buffer.startsWith(stopToken)) {
					found = true
					return
				}
			}

			if (!found) {
				yield buffer[0]
				buffer = buffer.slice(1)
			}
		}
	}

	// Check remaining buffer
	for (const stopToken of stopTokens) {
		if (buffer.startsWith(stopToken)) {
			return
		}
	}

	yield buffer
}

/**
 * Stop generation when suffix begins to appear in the completion
 * Prevents duplicating existing code
 */
export async function* stopAtStartOf(stream: AsyncGenerator<string>, suffix: string): AsyncGenerator<string> {
	if (suffix.trim().length === 0) {
		for await (const char of stream) {
			yield char
		}
		return
	}

	// Use first 20 characters of suffix as detection sequence
	const sequenceLength = 20
	const targetSequence = suffix.trimStart().slice(0, Math.floor(sequenceLength * 1.5))

	if (targetSequence.length < sequenceLength) {
		for await (const char of stream) {
			yield char
		}
		return
	}

	let buffer = ""

	for await (const chunk of stream) {
		buffer += chunk

		// Check if we've started generating the suffix
		// Only check when buffer has enough characters (at least sequenceLength)
		if (buffer.length >= sequenceLength && targetSequence.includes(buffer)) {
			return
		}

		// Yield characters once buffer is large enough
		while (buffer.length > sequenceLength) {
			yield buffer[0]
			buffer = buffer.slice(1)
		}
	}

	Logger.log("[VvCompletion] stopAtStartOf 完成，yield buffer 长度:", buffer.length)
	yield buffer
}

/**
 * Stop if first character is a newline (avoid starting with blank line)
 */
export async function* noFirstCharNewline(stream: AsyncGenerator<string>): AsyncGenerator<string> {
	let first = true
	for await (const char of stream) {
		if (first) {
			first = false
			if (char.startsWith("\n") || char.startsWith("\r")) {
				Logger.log("[VvCompletion] noFirstCharNewline 拦截! 第一个字符是换行")
				return
			}
		}
		yield char
	}
}
