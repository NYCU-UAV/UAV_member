import { NextResponse } from 'next/server';
import crypto from 'crypto';

// 全站門禁登入：驗證 SITE_PASSWORD，成功就發 30 天的 HttpOnly cookie。
// cookie 內容是密碼的雜湊（不是密碼本身），演算法需與 middleware 一致。
export async function POST(request: Request) {
    try {
        const { password } = await request.json();
        const expected = process.env.SITE_PASSWORD;

        if (!expected) {
            // 門禁未啟用，直接視為成功
            return NextResponse.json({ ok: true });
        }
        if (typeof password !== 'string' || password !== expected) {
            return NextResponse.json({ ok: false }, { status: 401 });
        }

        const token = crypto.createHash('sha256').update('uav-site-auth:' + expected).digest('hex');
        const res = NextResponse.json({ ok: true });
        res.cookies.set('uav_site_auth', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false, // 區網是 HTTP、Funnel 是 HTTPS，secure:true 會讓區網登不進
            maxAge: 60 * 60 * 24 * 30,
            path: '/',
        });
        return res;
    } catch {
        return NextResponse.json({ ok: false }, { status: 400 });
    }
}
