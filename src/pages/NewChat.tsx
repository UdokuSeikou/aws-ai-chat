import ChatInput from '../components/ui/ChatInput';
import { useNavigate } from 'react-router';
import { SAMPLE_CONVERSATIONS } from '../sampleDate';
import { createChatTitle } from '../utils';

export default function NewChat() {
	const navigate = useNavigate();
	const sendMessage = (message: string, model: string) => {
		const conversationId = self.crypto.randomUUID();
		SAMPLE_CONVERSATIONS.push({
			id: conversationId,
			title: createChatTitle(message),
			messages: [
				{
					id: `message-${self.crypto.randomUUID()}`,
					role: 'user',
					content: message,
					timestamp: new Date(),
				},
				{
					id: `message-${self.crypto.randomUUID()}`,
					role: 'assistant',
					content: message,
					timestamp: new Date(),
				},
			],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		navigate(`/chat/${conversationId}`, { state: { message, model } });
	};

	return (
		<div className="flex h-screen items-center justify-center">
			<div className="flex w-full max-w-xl flex-col gap-2">
				<h1 className="text-center text-3xl font-bold">
					test-userさん
				</h1>
				<ChatInput sendMessage={sendMessage} />
			</div>
		</div>
	);
}
