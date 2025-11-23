import { NextRequest, NextResponse } from 'next/server';
import { createSession, verifyPassword } from '@/lib/auth/session';
import { getConfig } from '@/config';

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();
        const config = getConfig();

        if (!config.passwordHash) {
            return NextResponse.json(
                { message: 'Password protection is not enabled' },
                { status: 400 }
            );
        }

        const isValid = await verifyPassword(password);

        if (!isValid) {
            return NextResponse.json(
                { message: 'Invalid password' },
                { status: 401 }
            );
        }

        await createSession();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
