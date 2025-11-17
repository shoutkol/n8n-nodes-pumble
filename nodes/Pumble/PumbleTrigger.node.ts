import {
	IDataObject,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	NodeConnectionTypes,
} from 'n8n-workflow';

export class PumbleTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pumble Trigger',
		name: 'pumbleTrigger',
		icon: 'file:pumble.svg',
		group: ['trigger'],
		version: 1,
		description: 'Listen for Pumble webhook events',
		defaults: {
			name: 'Pumble Trigger',
		},
		usableAsTool: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
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

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const triggerOn = this.getNodeParameter('triggerOn') as string;
		const channelId = this.getNodeParameter('channelId', '') as string;

		// Parse webhook payload (mock structure based on common chat webhook patterns)
		const webhookData = bodyData as IDataObject;

		// Filter based on trigger type
		let shouldTrigger = false;
		let outputData: IDataObject = {};

		switch (triggerOn) {
			case 'messageReceived':
				if (webhookData.event === 'message' || webhookData.type === 'message') {
					// If channelId filter is set, check if it matches
					if (
						!channelId ||
						webhookData.channelId === channelId ||
						webhookData.channel_id === channelId
					) {
						shouldTrigger = true;
						outputData = {
							eventType: 'message',
							messageId: webhookData.messageId || webhookData.message_id || webhookData.id,
							channelId: webhookData.channelId || webhookData.channel_id,
							text: webhookData.text || webhookData.message || webhookData.content,
							userId: webhookData.userId || webhookData.user_id || webhookData.sender,
							timestamp:
								webhookData.timestamp || webhookData.created_at || new Date().toISOString(),
							rawData: webhookData,
						};
					}
				}
				break;

			case 'botMention':
				if (
					webhookData.event === 'mention' ||
					webhookData.type === 'mention' ||
					webhookData.event === 'app_mention'
				) {
					shouldTrigger = true;
					outputData = {
						eventType: 'mention',
						messageId: webhookData.messageId || webhookData.message_id || webhookData.id,
						channelId: webhookData.channelId || webhookData.channel_id,
						text: webhookData.text || webhookData.message || webhookData.content,
						userId: webhookData.userId || webhookData.user_id || webhookData.sender,
						timestamp: webhookData.timestamp || webhookData.created_at || new Date().toISOString(),
						rawData: webhookData,
					};
				}
				break;

			case 'reactionAdded':
				if (
					webhookData.event === 'reaction_added' ||
					webhookData.type === 'reaction_added' ||
					webhookData.event === 'reaction'
				) {
					shouldTrigger = true;
					const item = webhookData.item as IDataObject | undefined;
					outputData = {
						eventType: 'reaction',
						messageId: webhookData.messageId || webhookData.message_id || (item?.id as string),
						channelId: webhookData.channelId || webhookData.channel_id || (item?.channel as string),
						emoji: webhookData.emoji || webhookData.reaction,
						userId: webhookData.userId || webhookData.user_id || webhookData.user,
						timestamp: webhookData.timestamp || webhookData.created_at || new Date().toISOString(),
						rawData: webhookData,
					};
				}
				break;
		}

		// If the event doesn't match the trigger criteria, don't trigger the workflow
		if (!shouldTrigger) {
			return { noWebhookResponse: true };
		}

		return {
			workflowData: [[{ json: outputData }]],
		};
	}
}
