import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';

// ユーザーデータの型定義
interface User {
	id: string;
	name: string;
	email: string;
}

// test data
const users: User[] = [
	{ id: '1', name: 'Tanaka', email: 'tanaka@example.com' },
	{ id: '2', name: 'Nakata', email: 'nakata@example.com' },
];

// レスポンスを生成するヘルパー関数
const createResponse = <T>(
	statusCode: number,
	body: T,
): APIGatewayProxyResult => ({
	statusCode,
	headers: {
		'Content-Type': 'application/json',
		'Access-Control-Allow-Origin': '*',
	},
	body: JSON.stringify(body),
});

// Lambda関数のハンドラ
export const handler: APIGatewayProxyHandler = async (event) => {
	const { httpMethod, body } = event;

	try {
		// GET /users -ユーザー一覧を取得
		if (httpMethod === 'GET') {
			return createResponse(200, { users });
		}

		// POST /users -ユーザーを新規登録
		if (httpMethod === 'POST') {
			if (!body) {
				return createResponse(400, {
					error: 'リクエストボディがありません',
				});
			}
			const newUser = JSON.parse(body);

			// 簡易的なバリデーション
			if (!newUser.name || !newUser.email) {
				return createResponse(400, { error: '名前とEmailは必須です' });
			}

			// 新規ユーザーを作成
			const createdUser: User = {
				id: self.crypto.randomUUID(),
				name: newUser.name,
				email: newUser.email,
			};

			users.push(createdUser);

			return createResponse(201, createdUser);
		}
		// サポートされていないHTTPメソッドの場合
		return createResponse(405, { error: 'Method Not Allowed' });
	} catch (e) {
		console.error(`error: ${e}`);
		return createResponse(500, { error: 'Internal Server Error' });
	}
};
