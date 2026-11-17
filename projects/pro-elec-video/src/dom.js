import { clamp, lerp, prog, easeInOut, easeOut, easeOutQuint, easeIn, spring, smooth, life, rng } from './util.js';

const sv = (p, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${p}</svg>`;
export const IC = {
  bolt: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 1.5 3.8 13.6h6.9l-1.6 8.9 9.7-12.2h-6.9z"/></svg>`,
  sun: sv('<circle cx="12" cy="12" r="4.6" fill="#FBBF24" stroke="#F59E0B"/><g stroke="#F59E0B"><path d="M12 1.8v2.6M12 19.6v2.6M4.8 4.8l1.8 1.8M17.4 17.4l1.8 1.8M1.8 12h2.6M19.6 12h2.6M4.8 19.2l1.8-1.8M17.4 6.6l1.8-1.8"/></g>'),
  snow: sv('<g stroke="#38BDF8"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/><path d="m9 3.5 3 2.5 3-2.5M9 20.5l3-2.5 3 2.5M3.6 10.6l3.8-.7-1.3-3.6M20.4 13.4l-3.8.7 1.3 3.6M3.6 13.4l3.8.7-1.3 3.6M20.4 10.6l-3.8-.7 1.3-3.6"/></g>'),
  moon: `<svg viewBox="0 0 24 24"><path d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1z" fill="#FDE68A" stroke="#F59E0B" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  shield: sv('<path d="M12 2.5 4 5.6v6.1c0 4.6 3.4 8.6 8 9.8 4.6-1.2 8-5.2 8-9.8V5.6z" fill="currentColor" stroke="none"/><path d="m8.4 12.2 2.5 2.5 4.8-5" stroke="#fff" stroke-width="2.4"/>'),
  phone: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>`,
  mail: sv('<rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>'),
  pin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.8a7.6 7.6 0 0 0-7.6 7.6c0 5.7 7.6 12.8 7.6 12.8s7.6-7.1 7.6-12.8A7.6 7.6 0 0 0 12 1.8zm0 10.4a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6z"/></svg>`,
  clock: sv('<circle cx="12" cy="12" r="9.2"/><path d="M12 6.6V12l3.6 2.2"/>', 'stroke-width="2.4"'),
  meter: sv('<rect x="4" y="2.8" width="16" height="18.4" rx="3"/><rect x="7" y="6" width="10" height="5" rx="1.2"/><path d="M8 15h2M14 15h2M8 18h8"/>', 'stroke-width="2.2"'),
  check: sv('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 'stroke-width="3"'),
  arrowDown: sv('<path d="M12 4v15M5.5 12.5 12 19l6.5-6.5"/>', 'stroke-width="3"'),
  send: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5 21.5 12 3 3.5l.1 6.6L15 12 3.1 13.9z"/></svg>`,
  plug: sv('<path d="M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0zM12 17v5"/>', 'stroke-width="2.4"'),
};

const EMO = { '👋': '1f44b', '😊': '1f60a', '👇': '1f447', '✅': '2705', '🔧': '1f527' };
const emo = (s) => s.replace(/👋|😊|👇|✅|🔧/gu, (m) => `<img class="emo" src="assets/emoji/${EMO[m]}.png">`);
function el(tag, cls, html = '', parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }

// Headline with per-word mask reveal. Words wrapped in {g:...} etc get accent classes.
function headline(parent, text, extraCls = '') {
  const h = el('div', 'hl ' + extraCls, '', parent);
  const lines = text.split('\n');
  lines.forEach((ln, li) => {
    ln.split(' ').forEach((tok) => {
      let cls = ''; let w = tok;
      const m = tok.match(/^\[(\w)\](.*)$/); if (m) { cls = m[1]; w = m[2]; }
      const o = el('span', 'w', '', h); const i = el('span', 'wi ' + cls, w, o);
      h.appendChild(document.createTextNode(' '));
    });
    if (li < lines.length - 1) h.appendChild(document.createElement('br'));
  });
  h._words = [...h.querySelectorAll('.wi')];
  return h;
}
function animHeadline(h, t, a, b, stagger = 0.06) {
  const on = t >= a - 0.01 && t <= b;
  h.style.display = on ? '' : 'none';
  if (!on) return;
  const out = easeIn(prog(t, b - 0.32, b));
  h._words.forEach((w, i) => {
    const p = easeOutQuint(prog(t, a + i * stagger, a + i * stagger + 0.6));
    w.style.transform = `translateY(${(1 - p) * 105}%) rotate(${(1 - p) * 4}deg)`;
  });
  h.style.opacity = 1 - out;
  h.style.transform = `translateY(${-out * 30}px)`;
  h.style.filter = out > 0.01 ? `blur(${out * 10}px)` : '';
}
function pop(e, t, a, b, { from = 0.85, y = 40, fin = 0.55, fout = 0.3, display = '' } = {}) {
  const on = t >= a && t <= b;
  e.style.display = on ? display : 'none';
  if (!on) return 0;
  const i = spring(prog(t, a, a + fin)); const o = easeIn(prog(t, b - fout, b));
  e.style.opacity = Math.min(1, prog(t, a, a + fin * 0.5)) * (1 - o);
  e.style.transform = `translateY(${(1 - i) * y - o * 20}px) scale(${lerp(from, 1, i)})`;
  return i * (1 - o);
}

export function buildDOM(ctx) {
  const { W, H, portrait } = ctx;
  const ui = document.getElementById('ui');
  const D = {};
  const P = portrait;

  /* S1 */
  D.bolt = el('div', '', `<svg id="boltSvg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="position:absolute;left:0;top:0;overflow:visible">
    <defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86EFAC"/><stop offset="1" stop-color="#16A34A"/></linearGradient></defs>
    <path id="boltPath" fill="url(#bg1)" stroke="#22C55E" stroke-width="10" stroke-linejoin="round" filter="url(#glow)"/></svg>`, ui);
  D.bolt.id = 'bolt';
  D.s1sub = el('div', '', `Électricité <span style="color:var(--green-d)">&amp;</span> Climatisation<span class="line"></span>`, ui); D.s1sub.id = 's1sub';

  /* S2a */
  D.hlRev = headline(ui, P ? 'La clim\n[g]réversible' : 'La clim\n[g]réversible');
  D.hlSummer = headline(ui, "L'été :\n[c]fraîcheur");
  D.hlWinter = headline(ui, "L'hiver :\n[h]chaleur");
  D.badgeSun = el('div', 'iconBadge', IC.sun, ui);
  D.badgeSnow = el('div', 'iconBadge', IC.snow, ui);
  D.badgeMoon = el('div', 'iconBadge', IC.moon, ui);
  const partners = ['samsung', 'mitsubishi', 'daikin', 'midea', 'atlantic'];
  const pills = partners.map((p) => `<div class="pill"><img src="assets/partners/${p}.png"></div>`).join('');
  D.partners = el('div', 'partners', `<div class="lbl">Nos marques partenaires</div><div class="row">${pills}</div>`, ui);
  D.partnerPills = [...D.partners.querySelectorAll('.pill')];

  /* S2b */
  D.split = el('div', '', `<div class="knob">${IC.sun}${IC.moon}</div>`, ui); D.split.id = 'split';
  D.s2bText = el('div', 'card', '', ui); D.s2bText.id = 's2bText';
  D.hlDN = headline(D.s2bText, P ? 'Au chaud,\n[g]jour et nuit' : 'Au chaud,\n[g]jour et nuit');
  D.lblDay = el('div', 'dnLabel', 'Jour', ui); D.lblDay.id = 'lblDay';
  D.lblNight = el('div', 'dnLabel', 'Nuit', ui); D.lblNight.id = 'lblNight';
  const stars = document.querySelector('#nightBg .stars'); const sr = rng(21);
  for (let i = 0; i < 90; i++) { const s = el('i', '', '', stars); s.style.left = sr() * 100 + '%'; s.style.top = sr() * 55 + '%'; s.style.opacity = 0.3 + sr() * 0.7; const z = 2 + sr() * 4; s.style.width = s.style.height = z + 'px'; }

  /* S2c invoice */
  D.hlBill = headline(ui, P ? 'Votre facture\n[g]fait la différence' : 'Votre facture\n[g]fait la\n[g]différence');
  D.invShadow = el('div', 'shadowEllipse', '', ui);
  D.invoiceWrap = el('div', '', `<div id="invoice">
      <div class="top"><div class="bico">${IC.bolt}</div><div><div class="tt">Facture<br>d'électricité</div></div></div>
      <div class="ln" style="width:86%"></div><div class="ln" style="width:62%"></div>
      <div class="chart">${'<div class="bar"></div>'.repeat(6)}
        <svg class="trend" viewBox="0 0 100 100" preserveAspectRatio="none"><path id="trendPath" d="M8 14 L25 22 L42 30 L58 46 L75 58 L92 70" fill="none" stroke="#16A34A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" style="stroke-width:8px"/></svg>
      </div>
      <div class="foot"><div class="ok">${IC.check}Consommation maîtrisée</div><div class="down">${IC.arrowDown}</div></div>
    </div>`, ui);
  D.invoiceWrap.id = 'invoiceWrap';
  D.invoice = D.invoiceWrap.querySelector('#invoice');
  D.bars = [...D.invoice.querySelectorAll('.bar')];
  D.trend = D.invoice.querySelector('#trendPath');

  /* S3 */
  D.hlPose = headline(ui, P ? 'Installation\n[g]par un pro' : 'Installation [g]par [g]un [g]pro', P ? '' : 'center');
  D.warranty = el('div', '', `<div class="chip"><div class="ic">${IC.shield}</div>Garantie décennale 10 ans</div>`, ui); D.warranty.id = 'warranty';
  D.veil = el('div', '', '', ui); D.veil.id = 'veil'; Object.assign(D.veil.style, { left: 0, top: 0, width: W + 'px', height: H + 'px' });
  D.photos = el('div', '', '', ui); D.photos.id = 'photos';
  const ph = [['daikin_chambre.jpg', 0.75], ['daikin_noir.jpg', 1.28], ['fujitsu_ext.jpg', 1.1]];
  D.photoEls = ph.map(([f, ar]) => { const p = el('div', 'photo', `<img src="assets/photos/${f}">`, D.photos); const h = P ? 470 : 400; p.style.height = h + 'px'; p.style.width = Math.round(h * ar) + 'px'; p._w = Math.round(h * ar); p._h = h; return p; });
  D.photoTag = el('div', 'tag', 'Nos réalisations', D.photos);
  D.ticker = el('div', 'ticker', `<div class="track">${(pills).repeat(4)}</div>`, ui);
  D.track = D.ticker.querySelector('.track');

  /* S4 */
  D.hlBorne = headline(ui, P ? 'Bornes de recharge\n[g]à domicile' : 'Bornes de\nrecharge\n[g]à domicile');
  D.battery = el('div', 'card', `<div class="bolt">${IC.bolt}</div><div class="cell"><div class="fill"></div></div><div class="pct">20%</div>`, ui); D.battery.id = 'battery';
  D.realBorne = el('div', 'photo realBorne', `<img src="assets/photos/borne_coffret.jpg"><div class="rbTag">${IC.check}Nos réalisations</div>`, ui);
  D.batFill = D.battery.querySelector('.fill'); D.batPct = D.battery.querySelector('.pct');

  /* S5 phone */
  D.hlChat = headline(ui, P ? '[g]Devis gratuit,\nréponse rapide' : '[g]Devis\n[g]gratuit,\nréponse\nrapide');
  D.phoneShadow = el('div', 'shadowEllipse', '', ui);
  D.phoneWrap = el('div', '', `<div id="phone">
      ${Array.from({ length: 8 }, (_, i) => `<div class="edge" style="transform:translateZ(${-(i + 1) * 4}px)"></div>`).join('')}
      <div class="body"><div class="screen">
        <div class="island"></div>
        <div class="status"><span>9:41</span><span style="letter-spacing:4px">●●● ▮</span></div>
        <div class="chatHead"><div class="av"></div><div><div class="nm">PRO ELEC</div><div class="st">● en ligne</div></div></div>
        <div class="msgs"></div>
        <div class="composer"><div class="in"></div><div class="snd">${IC.send}</div></div>
        <div class="notif"><div class="cal"><div class="mo">MER.</div><div class="d">9h</div></div><div><div class="ap">Calendrier · maintenant</div><div class="ti">Mercredi 9:00 – Pose clim</div></div><div class="ok">${IC.check}</div></div>
      </div></div>
      <div class="glare"></div>
    </div>`, ui);
  D.phoneWrap.id = 'phoneWrap';
  D.phone = D.phoneWrap.querySelector('#phone');
  D.msgs = D.phone.querySelector('.msgs');
  D.notif = D.phone.querySelector('.notif');
  const chat = [
    ['typing', 'in', 21.85, 22.45], ['msg', 'in', 22.45, 0, 'Bonjour 👋 je voudrais faire poser une clim réversible Samsung, je suis à Orléans centre.'],
    ['typing', 'out', 22.9, 23.45], ['msg', 'out', 23.45, 0, 'Bonjour ! Avec plaisir 😊 Voici votre devis gratuit 👇'],
    ['pdf', 'out', 24.05],
    ['typing', 'in', 24.7, 25.25], ['msg', 'in', 25.25, 0, 'Parfait, je valide ✅'],
    ['typing', 'out', 25.7, 26.25], ['msg', 'out', 26.25, 0, 'Top ! Rendez-vous mercredi à 9h 🔧'],
  ];
  D.chat = chat.map((c) => {
    let e;
    if (c[0] === 'typing') e = el('div', 'typing ' + c[1], '<i></i><i></i><i></i>', D.msgs);
    else if (c[0] === 'msg') e = el('div', 'msg ' + c[1], `${emo(c[4])}<span class="tm">${c[1] === 'out' ? '09:4' + (c[2] > 25 ? '3' : '2') + ' ✓✓' : '09:4' + (c[2] > 25 ? '3' : '1')}</span>`, D.msgs);
    else e = el('div', 'pdf', `<div class="pv"><div class="doc"><b></b><b></b><b></b><b style="width:70%"></b><b style="width:50%"></b></div><div class="free">GRATUIT</div></div><div class="meta"><div class="t">Devis – Clim réversible Samsung</div><div class="s"><em>PDF</em> · 1 page · PRO ELEC</div></div>`, D.msgs);
    e.style.display = 'none';
    return { e, kind: c[0], a: c[2], b: c[3] };
  });

  /* S6 */
  D.hlZone = headline(ui, P ? 'On se déplace,\n[g]24h/24' : 'On se\ndéplace,\n[g]24h/24');
  D.mapLbl = el('div', 'mapLbl', "jusqu'à 100 km", ui);
  D.cityLbl = el('div', 'cityLbl', 'Orléans', ui);
  D.svc = el('div', '', `
    <div class="svc"><div class="ic">${IC.clock}</div><div class="t">24h/24<br>7j/7</div></div>
    <div class="svc"><div class="ic">${IC.meter}</div><div class="t">Compteur<br>& tableau</div></div>
    <div class="svc"><div class="ic"><img src="assets/photos/tableau.jpg"></div><div class="t">Électricité<br>générale</div></div>`, ui);
  D.svc.id = 'svc'; D.svcEls = [...D.svc.children];

  /* S7 */
  D.end = el('div', '', `
    <div class="cta"><div class="ic">${IC.phone}</div>07 67 23 95 91<div class="shine"></div></div>
    <div class="info">${IC.mail}proelec45@gmail.com</div>
    <div class="info">${IC.pin}Orléans + 100 km</div>
    <div class="free">${IC.check}Devis gratuit</div>`, ui);
  D.end.id = 'end'; D.endEls = [...D.end.children]; D.shine = D.end.querySelector('.shine');
  D.endSub = el('div', 'kicker', 'Électricité & Climatisation', ui);
  return D;
}

/* bolt geometry centred on (cx, cy) with height h */
function boltPath(cx, cy, h) {
  const s = h / 130; const pts = [[60, 0], [8, 74], [46, 74], [26, 130], [94, 50], [55, 50], [78, 0]];
  return 'M' + pts.map(([x, y]) => `${(cx + (x - 50) * s).toFixed(1)} ${(cy + (y - 65) * s).toFixed(1)}`).join(' L') + ' Z';
}

export function updateDOM(D, t, ctx) {
  const { W, H, portrait: P, state } = ctx;
  const $ = (e, v) => { e.style.display = v ? '' : 'none'; };

  /* ── S1 intro ── */
  {
    const bp = document.getElementById('boltPath');
    const on = t < 1.25 || (t > 33.9 && t < 34.75);
    $(D.bolt, on);
    if (on) {
      const isEnd = t > 33;
      const lt = isEnd ? t - 33.9 : t;
      const cx = isEnd ? (P ? W / 2 + 370 : 560) : W / 2, cy = isEnd ? (P ? 420 : 300) : (P ? H * 0.42 : H * 0.43);
      const h = isEnd ? 150 : (P ? 520 : 420);
      bp.setAttribute('d', boltPath(cx, cy, h));
      const len = 2400; bp.style.strokeDasharray = len;
      const draw = easeInOut(prog(lt, 0.05, 0.55));
      bp.style.strokeDashoffset = len * (1 - draw);
      bp.style.fillOpacity = smooth(0.45, 0.62, lt);
      const fade = smooth(0.78, 1.15, lt) * (isEnd ? 1 : 1);
      const sc = isEnd ? 1 + 0.15 * smooth(0.5, 0.85, lt) : lerp(1, 0.25, easeIn(prog(lt, 0.72, 1.0)));
      D.bolt.style.opacity = 1 - fade;
      bp.style.transformOrigin = `${cx}px ${cy}px`; bp.style.transform = `scale(${sc})`;
    }
    const fl = Math.max(0, 1 - Math.abs(t - 0.74) / 0.22);
    document.getElementById('flash').style.opacity = fl * 0.95;
    const sub = life(t, 1.45, 3.05, 0.6, 0.3);
    $(D.s1sub, sub.on); if (sub.on) { D.s1sub.style.opacity = sub.v; D.s1sub.style.transform = `translateY(${(1 - sub.i) * 40}px)`; D.s1sub.style.letterSpacing = `${lerp(0.3, 0.02, sub.i)}em`; D.s1sub.querySelector('.line').style.width = `${140 * easeOut(prog(t, 1.8, 2.4))}px`; }
  }

  /* ── S2a ── */
  animHeadline(D.hlRev, t, 3.25, 4.55);
  animHeadline(D.hlSummer, t, 4.6, 6.55);
  animHeadline(D.hlWinter, t, 6.6, 8.45);
  const badgePos = (b) => { if (P) { b.style.left = (W / 2 - 75) + 'px'; b.style.top = '88px'; } else { b.style.left = '192px'; b.style.top = '140px'; } };
  for (const [b, a, z] of [[D.badgeSun, 4.65, 6.55], [D.badgeSnow, 6.65, 8.45]]) {
    badgePos(b); const v = pop(b, t, a, z, { from: 0.4, y: 0, fin: 0.7 });
    if (v) b.querySelector('svg').style.transform = `rotate(${(t - a) * 25}deg)`;
  }
  $(D.badgeMoon, false);
  document.querySelector('.tint.cold').style.opacity = smooth(4.5, 5.0, t) * (1 - smooth(6.4, 6.9, t));
  document.querySelector('.tint.warm').style.opacity = smooth(6.4, 6.9, t) * (1 - smooth(8.2, 8.5, t));
  {
    const v = pop(D.partners, t, 3.7, 8.45, { from: 0.96, y: 60, fin: 0.7 });
    if (v) D.partnerPills.forEach((p, i) => { const k = spring(prog(t, 3.8 + i * 0.07, 4.4 + i * 0.07)); p.style.transform = `translateY(${(1 - k) * 50}px)`; p.style.opacity = Math.min(1, k * 1.5); });
  }

  /* ── S2b day/night ── */
  {
    const on = t >= 8.3 && t <= 10.45;
    const inn = smooth(8.3, 8.6, t), out = smooth(10.15, 10.45, t);
    const vis = on ? inn * (1 - out) : 0;
    const sx = (state.split ?? 1) * W;
    const day = document.getElementById('dayBg'), night = document.getElementById('nightBg');
    day.style.opacity = vis; night.style.opacity = vis;
    day.style.clipPath = `inset(0 ${W - sx}px 0 0)`; night.style.clipPath = `inset(0 0 0 ${sx}px)`;
    $(D.split, on && sx < W - 2); D.split.style.left = sx + 'px'; D.split.style.opacity = vis;
    $(D.s2bText, on); D.s2bText.style.opacity = vis; D.s2bText.style.transform = `translateY(${(1 - easeOut(inn)) * 40}px)`;
    animHeadline(D.hlDN, t, 8.45, 10.45);
    for (const [e, x] of [[D.lblDay, sx / 2], [D.lblNight, sx + (W - sx) / 2]]) {
      $(e, on); e.style.left = x + 'px'; e.style.top = (P ? H - 330 : H - 190) + 'px'; e.style.transform = 'translateX(-50%)'; e.style.opacity = vis * smooth(9.0, 9.3, t);
    }
    document.querySelector('#nightBg .stars').style.transform = `translateX(${(t - 8.3) * -12}px)`;
  }

  /* ── S2c invoice ── */
  {
    animHeadline(D.hlBill, t, 10.35, 12.1);
    const v = pop(D.invoiceWrap, t, 10.3, 12.1, { from: 0.8, y: 120, fin: 0.8 });
    if (v) {
      const lt = t - 10.3;
      D.invoice.style.transform = `rotateX(${lerp(28, 8, easeOut(prog(lt, 0, 1.2)))}deg) rotateY(${lerp(-30, -10, easeInOut(prog(lt, 0, 1.8)))}deg) rotateZ(${lerp(-4, 1, easeOut(prog(lt, 0, 1.5)))}deg)`;
      const targets = [0.88, 0.82, 0.74, 0.58, 0.44, 0.32];
      D.bars.forEach((b, i) => { const k = easeInOut(prog(t, 10.7 + i * 0.1, 11.3 + i * 0.1)); b.style.height = lerp(0.9, targets[i], k) * 100 + '%'; const g = k * (i >= 2 ? 1 : 0.35); b.style.background = `color-mix(in srgb, #22C55E ${g * 100}%, #d9dfdc)`; });
      D.trend.style.strokeDasharray = 200; D.trend.style.strokeDashoffset = 200 * (1 - easeInOut(prog(t, 11.0, 11.7)));
      D.trend.setAttribute('pathLength', 200);
    }
    $(D.invShadow, v > 0); if (v) { const w = 640; Object.assign(D.invShadow.style, { width: w + 'px', height: '80px', left: (P ? 220 : 1100) + 'px', top: (P ? 1640 : 1010) + 'px', opacity: v * 0.9 }); }
  }

  /* ── S3 pose ── */
  {
    animHeadline(D.hlPose, t, 12.1, 16.1);
    pop(D.warranty, t, 13.35, 16.1, { from: 0.7, y: 30, fin: 0.6 });
    const tk = pop(D.ticker, t, 12.3, 16.15, { from: 1, y: 40, fin: 0.5 });
    if (tk) D.track.style.transform = `translateX(${-(t - 12) * 170}px)`;
    const ph = t >= 14.45 && t <= 16.15; $(D.photos, ph);
    D.veil.style.display = ph ? '' : 'none';
    if (ph) {
      const out = easeIn(prog(t, 15.85, 16.15));
      D.veil.style.background = `rgba(255,255,255,${0.8 * smooth(14.45, 14.8, t) * (1 - out)})`;
      const cw = P ? 1080 : 1920, ch = P ? 900 : 560;
      const fan = [[-1, -9], [0, 2], [1, 10]];
      D.photoEls.forEach((p, i) => {
        const k = spring(prog(t, 14.5 + i * 0.12, 15.2 + i * 0.12));
        const [d, rot] = fan[i];
        const spread = P ? 300 : 520;
        const x = cw / 2 - p._w / 2 + d * spread * k, y = ch / 2 - p._h / 2 + (P ? Math.abs(d) * 40 : Math.abs(d) * 20) + (1 - k) * 500;
        p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.zIndex = i === 1 ? 3 : 1;
        p.style.transform = `rotate(${rot * k}deg) scale(${lerp(0.7, i === 1 ? 1.06 : 0.92, k)})`;
        p.style.opacity = Math.min(1, prog(t, 14.5 + i * 0.12, 14.75 + i * 0.12)) * (1 - out);
      });
      Object.assign(D.photoTag.style, { left: 0, width: cw + 'px', textAlign: 'center', top: (P ? ch - 60 : ch - 10) + 'px', opacity: smooth(14.9, 15.2, t) * (1 - out) });
    }
  }

  /* ── S4 borne ── */
  {
    animHeadline(D.hlBorne, t, 16.3, 21.1);
    const v = pop(D.battery, t, 18.5, 21.1, { from: 0.85, y: 60, fin: 0.6 });
    {
      const on = t >= 19.5 && t <= 21.15; $(D.realBorne, on);
      if (on) {
        const k = spring(prog(t, 19.5, 20.2)); const o = easeIn(prog(t, 20.9, 21.15));
        D.realBorne.style.opacity = Math.min(1, prog(t, 19.5, 19.7)) * (1 - o);
        D.realBorne.style.transform = `translateX(${(1 - k) * 380}px) rotate(${lerp(14, 4, k)}deg) scale(${lerp(0.75, 1, k)})`;
      }
    }
    if (v) { const f = lerp(0.2, 1, easeInOut(prog(t, 18.7, 20.8))); D.batFill.style.width = f * 100 + '%'; D.batPct.textContent = Math.round(f * 100) + '%'; D.batFill.style.filter = `brightness(${1 + 0.15 * Math.sin(t * 9)})`; }
  }

  /* ── S5 phone ── */
  {
    animHeadline(D.hlChat, t, 21.25, 28.1);
    const on = t >= 21.05 && t <= 28.2;
    $(D.phoneWrap, on); $(D.phoneShadow, on);
    if (on) {
      const a = spring(prog(t, 21.05, 22.0)); const o = easeIn(prog(t, 27.9, 28.2));
      D.phone.style.transform = `translateY(${(1 - a) * 500}px) rotateY(${lerp(-62, -7, a) + 5 * Math.sin((t - 21) * 0.8) * a}deg) rotateX(${lerp(22, 5, a)}deg) rotateZ(${lerp(-8, 0, a)}deg) scale(${1 - o * 0.08})`;
      D.phoneWrap.style.opacity = Math.min(1, prog(t, 21.05, 21.35)) * (1 - o);
      Object.assign(D.phoneShadow.style, { width: '560px', height: '90px', left: (P ? 260 : 1185) + 'px', top: (P ? 1810 : 1035) + 'px', opacity: a * (1 - o) });
      for (const c of D.chat) {
        if (c.kind === 'typing') {
          const vis = t >= c.a && t < c.b; c.e.style.display = vis ? 'flex' : 'none';
          if (vis) { const k = spring(prog(t, c.a, c.a + 0.3)); c.e.style.transform = `scale(${k})`; c.e.style.transformOrigin = c.e.classList.contains('out') ? 'bottom right' : 'bottom left'; [...c.e.children].forEach((d, i) => { d.style.transform = `translateY(${-8 * Math.max(0, Math.sin((t - c.a) * 9 - i * 0.9))}px)`; d.style.opacity = 0.5 + 0.5 * Math.max(0, Math.sin((t - c.a) * 9 - i * 0.9)); }); }
        } else {
          const vis = t >= c.a; c.e.style.display = vis ? '' : 'none';
          if (vis) { const k = spring(prog(t, c.a, c.a + 0.45)); const fly = c.kind === 'pdf' ? (1 - easeOutQuint(prog(t, c.a, c.a + 0.5))) * 260 : 0; c.e.style.transform = `translateY(${fly}px) scale(${lerp(0.6, 1, k)})`; c.e.style.opacity = Math.min(1, prog(t, c.a, c.a + 0.15)); }
        }
      }
      const n = spring(prog(t, 26.85, 27.45));
      D.notif.style.display = t >= 26.85 ? 'flex' : 'none';
      D.notif.style.transform = `translateY(${(1 - n) * -260}px) scale(${lerp(0.9, 1, n)})`;
    }
  }

  /* ── S6 map ── */
  {
    animHeadline(D.hlZone, t, 28.2, 32.1);
    const ml = state.mapLabel; const on = t >= 28.9 && t <= 32.15 && ml;
    $(D.mapLbl, on); $(D.cityLbl, t >= 28.6 && t <= 32.15 && ml);
    if (ml) {
      const out = 1 - smooth(31.85, 32.15, t);
      const s = ctx.project(ml.p, ml.cam); D.mapLbl.style.left = s.x + 'px'; D.mapLbl.style.top = Math.min(s.y + 10, P ? 1420 : 960) + 'px';
      const k = spring(prog(t, 29.5, 30.1)); D.mapLbl.style.transform = `translate(-50%,-50%) scale(${k})`; D.mapLbl.style.opacity = out;
      const c = ctx.project({ x: 0, y: 0.85, z: 0 }, ml.cam); D.cityLbl.style.left = c.x + 'px'; D.cityLbl.style.top = c.y + 'px';
      const k2 = spring(prog(t, 28.75, 29.3)); D.cityLbl.style.transform = `translate(-50%,-100%) translateY(${(1 - k2) * 30}px) scale(${lerp(0.7, 1, k2)})`; D.cityLbl.style.opacity = Math.min(1, prog(t, 28.75, 28.95)) * out;
    }
    const sv = t >= 29.95 && t <= 32.15; $(D.svc, sv);
    if (sv) D.svcEls.forEach((e, i) => { const k = spring(prog(t, 30.0 + i * 0.28, 30.65 + i * 0.28)); const o = easeIn(prog(t, 31.85, 32.15)); e.style.transform = `translateY(${(1 - k) * 120}px) scale(${lerp(0.6, 1, k)}) rotate(${(1 - k) * (i - 1) * 8}deg)`; e.style.opacity = Math.min(1, prog(t, 30 + i * 0.28, 30.2 + i * 0.28)) * (1 - o); });
  }

  /* ── S7 end ── */
  {
    const on = t >= 32.2; $(D.end, on);
    if (on) {
      D.endEls.forEach((e, i) => { const k = spring(prog(t, 32.45 + i * 0.13, 33.1 + i * 0.13)); e.style.transform = `translateY(${(1 - k) * 80}px) scale(${lerp(0.8, 1, k) * (i === 0 ? 1 + 0.025 * Math.sin((t - 33) * 5) * smooth(33.2, 33.5, t) : 1)})`; e.style.opacity = Math.min(1, prog(t, 32.45 + i * 0.13, 32.7 + i * 0.13)); });
      D.shine.style.left = lerp(-200, 1100, prog(t, 33.3, 34.0)) + 'px';
    }
    const ks = false; $(D.endSub, ks);
    if (ks) { Object.assign(D.endSub.style, P ? { left: '0px', width: W + 'px', textAlign: 'center', top: '890px', fontSize: '34px' } : { left: '150px', width: '820px', textAlign: 'center', top: '760px', fontSize: '30px' }); D.endSub.style.opacity = smooth(32.6, 33.0, t); }
  }

  /* ── light sweep on scene cuts ── */
  {
    const cuts = [3.0, 8.4, 12.0, 16.0, 21.05, 28.0, 32.0];
    let x = -60, op = 0;
    for (const c of cuts) { const p = prog(t, c - 0.22, c + 0.28); if (p > 0 && p < 1) { x = lerp(-60, 110, easeInOut(p)); op = 1; } }
    const sw = document.querySelector('#sweep > div'); sw.style.left = x + '%'; sw.style.opacity = op;
  }
}
