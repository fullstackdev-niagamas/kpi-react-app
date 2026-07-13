import { PERSPECTIVES, CURRENT_MONTH_IDX } from '../data/mockData';

// ── MTD / YTD Calculations ──
export function calcMTD(item, m) {
  const f1 = item.factor1[m], f2 = item.factor2[m];
  if (item.mtdCat === 'DIRECT') return f1;
  return f2 ? (f1 / f2) * 100 : 0;
}

export function calcYTD(item, m) {
  // Bug ditemukan (2026-07-13): dulu me-return `factor2[m]` mentah (nilai pembanding/target bulan
  // berjalan) — bukan nilai Actual yg sudah dihitung. "LAST" seharusnya berarti "snapshot %Actual
  // TERAKHIR" (Sec. 5.3: cocok utk KPI snapshot/rasio yg tidak bisa dikumulatifkan), jadi harus sama
  // dgn MTD bulan berjalan (`calcMTD`), bukan Factor 2 mentah. Salah sebelumnya kebetulan tidak
  // kelihatan kalau Factor 1 == Factor 2 pas diinput (mis. 100/100) — begitu beda, YTD-nya jadi salah
  // menampilkan angka target/pembanding, bukan performa aktualnya.
  if (item.ytdCat === 'LAST') return calcMTD(item, m);
  if (item.ytdCat === 'SUM') {
    const sum1 = item.factor1.slice(0, m + 1).reduce((a, b) => a + (b || 0), 0);
    const sum2 = item.factor2.slice(0, m + 1).reduce((a, b) => a + (b || 0), 0);
    return sum2 ? (sum1 / sum2) * 100 : 0;
  }
  // AVG
  const mtds = item.factor1.slice(0, m + 1).map((_, i) => calcMTD(item, i));
  return mtds.reduce((a, b) => a + b, 0) / mtds.length;
}

// ── Scoring Engine (Section 5 Project Brief) ──
export function computeAch(type, target, actual) {
  if (!target) return 0;
  return type === 'Min' ? (2 * target - actual) / target : actual / target;
}

export function computeScore(ach, type) {
  if (type === 'Min') {
    if (ach < 0.8) return 1;
    if (ach < 1.0) return 2;
    return 3;
  }
  if (ach < 0.8) return 1;
  if (ach < 0.95) return 2;
  return 3;
}

// ── KPI Month Stats (shared) ──
export function kpiMonthStats(k, mi) {
  if (k.factor1[mi] === null || k.factor1[mi] === undefined) return null;
  if (k.factor2[mi] === null || k.factor2[mi] === undefined) return null;
  const mtd = calcMTD(k, mi);
  const ach = computeAch(k.type, k.target, mtd);
  const score = computeScore(ach, k.type);
  return { mtd, ach, score, scoreXW: score * k.weight };
}

// Total Score (weighted) untuk sekumpulan KPI di bulan mi — dasar agregasi Dept/Company
// (Sec. 6.3 Project Brief: skor Company = roll-up dari Dept, bukan angka terpisah).
// Dipakai bersama oleh Executive Dashboard & Monitoring Dashboard supaya angka selalu konsisten.
export function deptScoreAt(kpis, mi) {
  return kpis.reduce((s, k) => { const st = kpiMonthStats(k, mi); return s + (st ? st.scoreXW : 0); }, 0);
}

// Agregasi Dept dari data live: users (Master Data User) + userKPIs (Planning/Actual per user, Sec. 8)
// + batches (status approval, Sec. 6.4). Dipakai bersama Monitoring & Executive supaya skor Dept/Company
// SELALU dihitung dari data KPI User sungguhan — bukan angka statis terpisah (root cause bug yang pernah
// ditemukan: totalScore vs drill-down tidak sinkron). Dept tanpa KPI (mis. BOD — KPI BOD = agregasi
// Company itu sendiri, bukan KPI personal terpisah) otomatis tidak tampil, bukan dipaksa skor 0/"Kurang".
export function buildDeptAggregates(users, userKPIs, batches, mi) {
  const depts = [...new Set(users.map(u => u.dept))];
  return depts
    .map(dept => {
      const deptUsers = users.filter(u => u.dept === dept);
      const kpis = deptUsers.flatMap(u => (userKPIs[u.name] || []).filter(k => k.status === 'Approved' || k.status === 'Locked'));
      const deptBatches = batches.filter(b => deptUsers.some(u => u.name === b.user));
      const submitted = deptBatches.length;
      const approved = deptBatches.filter(b => b.status === 'Approved').length;
      const pending = deptBatches.filter(b => b.status === 'Pending' || b.status === 'Request Revision').length;
      return { dept, kpis, submitted, approved, pending, score: deptScoreAt(kpis, mi) };
    })
    .filter(d => d.kpis.length > 0);
}

// ── Color / Badge Helpers ──
export function badgeColorByPersp(persp) {
  const map = {
    purple: 'bg-purple-100 text-purple-700',
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    green: 'bg-green-100 text-green-700',
    teal: 'bg-teal-100 text-teal-700',
  };
  return (PERSPECTIVES[persp] && map[PERSPECTIVES[persp].color]) || 'bg-gray-100 text-nlg-text-muted';
}

export function scoreBg(score) {
  if (!score && score !== 0) return '';
  if (score <= 1) return 'bg-red-500 text-white';
  if (score <= 2) return 'bg-amber-400 text-white';
  return 'bg-green-500 text-white';
}

export function scoreTextColor(score) {
  if (!score && score !== 0) return '';
  if (score <= 1) return 'text-red-600 font-semibold';
  if (score <= 2) return 'text-amber-600 font-semibold';
  return 'text-green-600 font-semibold';
}

export function colorFromScore(score) {
  if (score <= 1) return 'text-red-600';
  if (score < 3) return 'text-amber-600';
  return 'text-green-600';
}

export function bgFromScore(score) {
  if (score <= 1) return 'bg-red-100 text-red-700';
  if (score < 3) return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
}

// ── Perspective Band Styling (Strategy Map + Dashboard Card View share this palette so both screens
// read as the same visual system — sebelumnya cuma didefinisikan lokal di StrategyMap.jsx) ──
export const PERSP_ORDER = ['Financial', 'Customer', 'Internal Process', 'Learning & Growth'];

export const PERSP_META = {
  Financial:           { color: '#7C3AED', light: '#F5F3FF', border: '#DDD6FE', textColor: '#5B21B6', icon: 'F' },
  Customer:            { color: '#2563EB', light: '#EFF6FF', border: '#BFDBFE', textColor: '#1E40AF', icon: 'C' },
  'Internal Process':  { color: '#EA580C', light: '#FFF7ED', border: '#FED7AA', textColor: '#9A3412', icon: 'IP' },
  'Learning & Growth': { color: '#0D9488', light: '#F0FDFA', border: '#99F6E4', textColor: '#115E59', icon: 'LG' },
};

export const borderByGrade = (label) =>
  label === 'K' ? '#F87171' : label === 'C' ? '#FBBF24' : '#34D399';
export const bgByGrade = (label) =>
  label === 'K' ? '#FEF2F2' : label === 'C' ? '#FFFBEB' : '#F0FDF4';
export const textColorByGrade = (label) =>
  label === 'K' ? 'text-red-600' : label === 'C' ? 'text-amber-600' : 'text-green-600';

export function gradeFromScore(score) {
  if (score <= 1) return { label: 'K', text: 'Kurang', cls: 'bg-red-100 text-red-700' };
  if (score < 3) return { label: 'C', text: 'Cukup', cls: 'bg-amber-100 text-amber-700' };
  return { label: 'B', text: 'Baik', cls: 'bg-green-100 text-green-700' };
}

export function gradeFromTotal(total) {
  if (total <= 1.5) return { label: 'K', text: 'Kurang', cls: 'bg-red-100 text-red-700' };
  if (total <= 2.5) return { label: 'C', text: 'Cukup', cls: 'bg-amber-100 text-amber-700' };
  return { label: 'B', text: 'Baik', cls: 'bg-green-100 text-green-700' };
}

// ── Periode Pengukuran → bulan wajib Input Actual (Sec. 6.2/6.3/7 Project Brief) ──
// "User isi Factor 1 & 2 utk SEMUA KPI PERIODE AKTIF" — KPI Kuartalan/Semesteran/Tahunan HANYA wajib
// diisi di bulan akhir periodenya (konvensi: akhir kuartal/semester/tahun kalender), bukan tiap bulan
// aktif spt KPI Bulanan. `null` = setiap bulan (Bulanan/fallback tipe periode yg tidak dikenal).
export const PERIOD_DUE_MONTHS = {
  Bulanan: null,
  Kuartalan: [2, 5, 8, 11],   // Mar, Jun, Sep, Des (akhir Q1-Q4)
  Semesteran: [5, 11],        // Jun, Des (akhir S1-S2)
  Tahunan: [11],              // Des (akhir tahun)
};

export function isDueMonth(period, mi) {
  const due = PERIOD_DUE_MONTHS[period];
  return !due || due.includes(mi);
}

// Bulan due berikutnya sejak `fromMi` (inklusif) — wrap ke due month pertama kalau sudah lewat semua.
export function nextDueMonth(period, fromMi) {
  const due = PERIOD_DUE_MONTHS[period];
  if (!due) return fromMi;
  return due.find((mi) => mi >= fromMi) ?? due[0];
}

export function levelBadge(level) {
  const map = {
    Company: 'bg-purple-100 text-purple-700',
    Dept: 'bg-blue-100 text-blue-700',
    Individual: 'bg-gray-100 text-nlg-text-muted',
  };
  return map[level] || 'bg-gray-100';
}

export function statusPill(status) {
  const map = {
    Draft: 'bg-gray-100 text-nlg-text-muted',
    Submitted: 'bg-nlg-primary-tint text-nlg-primary',
    Approved: 'bg-green-100 text-green-700',
    Rejected: 'bg-red-100 text-red-700',
    Locked: 'bg-nlg-text text-white',
    'Pending Mediation': 'bg-amber-100 text-amber-700',
  };
  return map[status] || 'bg-gray-100 text-nlg-text-muted';
}

// ── Helpers for SO visibility ──
export function userShowSO(userMeta) {
  if (!userMeta) return false;
  return userMeta.level !== 'Individual';
}

export function kpiHasSO(k) {
  return k && k.so && k.so !== '—';
}

// ── Check if KPI is Red achievement ──
export function isRedAchievement(k) {
  const st = kpiMonthStats(k, CURRENT_MONTH_IDX);
  if (!st) return false;
  return st.score <= 1;
}
