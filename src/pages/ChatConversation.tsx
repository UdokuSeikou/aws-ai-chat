import { useParams, useLocation } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import type { Conversation } from '../types/chat';
import { SAMPLE_CONVERSATIONS } from '../sampleDate';
import MessageList from '../components/ui/MessageList';
import ChatInput from '../components/ui/ChatInput';

export default function ChatConversation() {
	const { conversationId } = useParams();
	const [conversation, setConversation] = useState<Conversation | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const location = useLocation();
	const { state: initChatDetail } = location;

	// conversationIdから会話データ(conversation)の取得
	useEffect(() => {
		// Todo: APIから取得
		const foundConversation = SAMPLE_CONVERSATIONS.find(
			(content) => content.id === conversationId,
		);
		if (foundConversation) {
			setConversation(foundConversation);
		}
	}, [conversationId]);

	// 最後の会話まで画面をスクロール
	useEffect(() => {
		if (conversation?.messages.length) {
			messagesEndRef.current?.scrollIntoView();
		}
	}, [conversation]);

	// conversationを取得できなかった場合
	if (!conversation) {
		return (
			<div className="flex h-screen justify-center">
				<div className="text-center text-2xl font-bold">
					指定されたIDの会話が見つかりません
				</div>
			</div>
		);
	}

	// メッセージが送信された際
	const sendMessage = (message: string) => {
		const conversationIndex = SAMPLE_CONVERSATIONS.findIndex(
			(conversation) => conversation.id === conversationId,
		);
		if (conversationIndex === -1) return;
		// 既存の会話履歴の末尾に新規メッセージを追加
		const updateConversation = {
			...SAMPLE_CONVERSATIONS[conversationIndex],
			messages: [
				...SAMPLE_CONVERSATIONS[conversationIndex].messages,
				{
					id: `message-${self.crypto.randomUUID()}`,
					role: 'user' as const,
					content: message,
					timestamp: new Date(),
				},
				{
					id: `message-${self.crypto.randomUUID()}`,
					role: 'assistant' as const,
					content: 'dummy',
					timestamp: new Date(),
				},
			],
			updatedAt: new Date(),
		};
		// 内容を更新
		SAMPLE_CONVERSATIONS[conversationIndex] = updateConversation;
		setConversation(updateConversation);
	};

	return (
		<div className="flex h-screen flex-col">
			<div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-4">
				<h1 className="text-xl font-bold">{conversation.title}</h1>
			</div>
			<div className="flex flex-1 justify-center overflow-y-auto bg-white">
				<div className="w-3xl">
					<MessageList messages={conversation.messages} />
					<div ref={messagesEndRef} />
				</div>
			</div>
			<div className="mx-auto w-3xl bg-white px-4 py-3">
				<ChatInput
					sendMessage={sendMessage}
					initialModel={initChatDetail?.model}
				/>
			</div>
		</div>
	);
}
