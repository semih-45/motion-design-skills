// Scene 7 — call to action: the spinning brake disc becomes the QR-code ring (holes → dots),
// then "Prenez rendez-vous", the phone number, the 50€ / 1h offer and the service area.
import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import QRCode from 'qrcode';
import {C, FONT, S, W} from '../timeline';
import {clamp, easeIn, easeInOut, easeOut, lerp, prog, springy} from '../lib/anim';
import {DISC_SCREEN, discSpin} from '../three/rig2';
import {DISC_HOLES} from '../three/disc';
import {H2Drop} from '../components/H2Drop';
import type {AdProps} from '../Ad';

export const QR_FINAL = {x: 540, y: 1120, r: 238};

export const qrState = (f: number) => {
  const m = prog(f, C.ctaCall - 2, 14, easeInOut);
  return {
    x: lerp(DISC_SCREEN.x, QR_FINAL.x, m),
    y: lerp(DISC_SCREEN.y, QR_FINAL.y, m),
    r: lerp(DISC_SCREEN.r, QR_FINAL.r, m),
  };
};

const useQr = (text: string) =>
  useMemo(() => {
    const qr = QRCode.create(text, {errorCorrectionLevel: 'Q'});
    const n = qr.modules.size;
    const cells: {r: number; c: number}[] = [];
    const isFinder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.modules.get(r, c) && !isFinder(r, c)) cells.push({r, c});
    return {n, cells};
  }, [text]);

const PhoneIcon: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <circle cx={32} cy={32} r={32} fill="#2BD17E" />
    <path
      d="M 22 16 C 24 15, 27 15, 28 18 L 30 24 C 31 26, 30 28, 28 29 L 26 30 C 28 36, 31 39, 36 41 L 37.5 39 C 38.5 37, 40.5 36.5, 42.5 37.5 L 48 40 C 50 41, 50 44, 49 46 C 47 49, 44 50, 41 49.5 C 30 47, 19 36, 16.5 25 C 16 22, 18.5 18, 22 16 Z"
      fill="#05210F"
    />
  </svg>
);

const Stopwatch: React.FC<{size: number; f: number}> = ({size, f}) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <circle cx={32} cy={36} r={22} fill="none" stroke="#fff" strokeWidth={5} />
    <rect x={26} y={6} width={12} height={6} rx={2} fill="#fff" />
    <rect x={30} y={10} width={4} height={6} fill="#fff" />
    <line x1={32} y1={36} x2={32 + Math.sin(f * 0.25) * 14} y2={36 - Math.cos(f * 0.25) * 14} stroke="#2BD17E" strokeWidth={5} strokeLinecap="round" />
    <circle cx={32} cy={36} r={3.5} fill="#fff" />
  </svg>
);

const PinGlyph: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path d="M 24 46 C 20 38, 8 28, 8 18 C 8 9, 15 3, 24 3 C 33 3, 40 9, 40 18 C 40 28, 28 38, 24 46 Z" fill="#E3262E" />
    <circle cx={24} cy={18} r={7} fill="#fff" />
  </svg>
);

export const S7Cta: React.FC<AdProps> = ({phoneDisplay, snapchatHandle, price}) => {
  const f = useCurrentFrame();
  const qr = useQr(`https://www.snapchat.com/add/${snapchatHandle}`);
  if (f < C.qr - 6 || f > S.end + 16) return null;

  const exit = prog(f, S.end - 5, 8, easeIn);
  const st = qrState(f);
  const ringIn = prog(f, C.qr - 4, 6);
  const fill = prog(f, C.qr, 5);
  const spin = discSpin(Math.min(f, C.qr + 2));
  const sweep = prog(f, C.qr + 2, 14, easeOut); // conic reveal of QR modules
  const holesOut = 1 - prog(f, C.qr + 2, 8);
  const side = st.r * 2 * 0.62;
  const cell = side / qr.n;
  const x0 = st.x - side / 2;
  const y0 = st.y - side / 2;
  const angleOf = (cx: number, cy: number) => {
    let a = Math.atan2(cy - st.y, cx - st.x) + Math.PI / 2 - spin;
    a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return a / (Math.PI * 2);
  };

  const call = prog(f, C.ctaCall, 10, easeOut);
  const phone = springy(f, C.ctaPhone, 2.2, 0.55);
  const pricePop = f >= C.ctaPrice ? clamp(springy(f, C.ctaPrice, 2.6, 0.42), 0, 1.25) : 0;
  const where = prog(f, C.ctaWhere, 10, easeOut);
  const handle = prog(f, C.ctaCall + 8, 10, easeOut);

  const finder = (r: number, c: number) => {
    const x = x0 + c * cell;
    const y = y0 + r * cell;
    return (
      <g key={`f${r}${c}`}>
        <rect x={x + cell * 0.5} y={y + cell * 0.5} width={cell * 6} height={cell * 6} rx={cell * 0.6} fill="none" stroke="#0B1E3F" strokeWidth={cell} />
        <rect x={x + cell * 2} y={y + cell * 2} width={cell * 3} height={cell * 3} rx={cell * 0.4} fill="#0B1E3F" />
      </g>
    );
  };

  return (
    <div style={{position: 'absolute', inset: 0, opacity: 1 - exit, transform: `translateY(${exit * 60}px)`}}>
      {/* QR disc */}
      <svg width={W} height={1920} style={{position: 'absolute', inset: 0}}>
        <circle cx={st.x} cy={st.y} r={st.r + 26} fill="none" stroke="#2BD17E" strokeWidth={4} opacity={0.5 * fill} style={{filter: 'drop-shadow(0 0 16px #2BD17E)'}} />
        <circle cx={st.x} cy={st.y} r={st.r} fill="#ffffff" opacity={fill} />
        <circle cx={st.x} cy={st.y} r={st.r - 6} fill="none" stroke="#ffffff" strokeWidth={14} opacity={ringIn} />
        {/* drilled holes of the disc, still spinning, fading out */}
        {holesOut > 0 &&
          DISC_HOLES.map((h, i) => {
            const a = h.a + spin;
            return <circle key={i} cx={st.x + Math.cos(a) * h.r * st.r} cy={st.y - Math.sin(a) * h.r * st.r} r={0.038 * st.r} fill="#0B1E3F" opacity={fill * holesOut} />;
          })}
        {/* QR modules revealed by a rotating sweep */}
        {sweep > 0 &&
          qr.cells.map(({r, c}) => {
            const cx = x0 + (c + 0.5) * cell;
            const cy = y0 + (r + 0.5) * cell;
            if (angleOf(cx, cy) > sweep) return null;
            return <rect key={`${r}-${c}`} x={cx - cell * 0.51} y={cy - cell * 0.51} width={cell * 1.02} height={cell * 1.02} rx={cell * 0.12} fill="#0B1E3F" />;
          })}
        {sweep > 0.5 && (
          <g opacity={prog(f, C.qr + 9, 5)}>
            {finder(0, 0)}
            {finder(0, qr.n - 7)}
            {finder(qr.n - 7, 0)}
          </g>
        )}
        {sweep > 0.6 && <circle cx={st.x} cy={st.y} r={cell * 2.9} fill="#fff" />}
      </svg>
      {sweep > 0.6 && <H2Drop x={st.x} y={st.y + cell * 0.4} size={cell * 4.6} leaf={1} label={1} glow={0.4} opacity={prog(f, C.qr + 9, 5)} />}
      {/* handle */}
      <div
        style={{
          position: 'absolute',
          left: QR_FINAL.x,
          top: QR_FINAL.y + QR_FINAL.r + 34,
          transform: `translate(-50%, 0) scale(${lerp(0.8, 1, handle)})`,
          opacity: handle,
          padding: '12px 28px',
          borderRadius: 999,
          background: '#FFFC00',
          color: '#000',
          fontFamily: FONT.sans,
          fontWeight: 800,
          fontSize: 38,
          whiteSpace: 'nowrap',
        }}
      >
        Snapchat · @{snapchatHandle}
      </div>
      {/* Prenez rendez-vous */}
      <div style={{position: 'absolute', left: 0, top: 318, width: W, textAlign: 'center', overflow: 'hidden', height: 86}}>
        <div style={{fontFamily: FONT.sans, fontWeight: 800, fontSize: 64, color: '#fff', transform: `translateY(${(1 - call) * 105}%)`}}>Prenez rendez-vous</div>
      </div>
      {/* phone number */}
      <div
        style={{
          position: 'absolute',
          left: W / 2,
          top: 420,
          transform: `translate(-50%, 0) scale(${clamp(phone, 0, 1.2)})`,
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          whiteSpace: 'nowrap',
        }}
      >
        <PhoneIcon size={92} />
        <span style={{fontFamily: FONT.sans, fontWeight: 900, fontSize: 98, color: '#fff', letterSpacing: -2}}>{phoneDisplay}</span>
      </div>
      {/* offer */}
      {pricePop > 0 && (
        <div
          style={{
            position: 'absolute',
            left: W / 2,
            top: 590,
            transform: `translate(-50%, 0) rotate(-3deg) scale(${pricePop})`,
            display: 'flex',
            alignItems: 'stretch',
            borderRadius: 30,
            overflow: 'hidden',
            boxShadow: '0 24px 50px rgba(0,0,0,0.45)',
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{background: '#E3262E', padding: '6px 34px 10px', fontFamily: FONT.sans, fontWeight: 900, fontStyle: 'italic', fontSize: 120, color: '#fff', lineHeight: 1.05}}>{price}</div>
          <div style={{background: '#0B1E3F', border: '4px solid #1E6BFF', borderLeft: 'none', borderRadius: '0 30px 30px 0', padding: '0 34px', display: 'flex', alignItems: 'center', gap: 18}}>
            <Stopwatch size={78} f={f} />
            <div style={{fontFamily: FONT.sans, color: '#fff', lineHeight: 1.02}}>
              <div style={{fontWeight: 700, fontSize: 38}}>Intervention</div>
              <div style={{fontWeight: 900, fontSize: 62}}>en 1h</div>
            </div>
          </div>
        </div>
      )}
      {/* where */}
      <div
        style={{
          position: 'absolute',
          left: W / 2,
          top: 1540,
          transform: `translate(-50%, ${(1 - where) * 30}px)`,
          opacity: where,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: FONT.sans,
          fontWeight: 700,
          fontSize: 38,
          color: '#fff',
          whiteSpace: 'nowrap',
        }}
      >
        <PinGlyph size={50} />À domicile ou sur votre lieu de travail
      </div>
    </div>
  );
};
