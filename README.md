# HEAD-ON

WWI aerial combat web game.

- 공개 게임: https://head-on-aces.justzeon.chatgpt.site
- 프로젝트 구조와 배포 기준: `PROJECT_STATUS.md`
- 현재 구현 상태와 인수인계 기록: `HEAD-ON_CURRENT_STATUS.md`
- 두 ChatGPT 계정 작업 규칙: `CONTRIBUTING.md`
- 새 채팅 인수인계문: `docs/CHATGPT_ACCOUNT_HANDOFF.md`

## Source of Truth

이 GitHub 저장소의 `main` 브랜치가 HEAD-ON의 최신 기준 소스입니다.

ChatGPT 또는 다른 개발 환경에서 수정할 때는 반드시 작업 시작 전에 `main`의
최신 상태를 확인합니다. 최초 이전 기준은 ChatGPT Site 저장 버전 146의 소스
커밋 `86bcf04af132023708f108aa9f96e4ae8d2bb49c`입니다.

## 로컬 확인

```bash
npm install
npm test
npm run build
```

게임 소스와 웹 자산은 `dist/`에 있습니다. `dist/client/`, `dist/server/`,
`dist/.openai/`는 빌드 결과이므로 저장소에 올리지 않습니다.

## Development Rule

1. 작업 전 반드시 `main`을 최신화합니다.
2. 관련 코드와 호출부만 탐색합니다.
3. 요청 범위만 최소 수정하고 기존 기능을 유지합니다.
4. `git diff`를 확인합니다.
5. 관련 테스트와 빌드를 실행합니다.
6. 정상 확인 후 커밋합니다.

복잡하거나 동시에 진행되는 작업은 별도 브랜치에서 수정하고 검증 후 Pull Request로
`main`에 합칩니다. HEAD-ON Sites 배포는 기본 계정에서만 진행합니다.

## Production Assets

임시 placeholder, debug 전용 자산 또는 승인되지 않은 임시 도트를 production에
포함하지 않습니다. `dist/`는 이 프로젝트에서 실제 게임 원본과 production 에셋을
보관하는 디렉터리이므로 폴더 전체를 빌드 산출물로 취급하지 않습니다.
