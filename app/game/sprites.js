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
function palmImage(lean) {
  const c = makeCanvas(240, 440);
  const g = c.getContext("2d");
  const bx = 120;
  const tx = 120 + lean * 45;
  const ty = 120;

  const trunk = () => {
    g.beginPath();
    g.moveTo(bx, 436);
    g.quadraticCurveTo(bx - lean * 25, 280, tx, ty);
  };
  g.lineCap = "round";
  g.strokeStyle = "#ff2a6d";
  g.lineWidth = 19;
  trunk();
  g.stroke();
  g.strokeStyle = "#16041f";
  g.lineWidth = 14;
  trunk();
  g.stroke();

  const angles = [-175, -145, -115, -80, -50, -20, 10, 200, 160];
  for (const deg of angles) {
    const a = (deg * Math.PI) / 180;
    const L = 100 + (deg % 3) * 4;
    const ex = tx + Math.cos(a) * L;
    const ey = ty + Math.sin(a) * L * 0.5 + 38;
    const cx = tx + Math.cos(a) * L * 0.55;
    const cy = ty + Math.sin(a) * L * 0.55 - 26;
    g.beginPath();
    g.moveTo(tx, ty);
    g.quadraticCurveTo(cx, cy - 9, ex, ey);
    g.quadraticCurveTo(cx, cy + 11, tx, ty + 6);
    g.closePath();
    g.fillStyle = "#16041f";
    g.fill();
    g.strokeStyle = "#ff2a6d";
    g.lineWidth = 2;
    g.stroke();
  }
  return c;
}

function lampImage() {
  const c = makeCanvas(90, 420);
  const g = c.getContext("2d");
  const glow = g.createRadialGradient(68, 56, 2, 68, 56, 40);
  glow.addColorStop(0, "rgba(142,249,243,0.9)");
  glow.addColorStop(1, "rgba(142,249,243,0)");
  g.fillStyle = glow;
  g.fillRect(20, 10, 70, 90);
  g.fillStyle = "#2d2840";
  g.fillRect(28, 44, 7, 376);
  g.fillRect(28, 44, 40, 5);
  g.fillStyle = "#e9ffff";
  rr(g, 56, 48, 24, 6, 2);
  return c;
}

function billboardImage(label, color) {
  const c = makeCanvas(440, 300);
  const g = c.getContext("2d");
  g.fillStyle = "#1a1328";
  g.fillRect(95, 190, 16, 110);
  g.fillRect(329, 190, 16, 110);

  g.fillStyle = "#12052a";
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
  const c = billboardImage(label, "#f9c80e");
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
function mountainsImage() {
  const w = 1024;
  const h = 150;
  const c = makeCanvas(w, h);
  const g = c.getContext("2d");
  const height = (x) => {
    const t = (x / w) * Math.PI * 2;
    return 70 + 30 * Math.sin(t * 2 + 1) + 22 * Math.sin(t * 5 + 2) + 12 * Math.sin(t * 11 + 0.5) + 6 * Math.sin(t * 23);
  };
  g.beginPath();
  g.moveTo(0, h);
  for (let x = 0; x <= w; x += 4) g.lineTo(x, h - height(x));
  g.lineTo(w, h);
  g.closePath();
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#3d0f63");
  grad.addColorStop(1, "#200634");
  g.fillStyle = grad;
  g.fill();
  g.strokeStyle = "#ff4f9a";
  g.lineWidth = 2;
  g.beginPath();
  for (let x = 0; x <= w; x += 4) g.lineTo(x, h - height(x));
  g.stroke();
  return c;
}

function cityImage() {
  const w = 1024;
  const h = 80;
  const c = makeCanvas(w, h);
  const g = c.getContext("2d");
  const building = (x, bw, bh) => {
    g.fillStyle = "#12041f";
    g.fillRect(x, h - bh, bw, bh);
    g.fillStyle = "#05d9e8";
    g.fillRect(x, h - bh, bw, 1);
    for (let wy = h - bh + 5; wy < h - 4; wy += 6) {
      for (let wx = x + 3; wx < x + bw - 3; wx += 5) {
        if (Math.random() < 0.3) {
          g.fillStyle = Math.random() < 0.5 ? "#f9c80e" : "#ff7fc0";
          g.fillRect(wx, wy, 2, 2);
        }
      }
    }
  };
  for (let x = 0; x < w; ) {
    const gap = Math.random() < 0.35 ? 20 + Math.random() * 60 : 0;
    x += gap;
    const bw = 14 + Math.floor(Math.random() * 26);
    const bh = 18 + Math.floor(Math.random() * 55);
    building(x, bw, bh);
    if (x + bw > w) building(x - w, bw, bh);
    x += bw + 1;
  }
  return c;
}

// ------------------------------------------------------------------ catálogo
export function buildSprites() {
  const PLAYER_COLOR = "#ff2a6d";
  const TRAFFIC = ["#05d9e8", "#f9c80e", "#7b2ff7", "#e8e8f0", "#ff6c11", "#2de2a6"];

  return {
    player: [-1, 0, 1].map((steer) => [carImage(PLAYER_COLOR, steer, false), carImage(PLAYER_COLOR, steer, true)]),
    cars: TRAFFIC.map((col) => carImage(col)),
    palms: [-1, -0.4, 0.4, 1].map((lean) => ({ img: palmImage(lean), worldW: 1300, hitW: 0.18 })),
    lamp: { img: lampImage(), worldW: 360, hitW: 0.3 },
    billboards: [
      ["ESTRADA NEON", "#ff2a6d"],
      ["ACELERE!", "#05d9e8"],
      ["PÔR DO SOL", "#f9c80e"],
      ["TURBO", "#2de2a6"],
      ["SEM FREIO", "#ff6c11"],
      ["1986", "#b967ff"],
    ].map(([label, color]) => ({ img: billboardImage(label, color), worldW: 1900, hitW: 0.85 })),
    checkpoint: { img: checkpointImage("CHECKPOINT"), worldW: 1900, hitW: 0.85 },
    start: { img: checkpointImage("LARGADA"), worldW: 1900, hitW: 0.85 },
    mountains: mountainsImage(),
    city: cityImage(),
  };
}
