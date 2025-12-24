import { client } from './client';

// 会話履歴を保存
export const callBedrockChat = async (
	prompt: string,
	modelId: string,
	conversationId: string | undefined,
) => {
	try {
		const response = await client.queries.BedrockChat({
			prompt,
			modelId,
			conversationId,
		});
		return response.data;
	} catch (e) {
		console.error(`チャットの送信でエラーが発生: ${e}`);
		throw new Error('チャットの送信リクエストでエラーが発生しました');
	}
};
