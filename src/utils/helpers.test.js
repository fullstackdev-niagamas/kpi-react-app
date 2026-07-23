import { describe, it, expect } from 'vitest';
import {
  calcMTD, calcYTD, computeAch, computeScore, kpiMonthStats, kpiYTDStats,
  deptScoreAt, deptScoreYTD, gradeFromTotal, gradeFromScore, scoreBg,
} from './helpers';

const NULL12 = () => Array(12).fill(null);
const arr = (overrides) => { const a = NULL12(); Object.entries(overrides).forEach(([i, v]) => { a[i] = v; }); return a; };

// Fixture: KPI Corporate Strategy 2026 (Indri Wahyuningrum) — Jan(0) & Feb(1) 2027, diverifikasi
// manual terhadap Excel referensi user (sesi 2026-07-20). Angka expected di test bawah BUKAN ditempel
// dari Excel — ini hasil MENJALANKAN formula deptScoreAt/deptScoreYTD yang sesungguhnya lewat
// helpers.js, lalu dites di sini supaya kalau ada perubahan kode di masa depan yang tidak sengaja
// merusak formula, test ini gagal otomatis (bukan menunggu ditemukan via cross-check manual lagi,
// seperti bug deptScoreYTD yang lolos sebelum revisi ini).
const kpis = [
  {
    name: 'Timeliness of Strategic Reports (HOD Material Meeting)',
    type: 'Max', mtdCat: 'DIRECT', ytdCat: 'LAST', weight: 0.10, target: 100,
    factor1: arr({ 0: 100 }), factor2: arr({ 0: 100 }),
  },
  {
    name: 'Audit Score Index', // sengaja kosong Jan & Feb — verifikasi exclude & re-normalize
    type: 'Max', mtdCat: 'RATIO', ytdCat: 'LAST', weight: 0.05, target: 100,
    factor1: NULL12(), factor2: NULL12(),
  },
  {
    name: 'Annual Plan KPI cascading',
    type: 'Max', mtdCat: 'RATIO', ytdCat: 'LAST', weight: 0.20, target: 100,
    factor1: arr({ 0: 186, 1: 186 }), factor2: arr({ 0: 206, 1: 206 }),
  },
  {
    name: 'Calendar of Events Completion Rate',
    type: 'Max', mtdCat: 'RATIO', ytdCat: 'SUM', weight: 0.10, target: 100,
    factor1: arr({ 0: 10 }), factor2: arr({ 0: 13 }),
  },
  {
    name: 'Dashboard Availability (Dept. & Individual Level)',
    type: 'Max', mtdCat: 'RATIO', ytdCat: 'LAST', weight: 0.10, target: 100,
    factor1: arr({ 0: 163, 1: 163 }), factor2: arr({ 0: 206, 1: 206 }),
  },
];

describe('calcMTD', () => {
  it('DIRECT mengembalikan Factor 1 mentah', () => {
    expect(calcMTD(kpis[0], 0)).toBe(100);
  });
  it('RATIO menghitung (F1/F2)*100', () => {
    expect(calcMTD(kpis[2], 0)).toBeCloseTo(90.2913, 3);
  });
});

describe('calcYTD', () => {
  it('LAST = calcMTD PERSIS di bulan mi (snapshot, bukan carry-forward)', () => {
    expect(calcYTD(kpis[2], 1)).toBeCloseTo(90.2913, 3); // Feb, sama dgn Jan krn data sama
  });
  it('SUM mengakumulasi F1/F2 dari Jan s.d. mi', () => {
    expect(calcYTD(kpis[3], 1)).toBeCloseTo(76.9231, 3); // Calendar: Jan terisi, Feb kosong -> tetap 10/13
  });
});

describe('kpiMonthStats — null-safety', () => {
  it('return null (bukan skor 0) kalau Factor 1/2 belum terisi', () => {
    expect(kpiMonthStats(kpis[1], 0)).toBeNull();
  });
});

describe('kpiYTDStats — null-safety (regresi 2026-07-22: "9V 9R" & "Aging Stock Level")', () => {
  // Root cause: `calcYTD` sendiri tidak menjaga null — kalau dipanggil langsung tanpa guard,
  // JS men-coerce null jadi 0 dlm aritmetika, menghasilkan angka PALSU yg arahnya beda tergantung
  // Type: KPI Max jatuh ke 0%/Score 1 (Merah, spt "9V 9R" di Dashboard), KPI Min malah jatuh ke
  // 200%/Score 3 (Hijau, spt "Aging Stock Level") — krn (2*target-0)/target = 2. Ditemukan dari
  // laporan user (screenshot Excel export vs Dashboard on-screen berbeda utk Rizaldi Faisal), sesudah
  // fix yg sama sebelumnya (2026-07-20) cuma diterapkan di excel.js, tidak di 4 halaman lain yg
  // re-implement kalkulasi YTD sendiri2 (root cause KEDUA: tidak ada single source of truth).
  it('KPI Max tanpa Actual sama sekali -> null (BUKAN 0%/Score 1)', () => {
    const kpiMax = { type: 'Max', mtdCat: 'DIRECT', ytdCat: 'LAST', target: 100, factor1: NULL12(), factor2: NULL12() };
    expect(kpiYTDStats(kpiMax, 5)).toBeNull();
  });
  it('KPI Min tanpa Actual sama sekali -> null (BUKAN 200%/Score 3)', () => {
    const kpiMin = { type: 'Min', mtdCat: 'DIRECT', ytdCat: 'LAST', target: 30, factor1: NULL12(), factor2: NULL12() };
    expect(kpiYTDStats(kpiMin, 5)).toBeNull();
  });
  it('kategori SUM: ada data di bulan sebelumnya (bukan bulan mi) -> tetap dihitung, bukan null', () => {
    expect(kpiYTDStats(kpis[3], 3)).not.toBeNull(); // Calendar: cuma Jan terisi, dicek s.d. bulan Apr(3)
  });
  it('kategori LAST: bulan mi kosong walau bulan lain pernah terisi -> null (snapshot, bukan carry-forward)', () => {
    const kpiLast = { type: 'Max', mtdCat: 'DIRECT', ytdCat: 'LAST', target: 100, factor1: arr({ 0: 100 }), factor2: arr({ 0: 100 }) };
    expect(kpiYTDStats(kpiLast, 3)).toBeNull(); // Jan terisi, tapi dicek per Apr(3) yg kosong
  });
  it('KPI dgn data lengkap tetap konsisten dgn calcYTD/computeAch/computeScore manual', () => {
    const st = kpiYTDStats(kpis[2], 1);
    expect(st.ach).toBeCloseTo(0.902913, 5);
    expect(st.score).toBe(2);
  });
});

describe('deptScoreAt (Total Score MTD) — exclude & re-normalize', () => {
  it('Jan 2027 = 1.80 — KPI kosong dikeluarkan, bobot direnormalisasi ke 50% (verified vs Excel)', () => {
    expect(deptScoreAt(kpis, 0)).toBeCloseTo(1.80, 2);
  });
  it('Feb 2027 = 1.67 — Timeliness & Calendar ikut dikeluarkan krn kosong bulan ini (verified vs Excel)', () => {
    expect(deptScoreAt(kpis, 1)).toBeCloseTo(1.6667, 3);
  });
  it('return null kalau tidak ada satu pun KPI terisi', () => {
    const empty = kpis.map(k => ({ ...k, factor1: NULL12(), factor2: NULL12() }));
    expect(deptScoreAt(empty, 0)).toBeNull();
  });
});

describe('deptScoreYTD (Total Score YTD) — menghormati kategori LAST/SUM/AVG per-KPI', () => {
  it('Jan 2027 = 1.80 (verified vs Excel user)', () => {
    expect(deptScoreYTD(kpis, 0)).toBeCloseTo(1.80, 2);
  });
  it('Feb 2027 = 1.50, BUKAN 1.80 — regresi 2026-07-20: versi awal salah treat semua KPI sbg kategori AVG', () => {
    expect(deptScoreYTD(kpis, 1)).toBeCloseTo(1.50, 2);
  });
});

describe('Warna skala performa — KUNING (yellow), bukan oranye (amber)', () => {
  it('gradeFromTotal "Cukup" pakai yellow, tidak lagi amber (keputusan user 2026-07-20)', () => {
    expect(gradeFromTotal(2.0).cls).toContain('yellow');
    expect(gradeFromTotal(2.0).cls).not.toContain('amber');
  });
  it('gradeFromScore "Cukup" pakai yellow, tidak lagi amber', () => {
    expect(gradeFromScore(2.0).cls).toContain('yellow');
    expect(gradeFromScore(2.0).cls).not.toContain('amber');
  });
  it('scoreBg skor tengah (2) pakai bg-yellow-400 + teks hitam (kontras cukup di kuning)', () => {
    expect(scoreBg(2)).toBe('bg-yellow-400 text-black');
  });
});

describe('gradeFromTotal / gradeFromScore — null-safety', () => {
  it('null TIDAK boleh jatuh ke grade K (bug JS: null <= 1.5 bernilai true)', () => {
    expect(gradeFromTotal(null).label).toBe('—');
    expect(gradeFromScore(null).label).toBe('—');
  });
  it('grade normal tetap sesuai ambang Section 5.5', () => {
    expect(gradeFromTotal(1.80).label).toBe('C');
    expect(gradeFromTotal(1.50).label).toBe('K');
  });
});

describe('computeAch / computeScore', () => {
  it('Max: ach = actual/target', () => {
    expect(computeAch('Max', 100, 90.29)).toBeCloseTo(0.9029, 3);
  });
  it('Min: ach = (2*target - actual)/target', () => {
    expect(computeAch('Min', 2, 3)).toBeCloseTo(0.5, 3);
  });
  it('threshold Max: <0.8 -> 1, <0.95 -> 2, else 3', () => {
    expect(computeScore(0.79, 'Max')).toBe(1);
    expect(computeScore(0.90, 'Max')).toBe(2);
    expect(computeScore(0.96, 'Max')).toBe(3);
  });
});
