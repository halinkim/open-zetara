export interface AppConfig {
    port: number;
    host: string;
    allowedIps: string[];
    passwordHash: string | null;
    sessionSecret: string;
    sessionMaxAge: number;
    dataDir: string;
}

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
    // 이미 로드된 설정이 있으면 반환
    if (cachedConfig) {
        return cachedConfig;
    }

    // CLI에서 전달한 설정 읽기 (JSON 문자열)
    const configStr = process.env.ZETARA_CONFIG;

    if (configStr) {
        try {
            cachedConfig = JSON.parse(configStr);
            return cachedConfig!;
        } catch (error) {
            console.error('Failed to parse ZETARA_CONFIG:', error);
        }
    }

    // 개발 환경 기본값
    cachedConfig = {
        port: 3000,
        host: '0.0.0.0',
        allowedIps: [],
        passwordHash: null,
        sessionSecret: 'dev-secret-please-change',
        sessionMaxAge: 86400,
        dataDir: process.env.HOME ? `${process.env.HOME}/.zetara` : '.zetara',
    };

    return cachedConfig;
}
