import { NextResponse } from 'next/server';
import { GroupService } from '@/lib/server/groups';

export async function GET() {
    try {
        const groups = await GroupService.getAll();
        return NextResponse.json(groups);
    } catch (error) {
        console.error('Failed to fetch groups:', error);
        return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { title } = await request.json();
        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }
        const group = await GroupService.create(title);
        return NextResponse.json(group);
    } catch (error) {
        console.error('Failed to create group:', error);
        return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
    }
}
