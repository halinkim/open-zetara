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

// zetara password - 비밀번호 설정
program
    .command('password')
    .description('Set a password for accessing the application')
    .action(async () => {
        await setPassword();
    });

// zetara config - 설정 확인
program
    .command('config')
    .description('Show current configuration')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
        await showConfig(options);
    });

program.parse();
