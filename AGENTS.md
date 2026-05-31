# ASDF 리듬게임 — AGENTS.md

## 프로젝트 요약

브라우저에서 바로 실행되는 한국어 ASDF 리듬게임이다.
노트가 내려오면 판정선에 맞춰 `A`, `S`, `D`, `F`를 누른다.
배경음악은 `a_minecraft_movie_07. Steves Lava Chicken.mp3`이고, 효과음은 Web Audio API로 생성한다.

## 저장소 구조

```text
Rhythmic-game/
├── index.html
├── main.js
├── sytle.css
└── a_minecraft_movie_07. Steves Lava Chicken.mp3
```

`sytle.css`는 현재 실제 파일명이다. 이름 수정 시 `index.html`의 `<link>`도 같이 고쳐야 한다.

## 실행

별도 설치 없이 `index.html`을 브라우저에서 열면 된다.
로컬 서버가 필요하면 `npx serve .`를 사용할 수 있다.

## 핵심 구현

- `index.html`: HUD, 난이도 radio, 4개 레인, 시작/다시 시작 버튼, MP3 audio 요소
- `main.js`: 차트, 난이도, 노트 생성/이동, 입력 판정, 점수/콤보, 음악 제어
- `sytle.css`: 전체 레이아웃, HUD, 난이도 버튼, 레인, 노트, 모바일 반응형

## main.js 주요 동작

| 항목 | 설명 |
|---|---|
| `baseChart` | 기본 노트 배열 |
| `hardExtraChart` | 어려움 난이도 추가 노트 |
| `difficulties` | 쉬움/보통/어려움의 속도와 판정폭 |
| `activeDifficulty` | 게임 시작 시 선택 난이도를 고정 |
| `buildNotes()` | 현재 난이도 차트로 DOM 노트 생성 |
| `update()` | `requestAnimationFrame`으로 노트 위치와 미스 판정 처리 |
| `hitKey()` | 키 입력 시 가장 가까운 노트를 찾아 판정 |
| `resetGame()` | 음악, 노트, 점수, 콤보, 판정 초기화 |
| `finishGame()` | 게임 종료 및 음악 정지 |

## 난이도 정책

- 쉬움: `noteStep: 2`, 노트가 적고 판정폭이 넓다.
- 보통: 기본 차트와 기본 판정폭.
- 어려움: 추가 노트를 포함하고 판정폭이 좁다.

플레이 도중 난이도 radio를 바꿔도 현재 게임에는 적용되지 않는다.
새 게임 시작 시 `activeDifficulty`로 고정된다.

## DOM 연결

```text
#score
#combo
#judgement
#startButton
#restartButton
input[name="difficulty"]
#song
.stage
.lane[data-key="a|s|d|f"]
```

DOM id나 class를 바꾸면 `main.js`의 selector도 함께 수정해야 한다.

## 판정과 위치

- CSS 판정선: `.hit-line { bottom: 72px; }`
- JS 판정선 보정: `hitLineOffset = 72`
- 두 값은 같은 의미이므로 함께 유지한다.
- 노트 위치는 `difficulty.noteTravelMs`로 계산한다.

## 검증

```bash
node --check main.js
```

수동 확인:
- 시작 버튼 클릭 후 음악 재생
- 쉬움/보통/어려움 각각 노트 수와 속도 차이 확인
- `A/S/D/F` 판정과 콤보 갱신 확인
- 다시 시작 시 음악이 처음부터 재생되는지 확인

## GitHub 작업

저장소: `https://github.com/kmathlove-wq/Rhythmic-game`
브랜치: `main`

사용자가 명시적으로 금지하지 않으면 변경 후 커밋하고 푸시한다.

```bash
git add <files>
git commit -m "<message>"
git push origin main
```

## 작업 규칙

### 절약 규칙

- 이미 읽은 파일은 다시 확인하지 않는다.
- 불필요한 도구 호출은 하지 않는다.
- 가능한 도구 호출은 동시에 실행한다.
- 긴 출력은 필요한 범위만 잘라 확인한다.
- 사용자가 이미 설명한 내용을 다시 반복하지 않는다.

### 기타 규칙

- 새로 알게된 프로젝트 지식은 필요할 때 `AGENTS.md` 또는 `CLAUDE.md`에 반영한다.
- `AGENTS.md`와 `CLAUDE.md`는 각각 200줄을 넘기지 않는다.
- 사용자 요청 없이 기존 변경사항을 되돌리지 않는다.
- 사용자가 “깃허브에 업로드하지 마”라고 하지 않는 한 작업 후 커밋 + 푸시한다.
