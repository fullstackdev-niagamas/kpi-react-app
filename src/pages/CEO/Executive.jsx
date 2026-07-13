import React, { useState, useEffect } from 'react';
import { ACTIVE_PLAN_YEAR, AVAILABLE_YEARS, MONTH_LABELS, CURRENT_MONTH_IDX, TREND_LABELS, TREND_SCORE, TABLE_THEMES } from '../../data/mockData';
import { useKPIContext } from '../../context/KPIContext';
import { kpiMonthStats, gradeFromTotal, gradeFromScore, scoreBg, scoreTextColor, calcYTD, computeAch, computeScore, badgeColorByPersp, deptScoreAt, buildDeptAggregates } from '../../utils/helpers';

const PERSP_ORDER = ['Financial', 'Customer', 'Internal Process', 'Learning & Growth'];

// KPI merah (score<=1) di CURRENT_MONTH_IDX
function redKpis(kpis) {
  return kpis.filter(k => { const st = kpiMonthStats(k, CURRENT_MONTH_IDX); return st && st.score <= 1; });
}

export const Executive = () => {
  const { users, userKPIs, batches } = useKPIContext();
  const [viewYear, setViewYear] = useState(ACTIVE_PLAN_YEAR);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptMonthIdx, setDeptMonthIdx] = useState(CURRENT_MONTH_IDX);

  // Apply navy table theme for the BSC drill table
  useEffect(() => {
    const t = TABLE_THEMES.navy;
    const root = document.documentElement;
    Object.entries(t.vars).forEach(([k, val]) => root.style.setProperty(k, val));
  }, []);

  const m = CURRENT_MONTH_IDX;

  // Company-wide aggregates — Dept & score dihitung live dari users + userKPIs + batches
  // sungguhan (Sec. 8), sama seperti Monitoring Dashboard, supaya angka selalu konsisten.
  const allDepts = buildDeptAggregates(users, userKPIs, batches, m);
  const companyScore = allDepts.length
    ? allDepts.reduce((s, d) => s + d.score, 0) / allDepts.length
    : 0;
  const companyGrade = gradeFromTotal(companyScore);
  const totalRed = allDepts.reduce((s, d) => s + redKpis(d.kpis).length, 0);
  const totalPending = allDepts.reduce((s, d) => s + d.pending, 0);

  const yearBar = (onChange) => (
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      <span className="text-[11px] font-medium text-nlg-text-muted shrink-0">Tahun KPI:</span>
      {AVAILABLE_YEARS.map(yr => (
        <button key={yr} onClick={() => { setViewYear(yr); if (onChange) onChange(); }}
          className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors ${viewYear === yr ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border'}`}>
          {yr}{yr === ACTIVE_PLAN_YEAR ? ' 🔓' : ''}
        </button>
      ))}
    </div>
  );

  // ── DEPT DRILL-DOWN (BSC table) ──
  if (selectedDept) {
    const dept = allDepts.find(d => d.dept === selectedDept);
    const kpis = dept?.kpis || [];
    const groups = PERSP_ORDER.map(p => ({ persp: p, kpis: kpis.filter(k => k.persp === p) })).filter(g => g.kpis.length);
    const activeMonths = MONTH_LABELS.map((_, mi) => mi).filter(mi => mi <= m);
    const reds = redKpis(kpis);
    const scoreNow = deptScoreAt(kpis, deptMonthIdx);
    const grade = gradeFromTotal(scoreNow);

    const monthlyTotals = MONTH_LABELS.map((_, mi) => (mi <= m ? deptScoreAt(kpis, mi) : null));
    const scoreCl = ts => ts <= 1.5 ? 'bg-red-400 text-white' : ts <= 2.5 ? 'bg-amber-400 text-white' : 'bg-green-500 text-white';

    return (
      <div className="mb-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold text-nlg-text mb-1">Executive View — {selectedDept}</h1>
            <p className="text-sm text-nlg-text-muted">Balanced Scorecard departemen · {viewYear}</p>
          </div>
          <button onClick={() => setSelectedDept(null)} className="text-sm text-nlg-primary hover:underline">← Kembali ke Summary</button>
        </div>

        {/* Dept info header */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
          <div className="border border-nlg-border rounded-nlg-card bg-white p-3"><div className="text-[10px] text-nlg-text-subdued uppercase">Total KPI</div><div className="text-lg font-bold">{kpis.length}</div></div>
          <div className="border border-nlg-border rounded-nlg-card bg-white p-3"><div className="text-[10px] text-nlg-text-subdued uppercase">Periode</div><div className="text-lg font-bold">{MONTH_LABELS[deptMonthIdx]}</div></div>
          <div className="border border-nlg-border rounded-nlg-card bg-white p-3"><div className="text-[10px] text-nlg-text-subdued uppercase">Submitted</div><div className="text-lg font-bold">{dept?.submitted ?? 0}</div></div>
          <div className="border border-nlg-border rounded-nlg-card bg-white p-3"><div className="text-[10px] text-nlg-text-subdued uppercase">KPI Merah</div><div className="text-lg font-bold text-red-600">{reds.length}</div></div>
          <div className="border border-nlg-border rounded-nlg-card bg-white p-3"><div className="text-[10px] text-nlg-text-subdued uppercase">Pending</div><div className="text-lg font-bold text-amber-600">{dept?.pending ?? 0}</div></div>
          <div className="border border-nlg-border rounded-nlg-card bg-[#172B4D] text-white p-3"><div className="text-[10px] text-white/70 uppercase">Score MTD</div><div className="text-lg font-bold">{scoreNow.toFixed(2)} <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white/20">{grade.label}</span></div></div>
        </div>

        {/* Month bar */}
        <div className="overflow-x-auto mb-4">
          <table className="text-xs border-collapse min-w-full">
            <tbody>
              <tr>
                <td className="px-3 py-1.5 font-semibold bg-nlg-rail border border-nlg-border min-w-[110px]">Total Score MTD</td>
                {MONTH_LABELS.map((label, mi) => {
                  const ts = monthlyTotals[mi];
                  if (ts === null) return <td key={mi} className="px-2 py-1 text-center border border-nlg-border text-nlg-text-subdued opacity-50">{label}</td>;
                  return (
                    <td key={mi} onClick={() => setDeptMonthIdx(mi)}
                      className={`px-2 py-1 text-center border border-nlg-border cursor-pointer font-bold ${scoreCl(ts)} ${mi === deptMonthIdx ? 'ring-2 ring-inset ring-white/60' : ''}`}>
                      {label}<br />{ts.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* BSC Table */}
        <div className="overflow-x-auto rounded-nlg-card border border-nlg-border">
          <table className="border-collapse min-w-full bg-white text-[11px]">
            <thead>
              <tr className="th1 text-white text-[10px]">
                <th rowSpan={2} className="th1 px-2 py-2 text-left border tbdr align-middle min-w-[90px]">Perspektif</th>
                <th rowSpan={2} className="th1 px-2 py-2 text-left border tbdr align-middle min-w-[140px]">KPI</th>
                <th rowSpan={2} className="th1 px-2 py-2 text-center border tbdr align-middle">Type</th>
                <th rowSpan={2} className="th1 px-2 py-2 text-center border tbdr align-middle">UoM</th>
                <th rowSpan={2} className="th1 px-2 py-2 text-center border tbdr align-middle">Bobot</th>
                <th rowSpan={2} className="th1 px-2 py-2 text-center border tbdr align-middle">Target</th>
                {activeMonths.map(mi => (
                  <th key={mi} colSpan={3} className={`${mi === deptMonthIdx ? 'bg-nlg-primary' : 'tpast'} px-2 py-2 text-center border tbdr cursor-pointer`} onClick={() => setDeptMonthIdx(mi)}>{MONTH_LABELS[mi]}</th>
                ))}
                <th colSpan={2} className="tytd px-2 py-2 text-center border tbdr">YTD</th>
              </tr>
              <tr className="th2 text-white text-[10px]">
                {activeMonths.map(mi => (
                  <React.Fragment key={mi}>
                    <th className="px-1 py-1 text-center border tbdr">Actual</th>
                    <th className="px-1 py-1 text-center border tbdr">Ach%</th>
                    <th className="px-1 py-1 text-center border tbdr">Skor</th>
                  </React.Fragment>
                ))}
                <th className="px-1 py-1 text-center border tbdr tytd">Ach%</th>
                <th className="px-1 py-1 text-center border tbdr tytd">Skor</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(g => {
                const pw = (g.kpis.reduce((s, k) => s + k.weight, 0) * 100).toFixed(0);
                return g.kpis.map((k, ki) => {
                  const ytd = calcYTD(k, deptMonthIdx);
                  const ytdAch = computeAch(k.type, k.target, ytd);
                  const ytdScore = computeScore(ytdAch, k.type);
                  return (
                    <tr key={k.id} className="hover:bg-nlg-sidebar/40">
                      {ki === 0 && (
                        <td rowSpan={g.kpis.length} className="bg-nlg-rail px-2 py-1.5 font-bold border border-nlg-border align-top">
                          <div>{g.persp}</div><div className="text-[10px] text-nlg-text-muted font-normal">{pw}%</div>
                        </td>
                      )}
                      <td className="px-2 py-1.5 font-medium border border-nlg-border">{k.name}</td>
                      <td className="px-1 py-1.5 text-center text-nlg-text-muted border border-nlg-border">{k.type}</td>
                      <td className="px-1 py-1.5 text-center text-nlg-text-muted border border-nlg-border">{k.uom}</td>
                      <td className="px-1 py-1.5 text-center font-medium border border-nlg-border">{(k.weight * 100).toFixed(0)}%</td>
                      <td className="px-1 py-1.5 text-center font-medium text-nlg-primary border border-nlg-border">{k.target}{k.uom === '%' ? '%' : ''}</td>
                      {activeMonths.map(mi => {
                        const st = kpiMonthStats(k, mi);
                        if (!st) return <React.Fragment key={mi}><td className="border border-nlg-border text-center text-nlg-text-subdued">—</td><td className="border border-nlg-border text-center text-nlg-text-subdued">—</td><td className="border border-nlg-border text-center text-nlg-text-subdued">—</td></React.Fragment>;
                        return (
                          <React.Fragment key={mi}>
                            <td className="px-1 py-1 text-center border border-nlg-border">{st.mtd.toFixed(1)}{k.uom === '%' ? '%' : ''}</td>
                            <td className={`px-1 py-1 text-center border border-nlg-border ${scoreTextColor(st.score)}`}>{(st.ach * 100).toFixed(0)}%</td>
                            <td className={`px-1 py-1 text-center font-bold border border-nlg-border ${scoreBg(st.score)}`}>{st.score}</td>
                          </React.Fragment>
                        );
                      })}
                      <td className={`px-1 py-1.5 text-center border border-nlg-border ${scoreTextColor(ytdScore)}`}>{(ytdAch * 100).toFixed(0)}%</td>
                      <td className={`px-1 py-1.5 text-center font-bold border border-nlg-border ${scoreBg(ytdScore)}`}>{ytdScore}</td>
                    </tr>
                  );
                });
              })}
              {/* Total row */}
              <tr className="th1 text-white">
                <td colSpan={4} className="ttotal px-2 py-2 font-bold border tbdr">Total Score</td>
                <td className="text-center font-medium border tbdr">{(kpis.reduce((s, k) => s + k.weight, 0) * 100).toFixed(0)}%</td>
                <td className="border tbdr"></td>
                {activeMonths.map(mi => {
                  const ts = deptScoreAt(kpis, mi);
                  const tg = gradeFromTotal(ts);
                  const cl = ts <= 1.5 ? 'bg-red-500' : ts <= 2.5 ? 'bg-amber-400' : 'bg-green-500';
                  return (
                    <React.Fragment key={mi}>
                      <td colSpan={2} className="px-2 py-1.5 text-right text-[10px] font-semibold border tbdr">Total:</td>
                      <td className={`px-2 py-2 text-center font-bold border tbdr ${cl}`}>{ts.toFixed(2)}<br /><span className="text-[10px]">{tg.label}</span></td>
                    </React.Fragment>
                  );
                })}
                <td className="px-2 py-1.5 text-right text-[10px] font-semibold border tbdr">YTD:</td>
                <td className={`px-2 py-2 text-center font-bold border tbdr ${scoreNow <= 1.5 ? 'bg-red-500' : scoreNow <= 2.5 ? 'bg-amber-400' : 'bg-green-500'}`}>{scoreNow.toFixed(2)}<br /><span className="text-[10px]">{grade.label}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── SUMMARY VIEW ──
  // Perspective aggregates across all depts
  const perspAgg = PERSP_ORDER.map(p => {
    const allK = allDepts.flatMap(d => d.kpis.filter(k => k.persp === p));
    const scores = allK.map(k => kpiMonthStats(k, m)).filter(Boolean).map(st => st.score);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const reds = allK.filter(k => { const st = kpiMonthStats(k, m); return st && st.score <= 1; }).length;
    return { persp: p, count: allK.length, score: avg, red: reds };
  });

  const allRed = allDepts.flatMap(d => redKpis(d.kpis).map(k => ({ ...k, dept: d.dept })));

  // Strategic alerts
  const alerts = [];
  if (companyScore < 1.5) alerts.push({ type: 'critical', icon: '🔴', text: `Skor korporat ${companyScore.toFixed(2)} berada di zona KURANG — perlu intervensi BOD.` });
  else if (companyScore < 2.5) alerts.push({ type: 'warning', icon: '🟡', text: `Skor korporat ${companyScore.toFixed(2)} di zona CUKUP — beberapa departemen perlu perhatian.` });
  else alerts.push({ type: 'success', icon: '🟢', text: `Skor korporat ${companyScore.toFixed(2)} di zona BAIK — pertahankan momentum.` });
  if (totalRed > 0) alerts.push({ type: 'critical', icon: '⚠️', text: `${totalRed} KPI berada di zona merah lintas departemen — pastikan PICA disubmit.` });
  if (totalPending > 0) alerts.push({ type: 'info', icon: 'ℹ️', text: `${totalPending} submission menunggu approval superior.` });

  const alertCls = { critical: 'border-red-300 bg-red-50 text-red-800', warning: 'border-amber-300 bg-amber-50 text-amber-800', info: 'border-blue-300 bg-blue-50 text-blue-800', success: 'border-green-300 bg-green-50 text-green-800' };

  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold text-nlg-text mb-1">Executive Dashboard</h1>
      <p className="text-sm text-nlg-text-muted mb-5">Helicopter view performa seluruh perusahaan untuk level BOD.</p>
      {yearBar(() => setSelectedDept(null))}

      {/* Corporate Performance Index + perspective cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
        <div className="border border-nlg-border rounded-nlg-card bg-[#172B4D] text-white p-5 flex flex-col justify-center items-center lg:col-span-1">
          <div className="text-[11px] font-semibold text-white/70 uppercase tracking-wide mb-2 text-center">Corporate Performance Index</div>
          <div className={`text-4xl font-bold ${companyScore >= 2.5 ? 'text-green-400' : companyScore >= 1.5 ? 'text-amber-400' : 'text-red-400'}`}>{companyScore.toFixed(2)}</div>
          <span className={`mt-2 text-[11px] px-2 py-0.5 rounded-full ${companyGrade.cls}`}>{companyGrade.text}</span>
          <div className="mt-3 w-full flex items-end gap-1 h-10">
            {TREND_SCORE.map((s, i) => {
              const cl = s >= 2.5 ? 'bg-green-400' : s >= 1.5 ? 'bg-amber-400' : 'bg-red-400';
              return <div key={i} className={`flex-1 rounded-t ${cl}`} style={{ height: `${(s / 3) * 100}%` }} title={`${TREND_LABELS[i]}: ${s}`}></div>;
            })}
          </div>
        </div>
        {perspAgg.map(p => {
          const g = gradeFromScore(p.score);
          return (
            <div key={p.persp} className="border border-nlg-border rounded-nlg-card bg-white p-4">
              <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wide mb-1">{p.persp}</div>
              <div className="text-2xl font-bold">{p.score.toFixed(2)} <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${g.cls}`}>{g.label}</span></div>
              <div className="mt-2 h-1.5 rounded-full bg-nlg-sidebar overflow-hidden"><div className={`h-full ${p.score >= 2.5 ? 'bg-green-500' : p.score >= 1.5 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${(p.score / 3) * 100}%` }}></div></div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-nlg-text-muted"><span>{p.count} KPI</span>{p.red > 0 && <span className="text-red-600 font-semibold">🔴 {p.red}</span>}</div>
            </div>
          );
        })}
      </div>

      {/* Strategic alerts */}
      <div className="space-y-2 mb-5">
        {alerts.map((a, i) => (
          <div key={i} className={`border rounded-nlg-input px-4 py-2.5 text-sm flex items-center gap-2 ${alertCls[a.type]}`}>
            <span>{a.icon}</span><span>{a.text}</span>
          </div>
        ))}
      </div>

      {/* Cascading Achievement — All Departments */}
      <div className="border border-nlg-border rounded-nlg-card bg-white overflow-hidden mb-5">
        <div className="px-4 py-3 bg-nlg-sidebar border-b border-nlg-border text-[11px] font-semibold text-nlg-text-subdued uppercase tracking-wide">Cascading Achievement — Semua Departemen</div>
        <table className="w-full text-sm text-left">
          <thead className="bg-white text-nlg-text-subdued text-[11px] uppercase border-b border-nlg-border">
            <tr>
              <th className="px-4 py-3">Departemen</th>
              <th className="px-4 py-3">Score MTD</th>
              <th className="px-4 py-3 text-center">vs Company</th>
              <th className="px-4 py-3 text-center">KPI Merah</th>
              <th className="px-4 py-3 text-center">Submission</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-nlg-border">
            {[...allDepts].sort((a, b) => b.score - a.score).map((d, i) => {
              const g = gradeFromTotal(d.score);
              const delta = d.score - companyScore;
              const reds = redKpis(d.kpis).length;
              return (
                <tr key={i} className="hover:bg-nlg-sidebar/40">
                  <td className="px-4 py-3 font-medium text-nlg-text"><span className="text-nlg-text-subdued mr-2">{i + 1}.</span>{d.dept}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-nlg-sidebar overflow-hidden"><div className={`h-full ${d.score >= 2.5 ? 'bg-green-500' : d.score >= 1.5 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${(d.score / 3) * 100}%` }}></div></div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${g.cls}`}>{d.score.toFixed(2)} {g.label}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-center text-[11px] font-semibold ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">{reds > 0 ? <span className="text-red-600 font-bold">{reds}</span> : <span className="text-green-600">0</span>}</td>
                  <td className="px-4 py-3 text-center text-[11px] text-nlg-text-muted">{d.approved}/{d.submitted}{d.pending > 0 && <span className="text-amber-600"> · {d.pending} pending</span>}</td>
                  <td className="px-4 py-3 text-center"><button onClick={() => { setSelectedDept(d.dept); setDeptMonthIdx(CURRENT_MONTH_IDX); }} className="text-nlg-primary hover:underline text-[11px] font-medium">Detail →</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Strategic Risk Radar + Perspektif summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="border border-nlg-border rounded-nlg-card bg-white p-5">
          <div className="text-[11px] font-semibold text-nlg-text-subdued uppercase tracking-wide mb-3">Strategic Risk Radar</div>
          {allRed.length === 0 ? (
            <div className="text-center py-6 text-green-600 text-sm">🟢 Tidak ada KPI merah lintas departemen.</div>
          ) : (
            <div className="space-y-2">
              {allRed.map((k, i) => {
                const st = kpiMonthStats(k, m);
                return (
                  <div key={i} className="border border-red-200 bg-red-50/40 rounded-nlg-input p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badgeColorByPersp(k.persp)}`}>{k.persp}</span>
                        <span className="ml-2 font-medium text-sm">{k.name}</span>
                        <div className="text-[11px] text-nlg-text-muted">{k.dept}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-red-600 font-bold text-sm">{st ? st.mtd.toFixed(1) : '—'}{k.uom === '%' ? '%' : ''}</div>
                        <div className="text-[10px] text-nlg-text-subdued">Score {st?.score} · K</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border border-nlg-border rounded-nlg-card bg-white overflow-hidden">
          <div className="px-4 py-3 bg-nlg-sidebar border-b border-nlg-border text-[11px] font-semibold text-nlg-text-subdued uppercase tracking-wide">Ringkasan per Perspektif BSC</div>
          <table className="w-full text-sm text-left">
            <thead className="text-nlg-text-subdued text-[11px] uppercase border-b border-nlg-border">
              <tr><th className="px-4 py-2">Perspektif</th><th className="px-4 py-2 text-center">Total KPI</th><th className="px-4 py-2 text-center">Score</th><th className="px-4 py-2 text-center">KPI Merah</th></tr>
            </thead>
            <tbody className="divide-y divide-nlg-border">
              {perspAgg.map(p => {
                const g = gradeFromScore(p.score);
                return (
                  <tr key={p.persp} className="hover:bg-nlg-sidebar/40">
                    <td className="px-4 py-2.5 font-medium">{p.persp}</td>
                    <td className="px-4 py-2.5 text-center">{p.count}</td>
                    <td className="px-4 py-2.5 text-center"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${g.cls}`}>{p.score.toFixed(2)} {g.label}</span></td>
                    <td className="px-4 py-2.5 text-center">{p.red > 0 ? <span className="text-red-600 font-bold">{p.red}</span> : '0'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
