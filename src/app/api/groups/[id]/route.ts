import { NextResponse } from 'next/server';
import { GroupService } from '@/lib/server/groups';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const group = await GroupService.get(id);
        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }
        return NextResponse.json(group);
    } catch (error) {
        console.error('Failed to fetch group:', error);
        return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const updates = await request.json();
        const group = await GroupService.update(id, updates);
        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }
        return NextResponse.json(group);
    } catch (error) {
        console.error('Failed to update group:', error);
        return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const success = await GroupService.delete(id);
        if (!success) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete group:', error);
        return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
    }
}
