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
			default: 'http://localhost:5625',
			required: true,
			placeholder: 'http://localhost:5625',
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
