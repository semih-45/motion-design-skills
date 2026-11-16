import React, {useMemo} from 'react';
import QR from 'qrcode';

/** QR code réel (généré à partir de l'URL), dessiné en SVG net. */
export const QRCode: React.FC<{value: string; size: number; reveal?: number}> = ({value, size, reveal = 1}) => {
  const {n, cells} = useMemo(() => {
    const q = QR.create(value, {errorCorrectionLevel: 'Q'});
    const n = q.modules.size;
    const cells: [number, number][] = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.modules.get(y, x)) cells.push([x, y]);
    return {n, cells};
  }, [value]);
  const quiet = 3;
  const total = n + quiet * 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${total} ${total}`} shapeRendering="crispEdges" style={{borderRadius: size * 0.07, display: 'block'}}>
      <rect width={total} height={total} fill="#fff" />
      {cells.map(([x, y], i) => (y / n <= reveal ? <rect key={i} x={x + quiet} y={y + quiet} width={1.02} height={1.02} fill="#05070B" /> : null))}
    </svg>
  );
};
