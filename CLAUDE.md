# ASDF 리듬게임 — CLAUDE.md

## 프로젝트 개요

순수 HTML/CSS/JavaScript로 만든 ASDF 키 리듬게임. 별도 빌드 도구 없이 브라우저에서 바로 실행된다.
플레이어는 노트가 판정선에 닿는 타이밍에 `A`, `S`, `D`, `F`를 누른다.
배경음악은 루트의 `a_minecraft_movie_07. Steves Lava Chicken.mp3`를 `<audio>`로 재생하고, 히트/미스 효과음은 Web Audio API로 생성한다.

## 파일 구조

```text
Rhythmic-game/
├── index.html                                      # 한국어 HUD, 난이도 선택, 레인 DOM, audio 태그
├── main.js                                         # 게임 로직 전체
├── sytle.css                                       # 화면 레이아웃, 레인, 노트, 반응형 스타일
└── a_minecraft_movie_07. Steves Lava Chicken.mp3   # 게임 시작 시 재생되는 배경음악
```

주의: CSS 파일명은 현재 `sytle.css`이다. 오타처럼 보여도 `index.html`에서 이 이름으로 연결되어 있으므로 변경 시 함께 수정해야 한다.

## 실행 방법

정적 파일만 사용하므로 `index.html`을 브라우저에서 직접 열어도 동작한다.
로컬 서버로 확인하려면 아래처럼 실행할 수 있다.

```bash
npx serve .
```

## 기술 스택

- HTML5
- CSS3
- Vanilla JavaScript
- Web Audio API
- `<audio>` 태그
- 빌드 도구 없음
- package.json 없음

## index.html 구조

```text
.game-shell
├── .hud
│   ├── #score      → 점수
│   ├── #combo      → 콤보
│   └── #judgement  → 판정
├── .difficulty     → 쉬움/보통/어려움 radio
├── .stage
│   ├── .hit-line
│   ├── .lane[data-key="a"]
│   ├── .lane[data-key="s"]
│   ├── .lane[data-key="d"]
│   └── .lane[data-key="f"]
├── .controls
│   ├── #startButton
│   └── #restartButton
└── #song           → MP3 배경음악
```

## main.js 구조

### 핵심 변수

| 변수 | 설명 |
|---|---|
| `keys` | 입력 가능한 키 배열: `["a", "s", "d", "f"]` |
| `hitLineOffset` | 판정선의 하단 기준 위치. CSS의 `.hit-line { bottom: 72px; }`와 맞춰야 함 |
| `songLengthMs` | MP3 duration을 알 수 없을 때 쓰는 예비 게임 길이 |
| `notes[]` | 현재 생성된 노트 상태 배열 |
| `activeDifficulty` | 시작 시 선택한 난이도. 플레이 중 난이도 변경으로 판정이 흔들리지 않게 고정 |
| `baseChart` | 기본 노트 타임라인 `[시간ms, 키]` |
| `hardExtraChart` | 어려움 난이도에서 추가되는 노트 |

### 난이도

```js
easy   = 노트 수 감소, 판정 넓음, 노트 느림
normal = 기본 노트, 기본 판정
hard   = 추가 노트, 판정 좁음, 노트 빠름
```

난이도 값은 `difficulties` 객체에서 관리한다.
- `noteTravelMs`: 노트가 내려오는 시간
- `perfectWindow`: 완벽 판정 허용 오차
- `goodWindow`: 좋음 판정 허용 오차
- `missWindow`: 놓침 처리 허용 오차
- `noteStep`: 쉬움에서 노트를 줄이는 필터 간격

### 게임 흐름

```text
startGame()
├── resetGame()
├── AudioContext resume
├── activeDifficulty 고정
├── buildNotes()
├── song.play()
├── startTime 기록
└── requestAnimationFrame(update)

update()
├── elapsed 계산
├── 각 노트 위치 갱신
├── missWindow 초과 노트 MISS 처리
├── 음악 길이 또는 예비 길이 종료 체크
└── 다음 frame 요청

hitKey(key)
├── 같은 키의 가장 가까운 미처리 노트 탐색
├── missWindow 밖이면 MISS
├── perfectWindow 안이면 완벽
├── goodWindow 안이면 좋음
└── 나머지는 아쉬움
```

## 조작키

| 키/버튼 | 기능 |
|---|---|
| 시작 | 선택한 난이도로 새 게임 시작 |
| 다시 시작 | 음악과 노트를 처음부터 재시작 |
| A/S/D/F | 해당 레인 노트 판정 |

## 사운드

- 배경음악: `#song` audio 요소로 MP3 재생
- 히트음: `playHitSound()`에서 Web Audio oscillator 사용
- 미스음: `playMissSound()`에서 Web Audio oscillator 사용
- 브라우저 자동재생 정책 때문에 음악은 사용자의 버튼 클릭 이후 재생해야 한다.

## 스타일

- `.game-shell`은 HUD, 난이도, 스테이지, 버튼 영역의 4행 그리드다.
- `.stage`는 4개 레인을 가진 고정형 게임 영역이다.
- `.note`는 JS에서 각 `.lane` 내부에 동적으로 생성한다.
- 모바일에서는 HUD와 난이도가 1열로 바뀌고 스테이지 높이가 줄어든다.

## 검증

JavaScript 문법 확인:

```bash
node --check main.js
```

브라우저 수동 확인:
- `index.html` 열기
- 난이도 선택
- `시작` 클릭
- MP3 재생 여부 확인
- `A/S/D/F` 입력 판정 확인

## GitHub

저장소: `https://github.com/kmathlove-wq/Rhythmic-game`
브랜치: `main`

코드 변경 후 사용자가 하지 말라고 하지 않은 경우 항상 커밋 + 푸시한다.

```bash
git add <files>
git commit -m "<message>"
git push origin main
```

## 주의사항

- 사용자 요청 없이 기존 변경사항을 되돌리지 않는다.
- MP3 파일명에 공백과 마침표가 있으므로 경로를 바꿀 때 주의한다.
- `song.currentTime = 0`은 재시작 시 음악을 처음으로 되돌리는 핵심 동작이다.
- `activeDifficulty`는 게임 시작 시 고정된다. 플레이 중 radio 변경은 다음 게임부터 반영된다.
- 판정선 위치를 바꾸면 CSS `.hit-line bottom`과 JS `hitLineOffset`을 함께 맞춘다.

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
- 사용자가 “깃허브에 업로드하지 마”라고 하지 않으면 작업 후 커밋 + 푸시한다.
