// VVCode Customization: Stream transform pipeline
// Ported from Continue's StreamTransformPipeline
// Applies all stream filters in sequence

import { Logger } from "@shared/services/Logger"
import { VvHelperVars } from "../vvHelperVars"
import { noFirstCharNewline, stopAtStartOf, stopAtStopTokens } from "./charStream"
import {
	avoidEmptyComments,
	noDoubleNewLine,
	stopAtLines,
	stopAtRepeatingLines,
	stopAtSimilarLine,
	streamLines,
	streamWithNewLines,
} from "./lineStream"

/**
 * Pipeline that applies all stream filters
 * Transforms raw LLM output into filtered completion
 */
export class VvStreamTransformPipeline {
	/**
	 * Apply all filters to the stream
	 * @param generator Raw character stream from LLM
	 * @param prefix Code before cursor
	 * @param suffix Code after cursor
	 * @param stopTokens Stop tokens from template
	 * @param fullStop Function to call when stream should stop completely
	 * @param helper Helper variables
	 * @returns Filtered character stream
	 */
	async *transform(
		generator: AsyncGenerator<string>,
		prefix: string,
		suffix: string,
		stopTokens: string[],
		fullStop: () => void,
		helper: VvHelperVars,
	): AsyncGenerator<string> {
		Logger.log("[VvCompletion] StreamTransformPipeline 开始")
		Logger.log("[VvCompletion]   stopTokens:", stopTokens)

		// Character-level filters
		let charGenerator = stopAtStopTokens(generator, stopTokens)
		charGenerator = stopAtStartOf(charGenerator, suffix)
		charGenerator = noFirstCharNewline(charGenerator)

		// Convert to line stream
		let lineGenerator = streamLines(charGenerator)

		// Line-level filters
		lineGenerator = stopAtLines(lineGenerator, fullStop)
		lineGenerator = stopAtRepeatingLines(lineGenerator, fullStop)
		lineGenerator = avoidEmptyComments(lineGenerator, helper.lang.singleLineComment)
		lineGenerator = noDoubleNewLine(lineGenerator)
		lineGenerator = stopAtSimilarLine(lineGenerator, helper.getLineBelowCursor(), fullStop)

		// Convert back to character stream
		const finalGenerator = streamWithNewLines(lineGenerator)

		let totalYielded = 0
		for await (const update of finalGenerator) {
			totalYielded += update.length
			yield update
		}

		Logger.log("[VvCompletion] StreamTransformPipeline 完成，总共 yield:", totalYielded, "字符")
	}
}
