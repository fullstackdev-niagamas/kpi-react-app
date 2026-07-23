import React, { useState, useRef, useEffect } from 'react';
import { MONTH_LABELS, ACTIVE_PLAN_YEAR, CURRENT_MONTH_IDX, AVAILABLE_YEARS, TABLE_THEMES } from '../data/mockData';
import { useKPIContext } from '../context/KPIContext';
import { kpiMonthStats, kpiYTDStats, gradeFromTotal, gradeFromScore, scoreBg, scoreTextColor, badgeColorByPersp, levelBadge, PERSP_META, borderByGrade, bgByGrade, deptScoreAt, deptScoreYTD } from '../utils/helpers';
import { exportDashboardExcel } from '../utils/excel';
import { useToast } from '../context/ToastContext';
import { TrendSparkline } from '../components/TrendSparkline';
import { KPIDetailModal } from '../components/KPIDetailModal';
import { FEATURES } from '../config/features';

export const Dashboard = ({ currentUserName }) => {
  const { users, userKPIs } = useKPIContext();
  const [dashboardView, setDashboardView] = useState('table');
  const [viewMonthIdx, setViewMonthIdx] = useState(CURRENT_MONTH_IDX);
  const [viewYear, setViewYear] = useState(ACTIVE_PLAN_YEAR);
  const [tableTheme, setTableTheme] = useState('navy');
  const [statusFilter, setStatusFilter] = useState('all'); // all | red | draft — filter cepat baris KPI
  const [detailKpi, setDetailKpi] = useState(null); // KPI yang lagi dibuka drill-down modal-nya
  const tableRef = useRef(null);
  const toast = useToast();

  const userMeta = users.find(u => u.name === currentUserName?.trim()) || users[0];
  const showSO = userMeta.level !== 'Individual';
  const m = CURRENT_MONTH_IDX;
  const v = viewMonthIdx;
  const isActive = viewYear === ACTIVE_PLAN_YEAR;

  // Apply table theme CSS vars
  useEffect(() => {
    const t = TABLE_THEMES[tableTheme] || TABLE_THEMES.navy;
    const root = document.documentElement;
    Object.entries(t.vars).forEach(([k, val]) => root.style.setProperty(k, val));
  }, [tableTheme]);

  // Sumber tunggal (Sec. 8): Planning & Actual sekarang satu entity per KPI, jadi tidak perlu lagi
  // merge 2 dataset terpisah. Draft tetap ditampilkan (redup, Actual = "—") sesuai Section 10.1 brief.
  const dashKPIs = (userKPIs[currentUserName] || []).map(k => ({ ...k, planStatus: k.status, isDraftOnly: k.status === 'Draft' }));

  // Monthly totals — pakai deptScoreAt/deptScoreYTD (sumber bersama, sama dgn Executive/Monitoring/
  // Reports/StrategyMap, lihat helpers.js) supaya Total Score individual TIDAK divergen dari halaman
  // lain. KPI yg belum terisi bulan mi dikeluarkan dari kalkulasi (exclude & re-normalize thd bobot
  // yg terisi, keputusan user 2026-07-20) — null kalau sama sekali belum ada KPI terisi bulan itu.
  const monthlyTotals = MONTH_LABELS.map((_, mi) => deptScoreAt(dashKPIs, mi));
  const monthlyYTDTotals = MONTH_LABELS.map((_, mi) => deptScoreYTD(dashKPIs, mi));
  // Dibulatkan 2 desimal — hindari noise floating-point (mis. 99.99999999999999) dari penjumlahan
  // fraksi weight, konsisten dgn Planning.jsx (satu-satunya sumber data yg sama, userKPIs).
  const totalWeight = Math.round(dashKPIs.reduce((s, k) => s + k.weight, 0) * 100 * 100) / 100;

  // Perspective groups — statusFilter cuma menyaring baris yg TAMPIL (Table & Card View berbagi
  // `groups` ini), tidak mengubah totalWeight/monthlyTotals di atas yg tetap dihitung dari semua KPI.
  const perspOrder = ['Financial', 'Customer', 'Internal Process', 'Learning & Growth'];
  const filteredKPIs = dashKPIs.filter(k => {
    if (statusFilter === 'red') { const st = kpiMonthStats(k, v); return st && st.score <= 1; }
    if (statusFilter === 'draft') return k.isDraftOnly || k.planStatus === 'Draft';
    return true;
  });
  const groups = perspOrder.map(p => ({ persp: p, kpis: filteredKPIs.filter(k => k.persp === p) })).filter(g => g.kpis.length);
  // Normalnya cuma s.d. bulan aktif `m` — tapi kalau ada data Actual di bulan setelahnya (mis. hasil
  // input via QA Testing Tools di Input Realisasi, yg sengaja bisa override bulan-bulan lain utk
  // simulasi), bulan itu ikut ditambahkan supaya Trend column & modal drill-down "link" ke data
  // tsb, bukan diam2 disembunyikan krn cuma mengandalkan `m`. Tidak berpengaruh di kondisi produksi
  // normal krn tidak akan ada data di bulan setelah `m` tanpa lewat QA Mode.
  const activeMonths = MONTH_LABELS.map((_, mi) => mi)
    .filter(mi => mi <= m || dashKPIs.some(k => k.factor1[mi] !== null && k.factor1[mi] !== undefined));

  const scoreCl = ts => ts <= 1.5 ? 'bg-red-400 text-white' : ts <= 2.5 ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white';

  // ── KPI Summary Header ──
  const renderSummaryHeader = () => (
    <div className="border border-nlg-border rounded-nlg-card bg-white mb-4 overflow-hidden shadow-sm">
      <div className="bg-[#172B4D] text-white px-5 py-3 flex items-center justify-between">
        <span className="text-sm font-bold tracking-wide">KEY PERFORMANCE INDICATOR</span>
      </div>
      <div className="grid grid-cols-3 border-b border-nlg-border">
        <div className="px-5 py-3 border-r border-nlg-border">
          <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">Name</div>
          <div className="font-semibold text-nlg-text text-[15px]">{userMeta.name || '—'}</div>
        </div>
        <div className="px-5 py-3 border-r border-nlg-border">
          <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">Position</div>
          <div className="font-semibold text-nlg-text text-[15px]">{userMeta.position || '—'}</div>
        </div>
        <div className="px-5 py-3">
          <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">Department</div>
          <div className="font-semibold text-nlg-text text-[15px]">{userMeta.dept || '—'}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 border-b border-nlg-border">
        <div className="px-5 py-3 border-r border-nlg-border">
          <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">NIK</div>
          <div className="font-semibold text-nlg-text font-mono text-[15px]">{userMeta.nik || '—'}</div>
        </div>
        <div className="px-5 py-3 border-r border-nlg-border">
          <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">Branch</div>
          <div className="font-semibold text-nlg-text text-[15px]">{userMeta.branch || '—'}</div>
        </div>
        <div className="px-5 py-3">
          <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">Superior</div>
          <div className="font-semibold text-nlg-text text-[15px]">{userMeta.superior || '—'}</div>
        </div>
      </div>
      <div className="grid grid-cols-3">
        <div className="px-5 py-3 border-r border-nlg-border">
          <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">Email</div>
          <div className="text-[13px] text-nlg-primary">{userMeta.email || '—'}</div>
        </div>
        <div className="px-5 py-3 border-r border-nlg-border">
          <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">Level KPI</div>
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${levelBadge(userMeta.level)}`}>{userMeta.level}</span>
        </div>
        <div className="px-5 py-3">
          <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">KPI Periode</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {AVAILABLE_YEARS.map(yr => (
              <button key={yr} onClick={() => { setViewYear(yr); setViewMonthIdx(CURRENT_MONTH_IDX); }}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded border transition-colors ${viewYear === yr ? 'bg-nlg-primary text-white border-nlg-primary' : 'border-nlg-border text-nlg-text-muted hover:bg-nlg-primary-tint'}`}>
                {yr}{yr === ACTIVE_PLAN_YEAR ? '🔓' : ''}
              </button>
            ))}
            {!isActive && <span className="text-[10px] text-amber-600 ml-1">🔒 read-only</span>}
          </div>
        </div>
      </div>
    </div>
  );

  // ── Summary Bar ──
  const renderSummaryBar = () => (
    <div className="overflow-x-auto mb-4">
      <table className="text-xs border-collapse min-w-full">
        <thead>
          <tr>
            <td className="px-3 py-1.5 font-semibold text-nlg-text bg-nlg-rail border border-nlg-border min-w-[110px]">KPI Score {viewYear}</td>
            {MONTH_LABELS.map((label, mi) => {
              const hasData = monthlyTotals[mi] !== null;
              const isView = mi === v;
              const isInput = mi === m;
              let cls;
              if (isView) cls = 'bg-nlg-primary text-white font-bold cursor-pointer';
              else if (hasData) cls = isInput ? 'bg-nlg-primary-tint text-nlg-primary font-semibold cursor-pointer' : 'bg-nlg-sidebar text-nlg-text-muted hover:bg-nlg-primary-tint hover:text-nlg-primary cursor-pointer';
              else cls = 'bg-nlg-sidebar text-nlg-text-subdued opacity-50 cursor-default';
              return (
                <td key={mi} onClick={() => hasData && setViewMonthIdx(mi)}
                  className={`px-2 py-1 text-center border border-nlg-border transition-colors ${cls} min-w-[52px]`}>
                  {label}{isInput ? ' 🔒' : ''}
                </td>
              );
            })}
          </tr>
          <tr>
            <td className="px-3 py-1 text-[11px] font-semibold bg-nlg-rail border border-nlg-border">Total Score MTD</td>
            {monthlyTotals.map((ts, mi) => ts === null
              ? <td key={mi} className="px-2 py-1 text-center border border-nlg-border text-nlg-text-subdued text-[11px]">—</td>
              : <td key={mi} className={`px-2 py-1 text-center font-bold border border-nlg-border text-[11px] ${scoreCl(ts)} ${mi === v ? 'ring-2 ring-inset ring-white/50' : ''}`}>{ts.toFixed(2)}</td>
            )}
          </tr>
          <tr>
            <td className="px-3 py-1 text-[11px] font-semibold bg-nlg-rail border border-nlg-border">Total Score YTD</td>
            {monthlyYTDTotals.map((ts, mi) => ts === null
              ? <td key={mi} className="px-2 py-1 text-center border border-nlg-border text-nlg-text-subdued text-[11px]">—</td>
              : <td key={mi} className={`px-2 py-1 text-center font-bold border border-nlg-border text-[11px] ${scoreCl(ts)} ${mi === v ? 'ring-2 ring-inset ring-white/50' : ''}`}>{ts.toFixed(2)}</td>
            )}
          </tr>
        </thead>
      </table>
    </div>
  );

  // ── Toggle Bar ──
  const renderToggle = () => (
    <>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-nlg-text-subdued">
            Menampilkan: <b className="text-nlg-primary">{MONTH_LABELS[v]} {viewYear}</b>
            {(v !== m || viewYear !== ACTIVE_PLAN_YEAR) && <span className="ml-1 opacity-60">· Aktif input: {MONTH_LABELS[m]} {ACTIVE_PLAN_YEAR} 🔒</span>}
          </span>
        </div>
        <div className="flex gap-1 items-center">
          {Object.entries(TABLE_THEMES).map(([key, t]) => (
            <button key={key} onClick={() => setTableTheme(key)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded border ${tableTheme === key ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border'}`}>
              {t.label}
            </button>
          ))}
          <div className="w-px h-4 bg-nlg-border mx-1"></div>
          <button onClick={() => setDashboardView('table')} className={`px-3 py-1.5 text-xs font-medium rounded-nlg-input border ${dashboardView === 'table' ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border'}`}>📊 Table</button>
          <button onClick={() => setDashboardView('card')} className={`px-3 py-1.5 text-xs font-medium rounded-nlg-input border ${dashboardView === 'card' ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border'}`}>🗂 Card</button>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <span className="text-[11px] text-nlg-text-subdued mr-1">Filter:</span>
        <button onClick={() => setStatusFilter('all')} className={`px-2.5 py-1 text-[11px] font-medium rounded-full border ${statusFilter === 'all' ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border hover:bg-nlg-sidebar'}`}>Semua ({dashKPIs.length})</button>
        <button onClick={() => setStatusFilter('red')} className={`px-2.5 py-1 text-[11px] font-medium rounded-full border ${statusFilter === 'red' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}>
          🔴 Merah ({dashKPIs.filter(k => { const st = kpiMonthStats(k, v); return st && st.score <= 1; }).length})
        </button>
        <button onClick={() => setStatusFilter('draft')} className={`px-2.5 py-1 text-[11px] font-medium rounded-full border ${statusFilter === 'draft' ? 'bg-gray-600 text-white border-gray-600' : 'bg-white text-nlg-text-muted border-nlg-border hover:bg-nlg-sidebar'}`}>
          📝 Draft ({dashKPIs.filter(k => k.isDraftOnly || k.planStatus === 'Draft').length})
        </button>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] text-nlg-text-subdued ml-auto">Export:</span>
        <button onClick={() => { exportDashboardExcel(userMeta, dashKPIs.filter(k => !k.isDraftOnly), viewYear); toast('Dashboard diexport ke Excel (.xlsx).'); }} className="px-3 py-1.5 text-[11px] font-medium rounded-nlg-input border border-nlg-border text-nlg-text-muted bg-white hover:bg-nlg-sidebar flex items-center gap-1.5">📥 Excel (.xlsx)</button>
        <button onClick={() => window.print()} className="px-3 py-1.5 text-[11px] font-medium rounded-nlg-input border border-nlg-border text-nlg-text-muted bg-white hover:bg-nlg-sidebar flex items-center gap-1.5">🖨️ Print / PDF</button>
      </div>
    </>
  );

  // ── Card View — dikelompokkan per Perspective band spt Strategy Map (v6.29), supaya bahasa visual
  // konsisten antar-halaman: strip warna kiri per Perspektif + skor rata-rata tertimbang band tsb,
  // kartu KPI dgn border/header warna mengikuti grade (bukan lagi flat grid tanpa pengelompokan). ──
  const renderKPICard = (k) => {
    const isDraft = k.isDraftOnly || k.planStatus === 'Draft';
    // Status Draft TIDAK berarti "tanpa data" — KPI yg direset ke Draft via QA Mode/Mode Simulasi
    // (Input Realisasi) tetap membawa Factor 1/2 asli, dan Total Score (deptScoreAt/deptScoreYTD)
    // sudah menghitung SEMUA status sejak keputusan "mirror penuh" (Team.jsx, 2026-07-21). Sebelumnya
    // baris/card di sini malah membutakan angka begitu status Draft, walau datanya ada — bikin Total
    // Score & tampilan per-KPI berselisih (root cause laporan user 2026-07-23, kasus Abu Tholib QA
    // Mode). Satu2nya syarat tampil/sembunyi sekarang murni "datanya ada?" via kpiMonthStats/
    // kpiYTDStats (null-safe) — sama seperti Team.jsx yg sudah benar di kolom MTD & Card View-nya.
    const stMTD = kpiMonthStats(k, v);
    const stYTD = kpiYTDStats(k, v);
    const achMTD = stMTD ? stMTD.ach : 0;
    const achYTD = stYTD ? stYTD.ach : 0;
    const gradeMTD = stMTD ? gradeFromScore(stMTD.score) : null;
    const gradeYTD = stYTD ? gradeFromScore(stYTD.score) : null;

    return (
      <div
        key={k.id}
        className={`rounded-nlg-input border-2 bg-white overflow-hidden h-full flex flex-col cursor-pointer hover:shadow-md transition-shadow ${isDraft ? 'opacity-70' : ''}`}
        style={{ borderColor: gradeMTD ? borderByGrade(gradeMTD.label) : '#E5E7EB' }}
        onClick={() => setDetailKpi(k)}
        title={FEATURES.PICA_ENABLED ? 'Klik untuk lihat detail riwayat & PICA' : 'Klik untuk lihat detail riwayat'}
      >
        <div className="flex items-start justify-between gap-2 px-3 py-2" style={{ background: gradeMTD ? bgByGrade(gradeMTD.label) : '#F9FAFB' }}>
          <span className="text-[12px] font-bold leading-snug text-nlg-text line-clamp-2 min-h-[2.25em]">{k.name}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${badgeColorByPersp(k.persp)}`}>{k.type}</span>
        </div>
        <div className="flex items-center justify-between px-3 py-1.5 text-[10px] text-nlg-text-subdued border-b border-nlg-border">
          <span>{k.period} · {k.uom}</span>
          <span className="font-medium text-nlg-primary">Target: {k.target}{k.uom === '%' ? '%' : ''}</span>
        </div>
        <div className="flex divide-x divide-nlg-border mt-auto">
          <div className="flex-1 px-2 py-1.5 text-center">
            <div className="text-[9px] text-nlg-text-subdued mb-1">MTD</div>
            {gradeMTD ? (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${gradeMTD.cls}`}>{(achMTD * 100).toFixed(0)}%</span>
            ) : (
              <span className="text-[9px] text-nlg-text-subdued italic">Belum ada data</span>
            )}
          </div>
          <div className="flex-1 px-2 py-1.5 text-center">
            <div className="text-[9px] text-nlg-text-subdued mb-1">YTD</div>
            {gradeYTD ? (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${gradeYTD.cls}`}>{(achYTD * 100).toFixed(0)}%</span>
            ) : (
              <span className="text-[9px] text-nlg-text-subdued italic">Belum ada data</span>
            )}
          </div>
        </div>
        {isDraft && <div className="text-[10px] text-nlg-text-subdued text-center py-1 border-t border-nlg-border bg-gray-50">Draft — belum disubmit</div>}
      </div>
    );
  };

  const renderCardView = () => (
    <div>
      {groups.map((g, gi) => {
        const meta = PERSP_META[g.persp];
        return (
          <div key={g.persp}>
            <div className="flex items-stretch gap-3">
              <div className="w-20 shrink-0 rounded-nlg-input flex flex-col items-center justify-center py-3 text-white text-center gap-0.5" style={{ background: meta.color }}>
                <div className="text-[11px] font-bold leading-tight">{g.persp}</div>
                <div className="text-[9px] opacity-75">Perspective</div>
              </div>
              <div
                className="flex-1 grid gap-3 p-3 rounded-nlg-card border items-stretch"
                style={{ borderColor: meta.border, background: meta.light, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
              >
                {g.kpis.map(k => renderKPICard(k))}
              </div>
            </div>
            {gi < groups.length - 1 && (
              <div className="flex justify-center text-nlg-text-subdued text-lg leading-none my-1" title="Cause-effect: perspektif di bawah mendorong perspektif di atas">▲</div>
            )}
          </div>
        );
      })}
      <div className="flex items-center gap-5 mt-3 text-[11px] text-nlg-text-subdued flex-wrap">
        <span>🟢 Score ≥2.5 — Baik</span>
        <span>🟡 Score 1.5–2.4 — Cukup</span>
        <span>🔴 Score ≤1.5 — Kurang</span>
        <span>⬜ Belum ada data Actual</span>
      </div>
    </div>
  );

  // ── BSC Table View ──
  const renderTableView = () => {
    // Bulan aktif SELAIN yang sedang dilihat (v) diringkas jadi satu kolom Trend (sparkline), bukan
    // masing-masing 3-kolom penuh — mencegah tabel melebar N-bulan x 3-kolom spt hasil export Excel.
    const trendMonths = activeMonths.filter(mi => mi !== v);
    const trendLabel = trendMonths.length > 1
      ? `${MONTH_LABELS[trendMonths[0]]}–${MONTH_LABELS[trendMonths[trendMonths.length - 1]]}`
      : trendMonths.length === 1 ? MONTH_LABELS[trendMonths[0]] : '';

    return (
      <div className="overflow-x-auto rounded-nlg-card border border-nlg-border" ref={tableRef}>
        <table className="border-collapse min-w-full bg-white text-[11px] tbl-zebra tbl-clean">
          <thead className="sticky top-0 z-10">
            <tr className="th1 text-white text-[10px]">
              <th rowSpan={2} className="sticky left-0 z-20 th1 px-2 py-2 text-left min-w-[90px] border tbdr align-middle">Perspective</th>
              {showSO && <th rowSpan={2} className="sticky left-[90px] z-20 th1 px-2 py-2 text-left min-w-[110px] border tbdr align-middle">Strategic Objective</th>}
              <th rowSpan={2} className={`${showSO ? 'sticky left-[200px]' : 'sticky left-[90px]'} sticky-shadow z-20 th1 px-2 py-2 text-left min-w-[140px] border tbdr align-middle`}>KPI</th>
              <th rowSpan={2} className="th1 px-2 py-2 text-center min-w-[42px] border tbdr align-middle">Type</th>
              <th rowSpan={2} className="th1 px-2 py-2 text-center min-w-[36px] border tbdr align-middle">UoM</th>
              <th rowSpan={2} className="th1 px-2 py-2 text-center min-w-[68px] border tbdr align-middle">Periode</th>
              <th rowSpan={2} className="th1 px-2 py-2 text-center min-w-[46px] border tbdr align-middle">Weight</th>
              <th rowSpan={2} className="th1 px-2 py-2 text-center min-w-[52px] border tbdr align-middle">Target</th>
              {trendMonths.length > 0 && (
                <th rowSpan={2} className="tpast px-2 py-2 text-center border tbdr min-w-[70px] align-middle" title="Tren Score bulan lain (selain bulan yang ditampilkan)">
                  Trend {trendLabel}
                </th>
              )}
              <th colSpan={3} className="bg-nlg-primary px-2 py-2 text-center border tbdr">
                {MONTH_LABELS[v]}-{String(viewYear).slice(2)}{v === m ? ' 🔒' : ''}
              </th>
              <th colSpan={2} className="tytd px-2 py-2 text-center border tbdr">YTD (Jan–{MONTH_LABELS[v]}, {viewYear})</th>
            </tr>
            <tr className="th2 text-white text-[10px]">
              <th className="px-1 py-1 text-center border tbdr min-w-[46px]">Actual</th>
              <th className="px-1 py-1 text-center border tbdr min-w-[52px]">Ach%</th>
              <th className="px-1 py-1 text-center border tbdr min-w-[36px]">Score</th>
              <th className="px-1 py-1 text-center border tbdr min-w-[52px] tytd">Ach% YTD</th>
              <th className="px-1 py-1 text-center border tbdr min-w-[36px] tytd">Score YTD</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(g => {
              const perspWeight = (g.kpis.reduce((s, k) => s + k.weight, 0) * 100).toFixed(0);
              return g.kpis.map((k, ki) => {
                const isDraft = k.isDraftOnly || k.planStatus === 'Draft';
                // Null-safe (root cause bug 2026-07-22): `kpiYTDStats` return null kalau KPI belum
                // pernah punya Actual sama sekali — dipakai bareng guard `stYTD` di sel tabel bawah,
                // bukan `calcYTD` mentah yg diam2 menghasilkan 0%/200% utk KPI kosong.
                // TIDAK lagi digating `!isDraft` (root cause bug 2026-07-23) — lihat catatan di
                // `renderKPICard` atas: status Draft (mis. dari QA Mode) tidak berarti tanpa data.
                const stYTD = kpiYTDStats(k, v);
                const kpiNameLeft = showSO ? 'sticky left-[200px]' : 'sticky left-[90px]';

                return (
                  <tr key={k.id} className={`hover:bg-nlg-sidebar/40 ${isDraft ? 'opacity-75 bg-gray-50/50' : ''}`}>
                    {ki === 0 && (
                      <td
                        className="sticky left-0 z-10 px-2 py-1.5 font-bold text-[11px] border border-nlg-border align-top"
                        style={{ background: PERSP_META[g.persp].light, borderLeft: `4px solid ${PERSP_META[g.persp].color}`, color: PERSP_META[g.persp].textColor }}
                        rowSpan={g.kpis.length}
                      >
                        <div>{g.persp}</div>
                        <div className="text-[10px] font-normal opacity-70">{perspWeight}%</div>
                      </td>
                    )}
                    {showSO && (
                      <td className="sticky left-[90px] bg-white px-2 py-1.5 text-[10px] border border-nlg-border text-nlg-text-subdued">{k.so || '—'}</td>
                    )}
                    <td
                      className={`${kpiNameLeft} sticky-shadow bg-white px-2 py-1.5 text-[11px] font-medium border border-nlg-border cursor-pointer hover:text-nlg-primary hover:underline`}
                      onClick={() => setDetailKpi(k)}
                      title={FEATURES.PICA_ENABLED ? 'Klik untuk lihat detail riwayat & PICA' : 'Klik untuk lihat detail riwayat'}
                    >
                      {k.name}
                      {isDraft && <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-gray-100 text-nlg-text-subdued">{k.planStatus}</span>}
                    </td>
                    <td className="px-1 py-1.5 text-center text-[10px] border border-nlg-border text-nlg-text-muted">{k.type}</td>
                    <td className="px-1 py-1.5 text-center text-[10px] border border-nlg-border text-nlg-text-muted">{k.uom}</td>
                    <td className="px-1 py-1.5 text-center text-[10px] border border-nlg-border text-nlg-text-muted">{k.period}</td>
                    <td className="px-1 py-1.5 text-center text-[10px] border border-nlg-border font-medium">{(k.weight * 100).toFixed(0)}%</td>
                    <td className="px-1 py-1.5 text-center text-[10px] border border-nlg-border font-medium text-nlg-primary">{k.target}{k.uom === '%' ? '%' : ''}</td>
                    {trendMonths.length > 0 && (
                      <td className="px-1 py-1 text-center border border-nlg-border align-middle">
                        <TrendSparkline
                          points={trendMonths.map(mi => {
                            const st = kpiMonthStats(k, mi);
                            return {
                              mi,
                              value: st ? st.score : null,
                              tooltip: st ? `${MONTH_LABELS[mi]} ${viewYear} — Actual ${st.mtd.toFixed(1)}${k.uom === '%' ? '%' : ''} · Ach ${(st.ach * 100).toFixed(1)}% · Score ${st.score}` : `${MONTH_LABELS[mi]} ${viewYear} — belum ada data`,
                            };
                          })}
                          onSelectMonth={setViewMonthIdx}
                        />
                      </td>
                    )}
                    {(() => {
                      const st = kpiMonthStats(k, v);
                      if (!st) return (
                        <>
                          <td className="px-1 py-1 text-center border border-nlg-border text-nlg-text-subdued text-[10px]">—</td>
                          <td className="px-1 py-1 text-center border border-nlg-border text-nlg-text-subdued text-[10px]">—</td>
                          <td className="px-1 py-1 text-center border border-nlg-border text-nlg-text-subdued">—</td>
                        </>
                      );
                      const achPct = Math.min(100, Math.max(0, st.ach * 100));
                      const barColor = st.score <= 1 ? '#EF4444' : st.score <= 2 ? '#FACC15' : '#22C55E';
                      return (
                        <>
                          <td className="px-1 py-1 text-center border border-nlg-border text-[10px]">{st.mtd.toFixed(1)}{k.uom === '%' ? '%' : ''}</td>
                          <td className="px-1 py-1.5 text-center border border-nlg-border">
                            <div className={`text-[10px] ${scoreTextColor(st.score)}`}>{(st.ach * 100).toFixed(1)}%</div>
                            <div className="h-[3px] mt-1 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${achPct}%`, background: barColor }} />
                            </div>
                          </td>
                          <td className="px-1 py-1 text-center border border-nlg-border">
                            <span className={`inline-flex items-center justify-center w-6 h-5 rounded-full font-bold text-[11px] ${scoreBg(st.score)}`}>{st.score}</span>
                          </td>
                        </>
                      );
                    })()}
                    {!stYTD ? (
                      <>
                        <td className="px-1 py-1.5 text-center border border-nlg-border text-nlg-text-subdued text-[10px]">—</td>
                        <td className="px-1 py-1.5 text-center border border-nlg-border text-nlg-text-subdued text-[10px]">—</td>
                      </>
                    ) : (
                      <>
                        <td className="px-1 py-1.5 text-center border border-nlg-border">
                          <div className={`text-[10px] ${scoreTextColor(stYTD.score)}`}>{(stYTD.ach * 100).toFixed(1)}%</div>
                          <div className="h-[3px] mt-1 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, stYTD.ach * 100))}%`, background: stYTD.score <= 1 ? '#EF4444' : stYTD.score <= 2 ? '#FACC15' : '#22C55E' }} />
                          </div>
                        </td>
                        <td className="px-1 py-1.5 text-center border border-nlg-border">
                          <span className={`inline-flex items-center justify-center w-6 h-5 rounded-full font-bold text-[11px] ${scoreBg(stYTD.score)}`}>{stYTD.score}</span>
                        </td>
                      </>
                    )}
                  </tr>
                );
              });
            })}
            {/* Total Row */}
            <tr className="th1 text-white">
              <td className={`sticky left-0 z-10 ttotal px-2 py-2 font-bold text-[11px] border tbdr`} colSpan={showSO ? 3 : 2}>Total Score</td>
              <td className="border tbdr"></td><td className="border tbdr"></td><td className="border tbdr"></td>
              <td className="text-center text-[10px] font-medium border tbdr">{totalWeight.toFixed(0)}%</td>
              <td className="border tbdr"></td>
              {trendMonths.length > 0 && (
                <td className="border tbdr text-center align-middle">
                  <TrendSparkline
                    points={trendMonths.map(mi => ({
                      mi,
                      value: monthlyTotals[mi],
                      tooltip: monthlyTotals[mi] !== null ? `${MONTH_LABELS[mi]} ${viewYear} — Total Score ${monthlyTotals[mi].toFixed(2)}` : `${MONTH_LABELS[mi]} ${viewYear} — belum ada data`,
                    }))}
                    onSelectMonth={setViewMonthIdx}
                  />
                </td>
              )}
              {/* `ts`/`ytdTs` = monthlyTotals[v]/monthlyYTDTotals[v] — dipakai ulang, BUKAN dihitung
                  lagi terpisah di sini (sumber ganda yg tadinya sama2 lupa exclude bobot KPI kosong,
                  ditemukan dari laporan user 2026-07-20 — sekarang satu sumber lewat deptScoreAt). */}
              {(() => {
                const ts = monthlyTotals[v];
                const tg = gradeFromTotal(ts);
                const cl = ts === null ? 'bg-gray-300' : ts <= 1.5 ? 'bg-red-500' : ts <= 2.5 ? 'bg-yellow-400 text-black' : 'bg-green-500';
                return (
                  <>
                    <td colSpan={2} className="px-2 py-1.5 text-right text-[10px] font-semibold border tbdr">Total Score {MONTH_LABELS[v]}:</td>
                    <td className={`px-2 py-2 text-center font-bold text-[12px] border tbdr ${cl}`}>
                      {ts !== null ? ts.toFixed(2) : '—'}<br /><span className="text-[10px]">{tg.label}</span>
                    </td>
                  </>
                );
              })()}
              {(() => {
                const ytdTs = monthlyYTDTotals[v];
                const ytdGr = gradeFromTotal(ytdTs);
                const ytdCl = ytdTs === null ? 'bg-gray-300' : ytdTs <= 1.5 ? 'bg-red-500' : ytdTs <= 2.5 ? 'bg-yellow-400 text-black' : 'bg-green-500';
                return (
                  <>
                    <td className="px-2 py-1.5 text-right text-[10px] font-semibold border tbdr">YTD:</td>
                    <td className={`px-2 py-2 text-center font-bold text-[12px] border tbdr ${ytdCl}`}>
                      {ytdTs !== null ? ytdTs.toFixed(2) : '—'}<br /><span className="text-[10px]">{ytdGr.label}</span>
                    </td>
                  </>
                );
              })()}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  // KPI BOD = agregasi Company (keputusan user) — tidak ada KPI personal untuk direncanakan/diisi.
  if (userMeta.level === 'Company' && dashKPIs.length === 0) {
    return (
      <div>
        <div className="mb-5">
          <h1 className="text-xl font-bold text-nlg-text">Dashboard Saya</h1>
        </div>
        {renderSummaryHeader()}
        <div className="border border-blue-200 bg-blue-50 rounded-nlg-card p-5 text-center">
          <div className="text-2xl mb-1">🏢</div>
          <div className="font-bold text-blue-800 mb-1">KPI Anda = Agregasi Company</div>
          <div className="text-[13px] text-blue-700">Sebagai BOD/Direktur Utama, performa Anda diukur dari agregasi otomatis skor seluruh Departemen — bukan KPI personal terpisah. Lihat <b>Executive Dashboard</b> untuk skor performa perusahaan secara live.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-nlg-text">Dashboard Saya</h1>
      </div>
      {renderSummaryHeader()}
      {renderSummaryBar()}
      {renderToggle()}
      {groups.length === 0 ? (
        <div className="border border-nlg-border rounded-nlg-card p-8 text-center text-[12px] text-nlg-text-subdued">
          Tidak ada KPI yang cocok dengan filter ini. <button onClick={() => setStatusFilter('all')} className="text-nlg-primary hover:underline font-medium">Reset filter</button>
        </div>
      ) : (
        dashboardView === 'card' ? renderCardView() : renderTableView()
      )}
      <KPIDetailModal kpi={detailKpi} activeMonths={activeMonths} year={viewYear} viewMonthIdx={v} onClose={() => setDetailKpi(null)} />
    </div>
  );
};
