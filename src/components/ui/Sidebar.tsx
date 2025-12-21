import { Link, useParams } from 'react-router';
import { useEffect, useState } from 'react';
import type { Conversation } from '../../types/chat';
import { SAMPLE_CONVERSATIONS } from '../../sampleDate';
import Profile from './Profile';
import { useAuthenticator } from '@aws-amplify/ui-react';

export default function Sidebar() {
	const { conversationId } = useParams();
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const { signOut } = useAuthenticator();

	useEffect(() => {
		// Todo:APIから取得
		setConversations(SAMPLE_CONVERSATIONS);
	});

	return (
		<aside className="flex w-80 flex-col border-r border-gray-200 bg-white px-4 py-2">
			<div className="p-4 text-2xl font-bold">Chatアプリ</div>
			<div className="px-4 py-2">
				<Link
					className="block w-full justify-center rounded-sm bg-blue-600 p-2 text-center text-white hover:bg-blue-700"
					to="/chat/new"
				>
					+ 新規チャット
				</Link>
			</div>
			<div className="px-4 py-2 text-sm font-medium">チャット履歴</div>

			<nav className="flex-1 overflow-y-auto">
				<ul>
					{conversations.map((conversation) => (
						<li key={conversation.id}>
							<Link
								to={`/chat/${conversation.id}`}
								className={`mx-4 my-2 block truncate rounded-md px-4 py-2 text-sm text-nowrap ${
									conversationId === conversation.id
										? 'bg-cream-100 font-medium'
										: 'hover:bg-cream-150'
								}`}
							>
								{conversation.title}
							</Link>
						</li>
					))}
				</ul>
			</nav>
			<div className="p-4">
				<Profile />
				<button
					className="block w-full justify-center rounded-sm bg-gray-400 p-2 text-white hover:bg-gray-500"
					onClick={signOut}
				>
					ログアウト
				</button>
			</div>
		</aside>
	);
}
