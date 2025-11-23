import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getConfig } from '@/config';

const SESSION_COOKIE_NAME = 'zetara_session';

export interface SessionData {
    authenticated: boolean;
    createdAt: number;
    expiresAt: number;
}

async function encrypt(data: SessionData, secret: string): Promise<string> {
    const jsonStr = JSON.stringify(data);
    return Buffer.from(jsonStr).toString('base64');
}

async function decrypt(token: string): Promise<SessionData | null> {
    try {
        const jsonStr = Buffer.from(token, 'base64').toString('utf-8');
        return JSON.parse(jsonStr);
    } catch {
        return null;
    }
}

export async function createSession(): Promise<void> {
    const config = getConfig();
    const now = Date.now();
    const sessionData: SessionData = {
        authenticated: true,
        createdAt: now,
        expiresAt: now + (config.sessionMaxAge * 1000),
    };

    const token = await encrypt(sessionData, config.sessionSecret);
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: config.sessionMaxAge,
        path: '/',
    });
}

export async function getSession(): Promise<SessionData | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    const session = await decrypt(token);

    if (!session || !session.authenticated) {
        return null;
    }

    // 세션 만료 확인
    if (Date.now() > session.expiresAt) {
        await destroySession();
        return null;
    }

    return session;
}

export async function destroySession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function verifyPassword(inputPassword: string): Promise<boolean> {
    const config = getConfig();

    if (!config.passwordHash) {
        return false;
    }

    try {
        return await bcrypt.compare(inputPassword, config.passwordHash);
    } catch (error) {
        console.error('Password verification error:', error);
        return false;
    }
}

export async function isAuthenticated(): Promise<boolean> {
    const config = getConfig();

    // 비밀번호 보호가 비활성화된 경우
    if (!config.passwordHash) {
        return true;
    }

    const session = await getSession();
    return session?.authenticated === true;
}
