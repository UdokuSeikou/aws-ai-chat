import type { Conversation } from './types/chat';

export const SAMPLE_CONVERSATIONS: Conversation[] = [
	{
		id: 'conv-1',
		title: 'TypeScriptの学習について',
		messages: [
			{
				id: 'msg-1',
				role: 'user',
				content: 'TypeScriptでInterfaceとTypeの違いは何ですか？',
				timestamp: new Date('2025-12-20T10:00:00'),
			},
			{
				id: 'msg-2',
				role: 'assistant',
				content:
					'主な違いは、Interfaceは「宣言の結合」が可能である点と、拡張性（extends）の構文が異なる点です。基本的にはInterfaceを使い、Union型などが必要な場合にTypeを使うのが一般的です。',
				timestamp: new Date('2025-12-20T10:01:30'),
			},
			{
				id: 'msg-3',
				role: 'user',
				content: 'なるほど、ありがとうございます！使い分けてみます。',
				timestamp: new Date('2025-12-20T10:05:00'),
			},
		],
		createdAt: new Date('2025-12-20T10:00:00'),
		updatedAt: new Date('2025-12-20T10:05:00'),
	},
];
