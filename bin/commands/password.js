'use strict';

const bcrypt = require('bcryptjs');

// read 패키지는 최근 버전에서 { read } 형태로 export 됨
// 옛날 버전과 둘 다 호환되도록 처리
const readModule = require('read');
const read =
    typeof readModule === 'function'
        ? readModule
        : readModule.read;

const { loadConfig, saveConfig, getConfigPath } = require('../lib/config');

const MIN_PASSWORD_LENGTH = 6;
const MAX_BCRYPT_BYTES = 72;

class PasswordSetupError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'PasswordSetupError';
        this.code = code;
    }
}

/**
 * 비밀번호 입력 (마스킹)
 * read@5.x 기준: await read(options) 로 문자열을 반환
 */
async function promptPassword(prompt) {
    try {
        const password = await read({
            prompt,
            silent: true,
            replace: '*'
        });

        return (password || '').trim();
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);

        // read가 취소 시 'canceled' 에러를 던지던 기존 동작을 그대로 가정
        if (msg === 'canceled') {
            throw new PasswordSetupError('Input canceled by user.', 'INPUT_CANCELED');
        }

        throw err;
    }
}

/**
 * y/n 질문용
 */
async function promptYesNo(prompt, defaultValue = false) {
    try {
        const answer = await read({
            prompt,
            silent: false
        });

        const normalized = (answer || '').trim().toLowerCase();

        if (!normalized) {
            return defaultValue;
        }
        if (normalized === 'y' || normalized === 'yes') {
            return true;
        }
        if (normalized === 'n' || normalized === 'no') {
            return false;
        }

        // 그 외 애매한 입력은 기본값으로 처리
        return defaultValue;
    } catch (err) {
        const msg = String(err && err.message ? err.message : err);

        if (msg === 'canceled') {
            throw new PasswordSetupError('Input canceled by user.', 'INPUT_CANCELED');
        }

        throw err;
    }
}

/**
 * 비밀번호 강도 검증
 * - 길이, 문자/숫자 조합 등
 * - 문제가 있으면 문자열(에러 메시지) 리턴, 문제 없으면 null
 */
function validatePasswordStrength(password) {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
    }

    // const hasLetter = /[A-Za-z]/.test(password);
    // const hasNumber = /\d/.test(password);

    // if (!hasLetter || !hasNumber) {
    //     return 'Use a mix of letters and numbers for better security.';
    // }

    return null;
}

/**
 * bcrypt 72바이트 제한 경고
 */
function warnIfTooLong(password) {
    const length = Buffer.byteLength(password, 'utf8');
    if (length > MAX_BCRYPT_BYTES) {
        console.warn(
            '\n⚠️  Password is longer than 72 bytes. ' +
            'bcrypt will ignore extra characters after that.'
        );
    }
}

/**
 * "패스워드 비우면 비활성화" 플로우 처리
 */
async function handleDisableFlow() {
    console.log('\nYou left the password empty.');
    const confirm = await promptYesNo('Disable password protection? (y/N): ', false);

    if (!confirm) {
        console.log('\nPassword not changed.');
        return { status: 'unchanged' };
    }

    const config = await loadConfig();
    delete config.passwordHash;
    await saveConfig(config);

    console.log('\n✅ Password protection has been disabled.');
    console.log(`   Updated config: ${getConfigPath()}`);

    return { status: 'disabled' };
}

/**
 * 메인: 비밀번호 설정
 * - 여기서는 process.exit() 안 쓰고
 *   bin/zetara.js 쪽에서 에러를 처리하게 둠
 */
async function setPassword() {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        throw new PasswordSetupError(
            'This command must be run in an interactive terminal.',
            'NON_INTERACTIVE_TTY'
        );
    }

    console.log('🔐 Set password for Zetara');
    console.log('Leave empty to disable password protection.\n');

    // 1) 비밀번호 입력
    let password = await promptPassword('Enter password: ');

    // 2) 빈 입력 → 비활성화 플로우
    if (!password) {
        return await handleDisableFlow();
    }

    // 3) 강도 검증
    const validationMessage = validatePasswordStrength(password);
    if (validationMessage) {
        throw new PasswordSetupError(validationMessage, 'WEAK_PASSWORD');
    }

    // 4) 재입력 확인
    const verify = await promptPassword('Verify password: ');

    if (password !== verify) {
        throw new PasswordSetupError('Passwords do not match.', 'PASSWORD_MISMATCH');
    }

    // 5) bcrypt 72바이트 경고
    warnIfTooLong(password);

    console.log('\n⏳ Hashing password...');

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 평문 비밀번호 참조 제거 (GC를 조금이라도 돕기)
    password = null;

    // 6) 설정 저장
    const config = await loadConfig();
    config.passwordHash = passwordHash;
    await saveConfig(config);

    console.log('✅ Password updated successfully.');
    console.log(`   Hash stored in: ${getConfigPath()}`);

    return { status: 'updated', passwordHash };
}

module.exports = {
    setPassword,
    PasswordSetupError
};
