// Motor do jogo "Estrada Neon": corrida pseudo-3D (estrada por segmentos projetados)
// desenhada em <canvas>. Não depende de React; o componente Game.js só o instancia.

import { buildSprites } from "./sprites";
import { createAudio } from "./audio";

// ---------------------------------------------------------------- constantes
const STEP = 1 / 60; // passo fixo da simulação
const VIRTUAL_H = 480; // altura interna do canvas (estética retrô)
const SEG_LEN = 200; // comprimento de um segmento de estrada
const RUMBLE_LEN = 3; // segmentos por faixa de zebra
const ROAD_W = 2000; // meia largura da estrada (unidades do mundo)
const LANES = 3;
const FOV = 100;
const CAM_H = 1000;
const DRAW_DIST = 300;
const FOG_DENSITY = 5;
const CAM_DEPTH = 1 / Math.tan(((FOV / 2) * Math.PI) / 180);
const PLAYER_Z = CAM_H * CAM_DEPTH;

const MAX_SPEED = SEG_LEN / STEP;
const ACCEL = MAX_SPEED / 5;
const BRAKING = -MAX_SPEED;
const DECEL = -MAX_SPEED / 5;
const OFFROAD_DECEL = -MAX_SPEED / 2;
const OFFROAD_LIMIT = MAX_SPEED / 4;
const CENTRIFUGAL = 0.3;

const CAR_WORLD_W = 600;
const CAR_W = CAR_WORLD_W / ROAD_W; // largura do carro em unidades de "playerX"
const TOTAL_CARS = 45;

const START_TIME = 50;
const SKY_SPEED = 0.001;
const CITY_SPEED = 0.002;
const BEST_KEY = "estrada-neon-recorde";

const COLORS = {
  fog: "#9e2a6e",
  grid: "#5c1784",
  light: { road: "#2b2540", grass: "#22083a", rumble: "#ff2a6d", lane: "#05d9e8" },
  dark: { road: "#262039", grass: "#1c0730", rumble: "#f2f2f2" },
  start: { road: "#f2f2f2", grass: "#22083a", rumble: "#f2f2f2" },
  checkpoint: { road: "#f9c80e", grass: "#22083a", rumble: "#f9c80e" },
};

const ROAD = {
  LENGTH: { NONE: 0, SHORT: 25, MEDIUM: 50, LONG: 100 },
  HILL: { NONE: 0, LOW: 20, MEDIUM: 40, HIGH: 60 },
  CURVE: { NONE: 0, EASY: 2, MEDIUM: 4, HARD: 6 },
};

const GRID_LINES = [1.7, 2.6, 3.8, 5.4, 7.6, 10.5];

// ---------------------------------------------------------------- utilitários
const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
const interp = (a, b, p) => a + (b - a) * p;
const easeIn = (a, b, p) => a + (b - a) * p * p;
const easeInOut = (a, b, p) => a + (b - a) * (-Math.cos(p * Math.PI) / 2 + 0.5);
const pctRemaining = (n, total) => (n % total) / total;
const fogAt = (d) => 1 / Math.pow(Math.E, d * d * FOG_DENSITY);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const increase = (start, inc, max) => {
  let r = start + inc;
  while (r >= max) r -= max;
  while (r < 0) r += max;
  return r;
};
const overlap = (x1, w1, x2, w2, pct = 1) => {
  const h = pct / 2;
  return !(x1 + w1 * h < x2 - w2 * h || x1 - w1 * h > x2 + w2 * h);
};

// ---------------------------------------------------------------- pista
function buildTrack() {
  const segments = [];
  const lastY = () => (segments.length ? segments[segments.length - 1].p2.world.y : 0);

  const addSegment = (curve, y) => {
    const n = segments.length;
    segments.push({
      index: n,
      p1: { world: { y: lastY(), z: n * SEG_LEN }, camera: {}, screen: {} },
      p2: { world: { y, z: (n + 1) * SEG_LEN }, camera: {}, screen: {} },
      curve,
      sprites: [],
      cars: [],
      color: Math.floor(n / RUMBLE_LEN) % 2 ? COLORS.dark : COLORS.light,
      clip: 0,
      fog: 1,
    });
  };

  const addRoad = (enter, hold, leave, curve, height) => {
    const startY = lastY();
    const endY = startY + Math.round(height) * SEG_LEN;
    const total = enter + hold + leave;
    for (let i = 0; i < enter; i++) addSegment(easeIn(0, curve, i / enter), easeInOut(startY, endY, i / total));
    for (let i = 0; i < hold; i++) addSegment(curve, easeInOut(startY, endY, (enter + i) / total));
    for (let i = 0; i < leave; i++)
      addSegment(easeInOut(curve, 0, i / leave), easeInOut(startY, endY, (enter + hold + i) / total));
  };

  const { LENGTH: L, HILL: Hh, CURVE: C } = ROAD;
  const straight = (n = L.MEDIUM) => addRoad(n, n, n, 0, 0);
  const hill = (n = L.MEDIUM, h = Hh.MEDIUM) => addRoad(n, n, n, 0, h);
  const curve = (n = L.MEDIUM, c = C.MEDIUM, h = Hh.NONE) => addRoad(n, n, n, c, h);
  const rolling = (h = Hh.LOW) => {
    const n = L.SHORT;
    addRoad(n, n, n, 0, h / 2);
    addRoad(n, n, n, 0, -h);
    addRoad(n, n, n, C.EASY, h);
    addRoad(n, n, n, 0, 0);
    addRoad(n, n, n, -C.EASY, h / 2);
    addRoad(n, n, n, 0, 0);
  };
  const sCurves = () => {
    addRoad(L.MEDIUM, L.MEDIUM, L.MEDIUM, -C.EASY, Hh.NONE);
    addRoad(L.MEDIUM, L.MEDIUM, L.MEDIUM, C.MEDIUM, Hh.MEDIUM);
    addRoad(L.MEDIUM, L.MEDIUM, L.MEDIUM, C.EASY, -Hh.LOW);
    addRoad(L.MEDIUM, L.MEDIUM, L.MEDIUM, -C.EASY, Hh.MEDIUM);
    addRoad(L.MEDIUM, L.MEDIUM, L.MEDIUM, -C.MEDIUM, -Hh.MEDIUM);
  };
  const bumps = () => {
    for (const h of [5, -2, -5, 8, 5, -7, 5, -2]) addRoad(10, 10, 10, 0, h);
  };

  straight(L.SHORT);
  rolling();
  sCurves();
  curve(L.MEDIUM, C.MEDIUM, Hh.LOW);
  bumps();
  rolling();
  curve(L.LONG * 2, C.MEDIUM, Hh.MEDIUM);
  straight();
  hill(L.MEDIUM, Hh.HIGH);
  sCurves();
  curve(L.LONG, -C.MEDIUM, Hh.NONE);
  hill(L.LONG, Hh.HIGH);
  curve(L.LONG, C.HARD, -Hh.LOW);
  bumps();
  hill(L.LONG, -Hh.MEDIUM);
  straight();
  sCurves();
  // descida final até a altura zero, para a pista fechar o circuito
  addRoad(200, 200, 200, -C.EASY, -lastY() / SEG_LEN);

  if (segments.length % 2) addSegment(0, 0); // nº par: o checkpoint fica exatamente na metade

  return segments;
}

// ---------------------------------------------------------------- jogo
export function createGame(canvas, { onChange, fontFamily = "monospace" } = {}) {
  const ctx = canvas.getContext("2d");
  const sprites = buildSprites();
  const audio = createAudio();

  const segments = buildTrack();
  const trackLength = segments.length * SEG_LEN;
  const findSegment = (z) => segments[Math.floor(z / SEG_LEN) % segments.length];
  const startIdx = findSegment(PLAYER_Z).index;
  const midIdx = (startIdx + segments.length / 2) % segments.length;

  let W = 640;
  let H = VIRTUAL_H;
  let XS = H * (2 / 3); // escala horizontal da projeção
  let YS = H / 2; // escala vertical da projeção
  let skyCanvas = null;

  // estado
  let state = "menu"; // menu | countdown | playing | paused | gameover
  let pausedFrom = null;
  let position = 0;
  let playerX = 0;
  let speed = 0;
  let timeLeft = START_TIME;
  let score = 0;
  let lap = 1;
  let checkpoints = 0;
  let lastPlayerIdx = startIdx;
  let countdown = 0;
  let skyOffset = 0;
  let cityOffset = 0;
  let shake = 0;
  let crashCooldown = 0;
  let message = null; // { text, color, t }
  let newBest = false;
  let cars = [];
  let best = 0;
  try {
    best = Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    best = 0;
  }

  const keys = { left: false, right: false, up: false, down: false };

  // ---------------------------------------------------------- montagem da pista
  function colorSegments() {
    const len = segments.length;
    for (const i of [startIdx, startIdx + 1]) segments[i % len].color = COLORS.start;
    for (const i of [midIdx, midIdx + 1]) segments[i % len].color = COLORS.checkpoint;
  }

  function placeSprites() {
    const len = segments.length;
    const add = (n, sprite, offset) => segments[((n % len) + len) % len].sprites.push({ sprite, offset });

    add(startIdx + 3, sprites.start, -1.25);
    add(startIdx + 3, sprites.start, 1.25);
    add(midIdx + 2, sprites.checkpoint, -1.25);
    add(midIdx + 2, sprites.checkpoint, 1.25);
    add(midIdx - 60, sprites.checkpoint, 1.3);

    const reserved = new Set([startIdx + 3, midIdx + 2, midIdx - 60].map((n) => n % len));

    for (let n = 30, side = 1; n < len - 20; n += 110 + Math.floor(Math.random() * 60), side = -side) {
      if (reserved.has(n)) continue;
      add(n, pick(sprites.billboards), side * (1.3 + Math.random() * 0.4));
      reserved.add(n);
    }

    for (let n = 8; n < len; n++) {
      if (reserved.has(n)) continue;
      if (n % 20 === 0) {
        add(n, sprites.lamp, -1.12);
        add(n, sprites.lamp, 1.12);
        continue;
      }
      const density = 0.5 + 0.45 * Math.sin(n / 90);
      if (n % 3 === 0 && Math.random() < density) add(n, pick(sprites.palms), -(1.35 + Math.random() * 2.2));
      if (n % 3 === 1 && Math.random() < density) add(n, pick(sprites.palms), 1.35 + Math.random() * 2.2);
      if (n % 7 === 0 && Math.random() < 0.35) add(n, pick(sprites.palms), (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 3));
    }
  }

  function resetCars() {
    for (const seg of segments) seg.cars.length = 0;
    cars = [];
    for (let i = 0; i < TOTAL_CARS; i++) {
      const segIdx = 40 + Math.floor(Math.random() * (segments.length - 60));
      const car = {
        offset: (Math.random() < 0.5 ? -1 : 1) * Math.random() * 0.75,
        z: segIdx * SEG_LEN,
        img: pick(sprites.cars),
        speed: MAX_SPEED / 4 + (Math.random() * MAX_SPEED) / 2.2,
        percent: 0,
      };
      segments[segIdx].cars.push(car);
      cars.push(car);
    }
  }

  colorSegments();
  placeSprites();
  resetCars();

  // ---------------------------------------------------------- UI / estado
  const emit = () =>
    onChange?.({ state, score: Math.floor(score), best, newBest, muted: audio.muted, lap });

  function setState(next) {
    state = next;
    emit();
  }

  function resetRun() {
    position = 0;
    playerX = 0;
    speed = 0;
    timeLeft = START_TIME;
    score = 0;
    lap = 1;
    checkpoints = 0;
    lastPlayerIdx = startIdx;
    message = null;
    newBest = false;
    shake = 0;
    resetCars();
  }

  function start() {
    audio.init();
    resetRun();
    countdown = 3.999;
    audio.tone(440, 0.15);
    setState("countdown");
  }

  function pause() {
    if (state !== "playing" && state !== "countdown") return;
    pausedFrom = state;
    audio.suspend();
    setState("paused");
  }

  function resume() {
    if (state !== "paused") return;
    audio.resume();
    last = performance.now();
    setState(pausedFrom || "playing");
  }

  function togglePause() {
    if (state === "paused") resume();
    else pause();
  }

  function showMessage(text, color = "#f9c80e") {
    message = { text, color, t: 2.2 };
  }

  function gameOver() {
    timeLeft = 0;
    if (Math.floor(score) > best) {
      best = Math.floor(score);
      newBest = true;
      try {
        localStorage.setItem(BEST_KEY, String(best));
      } catch {
        /* armazenamento indisponível */
      }
    }
    audio.tone(330, 0.25, "sawtooth");
    setTimeout(() => audio.tone(196, 0.5, "sawtooth"), 220);
    setState("gameover");
  }

  function reachCheckpoint(isLap) {
    checkpoints++;
    const bonus = Math.max(18, 32 - 2 * (checkpoints - 1));
    timeLeft += bonus;
    score += 500;
    if (isLap) lap++;
    showMessage(isLap ? `VOLTA ${lap}!  +${bonus}s` : `CHECKPOINT!  +${bonus}s`);
    audio.tone(880, 0.12);
    setTimeout(() => audio.tone(1320, 0.2), 120);
  }

  function checkCheckpoints(curIdx) {
    const len = segments.length;
    const p = lastPlayerIdx;
    let c = curIdx;
    lastPlayerIdx = curIdx;
    if (c === p) return;
    if (c < p) {
      if (p - c < len / 2) return; // recuo (colisão), não é volta completa
      c += len;
    }
    for (const cp of [startIdx, midIdx]) {
      const v = cp < p ? cp + len : cp;
      if (p < v && c >= v) reachCheckpoint(cp === startIdx);
    }
  }

  // ---------------------------------------------------------- simulação
  function updateCarOffset(car, carSeg, playerSeg) {
    const lookahead = 20;
    const dist = (carSeg.index - playerSeg.index + segments.length) % segments.length;
    if (dist > DRAW_DIST) return 0;

    for (let i = 1; i < lookahead; i++) {
      const seg = segments[(carSeg.index + i) % segments.length];
      if (seg === playerSeg && car.speed > speed && overlap(playerX, CAR_W, car.offset, CAR_W, 1.2)) {
        const dir = playerX > 0.5 ? -1 : playerX < -0.5 ? 1 : car.offset > playerX ? 1 : -1;
        return ((dir * 1) / i) * ((car.speed - speed) / MAX_SPEED);
      }
      for (const other of seg.cars) {
        if (car.speed > other.speed && overlap(car.offset, CAR_W, other.offset, CAR_W, 1.2)) {
          const dir = other.offset > 0.5 ? -1 : other.offset < -0.5 ? 1 : car.offset > other.offset ? 1 : -1;
          return ((dir * 1) / i) * ((car.speed - other.speed) / MAX_SPEED);
        }
      }
    }
    if (car.offset < -0.85) return 0.01;
    if (car.offset > 0.85) return -0.01;
    return 0;
  }

  function updateCars(dt, playerSeg) {
    for (const car of cars) {
      const oldSeg = findSegment(car.z);
      car.offset = clamp(car.offset + updateCarOffset(car, oldSeg, playerSeg), -0.95, 0.95);
      car.z = increase(car.z, dt * car.speed, trackLength);
      car.percent = pctRemaining(car.z, SEG_LEN);
      const newSeg = findSegment(car.z);
      if (oldSeg !== newSeg) {
        oldSeg.cars.splice(oldSeg.cars.indexOf(car), 1);
        newSeg.cars.push(car);
      }
    }
  }

  function crash() {
    shake = 0.35;
    if (crashCooldown <= 0) {
      audio.crash();
      crashCooldown = 0.5;
    }
  }

  function update(dt) {
    const playerSeg = findSegment(position + PLAYER_Z);
    const speedPct = speed / MAX_SPEED;
    const dx = dt * 2 * speedPct;
    const travelled = dt * speed;

    crashCooldown -= dt;
    shake = Math.max(0, shake - dt);
    if (message) {
      message.t -= dt;
      if (message.t <= 0) message = null;
    }

    updateCars(dt, playerSeg);
    position = increase(position, travelled, trackLength);

    if (state === "menu") {
      // modo demonstração: câmera percorre a pista sozinha
      speed += (MAX_SPEED * 0.55 - speed) * dt;
      playerX += (0 - playerX) * dt * 2;
    } else if (state === "countdown") {
      speed = 0;
      const before = Math.ceil(countdown);
      countdown -= dt;
      if (countdown <= 0) {
        showMessage("VAI!", "#8ef9f3");
        audio.tone(880, 0.35);
        setState("playing");
      } else if (Math.ceil(countdown) !== before) {
        audio.tone(440, 0.15);
      }
    } else {
      const k = state === "playing" ? keys : {};
      if (k.left) playerX -= dx;
      else if (k.right) playerX += dx;
      playerX -= dx * speedPct * playerSeg.curve * CENTRIFUGAL;

      if (k.up) speed += ACCEL * dt;
      else if (k.down) speed += BRAKING * dt;
      else speed += DECEL * dt;

      if (playerX < -1 || playerX > 1) {
        if (speed > OFFROAD_LIMIT) speed += OFFROAD_DECEL * dt;
        for (const s of playerSeg.sprites) {
          const wX = s.sprite.worldW / ROAD_W;
          const center = s.offset + (s.offset > 0 ? 1 : -1) * (wX / 2);
          if (overlap(playerX, CAR_W, center, s.sprite.hitW * wX)) {
            speed = MAX_SPEED / 5;
            position = increase(playerSeg.p1.world.z, -PLAYER_Z, trackLength);
            crash();
            break;
          }
        }
      }

      for (const car of playerSeg.cars) {
        if (speed > car.speed && overlap(playerX, CAR_W, car.offset, CAR_W, 0.8)) {
          speed = car.speed * (car.speed / speed);
          position = increase(car.z, -PLAYER_Z, trackLength);
          crash();
          break;
        }
      }

      if (state === "playing") {
        timeLeft -= dt;
        score += travelled / 100;
        checkCheckpoints(findSegment(position + PLAYER_Z).index);
        if (timeLeft <= 0) gameOver();
      }
    }

    playerX = clamp(playerX, -3, 3);
    speed = clamp(speed, 0, MAX_SPEED);
    skyOffset = increase(skyOffset, (SKY_SPEED * playerSeg.curve * travelled) / SEG_LEN, 1);
    cityOffset = increase(cityOffset, (CITY_SPEED * playerSeg.curve * travelled) / SEG_LEN, 1);
  }

  // ---------------------------------------------------------- renderização
  function buildSky() {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    const horizon = Math.round(H / 2) + 4;

    const sky = g.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#0b0221");
    sky.addColorStop(0.45, "#2a0a4a");
    sky.addColorStop(0.78, "#6b1a6b");
    sky.addColorStop(1, COLORS.fog);
    g.fillStyle = sky;
    g.fillRect(0, 0, W, horizon);
    g.fillStyle = COLORS.fog;
    g.fillRect(0, horizon, W, H - horizon);

    for (let i = 0; i < 90; i++) {
      g.globalAlpha = 0.3 + Math.random() * 0.7;
      g.fillStyle = Math.random() < 0.2 ? "#8ef9f3" : "#ffffff";
      const s = Math.random() < 0.15 ? 2 : 1;
      g.fillRect(Math.random() * W, Math.random() * horizon * 0.55, s, s);
    }
    g.globalAlpha = 1;

    // sol listrado
    const r = Math.round(H * 0.2);
    const sun = document.createElement("canvas");
    sun.width = r * 2;
    sun.height = r * 2;
    const sg = sun.getContext("2d");
    const grad = sg.createLinearGradient(0, 0, 0, r * 2);
    grad.addColorStop(0, "#fff38a");
    grad.addColorStop(0.5, "#ffb347");
    grad.addColorStop(1, "#ff2a6d");
    sg.fillStyle = grad;
    sg.beginPath();
    sg.arc(r, r, r, 0, Math.PI * 2);
    sg.fill();
    sg.globalCompositeOperation = "destination-out";
    for (let i = 0, y = r * 1.05; y < r * 2; i++) {
      const thick = 2 + i * 1.6;
      sg.fillRect(0, y, r * 2, thick);
      y += thick + Math.max(4, 14 - i * 2);
    }
    const sx = Math.round(W / 2 - r);
    const sy = Math.round(horizon - r * 1.55);
    g.save();
    g.shadowColor = "#ff5e9a";
    g.shadowBlur = 40;
    g.drawImage(sun, sx, sy);
    g.restore();

    skyCanvas = c;
  }

  function drawLayer(img, offset, bottom) {
    const iw = img.width;
    const y = Math.round(bottom - img.height);
    for (let x = -Math.floor(offset * iw); x < W; x += iw) ctx.drawImage(img, x, y);
  }

  function poly(x1, y1, x2, y2, x3, y3, x4, y4, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }

  function project(p, camX, camY, camZ) {
    p.camera.x = -camX;
    p.camera.y = p.world.y - camY;
    p.camera.z = p.world.z - camZ;
    p.screen.scale = CAM_DEPTH / p.camera.z;
    p.screen.x = Math.round(W / 2 + p.screen.scale * p.camera.x * XS);
    p.screen.y = Math.round(H / 2 - p.screen.scale * p.camera.y * YS);
    p.screen.w = Math.round(p.screen.scale * ROAD_W * XS);
  }

  function drawSegment(seg) {
    const { p1, p2, color } = seg;
    const x1 = p1.screen.x, y1 = p1.screen.y, w1 = p1.screen.w;
    const x2 = p2.screen.x, y2 = p2.screen.y, w2 = p2.screen.w;
    const r1 = w1 / 6, r2 = w2 / 6;
    const l1 = w1 / 32, l2 = w2 / 32;

    ctx.fillStyle = color.grass;
    ctx.fillRect(0, y2, W, y1 - y2);

    // grade neon no chão
    if (seg.index % 4 === 0) {
      ctx.fillStyle = COLORS.grid;
      const t = Math.max(1, (y1 - y2) * 0.35);
      ctx.fillRect(0, y1 - t, W, t);
    }
    for (const k of GRID_LINES) {
      const g1 = w1 * 0.012, g2 = w2 * 0.012;
      poly(x1 - w1 * k - g1, y1, x1 - w1 * k + g1, y1, x2 - w2 * k + g2, y2, x2 - w2 * k - g2, y2, COLORS.grid);
      poly(x1 + w1 * k - g1, y1, x1 + w1 * k + g1, y1, x2 + w2 * k + g2, y2, x2 + w2 * k - g2, y2, COLORS.grid);
    }

    poly(x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, color.rumble);
    poly(x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, color.rumble);
    poly(x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, color.road);

    if (color.lane) {
      const lw1 = (w1 * 2) / LANES, lw2 = (w2 * 2) / LANES;
      let lx1 = x1 - w1 + lw1, lx2 = x2 - w2 + lw2;
      for (let lane = 1; lane < LANES; lane++, lx1 += lw1, lx2 += lw2) {
        poly(lx1 - l1 / 2, y1, lx1 + l1 / 2, y1, lx2 + l2 / 2, y2, lx2 - l2 / 2, y2, color.lane);
      }
    }

    if (seg.fog < 1) {
      ctx.globalAlpha = 1 - seg.fog;
      ctx.fillStyle = COLORS.fog;
      ctx.fillRect(0, y2, W, y1 - y2);
      ctx.globalAlpha = 1;
    }
  }

  function drawSprite(img, worldW, scale, x, y, offsetX, offsetY, clipY) {
    const destW = worldW * scale * XS;
    const destH = (destW * img.height) / img.width;
    const dx = x + destW * offsetX;
    const dy = y + destH * offsetY;
    if (destW < 1 || dx > W || dx + destW < 0) return;
    const clipH = clipY ? Math.max(0, dy + destH - clipY) : 0;
    if (clipH >= destH) return;
    ctx.drawImage(img, 0, 0, img.width, img.height - (img.height * clipH) / destH, dx, dy, destW, destH - clipH);
  }

  function drawPlayer(playerSeg, playerPct) {
    const steering = state === "playing" && speed > 0 ? (keys.left ? -1 : keys.right ? 1 : 0) : 0;
    const braking = state === "playing" && keys.down;
    const img = sprites.player[steering + 1][braking ? 1 : 0];
    const scale = CAM_DEPTH / PLAYER_Z;
    const camY = interp(playerSeg.p1.camera.y, playerSeg.p2.camera.y, playerPct);
    const bounce = (H / 480) * 1.5 * Math.random() * (speed / MAX_SPEED) * (Math.random() < 0.5 ? -1 : 1);
    const y = H / 2 - scale * camY * YS + bounce;
    drawSprite(img, CAR_WORLD_W, scale, W / 2, y, -0.5, -1);
  }

  function text(str, x, y, size, color, align = "left") {
    ctx.font = `${size}px ${fontFamily}`;
    ctx.textAlign = align;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillText(str, x + 2, y + 2);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  function drawHud() {
    ctx.textBaseline = "top";
    const blink = Math.floor(performance.now() / 250) % 2 === 0;

    text("TEMPO", 16, 14, 10, "#8ef9f3");
    const t = Math.max(0, Math.ceil(timeLeft));
    text(String(t), 16, 30, 28, timeLeft < 10 && blink ? "#ff2a6d" : "#f9c80e");

    text("PONTOS", W / 2, 14, 10, "#8ef9f3", "center");
    text(String(Math.floor(score)).padStart(6, "0"), W / 2, 30, 18, "#ffffff", "center");
    text(`VOLTA ${lap}`, W / 2, 54, 10, "#ff9ec4", "center");

    const kmh = Math.round((speed / MAX_SPEED) * 300);
    text("KM/H", W - 16, 14, 10, "#8ef9f3", "right");
    text(String(kmh), W - 16, 30, 28, "#ffffff", "right");
    const blocks = 12;
    const lit = Math.round((speed / MAX_SPEED) * blocks);
    for (let i = 0; i < blocks; i++) {
      ctx.fillStyle = i < lit ? (i < 6 ? "#05d9e8" : i < 10 ? "#f9c80e" : "#ff2a6d") : "rgba(255,255,255,0.15)";
      ctx.fillRect(W - 16 - (blocks - i) * 9, 64, 7, 8);
    }

    if (state === "countdown") {
      text(String(Math.ceil(countdown)), W / 2, H * 0.3, 64, "#f9c80e", "center");
    }
    if (message && (message.t > 1.2 || blink)) {
      text(message.text, W / 2, H * 0.28, 18, message.color, "center");
    }
    if (state === "playing" && Math.abs(playerX) > 1 && blink) {
      text("FORA DA PISTA", W / 2, H * 0.36, 12, "#ff2a6d", "center");
    }
  }

  function render() {
    const baseSeg = findSegment(position);
    const basePct = pctRemaining(position, SEG_LEN);
    const playerSeg = findSegment(position + PLAYER_Z);
    const playerPct = pctRemaining(position + PLAYER_Z, SEG_LEN);
    const playerY = interp(playerSeg.p1.world.y, playerSeg.p2.world.y, playerPct);
    const len = segments.length;

    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * 8 * shake * 3, (Math.random() - 0.5) * 6 * shake * 3);

    ctx.drawImage(skyCanvas, 0, 0);
    const horizon = Math.round(H / 2) + 4;
    drawLayer(sprites.mountains, skyOffset, horizon);
    drawLayer(sprites.city, cityOffset, horizon);

    let maxy = H;
    let x = 0;
    let dx = -(baseSeg.curve * basePct);
    for (let n = 0; n < DRAW_DIST; n++) {
      const seg = segments[(baseSeg.index + n) % len];
      const looped = seg.index < baseSeg.index;
      seg.fog = fogAt(n / DRAW_DIST);
      seg.clip = maxy;
      const camZ = position - (looped ? trackLength : 0);
      project(seg.p1, playerX * ROAD_W - x, playerY + CAM_H, camZ);
      project(seg.p2, playerX * ROAD_W - x - dx, playerY + CAM_H, camZ);
      x += dx;
      dx += seg.curve;
      if (seg.p1.camera.z <= CAM_DEPTH || seg.p2.screen.y >= seg.p1.screen.y || seg.p2.screen.y >= maxy) continue;
      drawSegment(seg);
      maxy = seg.p2.screen.y;
    }

    for (let n = DRAW_DIST - 1; n > 0; n--) {
      const seg = segments[(baseSeg.index + n) % len];
      for (const car of seg.cars) {
        const scale = interp(seg.p1.screen.scale, seg.p2.screen.scale, car.percent);
        const sx = interp(seg.p1.screen.x, seg.p2.screen.x, car.percent) + scale * car.offset * ROAD_W * XS;
        const sy = interp(seg.p1.screen.y, seg.p2.screen.y, car.percent);
        drawSprite(car.img, CAR_WORLD_W, scale, sx, sy, -0.5, -1, seg.clip);
      }
      for (const s of seg.sprites) {
        const scale = seg.p1.screen.scale;
        const sx = seg.p1.screen.x + scale * s.offset * ROAD_W * XS;
        drawSprite(s.sprite.img, s.sprite.worldW, scale, sx, seg.p1.screen.y, s.offset < 0 ? -1 : 0, -1, seg.clip);
      }
      if (seg === playerSeg && state !== "menu") drawPlayer(playerSeg, playerPct);
    }
    ctx.restore();

    if (state !== "menu") drawHud();
  }

  // ---------------------------------------------------------- laço / eventos
  let raf = 0;
  let last = performance.now();
  let acc = 0;

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (state !== "paused") {
      acc += dt;
      while (acc >= STEP) {
        update(STEP);
        acc -= STEP;
      }
    }
    render();
    audio.engine(speed / MAX_SPEED, state === "playing" || state === "countdown" || (state === "gameover" && speed > 0));
    raf = requestAnimationFrame(frame);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const aspect = rect.width && rect.height ? rect.width / rect.height : 4 / 3;
    H = VIRTUAL_H;
    W = Math.round(clamp(H * aspect, 300, 1280));
    canvas.width = W;
    canvas.height = H;
    XS = Math.min(H * (2 / 3), W * 0.55);
    YS = H / 2;
    buildSky();
  }

  const KEYMAP = {
    ArrowLeft: "left", KeyA: "left",
    ArrowRight: "right", KeyD: "right",
    ArrowUp: "up", KeyW: "up",
    ArrowDown: "down", KeyS: "down",
  };

  function onKeyDown(e) {
    const k = KEYMAP[e.code];
    if (k) {
      keys[k] = true;
      e.preventDefault();
      return;
    }
    if (e.code === "Enter" || e.code === "Space") {
      if (state === "menu" || state === "gameover") {
        e.preventDefault();
        start();
      } else if (state === "paused") {
        e.preventDefault();
        resume();
      }
    } else if (e.code === "KeyP" || e.code === "Escape") {
      togglePause();
    } else if (e.code === "KeyM") {
      toggleMute();
    }
  }

  function onKeyUp(e) {
    const k = KEYMAP[e.code];
    if (k) keys[k] = false;
  }

  function onVisibility() {
    if (document.hidden) pause();
  }

  function onBlur() {
    for (const k in keys) keys[k] = false;
  }

  function toggleMute() {
    audio.setMuted(!audio.muted);
    emit();
  }

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", onVisibility);
  raf = requestAnimationFrame(frame);
  emit();

  return {
    start,
    pause,
    resume,
    togglePause,
    toggleMute,
    setKey(name, down) {
      if (name in keys) keys[name] = down;
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      audio.destroy();
    },
  };
}
