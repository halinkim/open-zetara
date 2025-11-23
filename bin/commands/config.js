const { loadConfig, getConfigPath } = require('../lib/config');

async function showConfig(options) {
    try {
        const config = await loadConfig();
        const configPath = getConfigPath();

        if (options.json) {
            // JSON 형식 출력 (비밀번호 해시는 숨김)
            const output = {
                ...config,
                passwordHash: config.passwordHash ? '***hidden***' : null,
            };
            console.log(JSON.stringify(output, null, 2));
        } else {
            // 사람이 읽기 쉬운 형식
            console.log('⚙️  Zetara Configuration\n');
            console.log(`📁 Config file: ${configPath}\n`);
            console.log(`Port:              ${config.port}`);
            console.log(`Host:              ${config.host}`);
            console.log(`Allowed IPs:       ${config.allowedIps.length > 0 ? config.allowedIps.join(', ') : 'all'}`);
            console.log(`Password:          ${config.passwordHash ? 'enabled (hash hidden)' : 'disabled'}`);
            console.log(`Session max age:   ${config.sessionMaxAge} seconds (${Math.floor(config.sessionMaxAge / 3600)} hours)`);
            console.log(`Session secret:    ${config.sessionSecret ? 'set' : 'not set'}`);
        }
    } catch (error) {
        console.error('❌ Error loading config:', error.message);
        process.exit(1);
    }
}

module.exports = { showConfig };
