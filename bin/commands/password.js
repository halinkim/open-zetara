const bcrypt = require('bcryptjs');
const read = require('read');
const { loadConfig, saveConfig, getConfigPath } = require('../lib/config');

async function promptPassword(prompt) {
    return new Promise((resolve, reject) => {
        read({
            prompt: prompt,
            silent: true,
            replace: '*'
        }, (err, password) => {
            if (err) {
                reject(err);
            } else {
                resolve(password);
            }
        });
    });
}

async function setPassword() {
    console.log('🔐 Set password for Zetara');
    console.log('Leave empty to disable password protection.\n');

    try {
        const password = await promptPassword('Enter password: ');

        if (!password) {
            console.log('\n✅ Password protection will be disabled.');
            const config = await loadConfig();
            config.passwordHash = null;
            await saveConfig(config);
            return;
        }

        if (password.length < 4) {
            console.log('\n❌ Password must be at least 4 characters long.');
            process.exit(1);
        }

        const verify = await promptPassword('Verify password: ');

        if (password !== verify) {
            console.log('\n❌ Passwords do not match.');
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
    }
}

module.exports = { setPassword };
