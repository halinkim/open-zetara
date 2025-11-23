import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/lib/server/storage';
import AdmZip from 'adm-zip';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const zip = new AdmZip(buffer);

        const storageRoot = StorageService.getStorageRoot();

        // Ensure directory exists
        await StorageService.ensureDirs();

        // Extract all
        zip.extractAllTo(storageRoot, true);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Import failed:', error);
        return NextResponse.json({ error: 'Import failed' }, { status: 500 });
    }
}
