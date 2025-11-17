import {
	IconFile,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';

export class Pumble implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pumble',
		name: 'pumble',
		icon: 'file:pumble.png' as unknown as IconFile,
		group: ['transform'],
		version: 1,
		description: 'Interact with Pumble API',
		defaults: {
			name: 'Pumble',
		},
		credentials: [
			{
				name: 'pumbleApi',
				required: true,
			},
		],
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			// Operation
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Send',
						value: 'send',
						description: 'Send a message to a channel',
						action: 'Send a message',
					},
					{
						name: 'Reply',
						value: 'reply',
						description: 'Reply to a message',
						action: 'Reply to a message',
					},
					{
						name: 'Add Reaction',
						value: 'addReaction',
						description: 'Add a reaction to a message',
						action: 'Add reaction to a message',
					},
				],
				default: 'send',
				noDataExpression: true,
			},

			// Send Message Fields
			{
				displayName: 'Channel ID (cId)',
				name: 'sendChannelId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['send'],
					},
				},
				default: '',
				required: true,
				placeholder: 'C1234567890',
				description: 'The ID of the channel to send the message to',
			},
			{
				displayName: 'Message Text',
				name: 'messageText',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['send'],
					},
				},
				default: '',
				required: true,
				placeholder: 'Hello from n8n!',
				description: 'The text of the message to send',
				typeOptions: {
					rows: 4,
				},
			},

			// Reply Message Fields
			{
				displayName: 'Channel ID (cId)',
				name: 'replyChannelId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['reply'],
					},
				},
				default: '',
				required: true,
				placeholder: 'C1234567890',
				description: 'The ID of the channel',
			},
			{
				displayName: 'Message ID (mId)',
				name: 'replyMessageId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['reply'],
					},
				},
				default: '',
				required: true,
				placeholder: 'msg_1234567890',
				description: 'The ID of the message to reply to',
			},
			{
				displayName: 'Reply Text',
				name: 'replyText',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['reply'],
					},
				},
				default: '',
				required: true,
				placeholder: 'This is a reply',
				description: 'The text of the reply',
				typeOptions: {
					rows: 4,
				},
			},

			// Add Reaction Fields
			{
				displayName: 'Message ID',
				name: 'reactionMessageId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['addReaction'],
					},
				},
				default: '',
				required: true,
				placeholder: 'msg_1234567890',
				description: 'The ID of the message to add a reaction to',
			},
			{
				displayName: 'Emoji',
				name: 'emoji',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['addReaction'],
					},
				},
				default: '',
				required: true,
				placeholder: ':par-shout:',
				description: 'The emoji to add as a reaction',
			},
		],
	};
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('pumbleApi');
		const operation = this.getNodeParameter('operation', 0) as string;
		const baseUrl = credentials.baseUrl as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'send') {
					const channelId = this.getNodeParameter('sendChannelId', i) as string;
					const messageText = this.getNodeParameter('messageText', i) as string;

					const response = await this.helpers.httpRequest({
						method: 'POST',
						url: `${baseUrl}/postMessage`,
						body: {
							channelId,
							text: messageText,
						},
						json: true,
					});

					returnData.push({ json: response });
				} else if (operation === 'reply') {
					const channelId = this.getNodeParameter('replyChannelId', i) as string;
					const messageId = this.getNodeParameter('replyMessageId', i) as string;
					const replyText = this.getNodeParameter('replyText', i) as string;

					const response = await this.helpers.httpRequest({
						method: 'POST',
						url: `${baseUrl}/reply`,
						body: {
							channelId,
							messageId,
							text: replyText,
						},
						json: true,
					});

					returnData.push({ json: response });
				} else if (operation === 'addReaction') {
					const messageId = this.getNodeParameter('reactionMessageId', i) as string;
					const emoji = this.getNodeParameter('emoji', i) as string;

					const response = await this.helpers.httpRequest({
						method: 'POST',
						url: `${baseUrl}/postReaction`,
						body: {
							messageId,
							code: emoji,
						},
						json: true,
					});

					returnData.push({ json: response });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: i,
					});
				} else {
					throw error;
				}
			}
		}

		return [returnData];
	}
}
