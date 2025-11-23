import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/server/storage';
import { Paper } from '@/db/schema';

export async function GET() {
    try {
        const papers = await StorageService.getPapers();
        return NextResponse.json(papers);
    } catch (error) {
        console.error('Failed to fetch papers:', error);
        return NextResponse.json({ error: 'Failed to fetch papers' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const metadataJson = formData.get('metadata') as string;

        if (!file || !metadataJson) {
            return NextResponse.json({ error: 'Missing file or metadata' }, { status: 400 });
        }

        const metadata = JSON.parse(metadataJson) as Paper;
        const buffer = Buffer.from(await file.arrayBuffer());

        const savedPaper = await StorageService.savePaper(metadata, buffer);
        return NextResponse.json(savedPaper);
    } catch (error) {
        console.error('Failed to save paper:', error);
        return NextResponse.json({ error: 'Failed to save paper' }, { status: 500 });
    }
}
