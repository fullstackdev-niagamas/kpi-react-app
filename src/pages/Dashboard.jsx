import React, { useState, useRef, useEffect } from 'react';
import { MONTH_LABELS, ACTIVE_PLAN_YEAR, CURRENT_MONTH_IDX, AVAILABLE_YEARS, TABLE_THEMES } from '../data/mockData';
import { useKPIContext } from '../context/KPIContext';
import { kpiMonthStats, gradeFromTotal, gradeFromScore, scoreBg, scoreTextColor, calcYTD, computeAch, computeScore, badgeColorByPersp, levelBadge, PERSP_META, borderByGrade, bgByGrade } from '../utils/helpers';
import { exportDashboardExcel } from '../utils/excel';
import { useToast } from '../context/ToastContext';

export const Dashboard = ({ currentUserName }) => {
  const { users, userKPIs } = useKPIContext();
  const [dashboardView, setDashboardView] = useState('table');
  const [viewMonthIdx, setViewMonthIdx] = useState(CURRENT_MONTH_IDX);
  const [viewYear, setViewYear] = useState(ACTIVE_PLAN_YEAR);
  const [tableTheme, setTableTheme] = useState('navy');
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

  // Monthly totals
  const monthlyTotals = MONTH_LABELS.map((_, mi) => {
    const scoreXWs = dashKPIs.map(k => { const st = kpiMonthStats(k, mi); return st ? st.scoreXW : null; });
    const filled = scoreXWs.filter(val => val !== null);
    if (!filled.length) return null;
    return filled.reduce((a, b) => a + b, 0);
  });

  const monthlyYTDTotals = MONTH_LABELS.map((_, mi) => {
    const hasData = dashKPIs.some(k => k.factor1[mi] !== null && k.factor1[mi] !== undefined);
    if (!hasData) return null;
    return dashKPIs.reduce((sum, k) => {
      const scores = [];
      for (let i = 0; i <= mi; i++) { const st = kpiMonthStats(k, i); if (st) scores.push(st.score); }
      const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return sum + avgScore * k.weight;
    }, 0);
  });

  const totalScore = dashKPIs.reduce((sum, k) => { const st = kpiMonthStats(k, v); return sum + (st ? st.scoreXW : 0); }, 0);
  const totalGrade = gradeFromTotal(totalScore);
  // Dibulatkan 2 desimal — hindari noise floating-point (mis. 99.99999999999999) dari penjumlahan
  // fraksi weight, konsisten dgn Planning.jsx (satu-satunya sumber data yg sama, userKPIs).
  const totalWeight = Math.round(dashKPIs.reduce((s, k) => s + k.weight, 0) * 100 * 100) / 100;

  // Perspective groups
  const perspOrder = ['Financial', 'Customer', 'Internal Process', 'Learning & Growth'];
  const groups = perspOrder.map(p => ({ persp: p, kpis: dashKPIs.filter(k => k.persp === p) })).filter(g => g.kpis.length);

  const scoreCl = ts => ts <= 1.5 ? 'bg-red-400 text-white' : ts <= 2.5 ? 'bg-amber-400 text-white' : 'bg-green-500 text-white';

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
    const stMTD = !isDraft ? kpiMonthStats(k, v) : null;
    const mtdVal = stMTD ? stMTD.mtd : 0;
    const ytdVal = isDraft ? 0 : calcYTD(k, v);
    const achMTD = isDraft ? 0 : computeAch(k.type, k.target, mtdVal);
    const achYTD = isDraft ? 0 : computeAch(k.type, k.target, ytdVal);
    const scoreMTD = isDraft ? 0 : computeScore(achMTD, k.type);
    const scoreYTD = isDraft ? 0 : computeScore(achYTD, k.type);
    const gradeMTD = stMTD ? gradeFromScore(scoreMTD) : null;
    const gradeYTD = stMTD ? gradeFromScore(scoreYTD) : null;

    return (
      <div
        key={k.id}
        className={`rounded-nlg-input border-2 bg-white overflow-hidden w-64 shrink-0 ${isDraft ? 'opacity-70' : ''}`}
        style={{ borderColor: gradeMTD ? borderByGrade(gradeMTD.label) : '#E5E7EB' }}
      >
        <div className="flex items-start justify-between gap-2 px-3 py-2" style={{ background: gradeMTD ? bgByGrade(gradeMTD.label) : '#F9FAFB' }}>
          <span className="text-[12px] font-bold leading-snug text-nlg-text">{k.name}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${badgeColorByPersp(k.persp)}`}>{k.type}</span>
        </div>
        <div className="flex items-center justify-between px-3 py-1.5 text-[10px] text-nlg-text-subdued border-b border-nlg-border">
          <span>{k.period} · {k.uom}</span>
          <span className="font-medium text-nlg-primary">Target: {k.target}{k.uom === '%' ? '%' : ''}</span>
        </div>
        <div className="flex divide-x divide-nlg-border">
          <div className="flex-1 px-2 py-1.5 text-center">
            <div className="text-[9px] text-nlg-text-subdued mb-1">MTD</div>
            {isDraft ? (
              <span className="text-[10px] text-nlg-text-subdued">—</span>
            ) : gradeMTD ? (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${gradeMTD.cls}`}>{(achMTD * 100).toFixed(0)}%</span>
            ) : (
              <span className="text-[9px] text-nlg-text-subdued italic">Belum ada data</span>
            )}
          </div>
          <div className="flex-1 px-2 py-1.5 text-center">
            <div className="text-[9px] text-nlg-text-subdued mb-1">YTD</div>
            {isDraft ? (
              <span className="text-[10px] text-nlg-text-subdued">—</span>
            ) : gradeYTD ? (
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
              <div className="flex-1 flex flex-wrap gap-3 items-start p-3 rounded-nlg-card border" style={{ borderColor: meta.border, background: meta.light }}>
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
    const activeMonths = MONTH_LABELS.map((_, mi) => mi).filter(mi => mi <= m);

    return (
      <div className="overflow-x-auto rounded-nlg-card border border-nlg-border" ref={tableRef}>
        <table className="border-collapse min-w-full bg-white text-[11px]">
          <thead className="sticky top-0 z-10">
            <tr className="th1 text-white text-[10px]">
              <th rowSpan={2} className="sticky left-0 z-20 th1 px-2 py-2 text-left min-w-[90px] border tbdr align-middle">Perspective</th>
              {showSO && <th rowSpan={2} className="sticky left-[90px] z-20 th1 px-2 py-2 text-left min-w-[110px] border tbdr align-middle">Strategic Objective</th>}
              <th rowSpan={2} className={`${showSO ? 'sticky left-[200px]' : 'sticky left-[90px]'} z-20 th1 px-2 py-2 text-left min-w-[140px] border tbdr align-middle`}>KPI</th>
              <th rowSpan={2} className="th1 px-2 py-2 text-center min-w-[42px] border tbdr align-middle">Type</th>
              <th rowSpan={2} className="th1 px-2 py-2 text-center min-w-[36px] border tbdr align-middle">UoM</th>
              <th rowSpan={2} className="th1 px-2 py-2 text-center min-w-[68px] border tbdr align-middle">Periode</th>
              <th rowSpan={2} className="th1 px-2 py-2 text-center min-w-[46px] border tbdr align-middle">Weight</th>
              <th rowSpan={2} className="th1 px-2 py-2 text-center min-w-[52px] border tbdr align-middle">Target</th>
              {activeMonths.map(mi => (
                <th key={mi} colSpan={3} className={`${mi === v ? 'bg-nlg-primary' : 'tpast'} px-2 py-2 text-center border tbdr`}>
                  {MONTH_LABELS[mi]}-{String(viewYear).slice(2)}{mi === m ? ' 🔒' : ''}
                </th>
              ))}
              <th colSpan={2} className="tytd px-2 py-2 text-center border tbdr">YTD (Jan–{MONTH_LABELS[v]}, {viewYear})</th>
            </tr>
            <tr className="th2 text-white text-[10px]">
              {activeMonths.map(mi => (
                <React.Fragment key={mi}>
                  <th className="px-1 py-1 text-center border tbdr min-w-[46px]">Actual</th>
                  <th className="px-1 py-1 text-center border tbdr min-w-[52px]">Ach%</th>
                  <th className="px-1 py-1 text-center border tbdr min-w-[36px]">Score</th>
                </React.Fragment>
              ))}
              <th className="px-1 py-1 text-center border tbdr min-w-[52px] tytd">Ach% YTD</th>
              <th className="px-1 py-1 text-center border tbdr min-w-[36px] tytd">Score YTD</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(g => {
              const perspWeight = (g.kpis.reduce((s, k) => s + k.weight, 0) * 100).toFixed(0);
              return g.kpis.map((k, ki) => {
                const isDraft = k.isDraftOnly || k.planStatus === 'Draft';
                const ytdAch = !isDraft ? calcYTD(k, v) : 0;
                const ytdAchv = !isDraft ? (k.type === 'Min' ? (2 * k.target - ytdAch) / k.target : ytdAch / k.target) : 0;
                const ytdScore = !isDraft ? computeScore(ytdAchv, k.type) : 0;
                const kpiNameLeft = showSO ? 'sticky left-[200px]' : 'sticky left-[90px]';

                return (
                  <tr key={k.id} className={`hover:bg-nlg-sidebar/40 ${isDraft ? 'opacity-75 bg-gray-50/50' : ''}`}>
                    {ki === 0 && (
                      <td className="sticky left-0 z-10 bg-nlg-rail px-2 py-1.5 font-bold text-[11px] border border-nlg-border text-nlg-text align-top" rowSpan={g.kpis.length}>
                        <div>{g.persp}</div>
                        <div className="text-[10px] text-nlg-text-muted font-normal">{perspWeight}%</div>
                      </td>
                    )}
                    {showSO && (
                      <td className="sticky left-[90px] bg-white px-2 py-1.5 text-[10px] border border-nlg-border text-nlg-text-subdued">{k.so || '—'}</td>
                    )}
                    <td className={`${kpiNameLeft} bg-white px-2 py-1.5 text-[11px] font-medium border border-nlg-border`}>
                      {k.name}
                      {isDraft && <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-gray-100 text-nlg-text-subdued">{k.planStatus}</span>}
                    </td>
                    <td className="px-1 py-1.5 text-center text-[10px] border border-nlg-border text-nlg-text-muted">{k.type}</td>
                    <td className="px-1 py-1.5 text-center text-[10px] border border-nlg-border text-nlg-text-muted">{k.uom}</td>
                    <td className="px-1 py-1.5 text-center text-[10px] border border-nlg-border text-nlg-text-muted">{k.period}</td>
                    <td className="px-1 py-1.5 text-center text-[10px] border border-nlg-border font-medium">{(k.weight * 100).toFixed(0)}%</td>
                    <td className="px-1 py-1.5 text-center text-[10px] border border-nlg-border font-medium text-nlg-primary">{k.target}{k.uom === '%' ? '%' : ''}</td>
                    {activeMonths.map(mi => {
                      const st = kpiMonthStats(k, mi);
                      if (!st || isDraft) return (
                        <React.Fragment key={mi}>
                          <td className="px-1 py-1 text-center border border-nlg-border text-nlg-text-subdued text-[10px]">—</td>
                          <td className="px-1 py-1 text-center border border-nlg-border text-nlg-text-subdued text-[10px]">—</td>
                          <td className="px-1 py-1 text-center border border-nlg-border text-nlg-text-subdued">—</td>
                        </React.Fragment>
                      );
                      return (
                        <React.Fragment key={mi}>
                          <td className="px-1 py-1 text-center border border-nlg-border text-[10px]">{st.mtd.toFixed(1)}{k.uom === '%' ? '%' : ''}</td>
                          <td className={`px-1 py-1 text-center border border-nlg-border text-[10px] ${scoreTextColor(st.score)}`}>{(st.ach * 100).toFixed(1)}%</td>
                          <td className={`px-1 py-1 text-center border border-nlg-border font-bold text-[11px] ${scoreBg(st.score)}`}>{st.score}</td>
                        </React.Fragment>
                      );
                    })}
                    {isDraft ? (
                      <>
                        <td className="px-1 py-1.5 text-center border border-nlg-border text-nlg-text-subdued text-[10px]">—</td>
                        <td className="px-1 py-1.5 text-center border border-nlg-border text-nlg-text-subdued text-[10px]">—</td>
                      </>
                    ) : (
                      <>
                        <td className={`px-1 py-1.5 text-center border border-nlg-border text-[10px] ${scoreTextColor(ytdScore)}`}>{(ytdAchv * 100).toFixed(1)}%</td>
                        <td className={`px-1 py-1.5 text-center border border-nlg-border font-bold text-[11px] ${scoreBg(ytdScore)}`}>{ytdScore}</td>
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
              {MONTH_LABELS.map((_, mi) => mi).filter(mi => mi <= m).map(mi => {
                const ts = dashKPIs.reduce((s, k) => { const st = kpiMonthStats(k, mi); return s + (st ? st.scoreXW : 0); }, 0);
                const tg = gradeFromTotal(ts);
                const cl = ts <= 1.5 ? 'bg-red-500' : ts <= 2.5 ? 'bg-amber-400' : 'bg-green-500';
                const ring = mi === v ? 'ring-2 ring-inset ring-white/40' : '';
                return (
                  <React.Fragment key={mi}>
                    <td colSpan={2} className="px-2 py-1.5 text-right text-[10px] font-semibold border tbdr">Total Score:</td>
                    <td className={`px-2 py-2 text-center font-bold text-[12px] border tbdr ${cl} ${ring}`}>
                      {ts.toFixed(2)}<br /><span className="text-[10px]">{tg.label}</span>
                    </td>
                  </React.Fragment>
                );
              })}
              {(() => {
                const ytdTs = dashKPIs.reduce((sum, k) => {
                  const scores = [];
                  for (let i = 0; i <= v; i++) { const st = kpiMonthStats(k, i); if (st) scores.push(st.score); }
                  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                  return sum + avg * k.weight;
                }, 0);
                const ytdGr = gradeFromTotal(ytdTs);
                const ytdCl = ytdTs <= 1.5 ? 'bg-red-500' : ytdTs <= 2.5 ? 'bg-amber-400' : 'bg-green-500';
                return (
                  <>
                    <td className="px-2 py-1.5 text-right text-[10px] font-semibold border tbdr">YTD:</td>
                    <td className={`px-2 py-2 text-center font-bold text-[12px] border tbdr ${ytdCl}`}>
                      {ytdTs.toFixed(2)}<br /><span className="text-[10px]">{ytdGr.label}</span>
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
      {dashboardView === 'card' ? renderCardView() : renderTableView()}
    </div>
  );
};
