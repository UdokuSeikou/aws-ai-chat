import type { Message } from '../../types/chat';

interface UserMessageProps {
	message: Message;
}

export default function UserMessage({ message }: UserMessageProps) {
	return (
		<div className="flex justify-end">
			<div className="max-w-3/4 rounded-lg bg-blue-200 px-4 py-2 text-gray-800">
				{message.content}
			</div>
		</div>
	);
}
