import { useState, useCallback } from 'react';
import type { Conversation } from '../types/chat';
import { fetchConversations_Sidebar } from '../api/chat';

export const useConversations = () => {
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const refreshConversations = useCallback(async () => {
		setIsLoading(true);
		try {
			const conversations = await fetchConversations_Sidebar();
			setConversations(conversations);
		} catch (e) {
			console.error(`会話一覧の取得に失敗しました: ${e}`);
		} finally {
			setIsLoading(false);
		}
	}, []);

	return {
		conversations,
		isLoading,
		refreshConversations,
	};
};
