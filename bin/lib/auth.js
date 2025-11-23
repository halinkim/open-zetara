function checkPasswordRequired(config, options) {
    // --no-password 플래그가 설정되면 비밀번호 무시
    if (options.password === false) {
        return false;
    }

    return config.passwordHash !== null && config.passwordHash !== '';
}

module.exports = {
    checkPasswordRequired,
};
