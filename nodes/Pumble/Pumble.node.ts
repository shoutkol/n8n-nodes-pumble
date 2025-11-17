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
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			// API Key
			{
				displayName: 'API Key',
				name: 'apiKey',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				required: true,
				placeholder: 'your-api-key',
				description: 'The Pumble API key',
			},

			// Resource
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Message',
						value: 'message',
					},
				],
				default: 'message',
				noDataExpression: true,
				required: true,
			},

			// Operation
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
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
				displayName: 'Channel ID',
				name: 'sendChannelId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['message'],
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
						resource: ['message'],
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
				displayName: 'Message ID',
				name: 'replyMessageId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['message'],
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
						resource: ['message'],
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
						resource: ['message'],
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
						resource: ['message'],
						operation: ['addReaction'],
					},
				},
				default: '',
				required: true,
				placeholder: '👍',
				description: 'The emoji to add as a reaction',
			},
		],
	};
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const apiKey = this.getNodeParameter('apiKey', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'message') {
					if (operation === 'send') {
						const channelId = this.getNodeParameter('sendChannelId', i) as string;
						const messageText = this.getNodeParameter('messageText', i) as string;

						// Mock API call - replace with actual Pumble API call
						const responseData = {
							success: true,
							messageId: `msg_${Date.now()}_${i}`,
							channelId,
							text: messageText,
							timestamp: new Date().toISOString(),
							apiKey: apiKey.substring(0, 4) + '****', // Masked for security
						};

						returnData.push({ json: responseData });
					} else if (operation === 'reply') {
						const messageId = this.getNodeParameter('replyMessageId', i) as string;
						const replyText = this.getNodeParameter('replyText', i) as string;

						// Mock API call - replace with actual Pumble API call
						const responseData = {
							success: true,
							messageId: `msg_${Date.now()}_${i}`,
							parentMessageId: messageId,
							text: replyText,
							timestamp: new Date().toISOString(),
							apiKey: apiKey.substring(0, 4) + '****', // Masked for security
						};

						returnData.push({ json: responseData });
					} else if (operation === 'addReaction') {
						const messageId = this.getNodeParameter('reactionMessageId', i) as string;
						const emoji = this.getNodeParameter('emoji', i) as string;

						// Mock API call - replace with actual Pumble API call
						const responseData = {
							success: true,
							messageId,
							emoji,
							timestamp: new Date().toISOString(),
							apiKey: apiKey.substring(0, 4) + '****', // Masked for security
						};

						returnData.push({ json: responseData });
					}
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
