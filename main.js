const hitLineOffset = 72;
const noteHeight = 58;
const songLengthMs = 32000;
const noteSpawnAheadMs = 260;

const stage = document.querySelector(".stage");
const scoreEl = document.querySelector("#score");
const comboEl = document.querySelector("#combo");
const judgementEl = document.querySelector("#judgement");
const startButton = document.querySelector("#startButton");
const restartButton = document.querySelector("#restartButton");
const difficultyInputs = [...document.querySelectorAll('input[name="difficulty"]')];
const modeInputs = [...document.querySelectorAll('input[name="gameMode"]')];
const songUpload = document.querySelector("#songUpload");
const analysisStatus = document.querySelector("#analysisStatus");
const song = document.querySelector("#song");
const defaultSongSource = song.getAttribute("src");

let audioContext;
let startTime = 0;
let animationId = 0;
let gameRunning = false;
let score = 0;
let combo = 0;
let notes = [];
let activeDifficulty = null;
let activeModeKey = "classic";
let uploadedSongUrl = "";
let uploadedPianoChart = [];
let uploadedSongName = "";

const difficulties = {
  easy: {
    noteTravelMs: 2200,
    perfectWindow: 95,
    goodWindow: 160,
    missWindow: 220,
    noteStep: 2,
    analysisMinGap: 300,
    analysisNotesPerSecond: 1.8,
    analysisMinNotes: 36,
    analysisMaxNotes: 220,
    pitchConfidence: 0.2,
    label: "쉬움"
  },
  normal: {
    noteTravelMs: 1850,
    perfectWindow: 70,
    goodWindow: 125,
    missWindow: 175,
    noteStep: 1,
    analysisMinGap: 220,
    analysisNotesPerSecond: 2.9,
    analysisMinNotes: 52,
    analysisMaxNotes: 420,
    pitchConfidence: 0.18,
    label: "보통"
  },
  hard: {
    noteTravelMs: 1550,
    perfectWindow: 50,
    goodWindow: 95,
    missWindow: 135,
    noteStep: 1,
    analysisMinGap: 160,
    analysisNotesPerSecond: 4.4,
    analysisMinNotes: 72,
    analysisMaxNotes: 760,
    pitchConfidence: 0.16,
    label: "어려움"
  }
};

const classicKeys = [
  { key: "a", label: "A", note: "A", frequency: 262 },
  { key: "s", label: "S", note: "S", frequency: 330 },
  { key: "d", label: "D", note: "D", frequency: 392 },
  { key: "f", label: "F", note: "F", frequency: 523 }
];

const pianoKeys = [
  { key: "a", label: "A", note: "도", frequency: 261.63 },
  { key: "s", label: "S", note: "레", frequency: 293.66 },
  { key: "d", label: "D", note: "미", frequency: 329.63 },
  { key: "f", label: "F", note: "파", frequency: 349.23 },
  { key: "j", label: "J", note: "솔", frequency: 392 },
  { key: "k", label: "K", note: "라", frequency: 440 },
  { key: "l", label: "L", note: "시", frequency: 493.88 },
  { key: ";", label: ";", note: "높은 도", frequency: 523.25 }
];

const classicBaseChart = [
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

const classicHardExtraChart = [
  [1050, "f"], [1425, "d"], [1775, "s"],
  [4175, "d"], [4425, "a"], [4675, "f"],
  [7275, "s"], [7625, "a"], [7975, "f"],
  [8975, "d"], [9225, "f"], [9475, "s"],
  [13725, "s"], [13975, "f"], [14225, "a"],
  [17025, "d"], [17375, "f"], [17725, "a"],
  [23625, "f"], [23875, "a"], [24125, "s"],
  [28775, "f"], [29125, "a"], [29475, "s"]
];

const pianoBaseChart = [
  [900, "a"], [1200, "s"], [1500, "d"], [1800, "f"], [2100, "j"], [2400, "k"], [2700, "l"], [3000, ";"],
  [3450, ";"], [3750, "l"], [4050, "k"], [4350, "j"], [4650, "f"], [4950, "d"], [5250, "s"], [5550, "a"],
  [6100, "a"], [6350, "d"], [6600, "j"], [6850, "d"], [7100, "s"], [7350, "f"], [7600, "k"], [7850, "f"],
  [8400, "j"], [8650, "k"], [8900, "l"], [9150, ";"], [9400, "l"], [9650, "k"], [9900, "j"], [10150, "f"],
  [10800, "a"], [11100, "s"], [11400, "d"], [11700, "j"], [12000, "f"], [12300, "d"], [12600, "s"], [12900, "a"],
  [13450, "f"], [13700, "j"], [13950, "k"], [14200, "l"], [14450, "k"], [14700, "j"], [14950, "f"], [15200, "d"],
  [15850, "a"], [16100, "s"], [16350, "d"], [16600, "f"], [16850, "j"], [17100, "k"], [17350, "l"], [17600, ";"],
  [18150, ";"], [18400, "k"], [18650, "j"], [18900, "f"], [19150, "d"], [19400, "f"], [19650, "j"], [19900, "k"],
  [20550, "a"], [20850, "d"], [21150, "f"], [21450, "j"], [21750, "k"], [22050, "j"], [22350, "f"], [22650, "d"],
  [23300, "s"], [23550, "d"], [23800, "f"], [24050, "j"], [24300, "k"], [24550, "l"], [24800, ";"], [25050, "l"],
  [25700, "j"], [26000, "f"], [26300, "d"], [26600, "s"], [26900, "a"], [27200, "d"], [27500, "f"], [27800, "j"],
  [28600, "k"], [28900, "l"], [29200, ";"], [29650, ";"]
];

const pianoHardExtraChart = [
  [1050, "j"], [1350, "k"], [1650, "l"],
  [6225, "k"], [6725, ";"], [7225, "l"], [7725, "j"],
  [8525, "d"], [9025, "f"], [9525, "d"],
  [13575, "a"], [14075, "d"], [14575, ";"], [15075, "l"],
  [15975, ";"], [16475, "l"], [16975, "j"], [17475, "f"],
  [23425, "k"], [23925, ";"], [24425, "j"], [24925, "d"],
  [28750, "f"], [29100, "k"], [29450, "l"]
];

const gameModes = {
  classic: {
    label: "ASDF 모드",
    stageClass: "classic-mode",
    keys: classicKeys,
    baseChart: classicBaseChart,
    hardExtraChart: classicHardExtraChart,
    pianoInput: false
  },
  piano: {
    label: "피아노 모드",
    stageClass: "piano-mode",
    keys: pianoKeys,
    baseChart: pianoBaseChart,
    hardExtraChart: pianoHardExtraChart,
    pianoInput: true
  }
};

function getDifficultyKey() {
  return difficultyInputs.find((input) => input.checked)?.value || "normal";
}

function getDifficulty() {
  return difficulties[getDifficultyKey()];
}

function getModeKey() {
  return modeInputs.find((input) => input.checked)?.value || "classic";
}

function getMode(modeKey = getModeKey()) {
  return gameModes[modeKey] || gameModes.classic;
}

function getActiveMode() {
  return getMode(activeModeKey);
}

function getKeyConfig(key, mode = getMode()) {
  return mode.keys.find((item) => item.key === key);
}

function getChart(mode = getMode(), difficultyKey = getDifficultyKey()) {
  const difficulty = difficulties[difficultyKey];
  const customPianoChart = mode.pianoInput && uploadedPianoChart.length > 0;
  const baseChart = customPianoChart ? uploadedPianoChart : mode.baseChart;
  const hardExtraChart = customPianoChart ? [] : mode.hardExtraChart;
  const chart = difficultyKey === "hard"
    ? [...baseChart, ...hardExtraChart].sort((a, b) => a[0] - b[0])
    : baseChart;

  return chart.filter((_, index) => index % difficulty.noteStep === 0);
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

function playPianoTone(key, accented = false) {
  const mode = gameRunning ? getActiveMode() : getMode();
  const keyConfig = getKeyConfig(key, mode);

  if (!keyConfig) {
    return;
  }

  const context = getAudioContext();
  const now = context.currentTime;
  const mainOscillator = context.createOscillator();
  const overtone = context.createOscillator();
  const gain = context.createGain();
  const overtoneGain = context.createGain();
  const peak = accented ? 0.16 : 0.11;

  mainOscillator.type = "triangle";
  overtone.type = "sine";
  mainOscillator.frequency.setValueAtTime(keyConfig.frequency, now);
  overtone.frequency.setValueAtTime(keyConfig.frequency * 2, now);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
  overtoneGain.gain.setValueAtTime(peak * 0.32, now);
  overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

  mainOscillator.connect(gain);
  overtone.connect(overtoneGain);
  overtoneGain.connect(gain);
  gain.connect(context.destination);
  mainOscillator.start(now);
  overtone.start(now);
  mainOscillator.stop(now + 0.56);
  overtone.stop(now + 0.26);
}

function playHitSound(key, judgement) {
  const mode = getActiveMode();

  if (mode.pianoInput) {
    playPianoTone(key, judgement === "PERFECT");
    return;
  }

  const base = getKeyConfig(key, mode)?.frequency || 262;
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

function setAnalysisStatus(text) {
  analysisStatus.textContent = text;
}

function renderLanes(modeKey = getModeKey()) {
  const mode = getMode(modeKey);

  clearNotes();
  stage.querySelectorAll(".lane").forEach((lane) => lane.remove());
  stage.classList.remove("classic-mode", "piano-mode");
  stage.classList.add(mode.stageClass);
  stage.style.setProperty("--lane-count", mode.keys.length);

  mode.keys.forEach((item) => {
    const lane = document.createElement("button");
    lane.className = "lane";
    lane.type = "button";
    lane.dataset.key = item.key;
    lane.setAttribute("aria-label", `${item.note} ${item.label} 키`);
    lane.innerHTML = `<span>${item.label}</span><small>${item.note}</small>`;
    stage.appendChild(lane);
  });
}

function buildNotes() {
  const mode = getActiveMode();

  notes = getChart(mode).map(([time, key]) => {
    const keyConfig = getKeyConfig(key, mode);

    return {
      time,
      key,
      keyConfig,
      element: null,
      hit: false,
      missed: false
    };
  });
}

function clearNotes() {
  notes.forEach((note) => note.element?.remove());
  notes = [];
}

function removeNoteElement(note, delay = 0) {
  if (!note.element) {
    return;
  }

  const element = note.element;
  note.element = null;
  window.setTimeout(() => element.remove(), delay);
}

function spawnNoteElement(note, mode) {
  if (note.element) {
    return;
  }

  const lane = [...document.querySelectorAll(".lane")].find((item) => item.dataset.key === note.key);

  if (!lane) {
    return;
  }

  const element = document.createElement("div");
  element.className = "note";
  element.dataset.key = note.keyConfig.label;
  element.dataset.note = note.keyConfig.note;
  element.textContent = mode.pianoInput ? note.keyConfig.note : note.keyConfig.label;
  lane.appendChild(element);
  note.element = element;
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
  activeModeKey = getModeKey();
  song.src = activeModeKey === "piano" && uploadedSongUrl ? uploadedSongUrl : defaultSongSource;
  renderLanes(activeModeKey);
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

function getAnalysisAudioData(audioBuffer) {
  const sampleStep = audioBuffer.sampleRate > 32000 ? 2 : 1;
  const length = Math.floor(audioBuffer.length / sampleStep);
  const mono = new Float32Array(length);

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const data = audioBuffer.getChannelData(channel);

    for (let index = 0; index < length; index += 1) {
      mono[index] += data[index * sampleStep] / audioBuffer.numberOfChannels;
    }
  }

  return {
    samples: mono,
    sampleRate: audioBuffer.sampleRate / sampleStep
  };
}

function getRms(samples, start, size) {
  let sum = 0;

  for (let index = 0; index < size; index += 4) {
    const sample = samples[start + index] || 0;
    sum += sample * sample;
  }

  return Math.sqrt(sum / Math.ceil(size / 4));
}

function estimatePitch(samples, start, size, sampleRate) {
  const candidates = pianoKeys.flatMap((item) => {
    const frequencies = [];

    for (let factor = 0.25; factor <= 4; factor *= 2) {
      const frequency = item.frequency * factor;

      if (frequency >= 55 && frequency <= 1400) {
        frequencies.push({ frequency, key: item.key });
      }
    }

    return frequencies;
  });
  let best = { frequency: 0, key: "", confidence: 0 };

  candidates.forEach((candidate) => {
    const lag = Math.round(sampleRate / candidate.frequency);
    let correlation = 0;
    let energyA = 0;
    let energyB = 0;

    for (let index = 0; index < size - lag; index += 6) {
      const a = samples[start + index] || 0;
      const b = samples[start + index + lag] || 0;
      correlation += a * b;
      energyA += a * a;
      energyB += b * b;
    }

    const confidence = correlation / Math.sqrt((energyA || 1) * (energyB || 1));

    if (confidence > best.confidence) {
      best = {
        frequency: candidate.frequency,
        key: candidate.key,
        confidence
      };
    }
  });

  return best;
}

function normalizeToPianoRange(frequency) {
  let normalized = frequency;
  const low = pianoKeys[0].frequency;
  const high = pianoKeys[pianoKeys.length - 1].frequency;

  while (normalized && normalized < low) {
    normalized *= 2;
  }

  while (normalized > high) {
    normalized /= 2;
  }

  return normalized;
}

function mapFrequencyToPianoKey(frequency) {
  const normalized = normalizeToPianoRange(frequency);

  if (!normalized) {
    return "";
  }

  return pianoKeys
    .map((item) => ({
      key: item.key,
      distance: Math.abs(Math.log2(normalized / item.frequency))
    }))
    .sort((a, b) => a.distance - b.distance)[0].key;
}

function getAnalysisOptions() {
  const difficulty = getDifficulty();

  return {
    minGap: difficulty.analysisMinGap,
    notesPerSecond: difficulty.analysisNotesPerSecond,
    minNotes: difficulty.analysisMinNotes,
    maxNotes: difficulty.analysisMaxNotes,
    pitchConfidence: difficulty.pitchConfidence
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function waitForBrowserFrame() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

async function buildGeneratedPianoChart(audioBuffer) {
  const { samples, sampleRate } = getAnalysisAudioData(audioBuffer);
  const { minGap, notesPerSecond, minNotes, maxNotes, pitchConfidence } = getAnalysisOptions();
  const hopSize = Math.floor(sampleRate * 0.045);
  const frameSize = Math.floor(sampleRate * 0.055);
  const energies = [];

  for (let start = 0; start + frameSize < samples.length; start += hopSize) {
    const rms = getRms(samples, start, frameSize);

    energies.push({
      start,
      time: start / sampleRate * 1000,
      rms,
      flux: 0
    });

    if (energies.length % 700 === 0) {
      setAnalysisStatus(`분석 중... ${Math.round(start / samples.length * 45)}%`);
      await waitForBrowserFrame();
    }
  }

  for (let index = 1; index < energies.length; index += 1) {
    energies[index].flux = Math.max(0, energies[index].rms - energies[index - 1].rms);

    if (index % 1200 === 0) {
      setAnalysisStatus(`분석 중... ${45 + Math.round(index / energies.length * 15)}%`);
      await waitForBrowserFrame();
    }
  }

  const averageEnergy = energies.reduce((sum, frame) => sum + frame.rms, 0) / (energies.length || 1);
  const averageFlux = energies.reduce((sum, frame) => sum + frame.flux, 0) / (energies.length || 1);
  const energyThreshold = Math.max(averageEnergy * 0.78, 0.006);
  const fluxThreshold = Math.max(averageFlux * 1.28, 0.0018);
  const rawEvents = collectRawEvents(energies, energyThreshold, fluxThreshold, 90);
  const rawEventsPerSecond = rawEvents.length / Math.max(1, audioBuffer.duration);
  const complexity = clamp((rawEventsPerSecond - 2.2) / 5.2, 0, 1);
  const baseLimit = clamp(Math.round(audioBuffer.duration * notesPerSecond), minNotes, maxNotes);
  const dynamicMinGap = Math.round(lerp(minGap, Math.max(80, minGap * 0.5), complexity));
  const dynamicLimit = Math.round(lerp(baseLimit * 0.65, baseLimit * 1.55, complexity));
  const dynamicPitchConfidence = lerp(pitchConfidence + 0.05, Math.max(0.1, pitchConfidence - 0.06), complexity);
  const candidates = [];
  let lastTime = -Infinity;

  for (let index = 1; index < energies.length - 1; index += 1) {
    const previous = energies[index - 1];
    const current = energies[index];
    const next = energies[index + 1];
    const isEnergyPeak = current.rms > energyThreshold && current.rms >= previous.rms && current.rms > next.rms;
    const isAttack = current.flux > fluxThreshold && current.flux >= previous.flux;
    const isNewHit = current.time - lastTime > dynamicMinGap;

    if ((!isEnergyPeak && !isAttack) || !isNewHit) {
      continue;
    }

    const pitch = estimatePitch(samples, current.start, Math.min(frameSize * 2, samples.length - current.start), sampleRate);
    const key = pitch.key || mapFrequencyToPianoKey(pitch.frequency);

    if (!key || pitch.confidence < dynamicPitchConfidence) {
      continue;
    }

    candidates.push({
      time: Math.max(450, Math.round(current.time)),
      key,
      score: current.rms + current.flux * 2 + pitch.confidence
    });
    lastTime = current.time;

    if (index % 500 === 0) {
      setAnalysisStatus(`분석 중... ${60 + Math.round(index / energies.length * 35)}%`);
      await waitForBrowserFrame();
    }
  }

  const chart = selectChartAcrossSong(candidates, dynamicLimit, audioBuffer.duration * 1000, complexity);

  if (chart.length > 0) {
    return chart;
  }

  return [];
}

function collectRawEvents(energies, energyThreshold, fluxThreshold, minGap) {
  const events = [];
  let lastTime = -Infinity;

  for (let index = 1; index < energies.length - 1; index += 1) {
    const previous = energies[index - 1];
    const current = energies[index];
    const next = energies[index + 1];
    const isEnergyPeak = current.rms > energyThreshold && current.rms >= previous.rms && current.rms > next.rms;
    const isAttack = current.flux > fluxThreshold && current.flux >= previous.flux;

    if ((isEnergyPeak || isAttack) && current.time - lastTime > minGap) {
      events.push(current);
      lastTime = current.time;
    }
  }

  return events;
}

function selectChartAcrossSong(candidates, limit, durationMs, complexity) {
  if (candidates.length <= limit) {
    return smoothGeneratedChart(candidates.map((candidate) => [candidate.time, candidate.key]), complexity);
  }

  const bucketCount = Math.min(limit, Math.max(1, Math.ceil(durationMs / 950)));
  const buckets = Array.from({ length: bucketCount }, () => []);

  candidates.forEach((candidate) => {
    const bucketIndex = Math.min(bucketCount - 1, Math.floor(candidate.time / durationMs * bucketCount));
    buckets[bucketIndex].push(candidate);
  });

  const selected = [];
  const perBucketBase = Math.max(1, Math.floor(limit / bucketCount));
  let spare = limit - bucketCount * perBucketBase;

  buckets.forEach((bucket) => {
    const takeCount = perBucketBase + (spare > 0 ? 1 : 0);

    if (spare > 0) {
      spare -= 1;
    }

    bucket
      .sort((a, b) => b.score - a.score)
      .slice(0, takeCount)
      .forEach((candidate) => selected.push(candidate));
  });

  return smoothGeneratedChart(selected
    .sort((a, b) => a.time - b.time)
    .map((candidate) => [candidate.time, candidate.key]), complexity);
}

function smoothGeneratedChart(chart, complexity) {
  const smoothed = [];
  const repeatGap = lerp(520, 220, complexity);
  const jumpGap = lerp(420, 180, complexity);

  chart.forEach(([time, key]) => {
    const previous = smoothed[smoothed.length - 1];

    if (previous && previous[1] === key && time - previous[0] < repeatGap) {
      return;
    }

    if (previous && Math.abs(pianoKeys.findIndex((item) => item.key === key) - pianoKeys.findIndex((item) => item.key === previous[1])) > 5 && time - previous[0] < jumpGap) {
      return;
    }

    smoothed.push([time, key]);
  });

  return smoothed;
}

async function analyzeUploadedSong(file) {
  if (!file) {
    return;
  }

  resetGame();
  setAnalysisStatus("분석 중...");

  try {
    const arrayBuffer = await file.arrayBuffer();
    const context = getAudioContext();
    const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
    uploadedPianoChart = await buildGeneratedPianoChart(audioBuffer);
    uploadedSongName = file.name;

    if (uploadedSongUrl) {
      URL.revokeObjectURL(uploadedSongUrl);
    }

    uploadedSongUrl = URL.createObjectURL(file);
    song.src = uploadedSongUrl;

    const pianoInput = modeInputs.find((input) => input.value === "piano");
    pianoInput.checked = true;
    renderLanes("piano");
    setAnalysisStatus(`${uploadedSongName} 분석 완료: 노트 ${uploadedPianoChart.length}개`);
  } catch (error) {
    uploadedPianoChart = [];
    uploadedSongName = "";

    if (uploadedSongUrl) {
      URL.revokeObjectURL(uploadedSongUrl);
      uploadedSongUrl = "";
    }

    song.src = defaultSongSource;
    setAnalysisStatus("분석 실패: 다른 음원 파일을 시도해 주세요");
  }
}

function update(now) {
  if (!gameRunning) {
    return;
  }

  const elapsed = now - startTime;
  const stageHeight = stage.clientHeight;
  const hitY = stageHeight - hitLineOffset;
  const difficulty = activeDifficulty || getDifficulty();
  const mode = getActiveMode();

  notes.forEach((note) => {
    if (note.hit || note.missed) {
      return;
    }

    if (!note.element && note.time - elapsed <= difficulty.noteTravelMs + noteSpawnAheadMs) {
      spawnNoteElement(note, mode);
    }

    if (!note.element) {
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
      removeNoteElement(note, 160);
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

function pulseLane(lane) {
  lane.classList.add("active");
  window.setTimeout(() => lane.classList.remove("active"), 90);
}

function hitKey(key) {
  const mode = gameRunning ? getActiveMode() : getMode();

  if (!mode.keys.some((item) => item.key === key)) {
    return;
  }

  if (!gameRunning && !mode.pianoInput) {
    return;
  }

  const lane = [...document.querySelectorAll(".lane")].find((item) => item.dataset.key === key);

  if (lane) {
    pulseLane(lane);
  }

  if (!gameRunning) {
    if (mode.pianoInput) {
      playPianoTone(key, false);
    }
    return;
  }

  const elapsed = performance.now() - startTime;
  const difficulty = activeDifficulty || getDifficulty();
  let target = null;

  notes.forEach((note) => {
    if (note.key !== key || note.hit || note.missed) {
      return;
    }

    const diff = Math.abs(elapsed - note.time);

    if (!target || diff < target.diff) {
      target = { note, diff };
    }
  });

  if (!target || target.diff > difficulty.missWindow) {
    combo = 0;
    updateScore(0);
    setJudgement("MISS");

    if (mode.pianoInput) {
      playPianoTone(key, false);
    } else {
      playMissSound();
    }

    return;
  }

  target.note.hit = true;

  if (target.note.element) {
    target.note.element.classList.add("hit");
    removeNoteElement(target.note, 120);
  }

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

    if (mode.pianoInput) {
      playPianoTone(key, false);
    } else {
      playMissSound();
    }
  }
}

document.addEventListener("keydown", (event) => {
  if (event.repeat) {
    return;
  }

  const key = event.key.toLowerCase();
  const mode = gameRunning ? getActiveMode() : getMode();

  if (mode.keys.some((item) => item.key === key)) {
    event.preventDefault();
    hitKey(key);
  }
});

stage.addEventListener("pointerdown", async (event) => {
  const lane = event.target.closest(".lane");

  if (!lane) {
    return;
  }

  event.preventDefault();
  await getAudioContext().resume();
  hitKey(lane.dataset.key);
});

modeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    if (!gameRunning) {
      renderLanes();
      song.src = getModeKey() === "piano" && uploadedSongUrl ? uploadedSongUrl : defaultSongSource;
    }
  });
});

songUpload.addEventListener("change", () => {
  analyzeUploadedSong(songUpload.files[0]);
});

renderLanes();
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
song.addEventListener("ended", finishGame);
