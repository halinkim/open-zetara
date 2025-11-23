import { NextResponse } from 'next/server';
import { StorageService } from '@/lib/server/storage';
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
    try {
        const zip = new AdmZip();
        const storageRoot = StorageService.getStorageRoot();

        // Add local folder to zip
        zip.addLocalFolder(storageRoot);

        const buffer = zip.toBuffer();

        return new NextResponse(buffer as unknown as BodyInit, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': 'attachment; filename=zetara-backup.zip',
            },
        });
    } catch (error) {
        console.error('Export failed:', error);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
