# Zetara 배포 가이드

Zetara는 Jupyter Lab과 유사한 방식으로 자신의 서버에 설치하여 사용할 수 있는 논문 리더 애플리케이션입니다.

## 로컬 개발 및 테스트

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

기본적으로 `http://localhost:3000`에서 실행됩니다.

## CLI 사용법 (구현 완료)

### 비밀번호 설정

```bash
node ./bin/zetara.js password
```

입력 예시:
```
🔐 Set password for Zetara
Leave empty to disable password protection.

Enter password: ****
Verify password: ****

⏳ Hashing password...
✅ Password updated successfully.
   Hash stored in: C:\Users\yourname\.zetara\config.json
```

### 설정 확인

```bash
node ./bin/zetara.js config
```

출력 예시:
```
⚙️  Zetara Configuration

📁 Config file: C:\Users\yourname\.zetara\config.json

Port:              3000
Host:              0.0.0.0
Allowed IPs:       all
Password:          enabled (hash hidden)
Session max age:   86400 seconds (24 hours)
Session secret:    set
```

### 서버 실행 (프로덕션)

먼저 프로덕션 빌드:
```bash
npm run build
```

CLI로 서버 시작:
```bash
node ./bin/zetara.js
```

옵션 사용:
```bash
# 포트 변경
node ./bin/zetara.js --port=8080
node ./bin/zetara.js -p 8080

# 특정 IP에서만 접근 허용
node ./bin/zetara.js --ip="127.0.0.1"  # 로컬만
node ./bin/zetara.js --ip="*"  # 모든 IP 허용

# IP 화이트리스트
node ./bin/zetara.js --allowed-ips="192.168.1.0/24,10.0.0.5"

# 비밀번호 일시적으로 비활성화
node ./bin/zetara.js --no-password
```

## 설정 파일

설정은 `~/.zetara/config.json`에 저장됩니다:

```json
{
  "port": 3000,
  "host": "0.0.0.0",
  "allowedIps": [],
  "passwordHash": "$2b$10$...",
  "sessionSecret": "auto-generated-hex-string",
  "sessionMaxAge": 86400
}
```

**주의**: 이 파일을 직접 수정하지 마세요. CLI 명령어를 사용해주세요.

## 사용 시나리오

### 시나리오 1: 로컬 개발 (개발 서버)

```bash
npm run dev
```

### 시나리오 2: 비밀번호로 보호된 로컬 서버

```bash
# 비밀번호 설정
node ./bin/zetara.js password

# 서버 시작
npm run build
node ./bin/zetara.js
```

### 시나리오 3: 특정 IP 대역만 허용

```bash
node ./bin/zetara.js --allowed-ips="192.168.1.0/24" --port=8080
```

## 주요 구현 사항

### CLI 도구
- ✅ `bin/zetara.js` - 메인 CLI 진입점
- ✅ `bin/commands/start.js` - 서버 시작 명령어
- ✅ `bin/commands/password.js` - 비밀번호 설정
- ✅ `bin/commands/config.js` - 설정 확인
- ✅ `bin/lib/config.js` - 설정 파일 관리
- ✅ `bin/lib/auth.js` - 인증 유틸리티

### 서버 모듈
- ✅ `src/config/index.ts` - 서버 설정 모듈
- ✅ `src/lib/auth/session.ts` - 세션 관리 (bcrypt 검증)
- ✅ `src/lib/auth/ip-guard.ts` - IP 접근 제어
- ✅ `src/middleware.ts` - Next.js 미들웨어

### 인증 UI
- ✅ `src/app/login/page.tsx` - 로그인 페이지
- ✅ `src/app/login/login.module.css` - 로그인 스타일
- ✅ `src/app/api/auth/login/route.ts` - 로그인 API
- ✅ `src/app/api/auth/logout/route.ts` - 로그아웃 API

## 보안 권장사항

1. **비밀번호 설정**: 공개 서버나 네트워크 공유 시 반드시 비밀번호 설정
2. **강력한 비밀번호**: 최소 4자 이상 (더 길게 권장)
3. **IP 제한**: 가능하면 신뢰할 수 있는 IP 대역만 허용
4. **HTTPS**: 프로덕션 환경에서는 reverse proxy (nginx 등)와 함께 HTTPS 사용

## 알려진 이슈

- 프로덕션 빌드 (`npm run build`) 시 일부 호환성 문제 발생 (조사 중)
- 현재는 개발 모드 (`npm run dev`)에서 테스트하거나, 빌드 후 직접 Next.js 서버 실행 권장

## 문제 해결

### 비밀번호를 잊어버렸을 때

```bash
# 비밀번호 재설정
node ./bin/zetara.js password

# 또는 설정 파일 삭제 (모든 설정 초기화)
# Windows
del %USERPROFILE%\.zetara\config.json
# Linux/macOS  
rm ~/.zetara/config.json
```

### 포트가 이미 사용 중

```bash
node ./bin/zetara.js --port=8080
```

## 다음 단계

- [ ] 프로덕션 빌드 이슈 해결
- [ ] npm 패키지로 배포 준비
- [ ] Docker 이미지 생성
- [ ] 추가 테스트 및 검증
