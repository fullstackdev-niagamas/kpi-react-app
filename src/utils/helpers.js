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

// ── KPI YTD Stats (shared) — analog `kpiMonthStats` tapi utk kolom "Ach%/Score YTD" ──
// `calcYTD` sendiri TIDAK menjaga null (Sec. atas): kategori LAST/DIRECT me-return factor1 mentah yg
// bisa null, SUM/AVG pakai `(b||0)` shg bulan kosong dianggap 0 dlm penjumlahan — keduanya bikin KPI yg
// BELUM PERNAH diisi Actual sama sekali (mis. "9V 9R"/"Aging Stock Level") tetap menghasilkan angka
// (0% utk KPI Max → Score 1 Merah; 200% utk KPI Min krn `(2*target-0)/target` → Score 3 Hijau) alih-alih
// "belum ada data". Root cause dilaporkan user 2026-07-20 (ditemukan dari cross-check Excel vs App utk
// KPI "9V 9R"), tapi fix-nya CUMA diterapkan inline di `excel.js` (`exportDashboardExcel`) — 5 tempat lain
// yg re-implement kalkulasi YTD sendiri2 (Dashboard.jsx, Team.jsx, Executive.jsx, ActualInput.jsx tabel
// read-only) tidak pernah ikut diperbaiki, sehingga Export Excel (benar) & tampilan on-screen (salah)
// mulai berbeda utk KPI yg sama — laporan user 2026-07-22 (Rizaldi Faisal). Fungsi ini menyatukan logika
// "KPI punya data YTD?" jadi SATU tempat (persis logika yg sudah benar di excel.js/deptScoreYTD):
// kategori LAST → bulan `mi` itu sendiri harus terisi; SUM/AVG → cukup ada ≥1 bulan terisi di 0..mi.
export function kpiYTDStats(k, mi) {
  const hasData = k.ytdCat === 'LAST'
    ? !!kpiMonthStats(k, mi)
    : Array.from({ length: mi + 1 }, (_, i) => i).some((i) => kpiMonthStats(k, i));
  if (!hasData) return null;
  const ytd = calcYTD(k, mi);
  const ach = computeAch(k.type, k.target, ytd);
  const score = computeScore(ach, k.type);
  return { ytd, ach, score };
}

// Total Score (weighted) untuk sekumpulan KPI di bulan mi — dasar agregasi Individual/Dept/Company
// (Sec. 6.3 Project Brief: skor Company = roll-up dari Dept, bukan angka terpisah).
// Dipakai bersama oleh Executive Dashboard, Monitoring Dashboard, Reports, StrategyMap, Dashboard
// (individual), & Team supaya angka selalu konsisten — satu sumber kebenaran.
// KPI yg belum ada data Actual bulan `mi` (kpiMonthStats null) DIKELUARKAN dari kalkulasi — bobotnya
// TIDAK ikut jadi penyebut ("exclude & re-normalize", keputusan user 2026-07-20). Sebelumnya KPI kosong
// diam2 berkontribusi skor 0 sementara bobotnya tetap penuh, jadi Total Score jatuh semu di tengah
// periode saat belum semua KPI due/dilaporkan — bukan krn performa buruk, tapi krn belum lengkap lapor.
// Return null (bukan 0) kalau TIDAK ADA satu pun KPI yg terisi, supaya caller bisa tampilkan "—" bukan
// skor 0/"Kurang" yg menyesatkan (analog kpiMonthStats yg juga return null, bukan 0, saat kosong).
export function deptScoreAt(kpis, mi) {
  const filled = kpis.map(k => ({ k, st: kpiMonthStats(k, mi) })).filter(x => x.st);
  const filledWeight = filled.reduce((s, x) => s + x.k.weight, 0);
  if (filledWeight <= 0) return null;
  return filled.reduce((s, x) => s + x.st.score * x.k.weight, 0) / filledWeight;
}

// Versi YTD dari `deptScoreAt` — tiap KPI dihitung YTD-nya via `calcYTD` (menghormati kategori
// LAST/SUM/AVG milik KPI itu sendiri, Sec. 5.3 Project Brief), BUKAN rata2 skor bulanan mentah.
// Versi sebelumnya (2026-07-20, revisi awal) keliru memperlakukan SEMUA KPI seolah kategori AVG —
// hasilnya Total Score YTD app tidak match Excel meski MTD sudah sama persis (root cause laporan
// user 2026-07-20 sesi ke-2: dibuktikan manual dari data Excel user, LAST = calcMTD PERSIS di bulan
// `mi` itu sendiri, bukan carry-forward — perhitungan ulang dgn formula ini match Excel sampai 2
// desimal utk Jan=1.80 & Feb=1.50).
// KPI "punya data" utk periode Jan..mi — logikanya sekarang di `kpiYTDStats` (single source, lihat
// komentar di sana), dipakai di sini via reduce spy KPI tanpa data dikeluarkan (exclude & re-normalize
// thd bobot terisi, sama spt `deptScoreAt`).
export function deptScoreYTD(kpis, mi) {
  const withData = kpis.map(k => ({ k, st: kpiYTDStats(k, mi) })).filter(x => x.st);
  const filledWeight = withData.reduce((s, x) => s + x.k.weight, 0);
  if (filledWeight <= 0) return null;
  return withData.reduce((s, x) => s + x.st.score * x.k.weight, 0) / filledWeight;
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

// Skala performa KPI (RAG — Merah/Kuning/Hijau, Sec. 5.4/5.5 Project Brief) sengaja pakai `yellow-*`
// Tailwind, BUKAN `amber-*` — indikator kebijakan perusahaan warnanya KUNING murni (keputusan user
// 2026-07-20), oranye bisa disalahartikan sbg tingkat ke-4 di antara Kuning & Merah padahal skalanya
// cuma 3 tingkat. Teks putih tidak cukup kontras di atas kuning (beda dgn amber yg lebih gelap) —
// dipakai `text-black` utk background kuning. Badge status LAIN di luar skala performa (Draft/Pending/
// Approved di `statusPill`) TIDAK ikut berubah — itu warna workflow, bukan indikator RAG performa.
export function scoreBg(score) {
  if (!score && score !== 0) return '';
  if (score <= 1) return 'bg-red-500 text-white';
  if (score <= 2) return 'bg-yellow-400 text-black';
  return 'bg-green-500 text-white';
}

export function scoreTextColor(score) {
  if (!score && score !== 0) return '';
  if (score <= 1) return 'text-red-600 font-semibold';
  if (score <= 2) return 'text-yellow-600 font-semibold';
  return 'text-green-600 font-semibold';
}

export function colorFromScore(score) {
  if (score <= 1) return 'text-red-600';
  if (score < 3) return 'text-yellow-600';
  return 'text-green-600';
}

export function bgFromScore(score) {
  if (score <= 1) return 'bg-red-100 text-red-700';
  if (score < 3) return 'bg-yellow-100 text-yellow-700';
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

// label '—' (grade N/A dari gradeFromTotal/gradeFromScore saat belum ada data) sengaja dipetakan ke
// warna netral abu2, bukan ikut fallback hijau ("Baik") di cabang default.
export const borderByGrade = (label) =>
  label === 'K' ? '#F87171' : label === 'C' ? '#FACC15' : label === '—' ? '#D1D5DB' : '#34D399';
export const bgByGrade = (label) =>
  label === 'K' ? '#FEF2F2' : label === 'C' ? '#FEFCE8' : label === '—' ? '#F9FAFB' : '#F0FDF4';
export const textColorByGrade = (label) =>
  label === 'K' ? 'text-red-600' : label === 'C' ? 'text-yellow-600' : label === '—' ? 'text-nlg-text-subdued' : 'text-green-600';

// `score` bisa null (mis. rata2 perspektif tanpa satu pun KPI terisi) — lihat catatan null-guard di
// gradeFromTotal, alasan sama: null <= 1 bernilai true di JS krn null dipaksa jadi 0.
export function gradeFromScore(score) {
  if (score === null || score === undefined) return { label: '—', text: 'Belum ada data', cls: 'bg-gray-100 text-nlg-text-subdued' };
  if (score <= 1) return { label: 'K', text: 'Kurang', cls: 'bg-red-100 text-red-700' };
  if (score < 3) return { label: 'C', text: 'Cukup', cls: 'bg-yellow-100 text-yellow-700' };
  return { label: 'B', text: 'Baik', cls: 'bg-green-100 text-green-700' };
}

// `total` bisa null (lihat deptScoreAt/deptScoreYTD — belum ada satu pun KPI terisi di rentang ybs) —
// return grade netral "N/A" alih2 ikut ke cabang 'K'/"Kurang" (null <= 1.5 bernilai true di JS krn
// null dipaksa jadi 0, jadi wajib di-guard eksplisit, bukan cuma andalkan urutan if).
export function gradeFromTotal(total) {
  if (total === null || total === undefined) return { label: '—', text: 'Belum ada data', cls: 'bg-gray-100 text-nlg-text-subdued' };
  if (total <= 1.5) return { label: 'K', text: 'Kurang', cls: 'bg-red-100 text-red-700' };
  if (total <= 2.5) return { label: 'C', text: 'Cukup', cls: 'bg-yellow-100 text-yellow-700' };
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

// KPI Mandatory yang berlaku untuk seorang User — 3 sumber cascade (Sec. 4.4 Project Brief): Company
// (cascade ke Dept), Dept (mandatory semua User di dept), User (mandatory individual by name). Satu
// sumber kebenaran dipakai bersama oleh Planning.jsx (render kartu), Approval.jsx (info pasif utk
// Superior), dan KPIBuilder.jsx (statistik drill-down CS) — supaya definisi "mandatory utk User X"
// tidak pernah divergen antar halaman (pola yang sama dgn deptScoreAt/buildDeptAggregates di atas).
export function getMandatoryKPIsFor(userMeta, kpis) {
  if (!userMeta) return [];
  return kpis.filter(k => k.status === 'Active' && (
    (k.owner_type === 'company' && (k.cascade_depts || []).includes(userMeta.dept)) ||
    (k.owner_type === 'dept' && k.owner_name === userMeta.dept) ||
    (k.owner_type === 'user' && k.owner_name === userMeta.name)
  ));
}

// ── Check if KPI is Red achievement ──
export function isRedAchievement(k) {
  const st = kpiMonthStats(k, CURRENT_MONTH_IDX);
  if (!st) return false;
  return st.score <= 1;
}
