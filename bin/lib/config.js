const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const CONFIG_DIR = path.join(os.homedir(), '.zetara');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function getConfigPath() {
    return CONFIG_FILE;
}

function getDefaultConfig() {
    return {
        port: 3000,
        host: '0.0.0.0',
        allowedIps: [],
        passwordHash: null,
        sessionSecret: crypto.randomBytes(32).toString('hex'),
        sessionMaxAge: 86400,
    };
}

async function ensureConfigDir() {
    try {
        await fs.access(CONFIG_DIR);
    } catch {
        await fs.mkdir(CONFIG_DIR, { recursive: true });
    }
}

async function loadConfig() {
    await ensureConfigDir();

    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf-8');
        const config = JSON.parse(data);

        // 기본값과 병합 (새로운 설정 항목 추가 시 대비)
        return { ...getDefaultConfig(), ...config };
    } catch (error) {
        if (error.code === 'ENOENT') {
            // 설정 파일이 없으면 기본값으로 생성
            const defaultConfig = getDefaultConfig();
            await saveConfig(defaultConfig);
            console.log(`📝 Created default config at: ${CONFIG_FILE}`);
            return defaultConfig;
        }
        throw error;
    }
}

async function saveConfig(config) {
    await ensureConfigDir();
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

function mergeWithCLIOptions(config, options) {
    const merged = { ...config };

    if (options.port) {
        merged.port = parseInt(options.port, 10);
    }

    if (options.ip) {
        merged.host = options.ip === '*' ? '0.0.0.0' : options.ip;
    }

    if (options.allowedIps) {
        merged.allowedIps = options.allowedIps.split(',').map(ip => ip.trim());
    }

    if (options.sessionMaxAge) {
        merged.sessionMaxAge = parseInt(options.sessionMaxAge, 10);
    }

    // --no-password 플래그
    if (options.password === false) {
        merged.passwordHash = null;
    }

    return merged;
}

module.exports = {
    getConfigPath,
    getDefaultConfig,
    loadConfig,
    saveConfig,
    mergeWithCLIOptions,
};
