#!/usr/bin/env node

/**
 * Zetara CLI Tool
 * Jupyter Lab 스타일의 커맨드라인 인터페이스
 */

const { Command } = require('commander');
const { startServer } = require('./commands/start');
const { setPassword } = require('./commands/password');
const { showConfig } = require('./commands/config');
const packageJson = require('../package.json');

const program = new Command();

program
    .name('zetara')
    .description('Paper reader application with canvas annotation')
    .version(packageJson.version);

// zetara [options] - 서버 시작
program
    .argument('[directory]', 'Working directory', '.')
    .option('-p, --port <number>', 'Port to run on', '3000')
    .option('--ip <address>', 'IP address to bind (use "*" for all)', '0.0.0.0')
    .option('--allowed-ips <ips>', 'Comma-separated list of allowed IPs (CIDR supported)')
    .option('--no-password', 'Disable password protection temporarily')
    .option('--session-max-age <seconds>', 'Session expiration time in seconds', '86400')
    .action(async (directory, options) => {
        await startServer(directory, options);
    });

// zetara config - 설정 확인
// zetara password - 비밀번호 설정
program
    .command('password')
    .description('Set a password for accessing the application')
    .action(async () => {
        try {
            const result = await setPassword();
            // result.status:
            //  - 'updated'   : 정상적으로 비밀번호 설정
            //  - 'disabled'  : 비밀번호 보호 비활성화
            //  - 'unchanged' : 사용자가 비활성화 취소 선택 등으로 변경 없음
            // 여기서는 추가 처리 없이도 자연스럽게 exit code 0으로 종료됨.
        } catch (err) {
            // 사용자가 입력 취소(Ctrl+C 등)
            if (err && err.code === 'INPUT_CANCELED') {
                console.log('\n↩️  Password setup canceled by user.');
                process.exit(0);
            }

            // 의도적으로 던진 검증 관련 에러
            if (err && err.name === 'PasswordSetupError') {
                console.error(`\n❌ ${err.message}`);
                process.exit(1);
            }

            // 그 외 예기치 못한 에러
            console.error('\n❌ Unexpected error while setting password:');
            if (err && err.stack) {
                console.error(err.stack);
            } else {
                console.error(err);
            }
            process.exit(1);
        }
    });


program.parse();
