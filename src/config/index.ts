// Edge Runtime compatible configuration
// Uses environment variables when running in Edge Runtime (middleware)
// Uses file system when running in Node.js runtime (API routes)

export interface AppConfig {
    dataDir: string;
    password?: string;
    passwordHash?: string;
    allowedIps?: string[];
    sessionMaxAge: number; // in seconds
    sessionSecret: string;
}

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
    if (cachedConfig) {
        return cachedConfig;
    }

    // Check if we're in Edge Runtime by checking NEXT_RUNTIME env var
    const isEdgeRuntime = process.env.NEXT_RUNTIME === 'edge';

    // In Edge Runtime, use environment variables only
    if (isEdgeRuntime) {
        cachedConfig = {
            dataDir: process.env.ZETARA_DATA_DIR || '',
            passwordHash: process.env.ZETARA_PASSWORD_HASH,
            allowedIps: process.env.ZETARA_ALLOWED_IPS
                ? process.env.ZETARA_ALLOWED_IPS.split(',')
                : [],
            sessionMaxAge: parseInt(process.env.ZETARA_SESSION_MAX_AGE || '604800', 10), // 7 days default
            sessionSecret: process.env.ZETARA_SESSION_SECRET || 'default-secret-change-in-production'
        };
        return cachedConfig;
    }

    // In Node.js runtime, use file system
    try {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');

        const CONFIG_FILE = path.join(os.homedir(), '.zetara', 'config.json');
        const DEFAULT_DATA_DIR = path.join(os.homedir(), '.zetara', 'data');

        // Try to read config file
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
            const config = JSON.parse(data);
            cachedConfig = {
                dataDir: config.dataDir || DEFAULT_DATA_DIR,
                password: config.password,
                passwordHash: config.passwordHash,
                allowedIps: config.allowedIps || [],
                sessionMaxAge: config.sessionMaxAge || 604800, // 7 days default
                sessionSecret: config.sessionSecret || 'default-secret-change-in-production'
            };
            return cachedConfig;
        }

        // Return default config
        cachedConfig = {
            dataDir: DEFAULT_DATA_DIR,
            allowedIps: [],
            sessionMaxAge: 604800, // 7 days
            sessionSecret: 'default-secret-change-in-production'
        };
        return cachedConfig;
    } catch (error) {
        console.error('Failed to read config file:', error);
        // Fallback for errors
        cachedConfig = {
            dataDir: process.env.ZETARA_DATA_DIR || '',
            passwordHash: process.env.ZETARA_PASSWORD_HASH,
            allowedIps: [],
            sessionMaxAge: 604800, // 7 days
            sessionSecret: 'default-secret-change-in-production'
        };
        return cachedConfig;
    }
}

export function clearConfigCache() {
    cachedConfig = null;
}
