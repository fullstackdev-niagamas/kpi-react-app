import React, { useState, useEffect } from 'react';
import { ACTIVE_PLAN_YEAR, AVAILABLE_YEARS, MONTH_LABELS, CURRENT_MONTH_IDX, TABLE_THEMES } from '../../data/mockData';
import { useKPIContext } from '../../context/KPIContext';
import { kpiMonthStats, kpiYTDStats, gradeFromTotal, gradeFromScore, scoreBg, scoreTextColor, badgeColorByPersp, deptScoreAt, deptScoreYTD, buildDeptAggregates } from '../../utils/helpers';
import { TrendSparkline } from '../../components/TrendSparkline';
import { FEATURES } from '../../config/features';

const PERSP_ORDER = ['Financial', 'Customer', 'Internal Process', 'Learning & Growth'];

// KPI merah (score<=1) di bulan `mi` — diparameterisasi (2026-07-21, sebelumnya hardcoded
// CURRENT_MONTH_IDX) supaya ikut berubah saat CEO/CS menjelajah bulan lain via viewMonthIdx.
function redKpis(kpis, mi) {
  return kpis.filter(k => { const st = kpiMonthStats(k, mi); return st && st.score <= 1; });
}

export const Executive = () => {
  const { users, userKPIs, batches } = useKPIContext();
  const [viewYear, setViewYear] = useState(ACTIVE_PLAN_YEAR);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptMonthIdx, setDeptMonthIdx] = useState(CURRENT_MONTH_IDX);
  // Ditambahkan (2026-07-21) — sebelumnya Company Scorecard (summary view) terkunci permanen ke
  // CURRENT_MONTH_IDX, TIDAK bisa dijelajah per-bulan spt Monitoring Dashboard/Dept Drill-Down yg
  // sudah lebih dulu interaktif (`deptMonthIdx`) — inkonsistensi yg ditemukan saat menambahkan
  // toggle bulan interaktif ke Strategy Map (permintaan user, protokol poin B: diterapkan menyeluruh
  // ke fitur relevan). Klik bulan di trend chart ATAU di month-picker strip mengubah `m` di seluruh
  // halaman (CPI, 4 Perspektif, Cascading table, Strategic Risk Radar) sekaligus.
  const [viewMonthIdx, setViewMonthIdx] = useState(CURRENT_MONTH_IDX);

  // Apply navy table theme for the BSC drill table
  useEffect(() => {
    const t = TABLE_THEMES.navy;
    const root = document.documentElement;
    Object.entries(t.vars).forEach(([k, val]) => root.style.setProperty(k, val));
  }, []);

  const m = viewMonthIdx;

  // Company-wide aggregates — Dept & score dihitung live dari users + userKPIs + batches
  // sungguhan (Sec. 8), sama seperti Monitoring Dashboard, supaya angka selalu konsisten.
  const allDepts = buildDeptAggregates(users, userKPIs, batches, m);
  // Tren CPI 6 bulan terakhir berakhir di bulan yg sedang dilihat `m` — MENGGANTIKAN `TREND_SCORE`
  // (array statis [2.1,2.3,2.2,2.5,2.6,2.7] di mockData.js, ditemukan tidak pernah dihitung dari data
  // sungguhan sama sekali, murni demo — kelas bug yg sama dgn "Strategy Map skor acak" yg sudah
  // diperbaiki di v6.28, ternyata belum menyentuh widget CPI trend di Executive Dashboard ini).
  const trailStart = Math.max(0, m - 5);
  const trailMonths = Array.from({ length: m - trailStart + 1 }, (_, i) => trailStart + i);
  const companyScoreForMonth = (mi) => {
    const depts = buildDeptAggregates(users, userKPIs, batches, mi);
    const scored = depts.filter(d => d.score !== null);
    return scored.length ? scored.reduce((s, d) => s + d.score, 0) / scored.length : null;
  };
  const companyTrend = trailMonths.map(mi => ({
    mi,
    value: companyScoreForMonth(mi),
    tooltip: `${MONTH_LABELS[mi]} ${viewYear} — ${companyScoreForMonth(mi) !== null ? companyScoreForMonth(mi).toFixed(2) : 'Belum ada data'}`,
  }));
  // `d.score` bisa null (deptScoreAt: dept ini py KPI tapi belum ada satu pun terisi bulan `m`) — Dept
  // tsb DIKELUARKAN dari rata2 korporat (exclude & re-normalize, sama spt prinsip deptScoreAt sendiri),
  // bukan diperlakukan skor 0 yg akan menjatuhkan Corporate Performance Index secara tidak akurat.
  const scoredDepts = allDepts.filter(d => d.score !== null);
  const companyScore = scoredDepts.length
    ? scoredDepts.reduce((s, d) => s + d.score, 0) / scoredDepts.length
    : null;
  const companyGrade = gradeFromTotal(companyScore);
  const totalRed = allDepts.reduce((s, d) => s + redKpis(d.kpis, m).length, 0);
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
    const reds = redKpis(kpis, deptMonthIdx);
    const scoreNow = deptScoreAt(kpis, deptMonthIdx);
    const grade = gradeFromTotal(scoreNow);

    const monthlyTotals = MONTH_LABELS.map((_, mi) => (mi <= m ? deptScoreAt(kpis, mi) : null));
    const scoreCl = ts => ts === null ? 'bg-gray-200 text-nlg-text-subdued' : ts <= 1.5 ? 'bg-red-400 text-white' : ts <= 2.5 ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white';

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
          <div className="border border-nlg-border rounded-nlg-card bg-[#172B4D] text-white p-3"><div className="text-[10px] text-white/70 uppercase">Score MTD</div><div className="text-lg font-bold">{scoreNow !== null ? scoreNow.toFixed(2) : '—'} <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-white/20">{grade.label}</span></div></div>
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
                  // Null-safe (root cause bug 2026-07-22): lihat catatan `kpiYTDStats` di helpers.js.
                  const stYTD = kpiYTDStats(k, deptMonthIdx);
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
                      {stYTD ? (
                        <>
                          <td className={`px-1 py-1.5 text-center border border-nlg-border ${scoreTextColor(stYTD.score)}`}>{(stYTD.ach * 100).toFixed(0)}%</td>
                          <td className={`px-1 py-1.5 text-center font-bold border border-nlg-border ${scoreBg(stYTD.score)}`}>{stYTD.score}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-1 py-1.5 text-center border border-nlg-border text-nlg-text-subdued">—</td>
                          <td className="px-1 py-1.5 text-center border border-nlg-border text-nlg-text-subdued">—</td>
                        </>
                      )}
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
                  const cl = ts === null ? 'bg-gray-300' : ts <= 1.5 ? 'bg-red-500' : ts <= 2.5 ? 'bg-yellow-400 text-black' : 'bg-green-500';
                  return (
                    <React.Fragment key={mi}>
                      <td colSpan={2} className="px-2 py-1.5 text-right text-[10px] font-semibold border tbdr">Total:</td>
                      <td className={`px-2 py-2 text-center font-bold border tbdr ${cl}`}>{ts !== null ? ts.toFixed(2) : '—'}<br /><span className="text-[10px]">{tg.label}</span></td>
                    </React.Fragment>
                  );
                })}
                {/* Sebelumnya kolom ini berlabel "YTD" tapi memakai `scoreNow` (skor MTD bulan
                    `deptMonthIdx`, bukan rata2 Jan..deptMonthIdx) — mislabel, angkanya identik dgn
                    kolom Total MTD di sampingnya. Diperbaiki pakai `deptScoreYTD` yg sesungguhnya. */}
                {(() => {
                  const ytdTs = deptScoreYTD(kpis, deptMonthIdx);
                  const ytdGrade = gradeFromTotal(ytdTs);
                  return (
                    <>
                      <td className="px-2 py-1.5 text-right text-[10px] font-semibold border tbdr">YTD:</td>
                      <td className={`px-2 py-2 text-center font-bold border tbdr ${ytdTs === null ? 'bg-gray-300' : ytdTs <= 1.5 ? 'bg-red-500' : ytdTs <= 2.5 ? 'bg-yellow-400 text-black' : 'bg-green-500'}`}>{ytdTs !== null ? ytdTs.toFixed(2) : '—'}<br /><span className="text-[10px]">{ytdGrade.label}</span></td>
                    </>
                  );
                })()}
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
    // null (bukan 0) saat belum ada satu pun KPI perspektif ini terisi — konsisten dgn deptScoreAt,
    // supaya card perspektif tampil "—" bukan "0.00" yg menyesatkan (seolah performa buruk).
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    const reds = allK.filter(k => { const st = kpiMonthStats(k, m); return st && st.score <= 1; }).length;
    return { persp: p, count: allK.length, score: avg, red: reds };
  });

  const allRed = allDepts.flatMap(d => redKpis(d.kpis, m).map(k => ({ ...k, dept: d.dept })));

  // Strategic alerts
  const alerts = [];
  if (companyScore === null) alerts.push({ type: 'info', icon: 'ℹ️', text: 'Belum ada data Actual terisi di departemen mana pun bulan ini — skor korporat belum bisa dihitung.' });
  else if (companyScore < 1.5) alerts.push({ type: 'critical', icon: '🔴', text: `Skor korporat ${companyScore.toFixed(2)} berada di zona KURANG — perlu intervensi BOD.` });
  else if (companyScore < 2.5) alerts.push({ type: 'warning', icon: '🟡', text: `Skor korporat ${companyScore.toFixed(2)} di zona CUKUP — beberapa departemen perlu perhatian.` });
  else alerts.push({ type: 'success', icon: '🟢', text: `Skor korporat ${companyScore.toFixed(2)} di zona BAIK — pertahankan momentum.` });
  if (totalRed > 0) alerts.push({ type: 'critical', icon: '⚠️', text: FEATURES.PICA_ENABLED ? `${totalRed} KPI berada di zona merah lintas departemen — pastikan PICA disubmit.` : `${totalRed} KPI berada di zona merah lintas departemen.` });
  if (totalPending > 0) alerts.push({ type: 'info', icon: 'ℹ️', text: `${totalPending} submission menunggu approval superior.` });

  // `warning` dipakai KHUSUS utk alert zona skor "Cukup" (baris di atas) — ikut skala RAG performa,
  // jadi diganti kuning. `critical`/`info`/`success` TIDAK diubah (merah/biru/hijau di luar cakupan).
  const alertCls = { critical: 'border-red-300 bg-red-50 text-red-800', warning: 'border-yellow-300 bg-yellow-50 text-yellow-800', info: 'border-blue-300 bg-blue-50 text-blue-800', success: 'border-green-300 bg-green-50 text-green-800' };

  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold text-nlg-text mb-1">Executive Dashboard</h1>
      <p className="text-sm text-nlg-text-muted mb-5">Helicopter view performa seluruh perusahaan untuk level BOD.</p>
      {yearBar(() => { setSelectedDept(null); setViewMonthIdx(CURRENT_MONTH_IDX); })}

      {/* Month picker — dijelajahi bulan per bulan (klik strip di bawah ATAU titik pada trend CPI di
          bawah), pola identik Monitoring Dashboard supaya konsisten lintas fitur CS/CEO. */}
      <div className="flex items-center gap-1.5 mb-5 flex-wrap">
        <span className="text-[11px] font-medium text-nlg-text-muted shrink-0">Bulan:</span>
        {MONTH_LABELS.map((lbl, mi) => (
          <button key={mi} onClick={() => mi <= CURRENT_MONTH_IDX && setViewMonthIdx(mi)}
            className={`px-2.5 py-1 text-[10px] font-medium rounded-full border transition-colors ${viewMonthIdx === mi ? 'bg-nlg-primary text-white border-nlg-primary' : mi <= CURRENT_MONTH_IDX ? 'bg-white text-nlg-text-muted border-nlg-border hover:bg-nlg-primary-tint' : 'bg-nlg-sidebar text-nlg-text-subdued border-nlg-border opacity-40 cursor-default'}`}>
            {lbl}{mi === CURRENT_MONTH_IDX ? ' 🔒' : ''}
          </button>
        ))}
      </div>

      {/* Corporate Performance Index + perspective cards */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
        <div className="border border-nlg-border rounded-nlg-card bg-[#172B4D] text-white p-5 flex flex-col justify-center items-center lg:col-span-1">
          <div className="text-[11px] font-semibold text-white/70 uppercase tracking-wide mb-2 text-center">Corporate Performance Index</div>
          <div className={`text-4xl font-bold ${companyScore === null ? 'text-white/50' : companyScore >= 2.5 ? 'text-green-400' : companyScore >= 1.5 ? 'text-yellow-400' : 'text-red-400'}`}>{companyScore !== null ? companyScore.toFixed(2) : '—'}</div>
          <span className={`mt-2 text-[11px] px-2 py-0.5 rounded-full ${companyGrade.cls}`}>{companyGrade.text}</span>
          <div className="mt-3 w-full flex justify-center">
            <TrendSparkline points={companyTrend} onSelectMonth={setViewMonthIdx} width={110} height={30} />
          </div>
          <div className="text-[9px] text-white/50 mt-1">klik titik utk pindah bulan</div>
        </div>
        {perspAgg.map(p => {
          const g = gradeFromScore(p.score);
          return (
            <div key={p.persp} className="border border-nlg-border rounded-nlg-card bg-white p-4">
              <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wide mb-1">{p.persp}</div>
              <div className="text-2xl font-bold">{p.score !== null ? p.score.toFixed(2) : '—'} <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${g.cls}`}>{g.label}</span></div>
              <div className="mt-2 h-1.5 rounded-full bg-nlg-sidebar overflow-hidden"><div className={`h-full ${p.score === null ? '' : p.score >= 2.5 ? 'bg-green-500' : p.score >= 1.5 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${p.score === null ? 0 : (p.score / 3) * 100}%` }}></div></div>
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
        <div className="px-4 py-3 bg-nlg-sidebar border-b border-nlg-border text-[11px] font-semibold text-nlg-text-subdued uppercase tracking-wide">Cascading Achievement — Semua Departemen · {MONTH_LABELS[m]} {viewYear}</div>
        <table className="w-full text-sm text-left">
          <thead className="bg-white text-nlg-text-subdued text-[11px] uppercase border-b border-nlg-border">
            <tr>
              <th className="px-4 py-3">Departemen</th>
              <th className="px-4 py-3">Score {MONTH_LABELS[m]}</th>
              <th className="px-4 py-3 text-center">vs Company</th>
              <th className="px-4 py-3 text-center">KPI Merah</th>
              <th className="px-4 py-3 text-center">Submission</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-nlg-border">
            {/* Dept dgn score null (belum ada KPI terisi bulan ini) diurutkan ke bawah, bukan ikut
                aritmetika b.score - a.score yg jadi NaN & merusak urutan sort. */}
            {[...allDepts].sort((a, b) => (b.score ?? -1) - (a.score ?? -1)).map((d, i) => {
              const g = gradeFromTotal(d.score);
              const delta = (d.score !== null && companyScore !== null) ? d.score - companyScore : null;
              const reds = redKpis(d.kpis, m).length;
              return (
                <tr key={i} className="hover:bg-nlg-sidebar/40">
                  <td className="px-4 py-3 font-medium text-nlg-text"><span className="text-nlg-text-subdued mr-2">{i + 1}.</span>{d.dept}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-nlg-sidebar overflow-hidden"><div className={`h-full ${d.score === null ? '' : d.score >= 2.5 ? 'bg-green-500' : d.score >= 1.5 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${d.score === null ? 0 : (d.score / 3) * 100}%` }}></div></div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${g.cls}`}>{d.score !== null ? d.score.toFixed(2) : '—'} {g.label}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-center text-[11px] font-semibold ${delta === null ? 'text-nlg-text-subdued' : delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>{delta === null ? '—' : <>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(2)}</>}</td>
                  <td className="px-4 py-3 text-center">{reds > 0 ? <span className="text-red-600 font-bold">{reds}</span> : <span className="text-green-600">0</span>}</td>
                  <td className="px-4 py-3 text-center text-[11px] text-nlg-text-muted">{d.approved}/{d.submitted}{d.pending > 0 && <span className="text-amber-600"> · {d.pending} pending</span>}</td>
                  <td className="px-4 py-3 text-center"><button onClick={() => { setSelectedDept(d.dept); setDeptMonthIdx(viewMonthIdx); }} className="text-nlg-primary hover:underline text-[11px] font-medium">Detail →</button></td>
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
                    <td className="px-4 py-2.5 text-center"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${g.cls}`}>{p.score !== null ? p.score.toFixed(2) : '—'} {g.label}</span></td>
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
