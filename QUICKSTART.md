# Zetara - Quick Start Guide

## 🚀 설치 및 실행 (다른 컴퓨터에서)

### 1. 글로벌 설치

```bash
npm install -g zetara
```

### 2. 비밀번호 설정 (선택사항, 권장)

```bash
zetara password
```

입력 프롬프트가 나타나면 비밀번호를 입력하세요.

### 3. 서버 시작

```bash
zetara
```

또는 포트를 지정하려면:

```bash
zetara --port=8080
```

### 4. 브라우저로 접속

서버 시작 후 브라우저에서:
- http://localhost:3000 (기본 포트)
- 또는 http://localhost:8080 (포트 지정 시)

비밀번호를 설정했다면 로그인 화면이 나타납니다.

## 📋 주요 명령어

```bash
# 설정 확인
zetara config

# 특정 포트로 실행
zetara --port=8080

# 모든 IP에서 접근 허용
zetara --ip="*"

# IP 제한 (예: 특정 네트워크만)
zetara --allowed-ips="192.168.1.0/24"

# 데이터 디렉토리 지정
zetara --data-dir="/path/to/your/data"
```

## 📁 데이터 저장 위치

기본 설정 및 데이터는 다음 위치에 저장됩니다:

**Windows:**
- 설정: `C:\Users\[username]\.zetara\config.json`
- 데이터: `C:\Users\[username]\.zetara\data\`

**Linux/macOS:**
- 설정: `~/.zetara/config.json`
- 데이터: `~/.zetara/data/`

## 🔧 문제 해결

### npm: command not found
Node.js를 먼저 설치하세요:
- https://nodejs.org/

### Permission denied (Linux/macOS)
sudo 권한이 필요할 수 있습니다:
```bash
sudo npm install -g zetara
```

또는 npm 권한 설정:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.profile
source ~/.profile
```

### 포트가 이미 사용 중
다른 포트를 지정하세요:
```bash
zetara --port=8080
```

## 📦 업데이트

새 버전이 출시되면:

```bash
npm update -g zetara
```

또는 완전히 재설치:

```bash
npm uninstall -g zetara
npm install -g zetara
```

## 🌐 공식 링크

- npm: https://www.npmjs.com/package/zetara
- GitHub: https://github.com/halinkim/open-zetara
- 버그 리포트: https://github.com/halinkim/open-zetara/issues

---

**즐거운 연구 되세요! 📚**
