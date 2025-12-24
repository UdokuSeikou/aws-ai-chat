import { useParams, useLocation } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import type { Conversation, Message } from '../types/chat';
import { fetchConversation } from '../api/chat';
import MessageList from '../components/ui/MessageList';
import ChatInput from '../components/ui/ChatInput';
import { callBedrockChat } from '../api/bedrock';
import { createChatTitle } from '../utils';
import { useConversationsContext } from '../context/ConversationContext';

export default function ChatConversation() {
	const { conversationId } = useParams();
	const [conversation, setConversation] = useState<Conversation | null>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const location = useLocation();
	const { state: initChatDetail } = location;
	const initRenderRef = useRef(true);
	const [isLoadingAIResponse, setIsLoadingAIResponse] =
		useState<boolean>(false);
	const [isLoadingConversation, setIsLoadingConversation] =
		useState<boolean>(true);
	const { notifyConversationCreated } = useConversationsContext();

	// 会話履歴を取得
	const getConversation = async () => {
		if (!conversationId) return;
		setIsLoadingConversation(true);

		try {
			const conversation = await fetchConversation(conversationId);
			setConversation(conversation);
		} catch (e) {
			console.log(`指定していた会話の取得に失敗しました: ${e}`);
			setConversation(null);
		} finally {
			setIsLoadingConversation(false);
		}
	};

	// bedrockにreqを送り、応答結果を会話空間に反映する
	const getAIResponse = async (
		message: string,
		model: string,
		isFirstMessage = false,
	) => {
		// ローディングインジケータを管理
		setIsLoadingAIResponse(true);

		let newAssistantMessage: Message;

		try {
			const aiResponse = await callBedrockChat(
				message,
				model,
				conversationId ?? '',
			);

			newAssistantMessage = {
				id: `message-${self.crypto.randomUUID()}`,
				role: 'assistant',
				content: `${aiResponse}` || 'AIからの応答がありません',
				timestamp: new Date(),
			};

			if (isFirstMessage) {
				await notifyConversationCreated();
			}
		} catch (e) {
			console.log(`AIからの応答の取得に失敗しました: ${e}`);

			newAssistantMessage = {
				id: `message-${self.crypto.randomUUID()}`,
				role: 'assistant',
				content:
					'AIからの応答の取得に失敗しました。時間をおいて再試行してください',
				timestamp: new Date(),
			};
		} finally {
			setConversation((prev) => {
				if (!prev) return null;
				return {
					...prev,
					messages: [...prev.messages, newAssistantMessage],
				};
			});
			setIsLoadingAIResponse(false);
		}
	};

	// conversationIdから会話データ(conversation)の取得
	useEffect(() => {
		if (!conversationId) return;

		if (initChatDetail) {
			if (!initRenderRef.current) return;
			initRenderRef.current = false;
			const { message, model } = initChatDetail;
			setConversation({
				id: conversationId,
				title: createChatTitle(message),
				messages: [
					{
						id: `message-${self.crypto.randomUUID()}`,
						role: 'user',
						content: message,
						timestamp: new Date(),
					},
				],
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			setIsLoadingConversation(false);
			getAIResponse(message, model, true);
		} else {
			getConversation();
		}
	}, [conversationId, initChatDetail]);

	// 最後の会話まで画面をスクロール
	useEffect(() => {
		if (conversation?.messages.length) {
			messagesEndRef.current?.scrollIntoView();
		}
	}, [conversation]);

	// メッセージが送信された際
	const sendMessage = async (message: string, model: string) => {
		const newUserMessage: Message = {
			id: `message-${self.crypto.randomUUID()}`,
			role: 'user' as const,
			content: message,
			timestamp: new Date(),
		};

		setConversation((prev) => {
			if (!prev) return null;
			return {
				...prev,
				messages: [...prev.messages, newUserMessage],
			};
		});

		await getAIResponse(message, model);
	};

	// 会話履歴の取得中、ローディングインジケータを表示
	if (isLoadingConversation) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="flex gap-2 text-center">
					<div className="border-cream-500 mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
					<div className="text-xl font-bold">会話を読み込み中...</div>
				</div>
			</div>
		);
	}

	// conversationを取得できなかった場合
	if (!conversation) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-center text-2xl font-bold">
					指定されたIDの会話が見つかりません
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col">
			<div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-4">
				<h1 className="text-xl font-bold">{conversation.title}</h1>
			</div>
			<div className="flex flex-1 justify-center overflow-y-auto bg-white">
				<div className="w-3xl">
					<MessageList messages={conversation.messages} />
					{/* ローディングインジケータを表示 */}
					{isLoadingAIResponse && (
						<div className="px-6">
							<div className="border-cream-500 h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
						</div>
					)}
					<div ref={messagesEndRef} />
				</div>
			</div>
			<div className="mx-auto w-3xl bg-white px-4 py-3">
				<ChatInput
					sendMessage={sendMessage}
					initialModel={initChatDetail?.model}
					disable={isLoadingAIResponse}
				/>
			</div>
		</div>
	);
}
