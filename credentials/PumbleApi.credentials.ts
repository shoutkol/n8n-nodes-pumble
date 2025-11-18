import { ICredentialType, INodeProperties, IconFile, ICredentialTestRequest } from 'n8n-workflow';

export class PumbleApi implements ICredentialType {
	name = 'pumbleApi';
	displayName = 'Pumble API';
	documentationUrl = 'https://pumble.com/api';
	icon = 'file:pumble.svg' as unknown as IconFile;
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://pumble-application--shout-dev-2a776.asia-southeast1.hosted.app',
			required: true,
			placeholder: 'https://pumble-application--shout-dev-2a776.asia-southeast1.hosted.app',
			description: 'The base URL of the Pumble API server',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/',
			method: 'GET',
		},
	};
}
