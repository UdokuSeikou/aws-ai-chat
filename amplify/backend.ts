import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { helloWorldFunction } from './function/HelloWorld/resource';
import { bedrockChatFunction } from './function/bedrockChat/resource';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Tags } from 'aws-cdk-lib';

// rest api用
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export const backend = defineBackend({
	auth,
	data,
	helloWorldFunction,
	bedrockChatFunction,
});

// タグの設定
const tags = Tags.of(backend.stack);
tags.add('Billing', 'aws-ai-chat');
tags.add('Project', 'aws-ai-chat');
tags.add('Environment', 'development');

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
		actions: ['dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:Query'],
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

// REST API用のスタック
const restApiStack = backend.createStack('RestAPIStack');

// Lambda関数を作成
const lambdaFunction = new NodejsFunction(
	restApiStack,
	'RestAPILambdaFunction',
	{
		runtime: lambda.Runtime.NODEJS_24_X,
		handler: 'handler',
		entry: path.join(
			path.dirname(fileURLToPath(import.meta.url)),
			'function/restApi/users/index.ts',
		),
		bundling: {
			externalModules: ['aws-sdk'],
			minify: true,
			sourceMap: true,
		},
	},
);

// API Gatewayを作成
const api = new apigateway.RestApi(restApiStack, 'RestAPI', {
	restApiName: 'Users_REST_API',
	defaultCorsPreflightOptions: {
		allowOrigins: ['*'],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
	},
});

// /usersリソースとメソッドを追加
const usersResource = api.root.addResource('users');
usersResource.addMethod(
	'GET',
	new apigateway.LambdaIntegration(lambdaFunction),
);
usersResource.addMethod(
	'POST',
	new apigateway.LambdaIntegration(lambdaFunction),
);

// フロントエンドからアクセスするためのAPI urlを出力
backend.addOutput({
	custom: {
		API: {
			[api.restApiName]: {
				endpoint: api.url,
				region: restApiStack.region,
				apiName: api.restApiName,
			},
		},
	},
});
