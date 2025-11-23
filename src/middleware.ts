import { NextRequest, NextResponse } from 'next/server';
import { isIpAllowed } from '@/lib/auth/ip-guard';
import { getSession } from '@/lib/auth/session';
import { getConfig } from '@/config';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 정적 파일은 제외
    if (
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    // 1. IP 접근 제어
    if (!isIpAllowed(request)) {
        return new NextResponse(
            JSON.stringify({
                error: 'Access Denied',
                message: 'Your IP address is not allowed to access this application.',
            }),
            {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    // 로그인 관련 경로는 인증 체크 제외
    if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
        return NextResponse.next();
    }

    // 2. 비밀번호 인증 확인
    const config = getConfig();

    // API 라우트는 세션 쿠키로 인증만 확인하고, 리다이렉트하지 않음
    if (pathname.startsWith('/api/')) {
        if (config.passwordHash) {
            const session = await getSession();
            if (!session) {
                return new NextResponse(
                    JSON.stringify({
                        error: 'Unauthorized',
                        message: 'Authentication required',
                    }),
                    {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            }
        }
        return NextResponse.next();
    }

    // 페이지 요청에 대해서만 로그인 페이지로 리다이렉트
    if (config.passwordHash) {
        const session = await getSession();

        if (!session) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('from', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
