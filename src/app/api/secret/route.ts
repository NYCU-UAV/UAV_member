import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 驗證管理員密碼：前端送密碼過來、後端比對後只回傳對或錯。
// 絕不把密碼本身回傳給瀏覽器（舊版 GET 會直接洩漏密碼，已移除）。
export async function POST(request: Request) {
    try {
        const { password } = await request.json();
        const secretPath = path.join(process.cwd(), 'secret.txt');
        if (!fs.existsSync(secretPath)) {
            return NextResponse.json({ valid: false, error: 'Secret file not found' }, { status: 500 });
        }
        const encoded = fs.readFileSync(secretPath, 'utf-8').trim();
        const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
        return NextResponse.json({ valid: typeof password === 'string' && password === decoded });
    } catch (error) {
        return NextResponse.json({ valid: false }, { status: 500 });
    }
}
