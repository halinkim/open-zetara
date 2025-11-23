import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/server/storage';
import fs from 'fs/promises';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const paperId = parseInt(id);

    // Check if requesting PDF content
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    const result = await StorageService.getPaper(paperId);
    if (!result) {
        return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
    }

    if (type === 'pdf') {
        try {
            const pdfBuffer = await fs.readFile(result.pdfPath);
            return new NextResponse(pdfBuffer, {
                headers: {
                    'Content-Type': 'application/pdf',
                },
            });
        } catch (e) {
            return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
        }
    }

    return NextResponse.json(result.paper);
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const paper = await request.json();
        if (paper.id !== parseInt(id)) {
            return NextResponse.json({ error: 'ID mismatch' }, { status: 400 });
        }
        await StorageService.updatePaper(paper);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update paper' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await StorageService.deletePaper(parseInt(id));
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete paper' }, { status: 500 });
    }
}
