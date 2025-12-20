// VVCode Customization: Added VV Settings button subscription
// Original: Cline v2.x
// Modified: 2025-12-20

import { Empty, EmptyRequest } from "@shared/proto/cline/common"
import { getRequestRegistry, StreamingResponseHandler } from "../grpc-handler"
import type { Controller } from "../index"

// Keep track of active VV settings button clicked subscriptions
const activeVVSettingsButtonClickedSubscriptions = new Set<StreamingResponseHandler<Empty>>()

/**
 * Subscribe to VV settings button clicked events
 * @param controller The controller instance
 * @param request The empty request
 * @param responseStream The streaming response handler
 * @param requestId The ID of the request (passed by the gRPC handler)
 */
export async function subscribeToVVSettingsButtonClicked(
	_controller: Controller,
	_request: EmptyRequest,
	responseStream: StreamingResponseHandler<Empty>,
	requestId?: string,
): Promise<void> {
	// Add this subscription to the active subscriptions
	activeVVSettingsButtonClickedSubscriptions.add(responseStream)

	// Register cleanup when the connection is closed
	const cleanup = () => {
		activeVVSettingsButtonClickedSubscriptions.delete(responseStream)
	}

	// Register the cleanup function with the request registry if we have a requestId
	if (requestId) {
		getRequestRegistry().registerRequest(
			requestId,
			cleanup,
			{ type: "vv_settings_button_clicked_subscription" },
			responseStream,
		)
	}
}

/**
 * Send a VV settings button clicked event to all active subscribers
 */
export async function sendVVSettingsButtonClickedEvent(): Promise<void> {
	// Send the event to all active subscribers
	const promises = Array.from(activeVVSettingsButtonClickedSubscriptions).map(async (responseStream) => {
		try {
			const event = Empty.create({})
			await responseStream(event, false) // Not the last message
		} catch (error) {
			console.error("Error sending VV settings button clicked event:", error)
			activeVVSettingsButtonClickedSubscriptions.delete(responseStream)
		}
	})

	await Promise.all(promises)
}
