// Sprites gerados proceduralmente em canvases fora da tela (sem arquivos de imagem).
// worldW: largura no mundo do jogo; hitW: fração da largura usada na colisão.

const makeCanvas = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))
  );
  return `rgb(${ch[0]},${ch[1]},${ch[2]})`;
}

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}

// ------------------------------------------------------------------ carros
function carImage(color, steer = 0, brake = false) {
  const c = makeCanvas(200, 120);
  const g = c.getContext("2d");
  const s = steer * 9;

  g.fillStyle = "rgba(0,0,0,0.45)";
  g.beginPath();
  g.ellipse(100, 112, 98, 8, 0, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = "#0b0a10";
  rr(g, 12, 78, 36, 38, 7);
  rr(g, 152, 78, 36, 38, 7);

  g.fillStyle = shade(color, -0.4);
  g.beginPath();
  g.moveTo(34, 56);
  g.lineTo(58 + s, 16);
  g.lineTo(142 + s, 16);
  g.lineTo(166, 56);
  g.closePath();
  g.fill();

  const glass = g.createLinearGradient(0, 22, 0, 54);
  glass.addColorStop(0, "#5a6aa8");
  glass.addColorStop(1, "#0f1430");
  g.fillStyle = glass;
  g.beginPath();
  g.moveTo(48, 54);
  g.lineTo(65 + s, 23);
  g.lineTo(135 + s, 23);
  g.lineTo(152, 54);
  g.closePath();
  g.fill();

  const body = g.createLinearGradient(0, 50, 0, 100);
  body.addColorStop(0, shade(color, 0.3));
  body.addColorStop(0.5, color);
  body.addColorStop(1, shade(color, -0.45));
  g.fillStyle = body;
  rr(g, 5, 50, 190, 46, 12);

  g.fillStyle = shade(color, -0.55);
  g.fillRect(10, 50, 180, 5);

  g.save();
  if (brake) {
    g.shadowColor = "#ff2020";
    g.shadowBlur = 18;
  }
  g.fillStyle = brake ? "#ff5a5a" : "#b3122e";
  rr(g, 14, 61, 52, 11, 3);
  rr(g, 134, 61, 52, 11, 3);
  g.restore();

  g.fillStyle = "#e8e8f0";
  g.fillRect(82, 71, 36, 12);
  g.fillStyle = "#2a2a3a";
  g.fillRect(86, 75, 28, 4);

  g.fillStyle = "#15121f";
  rr(g, 9, 86, 182, 10, 4);
  g.fillStyle = "#6b6b78";
  g.beginPath();
  g.arc(146, 98, 4, 0, Math.PI * 2);
  g.arc(158, 98, 4, 0, Math.PI * 2);
  g.fill();
  return c;
}

// ------------------------------------------------------------------ cenário
function cactusImage(variant) {
  const c = makeCanvas(220, 420);
  const g = c.getContext("2d");
  const body = "#1d3a26";
  const lit = "#3f6b45";
  const arm = (x, y, dir, len, up) => {
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + dir * len, y);
    g.lineTo(x + dir * len, y - up);
    g.stroke();
  };
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const [color, w, off] of [[body, 40, 0], [lit, 10, -10]]) {
    g.strokeStyle = color;
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(110 + off, 412);
    g.lineTo(110 + off, 40);
    g.stroke();
    g.lineWidth = w * 0.75;
    if (variant !== 2) arm(110 + off, 230, -1, 55, 90);
    if (variant !== 1) arm(110 + off, 280 - variant * 30, 1, 50, 110);
  }
  g.strokeStyle = "rgba(0,0,0,0.25)";
  g.lineWidth = 2;
  for (const dx of [-8, 8]) {
    g.beginPath();
    g.moveTo(110 + dx, 410);
    g.lineTo(110 + dx, 50);
    g.stroke();
  }
  return c;
}

function deadTreeImage(seed) {
  const c = makeCanvas(300, 420);
  const g = c.getContext("2d");
  let rnd = seed * 9301 + 49297;
  const rand = () => ((rnd = (rnd * 9301 + 49297) % 233280) / 233280);
  g.strokeStyle = "#0c070d";
  g.lineCap = "round";
  const branch = (x, y, angle, len, width, depth) => {
    const ex = x + Math.cos(angle) * len;
    const ey = y + Math.sin(angle) * len;
    g.lineWidth = width;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(angle + 0.4) * len * 0.5, y + Math.sin(angle + 0.4) * len * 0.5, ex, ey);
    g.stroke();
    if (depth > 0) {
      const n = 2 + Math.floor(rand() * 2);
      for (let i = 0; i < n; i++) {
        branch(ex, ey, angle + (rand() - 0.5) * 1.6, len * (0.55 + rand() * 0.2), width * 0.62, depth - 1);
      }
    }
  };
  branch(150, 418, -Math.PI / 2 + (rand() - 0.5) * 0.2, 150, 22, 4);
  return c;
}

function pumpkinImage(face) {
  const c = makeCanvas(160, 130);
  const g = c.getContext("2d");
  const glow = g.createRadialGradient(80, 80, 10, 80, 80, 80);
  glow.addColorStop(0, "rgba(255,150,40,0.45)");
  glow.addColorStop(1, "rgba(255,150,40,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, 160, 130);

  g.fillStyle = "#2f4d1a";
  g.fillRect(74, 22, 12, 20);
  for (const [dx, w, col] of [[-30, 34, "#d4560b"], [30, 34, "#d4560b"], [-12, 32, "#ff7518"], [12, 32, "#ff7518"], [0, 26, "#ff8c2e"]]) {
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(80 + dx, 80, w, 44, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.save();
  g.shadowColor = "#ffd23f";
  g.shadowBlur = 14;
  g.fillStyle = "#ffe066";
  const tri = (x1, y1, x2, y2, x3, y3) => {
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.lineTo(x3, y3);
    g.fill();
  };
  tri(50, 76, 68, 76, 59, 58);
  tri(92, 76, 110, 76, 101, 58);
  tri(74, 88, 86, 88, 80, 78);
  g.beginPath();
  if (face === 0) {
    g.moveTo(46, 96);
    for (let i = 0; i <= 8; i++) g.lineTo(46 + i * 8.5, i % 2 ? 104 : 96 + (i === 0 || i === 8 ? 0 : 4));
    g.lineTo(114, 96);
    g.quadraticCurveTo(80, 124, 46, 96);
  } else {
    g.moveTo(52, 98);
    g.quadraticCurveTo(80, 118, 108, 98);
    g.quadraticCurveTo(80, 108, 52, 98);
  }
  g.fill();
  g.restore();
  return c;
}

function tombImage(kind) {
  const c = makeCanvas(160, 190);
  const g = c.getContext("2d");
  g.fillStyle = "rgba(0,0,0,0.4)";
  g.beginPath();
  g.ellipse(80, 184, 72, 7, 0, 0, Math.PI * 2);
  g.fill();
  const stone = g.createLinearGradient(0, 0, 160, 0);
  stone.addColorStop(0, "#8d8a9c");
  stone.addColorStop(1, "#4d4a5c");
  g.fillStyle = stone;
  if (kind === 0) {
    g.beginPath();
    g.moveTo(22, 186);
    g.lineTo(22, 70);
    g.arc(80, 70, 58, Math.PI, 0);
    g.lineTo(138, 186);
    g.closePath();
    g.fill();
    g.fillStyle = "#2c2a36";
    g.font = 'bold 36px "Arial Black", Impact, sans-serif';
    g.textAlign = "center";
    g.fillText("RIP", 80, 100);
    g.fillRect(50, 120, 60, 5);
    g.fillRect(56, 136, 48, 5);
  } else {
    g.fillRect(66, 20, 28, 166);
    g.fillRect(30, 56, 100, 26);
  }
  return c;
}

function torchImage() {
  const c = makeCanvas(90, 420);
  const g = c.getContext("2d");
  const glow = g.createRadialGradient(45, 50, 2, 45, 50, 45);
  glow.addColorStop(0, "rgba(255,170,60,0.85)");
  glow.addColorStop(1, "rgba(255,120,30,0)");
  g.fillStyle = glow;
  g.fillRect(0, 0, 90, 100);
  g.fillStyle = "#2a1a12";
  g.fillRect(41, 64, 8, 356);
  g.fillStyle = "#4a3022";
  g.fillRect(36, 60, 18, 10);
  g.fillStyle = "#ff7518";
  g.beginPath();
  g.moveTo(32, 62);
  g.quadraticCurveTo(30, 34, 45, 14);
  g.quadraticCurveTo(60, 34, 58, 62);
  g.fill();
  g.fillStyle = "#ffe066";
  g.beginPath();
  g.moveTo(39, 62);
  g.quadraticCurveTo(38, 44, 45, 30);
  g.quadraticCurveTo(52, 44, 51, 62);
  g.fill();
  return c;
}

function billboardImage(label, color) {
  const c = makeCanvas(440, 300);
  const g = c.getContext("2d");
  g.fillStyle = "#1a1328";
  g.fillRect(95, 190, 16, 110);
  g.fillRect(329, 190, 16, 110);

  g.fillStyle = "#120a12";
  g.fillRect(14, 14, 412, 180);
  g.save();
  g.shadowColor = color;
  g.shadowBlur = 18;
  g.strokeStyle = color;
  g.lineWidth = 6;
  g.strokeRect(14, 14, 412, 180);

  let size = 80;
  g.font = `bold ${size}px "Arial Black", Impact, sans-serif`;
  while (g.measureText(label).width > 370 && size > 20) {
    size -= 4;
    g.font = `bold ${size}px "Arial Black", Impact, sans-serif`;
  }
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = color;
  g.fillText(label, 220, 106);
  g.restore();
  return c;
}

function checkpointImage(label) {
  const c = billboardImage(label, "#ff7518");
  const g = c.getContext("2d");
  for (let i = 0; i < 26; i++) {
    g.fillStyle = i % 2 ? "#f2f2f2" : "#111";
    g.fillRect(17 + i * 15.7, 20, 15.7, 12);
    g.fillStyle = i % 2 ? "#111" : "#f2f2f2";
    g.fillRect(17 + i * 15.7, 176, 15.7, 12);
  }
  return c;
}

// ------------------------------------------------------------------ fundo
function mesasImage() {
  const w = 1024;
  const h = 130;
  const c = makeCanvas(w, h);
  const g = c.getContext("2d");
  // mesas e chapadas: platôs de topo reto com encostas íngremes
  const mesas = [
    [40, 150, 70], [230, 110, 95], [380, 200, 55], [640, 90, 110], [760, 170, 65], [930, 120, 85],
  ];
  const height = (x) => {
    let y = 12 + 8 * Math.sin((x / w) * Math.PI * 6);
    for (const [mx, mw, mh] of mesas) {
      for (const xx of [x, x + w, x - w]) {
        const d = Math.abs(xx - (mx + mw / 2)) - mw / 2;
        if (d < 0) y = Math.max(y, mh);
        else if (d < 28) y = Math.max(y, mh * (1 - d / 28) ** 1.5);
      }
    }
    return y;
  };
  g.beginPath();
  g.moveTo(0, h);
  for (let x = 0; x <= w; x += 2) g.lineTo(x, h - height(x));
  g.lineTo(w, h);
  g.closePath();
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#3b1a3a");
  grad.addColorStop(1, "#22102a");
  g.fillStyle = grad;
  g.fill();
  g.strokeStyle = "rgba(255,170,90,0.55)";
  g.lineWidth = 1.5;
  g.beginPath();
  for (let x = 0; x <= w; x += 2) g.lineTo(x, h - height(x));
  g.stroke();
  return c;
}

function dunesImage() {
  const w = 1024;
  const h = 70;
  const c = makeCanvas(w, h);
  const g = c.getContext("2d");
  const height = (x) => {
    const t = (x / w) * Math.PI * 2;
    return 22 + 9 * Math.sin(t * 3 + 0.7) + 6 * Math.sin(t * 7 + 2) + 3 * Math.sin(t * 13);
  };
  g.beginPath();
  g.moveTo(0, h);
  for (let x = 0; x <= w; x += 4) g.lineTo(x, h - height(x));
  g.lineTo(w, h);
  g.closePath();
  g.fillStyle = "#1a0f14";
  g.fill();
  // silhuetas de cactos e uma casa assombrada no horizonte
  g.fillStyle = "#0d070b";
  for (let i = 0; i < 14; i++) {
    const x = (i * 73 + 20) % w;
    const base = h - height(x) + 2;
    const ch = 10 + ((i * 7) % 9);
    g.fillRect(x, base - ch, 3, ch);
    g.fillRect(x - 4, base - ch * 0.6, 4, 2);
    g.fillRect(x - 4, base - ch * 0.9, 2, ch * 0.3);
    g.fillRect(x + 3, base - ch * 0.5, 4, 2);
    g.fillRect(x + 5, base - ch * 0.75, 2, ch * 0.25);
  }
  const hx = 520;
  const hb = h - height(hx) + 2;
  g.fillRect(hx, hb - 22, 30, 22);
  g.fillRect(hx + 22, hb - 34, 8, 14);
  g.beginPath();
  g.moveTo(hx - 3, hb - 22);
  g.lineTo(hx + 15, hb - 36);
  g.lineTo(hx + 33, hb - 22);
  g.fill();
  g.fillStyle = "#ffb347";
  g.fillRect(hx + 6, hb - 16, 4, 4);
  g.fillRect(hx + 19, hb - 16, 4, 4);
  return c;
}

// ------------------------------------------------------------------ catálogo
export function buildSprites() {
  const PLAYER_COLOR = "#ff7518";
  const TRAFFIC = ["#9b4dff", "#7cff6b", "#e8e8f0", "#3a3a48", "#c0392b", "#ffd23f"];

  return {
    player: [-1, 0, 1].map((steer) => [carImage(PLAYER_COLOR, steer, false), carImage(PLAYER_COLOR, steer, true)]),
    cars: TRAFFIC.map((col) => carImage(col)),
    cacti: [0, 1, 2].map((v) => ({ img: cactusImage(v), worldW: 1000, hitW: 0.3 })),
    deadTrees: [1, 2, 3].map((seed) => ({ img: deadTreeImage(seed), worldW: 1500, hitW: 0.12 })),
    pumpkins: [0, 1].map((face) => ({ img: pumpkinImage(face), worldW: 500, hitW: 0.6 })),
    tombs: [0, 1].map((kind) => ({ img: tombImage(kind), worldW: 520, hitW: 0.7 })),
    torch: { img: torchImage(), worldW: 360, hitW: 0.3 },
    billboards: [
      ["DOCES OU TRAVESSURAS", "#ff7518"],
      ["NOITE DAS BRUXAS", "#9b4dff"],
      ["BUUU!", "#7cff6b"],
      ["CEMITÉRIO 2 KM", "#e8e8f0"],
      ["NÃO OLHE PRA TRÁS", "#ff3b3b"],
      ["ESTRADA NEON", "#ffb347"],
    ].map(([label, color]) => ({ img: billboardImage(label, color), worldW: 1900, hitW: 0.85 })),
    checkpoint: { img: checkpointImage("CHECKPOINT"), worldW: 1900, hitW: 0.85 },
    start: { img: checkpointImage("LARGADA"), worldW: 1900, hitW: 0.85 },
    mesas: mesasImage(),
    dunes: dunesImage(),
  };
}
