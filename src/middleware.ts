import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 全站門禁：設定了 SITE_PASSWORD 環境變數才啟用。
// 沒登入的訪客：頁面一律導到 /login，API 一律回 401。
// 這層擋住所有資料與照片（/api/data、/api/images...），是對外公開時唯一的保護。

const PUBLIC_PATHS = ['/login', '/api/auth'];

// token = SHA-256("uav-site-auth:" + 密碼)，與 /api/auth 發的 cookie 相同演算法
async function expectedToken(secret: string): Promise<string> {
    const data = new TextEncoder().encode('uav-site-auth:' + secret);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(req: NextRequest) {
    const sitePassword = process.env.SITE_PASSWORD;
    if (!sitePassword) return NextResponse.next(); // 未設定密碼 → 門禁停用

    const { pathname } = req.nextUrl;
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();

    const cookie = req.cookies.get('uav_site_auth')?.value;
    if (cookie && cookie === await expectedToken(sitePassword)) {
        return NextResponse.next();
    }

    if (pathname.startsWith('/api/')) {
        return new NextResponse('Unauthorized', { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
}

export const config = {
    // 靜態資源與 logo 不擋，其餘全部經過門禁
    matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.jpg).*)'],
};
