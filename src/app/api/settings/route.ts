import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/config';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CONFIG_FILE = path.join(os.homedir(), '.zetara', 'config.json');

export async function GET() {
    try {
        const config = getConfig();
        return NextResponse.json({
            dataDir: config.dataDir
        });
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { dataDir } = body;

        if (!dataDir) {
            return NextResponse.json({ error: 'Missing dataDir' }, { status: 400 });
        }

        // Read existing config
        let currentConfig = {};
        try {
            const data = await fs.readFile(CONFIG_FILE, 'utf-8');
            currentConfig = JSON.parse(data);
        } catch (e) {
            // Ignore if file doesn't exist
        }

        // Update config
        const newConfig = {
            ...currentConfig,
            dataDir
        };

        // Ensure config dir exists
        const configDir = path.dirname(CONFIG_FILE);
        await fs.mkdir(configDir, { recursive: true });

        // Save config
        await fs.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2));

        return NextResponse.json({ success: true, message: 'Settings saved. Restart required.' });
    } catch (error) {
        console.error('Failed to save settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
