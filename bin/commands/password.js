const bcrypt = require('bcryptjs');
const readline = require('readline');
const { loadConfig, saveConfig, getConfigPath } = require('../lib/config');

function createInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
}

function question(rl, query, hideInput = false) {
    return new Promise((resolve) => {
        if (hideInput) {
            const stdin = process.stdin;

            // Windows에서 raw mode가 지원되지 않을 수 있음
            if (typeof stdin.setRawMode === 'function') {
                stdin.setRawMode(true);
                process.stdout.write(query);

                let password = '';
                const onData = (char) => {
                    char = char.toString();

                    if (char === '\n' || char === '\r' || char === '\u0004') {
                        stdin.setRawMode(false);
                        stdin.removeListener('data', onData);
                        stdin.pause();
                        process.stdout.write('\n');
                        resolve(password);
                    } else if (char === '\u0003') {
                        // Ctrl+C
                        process.exit();
                    } else if (char === '\u007f' || char === '\b' || char === '\x08') {
                        // Backspace
                        if (password.length > 0) {
                            password = password.slice(0, -1);
                            process.stdout.write('\b \b');
                        }
                    } else {
                        password += char;
                        process.stdout.write('*');
                    }
                };

                stdin.on('data', onData);
            } else {
                // Raw mode를 지원하지 않으면 기본 readline 사용
                rl.question(query, (answer) => {
                    resolve(answer);
                });
            }
        } else {
            rl.question(query, resolve);
        }
    });
}

async function setPassword() {
    console.log('🔐 Set password for Zetara');
    console.log('Leave empty to disable password protection.\n');

    const rl = createInterface();

    try {
        const password = await question(rl, 'Enter password: ', true);

        if (!password) {
            console.log('\n✅ Password protection will be disabled.');
            const config = await loadConfig();
            config.passwordHash = null;
            await saveConfig(config);
            rl.close();
            return;
        }

        if (password.length < 4) {
            console.log('\n❌ Password must be at least 4 characters long.');
            rl.close();
            process.exit(1);
        }

        const verify = await question(rl, 'Verify password: ', true);

        if (password !== verify) {
            console.log('\n❌ Passwords do not match.');
            rl.close();
            process.exit(1);
        }

        console.log('\n⏳ Hashing password...');

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const config = await loadConfig();
        config.passwordHash = passwordHash;
        await saveConfig(config);

        console.log('✅ Password updated successfully.');
        console.log(`   Hash stored in: ${getConfigPath()}`);

    } catch (error) {
        console.error('\n❌ Error setting password:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

module.exports = { setPassword };
