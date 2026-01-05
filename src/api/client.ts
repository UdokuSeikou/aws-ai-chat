import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

let _client: ReturnType<typeof generateClient<Schema>> | null = null;

export const client = new Proxy(
	{} as ReturnType<typeof generateClient<Schema>>,
	{
		get(target, prop) {
			if (!_client) {
				_client = generateClient<Schema>();
			}
			return Reflect.get(_client, prop);
		},
	},
);
