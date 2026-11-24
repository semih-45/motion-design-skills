// Chat UI drawn on a 2D canvas (used as the phone screen texture). Pure function of frame.
import {C} from '../timeline';
import {clamp, easeOut, lin, prog, springy} from '../lib/anim';
import {CHAT} from './rig2';

export const MSG1 = [
  'Bonjour, mon filtre à',
  'particules est bouché.',
  "J'aimerais une intervention,",
  'pourrais-je avoir un devis ?',
];
export const MSG2 = [
  'Bonjour, oui bien sûr !',
  'Nous intervenons directement',
  'chez vous. Je vous envoie le',
  'devis, une fois validé nous',
  'fixons un rendez-vous.',
];

const FONT_MSG = "600 15.5px 'Montserrat'";
const LINE_H = 21;
const PAD_X = 13;
const PAD_Y = 10;

export const LAYOUT = {
  status: 47,
  header: 112,
  b1: {x: 390 - 12 - 292, y: 150, w: 292, h: MSG1.length * LINE_H + PAD_Y * 2 + 12},
  typing: {x: 12, y: 284, w: 70, h: 40},
  b2: {x: 12, y: 284, w: 292, h: MSG2.length * LINE_H + PAD_Y * 2 + 12},
  quote: {x: 12, y: 284 + MSG2.length * LINE_H + PAD_Y * 2 + 12 + 12, w: 292, h: 104},
  rdv: {x: 45, y: 0, w: 300, h: 54},
  input: 760,
};
LAYOUT.rdv.y = LAYOUT.quote.y + LAYOUT.quote.h + 16;

const GREEN_A = '#22c875';
const GREEN_B = '#109a58';
const NAVY_B = '#1a2945';
const BG = '#08111f';

const rr = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number | number[]) => {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
};

const popScale = (f: number, start: number) => {
  if (f < start) return 0;
  return clamp(springy(f, start, 2.6, 0.5), 0, 1.2);
};

const check = (g: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, w = 2) => {
  g.strokeStyle = color;
  g.lineWidth = w;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + s * 0.35, y + s * 0.35);
  g.lineTo(x + s, y - s * 0.45);
  g.stroke();
};

/** Draws the whole screen for frame f. g is pre-scaled to pt units. */
export const drawChat = (g: CanvasRenderingContext2D, f: number) => {
  const Wp = CHAT.w;
  const Hp = CHAT.h;
  g.save();
  g.clearRect(0, 0, Wp, Hp);
  // background with soft gradient + faint dot pattern
  const bg = g.createLinearGradient(0, 0, 0, Hp);
  bg.addColorStop(0, '#0b1730');
  bg.addColorStop(1, BG);
  g.fillStyle = bg;
  g.fillRect(0, 0, Wp, Hp);
  g.fillStyle = 'rgba(80,130,255,0.05)';
  for (let y = 130; y < Hp - 80; y += 22) for (let x = (y / 22) % 2 ? 11 : 0; x < Wp; x += 22) g.fillRect(x, y, 1.6, 1.6);

  // status bar
  g.fillStyle = '#fff';
  g.font = "700 15px 'Montserrat'";
  g.textBaseline = 'middle';
  g.fillText('10:24', 30, 26);
  // island
  g.fillStyle = '#000';
  rr(g, 138, 11, 114, 32, 16);
  g.fill();
  // signal / wifi / battery
  g.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) g.fillRect(290 + i * 5, 30 - (i + 1) * 3, 3.2, (i + 1) * 3);
  g.strokeStyle = '#fff';
  g.lineWidth = 1.4;
  rr(g, 332, 19, 26, 13, 4);
  g.stroke();
  g.fillRect(335, 22, 18, 7);
  g.fillRect(359.5, 23.5, 2, 4);

  // header
  g.fillStyle = 'rgba(255,255,255,0.04)';
  g.fillRect(0, LAYOUT.status, Wp, LAYOUT.header - LAYOUT.status);
  g.strokeStyle = 'rgba(255,255,255,0.08)';
  g.beginPath();
  g.moveTo(0, LAYOUT.header);
  g.lineTo(Wp, LAYOUT.header);
  g.stroke();
  // back chevron
  g.strokeStyle = '#4f8dff';
  g.lineWidth = 2.6;
  g.beginPath();
  g.moveTo(24, 70);
  g.lineTo(15, 80);
  g.lineTo(24, 90);
  g.stroke();
  // avatar: white disc with mini logo (car arc + gear dot)
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(56, 80, 20, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#0B1E3F';
  g.lineWidth = 2.4;
  g.beginPath();
  g.moveTo(42, 84);
  g.quadraticCurveTo(52, 66, 70, 78);
  g.stroke();
  g.fillStyle = '#E3262E';
  g.beginPath();
  g.arc(64, 87, 4.2, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#0B1E3F';
  g.font = "800 8.5px 'Montserrat'";
  g.fillText('CM', 45, 88);
  // name + status
  g.fillStyle = '#fff';
  g.font = "700 16px 'Montserrat'";
  g.fillText('Clean Moteur Mobile', 86, 73);
  const typingNow = f >= C.typing && f < C.msg2;
  g.fillStyle = '#2BD17E';
  g.font = "500 12.5px 'Montserrat'";
  g.fillText(typingNow ? "en train d'écrire…" : 'en ligne', 86, 92);
  // call icon
  g.strokeStyle = '#4f8dff';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(362, 80, 9, Math.PI * 0.55, Math.PI * 1.45, false);
  g.stroke();

  // date chip
  g.fillStyle = 'rgba(255,255,255,0.08)';
  rr(g, 150, 122, 90, 20, 10);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.font = "600 10.5px 'Montserrat'";
  g.textAlign = 'center';
  g.fillText("Aujourd'hui", 195, 132.5);
  g.textAlign = 'left';

  // --- message 1 (client, right, green) ---
  const b1 = LAYOUT.b1;
  const s1 = f < C.phoneReveal ? 1 : 1; // bubble already present (it IS the H2 drop)
  if (f >= C.dropOut + 14) {
    g.save();
    g.translate(b1.x + b1.w, b1.y + b1.h);
    g.scale(s1, s1);
    g.translate(-(b1.x + b1.w), -(b1.y + b1.h));
    const grd = g.createLinearGradient(b1.x, b1.y, b1.x + b1.w, b1.y + b1.h);
    grd.addColorStop(0, GREEN_A);
    grd.addColorStop(1, GREEN_B);
    g.fillStyle = grd;
    rr(g, b1.x, b1.y, b1.w, b1.h, [18, 18, 4, 18]);
    g.fill();
    // typed text
    const total = MSG1.join(' ').length;
    const shown = Math.floor(lin(f, C.msg1, 26) * total);
    let left = shown;
    g.fillStyle = '#fff';
    g.font = FONT_MSG;
    g.textBaseline = 'alphabetic';
    MSG1.forEach((line, i) => {
      if (left <= 0) return;
      const part = line.slice(0, left);
      left -= line.length + 1;
      g.fillText(part, b1.x + PAD_X, b1.y + PAD_Y + 15 + i * LINE_H);
      // caret
      if (left < 0 && f < C.msg1 + 28 && Math.floor(f / 4) % 2 === 0) {
        const w = g.measureText(part).width;
        g.fillRect(b1.x + PAD_X + w + 1.5, b1.y + PAD_Y + 2 + i * LINE_H, 1.6, 16);
      }
    });
    if (f >= C.msg1 && shown === 0 && Math.floor(f / 4) % 2 === 0) g.fillRect(b1.x + PAD_X, b1.y + PAD_Y + 2, 1.6, 16);
    // time + ticks
    if (f >= C.msg1 + 26) {
      g.fillStyle = 'rgba(255,255,255,0.8)';
      g.font = "500 10px 'Montserrat'";
      g.fillText('10:24', b1.x + b1.w - 64, b1.y + b1.h - 8);
      const read = f >= C.typing;
      check(g, b1.x + b1.w - 32, b1.y + b1.h - 12, 8, read ? '#bfe9ff' : 'rgba(255,255,255,0.8)', 1.6);
      check(g, b1.x + b1.w - 26, b1.y + b1.h - 12, 8, read ? '#bfe9ff' : 'rgba(255,255,255,0.8)', 1.6);
    }
    g.restore();
  }

  // --- typing indicator ---
  if (f >= C.typing && f < C.msg2) {
    const s = popScale(f, C.typing);
    const t = LAYOUT.typing;
    g.save();
    g.translate(t.x, t.y + t.h);
    g.scale(s, s);
    g.translate(-t.x, -(t.y + t.h));
    g.fillStyle = NAVY_B;
    rr(g, t.x, t.y, t.w, t.h, [18, 18, 18, 4]);
    g.fill();
    for (let i = 0; i < 3; i++) {
      const ph = Math.sin((f - C.typing) * 0.5 - i * 0.9);
      g.fillStyle = `rgba(255,255,255,${0.45 + 0.4 * Math.max(0, ph)})`;
      g.beginPath();
      g.arc(t.x + 20 + i * 15, t.y + t.h / 2 - Math.max(0, ph) * 3, 4, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  // --- message 2 (business, left) ---
  if (f >= C.msg2) {
    const b2 = LAYOUT.b2;
    const s = popScale(f, C.msg2);
    g.save();
    g.translate(b2.x, b2.y + b2.h);
    g.scale(s, s);
    g.translate(-b2.x, -(b2.y + b2.h));
    g.fillStyle = NAVY_B;
    rr(g, b2.x, b2.y, b2.w, b2.h, [18, 18, 18, 4]);
    g.fill();
    g.strokeStyle = 'rgba(79,141,255,0.35)';
    g.lineWidth = 1;
    g.stroke();
    g.font = FONT_MSG;
    MSG2.forEach((line, i) => {
      const a = prog(f, C.msg2 + 3 + i * 2.5, 6, easeOut);
      g.fillStyle = `rgba(255,255,255,${a})`;
      g.fillText(line, b2.x + PAD_X + (1 - a) * 6, b2.y + PAD_Y + 15 + i * LINE_H);
    });
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.font = "500 10px 'Montserrat'";
    g.fillText('10:25', b2.x + b2.w - 40, b2.y + b2.h - 8);
    g.restore();
  }

  // --- quote card ---
  if (f >= C.quote) {
    const q = LAYOUT.quote;
    const s = popScale(f, C.quote);
    g.save();
    g.translate(q.x, q.y + q.h);
    g.scale(s, s);
    g.translate(-q.x, -(q.y + q.h));
    g.fillStyle = '#f4f7fc';
    rr(g, q.x, q.y, q.w, q.h, [18, 18, 18, 4]);
    g.fill();
    // doc icon
    g.fillStyle = '#1E6BFF';
    rr(g, q.x + 14, q.y + 14, 36, 44, 7);
    g.fill();
    g.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) g.fillRect(q.x + 21, q.y + 25 + i * 8, i === 2 ? 14 : 22, 3);
    g.fillStyle = '#0B1E3F';
    g.font = "800 15px 'Montserrat'";
    g.fillText('DEVIS', q.x + 62, q.y + 31);
    g.font = "600 12px 'Montserrat'";
    g.fillStyle = '#4a5875';
    g.fillText('Nettoyage FAP · à domicile', q.x + 62, q.y + 50);
    // status pill
    const ok = prog(f, C.quoteOk, 8, easeOut);
    const pillY = q.y + 68;
    if (ok < 1) {
      g.globalAlpha = 1 - ok;
      g.fillStyle = 'rgba(255,159,28,0.18)';
      rr(g, q.x + 14, pillY, 132, 24, 12);
      g.fill();
      g.fillStyle = '#d97a00';
      g.font = "700 12px 'Montserrat'";
      g.fillText('En attente…', q.x + 30, pillY + 16.5);
      g.globalAlpha = 1;
    }
    if (ok > 0) {
      const sc = 0.6 + 0.4 * springy(f, C.quoteOk, 2.4, 0.45);
      g.save();
      g.translate(q.x + 80, pillY + 12);
      g.scale(sc, sc);
      g.globalAlpha = ok;
      g.fillStyle = '#2BD17E';
      rr(g, -66, -12, 132, 24, 12);
      g.fill();
      g.fillStyle = '#04210f';
      g.font = "800 12.5px 'Montserrat'";
      g.fillText('Validé', -40, 4.5);
      check(g, 12, 0, 12, '#04210f', 2.6);
      g.restore();
    }
    g.restore();
  }

  // --- RDV confirmed ---
  if (f >= C.rdv) {
    const r = LAYOUT.rdv;
    const s = popScale(f, C.rdv);
    g.save();
    g.translate(r.x + r.w / 2, r.y + r.h / 2);
    g.scale(s, s);
    g.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
    g.fillStyle = 'rgba(43,209,126,0.14)';
    rr(g, r.x, r.y, r.w, r.h, 16);
    g.fill();
    g.strokeStyle = '#2BD17E';
    g.lineWidth = 1.6;
    g.stroke();
    // calendar icon
    g.strokeStyle = '#2BD17E';
    g.lineWidth = 2;
    rr(g, r.x + 16, r.y + 14, 26, 26, 5);
    g.stroke();
    g.fillStyle = '#2BD17E';
    g.fillRect(r.x + 16, r.y + 14, 26, 7);
    check(g, r.x + 22, r.y + 30, 12, '#2BD17E', 2.4);
    g.fillStyle = '#fff';
    g.font = "800 15.5px 'Montserrat'";
    g.fillText('Rendez-vous confirmé', r.x + 54, r.y + 33);
    g.restore();
  }

  // input bar
  g.fillStyle = 'rgba(255,255,255,0.05)';
  g.fillRect(0, LAYOUT.input - 12, Wp, Hp - LAYOUT.input + 12);
  g.fillStyle = 'rgba(255,255,255,0.09)';
  rr(g, 14, LAYOUT.input, 318, 38, 19);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.38)';
  g.font = "500 14px 'Montserrat'";
  g.fillText('Message', 30, LAYOUT.input + 24);
  g.fillStyle = '#22c875';
  g.beginPath();
  g.arc(358, LAYOUT.input + 19, 18, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.beginPath();
  g.moveTo(351, LAYOUT.input + 11);
  g.lineTo(368, LAYOUT.input + 19);
  g.lineTo(351, LAYOUT.input + 27);
  g.lineTo(354, LAYOUT.input + 19);
  g.closePath();
  g.fill();
  // home indicator
  g.fillStyle = 'rgba(255,255,255,0.85)';
  rr(g, 130, Hp - 12, 130, 5, 3);
  g.fill();
  g.restore();
};
