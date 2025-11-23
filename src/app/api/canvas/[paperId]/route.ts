import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/server/storage';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ paperId: string }> }
) {
    const { paperId } = await params;
    try {
        const canvas = await StorageService.getCanvas(parseInt(paperId));
        return NextResponse.json(canvas || { elements: '[]' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch canvas' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ paperId: string }> }
) {
    const { paperId } = await params;
    try {
        const { elements } = await request.json();
        await StorageService.saveCanvas(parseInt(paperId), elements);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save canvas' }, { status: 500 });
    }
}
