import type { Schema } from '../../data/resource';
import {
	BedrockRuntimeClient,
	ConverseCommand,
	ConverseCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	DynamoDBDocumentClient,
	PutCommand,
	UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

// DynamoDBのテーブル名を環境変数から取得
const CONVERSATION_TABLE = process.env.CONVERSATION_TABLE_NAME;
const MESSAGE_TABLE = process.env.MESSAGE_TABLE_NAME;

const MAX_TITLE_LENGTH = 20;
const SYSTEM_PROMPT = 'You are the best teacher in the world.';
const GENERIC_ERROR_MESSAGE =
	'申し訳ございません。サーバーで予期せぬエラーが発生しました';

const bedRockClient = new BedrockRuntimeClient();
const dynamoClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: Schema['BedrockChat']['functionHandler'] = async (
	event,
) => {
	const prompt = event.arguments.prompt;
	const modelId = event.arguments.modelId;
	const conversationId = event.arguments.conversationId;

	const claims =
		event.identity && 'claims' in event.identity
			? event.identity.claims
			: null;

	// ユーザーのIDと名前を取得
	// AppSyncの認証フィルターに使用
	const sub = claims?.sub;
	const userName = claims?.userName ?? claims?.['cognito:username'];

	// AppSyncの認証オーナーに合わせてownerを設定
	const owner = sub && userName ? `${sub}::${userName}` : 'unknown-user';

	try {
		const title =
			prompt.length > MAX_TITLE_LENGTH
				? prompt.substring(0, MAX_TITLE_LENGTH)
				: prompt;
		if (conversationId) {
			// 会話データを更新または保存
			await saveConversation(conversationId, title, owner);
			// ユーザーのメッセージを保存
			await saveMessage(conversationId, 'user', prompt, owner);
		}

		// Bedrockからレスポンスを取得
		const assistantResponse = await invokeBedrockModel(prompt, modelId);

		// アシスタントの返答を保存
		if (conversationId) {
			await saveMessage(
				conversationId,
				'assistant',
				assistantResponse,
				owner,
			);
		}

		return assistantResponse;
	} catch (e) {
		console.log(`処理中にエラーが発生しました： ${e}`);
		throw new Error(GENERIC_ERROR_MESSAGE);
	}
};

// bedrockAPIに取得したプロンプトとmodelIdを渡してモデルを呼び出す関数
async function invokeBedrockModel(
	prompt: string,
	modelId: string,
): Promise<string> {
	const input: ConverseCommandInput = {
		modelId: modelId,
		system: [
			{
				text: SYSTEM_PROMPT,
			},
		],
		messages: [
			{
				role: 'user',
				content: [
					{
						text: prompt,
					},
				],
			},
		],
		inferenceConfig: {
			maxTokens: 150,
			temperature: 0.8,
		},
	};

	const command = new ConverseCommand(input);
	const response = await bedRockClient.send(command);
	return response.output?.message?.content?.[0]?.text || '';
}

// 会話の保存/更新をする関数
async function saveConversation(
	conversationId: string,
	title: string,
	owner: string,
) {
	try {
		const timestamp = getISOString();

		// upsert(存在しない場合は作成、存在する場合は更新)
		const updateCommand = new UpdateCommand({
			TableName: CONVERSATION_TABLE,
			Key: { conversationId: conversationId },
			UpdateExpression: `
				SET #title = if_not_exists(#title, :title),
					#createdAt = if_not_exists(#createdAt, :timestamp),
					#updateAt = :timestamp
					#owner =if_not_exists(#owner, :owner),
					#typename = if_not_exists(#typename, :typename)
				`,
			ExpressionAttributeNames: {
				'#title': 'title',
				'#createdAt': 'createdAt',
				'#updateAt': 'updateAt',
				'#owner': 'owner',
				'#typename': 'typename',
			},
			ExpressionAttributeValues: {
				':title': title,
				':timestamp': timestamp,
				':owner': owner,
				':typename': 'Conversation',
			},
		});

		await docClient.send(updateCommand);
		console.log(`会話を保存/更新しました: ${conversationId}`);
	} catch (e) {
		console.error(`会話の保存でエラーが発生しました: ${e}`);
		throw new Error(GENERIC_ERROR_MESSAGE);
	}
}

// メッセージを保存する関数
async function saveMessage(
	conversationId: string,
	sender: string,
	content: string,
	owner: string,
) {
	const timestamp = getISOString();
	try {
		const putCommand = new PutCommand({
			TableName: MESSAGE_TABLE,
			Item: {
				conversationId: conversationId,
				createdAt: timestamp,
				sender: sender,
				content: content,
				owner: owner,
				__typename: 'Message',
			},
		});

		await docClient.send(putCommand);
		console.log(
			`メッセージを保存しました：${conversationId}, ${timestamp}`,
		);
	} catch (e) {
		console.error(`メッセージを保存でエラーが発生しました：${e}`);
		throw new Error(GENERIC_ERROR_MESSAGE);
	}
}

// timestamp取得の補助関数
function getISOString(): string {
	const timestamp = new Date().toISOString();
	return timestamp;
}
