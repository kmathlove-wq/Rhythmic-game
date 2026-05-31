const keys = ["a", "s", "d", "f"];
const hitLineOffset = 72;
const noteHeight = 58;
const songLengthMs = 32000;

const stage = document.querySelector(".stage");
const lanes = [...document.querySelectorAll(".lane")];
const scoreEl = document.querySelector("#score");
const comboEl = document.querySelector("#combo");
const judgementEl = document.querySelector("#judgement");
const startButton = document.querySelector("#startButton");
const restartButton = document.querySelector("#restartButton");
const difficultyInputs = [...document.querySelectorAll('input[name="difficulty"]')];
const song = document.querySelector("#song");

let audioContext;
let startTime = 0;
let animationId = 0;
let gameRunning = false;
let score = 0;
let combo = 0;
let notes = [];
let activeDifficulty = null;

const difficulties = {
  easy: {
    noteTravelMs: 2200,
    perfectWindow: 95,
    goodWindow: 160,
    missWindow: 220,
    noteStep: 2,
    label: "쉬움"
  },
  normal: {
    noteTravelMs: 1850,
    perfectWindow: 70,
    goodWindow: 125,
    missWindow: 175,
    noteStep: 1,
    label: "보통"
  },
  hard: {
    noteTravelMs: 1550,
    perfectWindow: 50,
    goodWindow: 95,
    missWindow: 135,
    noteStep: 1,
    label: "어려움"
  }
};

const baseChart = [
  [900, "a"], [1250, "s"], [1600, "d"], [1950, "f"],
  [2450, "a"], [2800, "d"], [3150, "s"], [3500, "f"],
  [4050, "a"], [4300, "s"], [4550, "d"], [4800, "f"],
  [5450, "f"], [5800, "d"], [6150, "s"], [6500, "a"],
  [7150, "a"], [7500, "f"], [7850, "s"], [8200, "d"],
  [8850, "a"], [9100, "s"], [9350, "a"], [9600, "f"],
  [10300, "d"], [10650, "f"], [11000, "s"], [11350, "a"],
  [12050, "a"], [12400, "s"], [12750, "d"], [13100, "f"],
  [13600, "a"], [13850, "d"], [14100, "s"], [14350, "f"],
  [15100, "f"], [15450, "d"], [15800, "s"], [16150, "a"],
  [16900, "a"], [17250, "s"], [17600, "d"], [17950, "f"],
  [18500, "a"], [18750, "f"], [19000, "d"], [19250, "s"],
  [20000, "a"], [20350, "s"], [20700, "d"], [21050, "f"],
  [21750, "f"], [22100, "a"], [22450, "d"], [22800, "s"],
  [23500, "a"], [23750, "s"], [24000, "d"], [24250, "f"],
  [24900, "a"], [25250, "d"], [25600, "s"], [25950, "f"],
  [26700, "f"], [27050, "d"], [27400, "s"], [27750, "a"],
  [28600, "a"], [28950, "s"], [29300, "d"], [29650, "f"]
];

const hardExtraChart = [
  [1050, "f"], [1425, "d"], [1775, "s"],
  [4175, "d"], [4425, "a"], [4675, "f"],
  [7275, "s"], [7625, "a"], [7975, "f"],
  [8975, "d"], [9225, "f"], [9475, "s"],
  [13725, "s"], [13975, "f"], [14225, "a"],
  [17025, "d"], [17375, "f"], [17725, "a"],
  [23625, "f"], [23875, "a"], [24125, "s"],
  [28775, "f"], [29125, "a"], [29475, "s"]
];

function getDifficultyKey() {
  return difficultyInputs.find((input) => input.checked)?.value || "normal";
}

function getDifficulty() {
  return difficulties[getDifficultyKey()];
}

function getChart() {
  const difficultyKey = getDifficultyKey();
  const difficulty = getDifficulty();

  if (difficultyKey === "hard") {
    return [...baseChart, ...hardExtraChart].sort((a, b) => a[0] - b[0]);
  }

  return baseChart.filter((_, index) => index % difficulty.noteStep === 0);
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  return audioContext;
}

function playTone(frequency, duration = 0.08, type = "sine", gainValue = 0.08) {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playHitSound(key, judgement) {
  const base = { a: 262, s: 330, d: 392, f: 523 }[key];
  playTone(judgement === "PERFECT" ? base * 1.5 : base, 0.09, "triangle", 0.09);
}

function playMissSound() {
  playTone(90, 0.14, "sawtooth", 0.05);
}

function setJudgement(text) {
  const textMap = {
    READY: "준비",
    GO: "시작",
    PERFECT: "완벽",
    GOOD: "좋음",
    BAD: "아쉬움",
    MISS: "놓침",
    "MUSIC ERROR": "음악 오류"
  };

  judgementEl.textContent = textMap[text] || text;
}

function updateScore(points) {
  score += points;
  scoreEl.textContent = score;
  comboEl.textContent = combo;
}

function buildNotes() {
  notes = getChart().map(([time, key]) => {
    const lane = document.querySelector(`.lane[data-key="${key}"]`);
    const element = document.createElement("div");
    element.className = "note";
    element.dataset.key = key;
    element.textContent = key.toUpperCase();
    lane.appendChild(element);

    return {
      time,
      key,
      lane,
      element,
      hit: false,
      missed: false
    };
  });
}

function clearNotes() {
  notes.forEach((note) => note.element.remove());
  notes = [];
}

function resetGame() {
  cancelAnimationFrame(animationId);
  clearNotes();
  song.pause();
  song.currentTime = 0;
  gameRunning = false;
  score = 0;
  combo = 0;
  scoreEl.textContent = "0";
  comboEl.textContent = "0";
  setJudgement("READY");
}

async function startGame() {
  resetGame();
  await getAudioContext().resume();
  activeDifficulty = getDifficulty();
  buildNotes();

  try {
    song.volume = 0.72;
    await song.play();
  } catch (error) {
    setJudgement("MUSIC ERROR");
  }

  gameRunning = true;
  startTime = performance.now();
  setJudgement("GO");

  animationId = requestAnimationFrame(update);
}

function update(now) {
  if (!gameRunning) {
    return;
  }

  const elapsed = now - startTime;
  const stageHeight = stage.clientHeight;
  const hitY = stageHeight - hitLineOffset;
  const difficulty = activeDifficulty || getDifficulty();

  notes.forEach((note) => {
    if (note.hit) {
      return;
    }

    const progress = (elapsed - (note.time - difficulty.noteTravelMs)) / difficulty.noteTravelMs;
    const currentNoteHeight = note.element.offsetHeight || noteHeight;
    const y = progress * hitY - currentNoteHeight / 2;
    note.element.style.top = `${y}px`;

    if (!note.missed && elapsed - note.time > difficulty.missWindow) {
      note.missed = true;
      note.element.classList.add("missed");
      combo = 0;
      updateScore(0);
      setJudgement("MISS");
      playMissSound();
      window.setTimeout(() => note.element.remove(), 160);
    }
  });

  const currentSongLength = Number.isFinite(song.duration)
    ? song.duration * 1000
    : songLengthMs;

  if (elapsed > currentSongLength) {
    finishGame();
    return;
  }

  animationId = requestAnimationFrame(update);
}

function finishGame() {
  gameRunning = false;
  song.pause();
  setJudgement(`완료 ${score}`);
}

function hitKey(key) {
  if (!gameRunning || !keys.includes(key)) {
    return;
  }

  const lane = lanes.find((item) => item.dataset.key === key);
  lane.classList.add("active");
  window.setTimeout(() => lane.classList.remove("active"), 90);

  const elapsed = performance.now() - startTime;
  const difficulty = activeDifficulty || getDifficulty();
  const target = notes
    .filter((note) => note.key === key && !note.hit && !note.missed)
    .map((note) => ({ note, diff: Math.abs(elapsed - note.time) }))
    .sort((a, b) => a.diff - b.diff)[0];

  if (!target || target.diff > difficulty.missWindow) {
    combo = 0;
    updateScore(0);
    setJudgement("MISS");
    playMissSound();
    return;
  }

  target.note.hit = true;
  target.note.element.classList.add("hit");
  window.setTimeout(() => target.note.element.remove(), 120);

  if (target.diff <= difficulty.perfectWindow) {
    combo += 1;
    updateScore(1000 + combo * 12);
    setJudgement("PERFECT");
    playHitSound(key, "PERFECT");
  } else if (target.diff <= difficulty.goodWindow) {
    combo += 1;
    updateScore(650 + combo * 8);
    setJudgement("GOOD");
    playHitSound(key, "GOOD");
  } else {
    combo = 0;
    updateScore(150);
    setJudgement("BAD");
    playMissSound();
  }
}

document.addEventListener("keydown", (event) => {
  if (event.repeat) {
    return;
  }

  const key = event.key.toLowerCase();
  if (keys.includes(key)) {
    event.preventDefault();
    hitKey(key);
  }
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
song.addEventListener("ended", finishGame);
