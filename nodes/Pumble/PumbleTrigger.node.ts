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
				if (webhookData.cId === channelId) {
					shouldTrigger = true;
					outputData = { ...webhookData, eventType: 'messageReceived' };
				}
				break;

			case 'botMention':
				shouldTrigger = true;
				outputData = { ...webhookData, eventType: 'botMention' };
				break;

			case 'reactionAdded':
				shouldTrigger = true;
				outputData = { ...webhookData, eventType: 'reactionAdded' };
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
