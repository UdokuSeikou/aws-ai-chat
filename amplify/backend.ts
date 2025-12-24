import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { helloWorldFunction } from './function/HelloWorld/resource';
import { bedrockChatFunction } from './function/bedrockChat/resource';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export const backend = defineBackend({
	auth,
	data,
	helloWorldFunction,
	bedrockChatFunction,
});

// bedrockに接続するLambda関数へ権限を付与
backend.bedrockChatFunction.resources.lambda.addToRolePolicy(
	new PolicyStatement({
		effect: Effect.ALLOW,
		actions: ['bedrock:InvokeModel'],
		resources: [
			'arn:aws:bedrock:*::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0',
			'arn:aws:bedrock:*::foundation-model/anthropic.claude-sonnet-4-5-20250929-v1:0',
			'arn:aws:bedrock:*::foundation-model/amazon.nova-pro-v1:0',
			'arn:aws:bedrock:*:*:inference-profile/*',
			'arn:aws:bedrock:*:*:application-inference-profile/*',
		],
	}),
);

// LambdaにDynamoDBテーブルへのアクセス権限を追加
backend.bedrockChatFunction.resources.lambda.addToRolePolicy(
	new PolicyStatement({
		effect: Effect.ALLOW,
		actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
		resources: [
			backend.data.resources.tables['Conversation'].tableArn,
			backend.data.resources.tables['Message'].tableArn,
		],
	}),
);

// Lambdaの環境変数にテーブル名を設定
backend.bedrockChatFunction.addEnvironment(
	'CONVERSATION_TABLE_NAME',
	backend.data.resources.tables['Conversation'].tableName,
);
backend.bedrockChatFunction.addEnvironment(
	'MESSAGE_TABLE_NAME',
	backend.data.resources.tables['Message'].tableName,
);
