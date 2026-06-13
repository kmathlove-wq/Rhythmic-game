# ASDF 피아노 리듬게임 — AGENTS.md

## 프로젝트 요약

브라우저에서 바로 실행되는 한국어 ASDF/피아노 리듬게임이다.
ASDF 모드는 판정선에 맞춰 `A`, `S`, `D`, `F`를 누르고, 피아노 모드는 `A`, `S`, `D`, `F`, `J`, `K`, `L`, `;`로 음계를 연주한다.
피아노 모드에서는 사용자가 음원 파일을 업로드하면 브라우저에서 에너지 변화/피치 후보를 분석해 자동 피아노 차트를 만든다.
배경음악은 `a_minecraft_movie_07. Steves Lava Chicken.mp3`이고, 효과음은 Web Audio API로 생성한다.

## 저장소 구조

```text
Rhythmic-game/
├── index.html
├── main.js
├── sytle.css
├── rhythm-badge.svg
└── a_minecraft_movie_07. Steves Lava Chicken.mp3
```

`sytle.css`는 현재 실제 파일명이다. 이름 수정 시 `index.html`의 `<link>`도 같이 고쳐야 한다.

## 실행

별도 설치 없이 `index.html`을 브라우저에서 열면 된다.
로컬 서버가 필요하면 `npx serve .`를 사용할 수 있다.

## 핵심 구현

- `index.html`: HUD, 난이도 radio, 모드 radio, 피아노 음원 업로드, 동적 레인 stage, 시작/다시 시작 버튼, MP3 audio 요소
- `main.js`: 모드별 차트/키, 업로드 음원 분석, 난이도, 노트 생성/이동, 입력 판정, 점수/콤보, 음악 제어
- `sytle.css`: 전체 레이아웃, HUD, 난이도/모드 버튼, ASDF/피아노 레인, 내려오는 노트, 모바일 반응형
- `rhythm-badge.svg`: 브라우저 탭에 표시되는 직접 제작 SVG 파비콘

## main.js 주요 동작

| 항목 | 설명 |
|---|---|
| `gameModes` | ASDF/피아노 모드별 키, 차트, 레인 스타일 설정 |
| `classicBaseChart`, `pianoBaseChart` | 모드별 기본 노트 배열 |
| `classicHardExtraChart`, `pianoHardExtraChart` | 어려움 난이도 추가 노트 |
| `uploadedPianoChart` | 업로드 음원 분석으로 생성한 피아노 모드 차트 |
| `difficulties` | 쉬움/보통/어려움의 속도와 판정폭 |
| `activeDifficulty` | 게임 시작 시 선택 난이도를 고정 |
| `activeModeKey` | 게임 시작 시 선택 모드를 고정 |
| `renderLanes()` | 선택 모드에 맞는 레인을 DOM에 생성 |
| `buildNotes()` | 현재 모드/난이도 차트로 DOM 노트 생성 |
| `analyzeUploadedSong()` | 업로드 음원을 디코딩하고 피아노 차트를 생성 |
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

## 모드 정책

- ASDF 모드: 기존 4키 차트와 판정/효과음 흐름을 유지한다.
- 피아노 모드: 8키 차트와 Web Audio 피아노 톤을 사용하며, 레인을 클릭/터치해도 해당 음이 재생된다.
- 피아노 모드에서 음원을 업로드하면 업로드 파일을 배경음악으로 쓰고 `uploadedPianoChart`를 우선 사용한다.
- 업로드 차트는 난이도별 밀도로 생성하며, 낮거나 높은 옥타브 음은 `도~높은 도` 범위의 가장 가까운 키로 접어 매핑한다.
- 렉 방지를 위해 피아노 노트 DOM은 게임 시작 시 한꺼번에 만들지 않고, 내려올 시간이 가까워질 때 생성한다.
- 플레이 도중 모드 radio를 바꿔도 현재 게임에는 적용되지 않는다. 새 게임 시작 시 `activeModeKey`로 고정된다.

## DOM 연결

```text
#score
#combo
#judgement
#startButton
#restartButton
input[name="difficulty"]
input[name="gameMode"]
#songUpload
#analysisStatus
#song
.stage
.lane[data-key="a|s|d|f|j|k|l|;"]
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
- ASDF 모드에서 `A/S/D/F` 판정과 콤보 갱신 확인
- 피아노 모드에서 `A/S/D/F/J/K/L/;` 키보드 입력과 레인 클릭/터치 시 음 재생 확인
- 피아노 모드 음원 업로드 후 분석 완료 메시지와 생성 노트 재생 확인
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
