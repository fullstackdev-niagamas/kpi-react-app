import React from 'react';

// Meringkas skor bulan-bulan selain bulan yang sedang di-drill-down jadi satu mini trend-line,
// supaya BSC Table View tidak melebar N-bulan x 3-kolom spt hasil export Excel. Dipakai bersama
// Dashboard Saya & Performa Tim → Detail Anggota (Sec. 8 Project Brief: format harus identik).
//
// points: [{ mi: number, value: number|null (skala 1-3), tooltip?: string }] — urutan kronologis.
// onSelectMonth?: (mi) => void — kalau diisi, titik yg ada datanya bisa diklik utk pindah bulan
// yang ditampilkan (drill-down), reuse state yang sama dgn klik bulan di summary bar.
export const TrendSparkline = ({ points, onSelectMonth, width = 58, height = 22, emptyLabel = '—' }) => {
  const pad = 3;
  const n = points.length;
  const hasAny = points.some(p => p.value !== null && p.value !== undefined);
  if (!n || !hasAny) return <span className="text-[9px] text-nlg-text-subdued">{emptyLabel}</span>;

  const colorFor = (v) => (v <= 1 ? '#EF4444' : v <= 2 ? '#FACC15' : '#22C55E');
  const stepX = n > 1 ? (width - pad * 2) / (n - 1) : 0;
  const yFor = (v) => height - pad - ((Math.min(3, Math.max(1, v)) - 1) / 2) * (height - pad * 2);
  const coords = points.map((p, i) => (p.value === null || p.value === undefined ? null : [pad + i * stepX, yFor(p.value)]));
  const validIdx = coords.map((c, i) => (c ? i : null)).filter(i => i !== null);
  const pathD = validIdx.map((i, k) => `${k === 0 ? 'M' : 'L'}${coords[i][0].toFixed(1)},${coords[i][1].toFixed(1)}`).join(' ');
  const single = validIdx.length === 1;

  return (
    <svg width={single ? width + 14 : width} height={height} className="overflow-visible inline-block align-middle">
      {validIdx.length > 1 && <path d={pathD} fill="none" stroke="#CBD5E1" strokeWidth="1.25" />}
      {validIdx.map(i => {
        const [cx, cy] = coords[i];
        const pt = points[i];
        const clickable = !!onSelectMonth;
        return (
          <g key={i} onClick={clickable ? () => onSelectMonth(pt.mi) : undefined} style={clickable ? { cursor: 'pointer' } : undefined}>
            {clickable && <circle cx={cx} cy={cy} r="7" fill="transparent" />}
            <circle cx={cx} cy={cy} r={single ? 2.5 : 2} fill={colorFor(pt.value)} />
            {single && (
              <text x={cx + 7} y={cy + 3} fontSize="9" fontWeight="700" fill={colorFor(pt.value)}>{pt.value}</text>
            )}
            {pt.tooltip && <title>{pt.tooltip}</title>}
          </g>
        );
      })}
    </svg>
  );
};
