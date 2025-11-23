const path = require('path');
const { spawn } = require('child_process');
const { loadConfig, mergeWithCLIOptions } = require('../lib/config');
const { checkPasswordRequired } = require('../lib/auth');

async function startServer(directory, options) {
    console.log('🚀 Starting Zetara...\n');

    // 설정 로드 및 CLI 옵션과 병합
    const config = await loadConfig();
    const finalConfig = mergeWithCLIOptions(config, options);

    // IP 주소 변환 ("*" -> "0.0.0.0")
    if (finalConfig.host === '*') {
        finalConfig.host = '0.0.0.0';
    }

    // 비밀번호 확인
    if (checkPasswordRequired(finalConfig, options)) {
        console.log('🔒 Password protection: enabled');
    } else {
        console.log('⚠️  Password protection: disabled');
    }

    // IP 제한 확인
    if (finalConfig.allowedIps.length > 0) {
        console.log(`🛡️  IP whitelist: ${finalConfig.allowedIps.join(', ')}`);
    } else {
        console.log('🌍 Accepting connections from all IPs');
    }

    console.log(`\n📍 Server will run at: http://${finalConfig.host}:${finalConfig.port}`);

    if (finalConfig.host === '0.0.0.0') {
        console.log(`   Or access via: http://localhost:${finalConfig.port}`);
    }

    // 환경 변수로 설정 전달
    const env = {
        ...process.env,
        ZETARA_CONFIG: JSON.stringify(finalConfig),
        PORT: finalConfig.port.toString(),
        HOST: finalConfig.host,
    };

    // Next.js 프로덕션 서버 시작
    const nextBin = path.join(__dirname, '../../node_modules/.bin/next');
    const isWindows = process.platform === 'win32';
    const nextCmd = isWindows ? `${nextBin}.cmd` : nextBin;

    const serverProcess = spawn(nextCmd, ['start', '-p', finalConfig.port, '-H', finalConfig.host], {
        env,
        stdio: 'inherit',
        cwd: path.join(__dirname, '../..'),
        shell: isWindows,
    });

    serverProcess.on('error', (error) => {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    });

    serverProcess.on('exit', (code) => {
        if (code !== 0 && code !== null) {
            console.error(`❌ Server exited with code ${code}`);
        }
        process.exit(code || 0);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n👋 Shutting down gracefully...');
        serverProcess.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
        serverProcess.kill('SIGTERM');
    });
}

module.exports = { startServer };
