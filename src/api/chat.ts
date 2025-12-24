import { client } from './client';
import type { Conversation, Message, MessageRole } from '../types/chat';

// 会話履歴の取得
export const fetchConversation = async (
	conversationId: string,
): Promise<Conversation> => {
	try {
		const { data: conversation } = await client.models.Conversation.get(
			{
				conversationId,
			},
			{
				selectionSet: [
					'conversationId',
					'title',
					'createdAt',
					'updatedAt',
					'messages.sender',
					'messages.content',
					'messages.createdAt',
				],
			},
		);

		if (!conversation) throw new Error('会話が見つかりません');

		const messages: Message[] = conversation.messages
			.map((item) => ({
				id: `${conversationId}-${item.createdAt}`,
				role: item.sender as MessageRole,
				content: item.content || '',
				timestamp: new Date(item.createdAt),
			}))
			.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

		const result: Conversation = {
			id: conversation.conversationId,
			title: conversation.title || `Chat ${conversationId}`,
			messages,
			createdAt: new Date(conversation.createdAt || ''),
			updatedAt: new Date(conversation.updatedAt || ''),
		};

		return result;
	} catch (e) {
		console.log(`会話履歴の取得に失敗しました: ${e}`);
		throw new Error(`会話履歴の取得に失敗しました`);
	}
};

// 会話一覧の取得
export const fetchConversations_Sidebar = async (): Promise<Conversation[]> => {
	try {
		const { data: conversations } = await client.models.Conversation.list();

		if (!conversations) throw new Error('会話一覧が見つかりません');

		const result: Conversation[] = conversations
			.map((item) => ({
				id: item.conversationId,
				title: item.title,
				messages: [],
				createdAt: new Date(item.createdAt || ''),
				updatedAt: new Date(item.updatedAt || ''),
			}))
			.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

		return result;
	} catch (e) {
		console.log(`会話履歴の取得に失敗しました: ${e}`);
		throw new Error(`会話履歴の取得に失敗しました`);
	}
};
