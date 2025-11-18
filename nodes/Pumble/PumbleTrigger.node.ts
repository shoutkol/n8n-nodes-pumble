import {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
	INodeExecutionData,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

export class PumbleTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pumble Trigger',
		name: 'pumbleTrigger',
		icon: 'file:pumble.svg',
		group: ['trigger'],
		version: 1,
		description: 'Poll for Pumble events',
		defaults: {
			name: 'Pumble Trigger',
		},
		usableAsTool: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'pumbleApi',
				required: true,
			},
		],
		polling: true,
		properties: [
			{
				displayName: 'Trigger On',
				name: 'triggerOn',
				type: 'options',
				options: [
					{
						name: 'Message Received',
						value: 'messageReceived',
						description: 'Trigger when a message is received',
					},
					{
						name: 'Bot Mentioned',
						value: 'botMention',
						description: 'Trigger when the bot is mentioned',
					},
					{
						name: 'Reaction Added',
						value: 'reactionAdded',
						description: 'Trigger when a reaction is added to a message',
					},
				],
				default: 'messageReceived',
				noDataExpression: true,
				description: 'The event to trigger on',
			},
			{
				displayName: 'Channel ID',
				name: 'channelId',
				type: 'string',
				displayOptions: {
					show: {
						triggerOn: ['messageReceived'],
					},
				},
				default: '',
				placeholder: 'C1234567890',
				description: 'Filter messages from specific channel (leave empty for all channels)',
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const triggerOn = this.getNodeParameter('triggerOn') as string;
		const channelId = this.getNodeParameter('channelId', '') as string;
		const webhookData = this.getWorkflowStaticData('node');

		// Get credentials
		const credentials = await this.getCredentials('pumbleApi');
		const baseUrl = credentials.baseUrl as string;

		// Map trigger type to event type for API filtering
		const eventTypeMap: Record<string, string> = {
			messageReceived: 'message',
			botMention: 'mention',
			reactionAdded: 'reaction',
		};

		// Build query parameters
		const queryParams: string[] = [];

		// Add 'since' parameter if we have a last timestamp
		if (webhookData.lastTimestamp) {
			queryParams.push(`since=${webhookData.lastTimestamp}`);
		}

		// Add 'type' parameter for event filtering
		const eventType = eventTypeMap[triggerOn];
		if (eventType) {
			queryParams.push(`type=${eventType}`);
		}

		const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
		const pollUrl = `${baseUrl}/events/poll${queryString}`;

		try {
			// Make request to polling endpoint
			const response = await this.helpers.httpRequest({
				method: 'GET',
				url: pollUrl,
				json: true,
			});

			// Handle structured error responses
			if (response.error) {
				const errorCode = response.code || 'UNKNOWN_ERROR';

				// For DB_UNAVAILABLE or INTERNAL_ERROR, return null to retry later
				if (errorCode === 'DB_UNAVAILABLE' || errorCode === 'INTERNAL_ERROR') {
					return null;
				}

				// For invalid parameters, throw error to alert user
				if (errorCode === 'INVALID_PARAM' || errorCode === 'INVALID_TYPE') {
					throw new NodeOperationError(
						this.getNode(),
						`${response.error}: ${response.details || ''}`,
					);
				}

				return null;
			}

			const events = response.events || [];

			// Always update to server's lastTimeChecked for next poll
			// This ensures no events are missed and handles the 1-second buffer server-side
			if (response.lastTimeChecked) {
				webhookData.lastTimestamp = response.lastTimeChecked;
			}

			if (events.length === 0) {
				return null;
			}

			// Filter events based on trigger type (backup filter in case API doesn't filter)
			const filteredEvents = events.filter((event: IDataObject) => {
				const eventData = event.data as IDataObject;
				const eventType = eventData?.type as string;

				// Channel filtering for messages
				if (triggerOn === 'messageReceived' && channelId) {
					return eventType === 'message' && eventData?.cId === channelId;
				}

				// Type-based filtering as fallback
				const expectedType = eventTypeMap[triggerOn];
				return eventType === expectedType;
			});

			if (filteredEvents.length === 0) {
				return null;
			}

			// Return the filtered events with metadata
			return [
				filteredEvents.map((event: IDataObject) => ({
					json: {
						...event,
						eventType: triggerOn,
						// Add metadata from API response
						_meta: {
							serverTime: response.serverTime,
							pollInterval: response.pollInterval,
							hasMore: response.hasMore,
						},
					},
				})),
			];
		} catch (error) {
			// Handle network errors and unexpected issues
			if (error instanceof NodeOperationError) {
				// Re-throw validation errors
				throw error;
			}
			// For other errors, return null to retry later
			return null;
		}
	}
}
