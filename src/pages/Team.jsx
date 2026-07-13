import React, { useState } from 'react';
import { ACTIVE_PLAN_YEAR, MONTH_LABELS, CURRENT_MONTH_IDX } from '../data/mockData';
import { useKPIContext } from '../context/KPIContext';
import { kpiMonthStats, gradeFromTotal, scoreBg, scoreTextColor, calcYTD, computeScore, levelBadge } from '../utils/helpers';

// Band warna per Perspektif — konsisten dgn palet Strategy Map (StrategyMap.jsx PERSP_META) supaya
// Card View Performa Tim terasa satu bahasa visual dgn tampilan Super User.
const PERSP_BAND = {
  Financial:           { header: 'bg-[#7C3AED]', light: 'bg-[#F5F3FF]', border: 'border-[#DDD6FE]' },
  Customer:            { header: 'bg-[#2563EB]', light: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]' },
  'Internal Process':  { header: 'bg-[#EA580C]', light: 'bg-[#FFF7ED]', border: 'border-[#FED7AA]' },
  'Learning & Growth': { header: 'bg-[#0D9488]', light: 'bg-[#F0FDFA]', border: 'border-[#99F6E4]' },
};

export const Team = ({ currentUserName }) => {
  const { users, userKPIs } = useKPIContext();
  const [teamView, setTeamView] = useState('summary');
  const [selectedMember, setSelectedMember] = useState(null);
  const [teamDashView, setTeamDashView] = useState('table');
  const [teamViewMonthIdx, setTeamViewMonthIdx] = useState(CURRENT_MONTH_IDX);

  const mySubordinates = users.filter(u => u.superior === (currentUserName || 'Budi Santoso'));
  const tv = teamViewMonthIdx;

  if (!mySubordinates.length) {
    return (
      <div className="mb-5">
        <h1 className="text-xl font-bold text-nlg-text">Performa Tim</h1>
        <p className="text-sm text-nlg-text-muted mt-1">Tidak ada anggota tim yang terdaftar di bawah Anda di Master Data User.</p>
      </div>
    );
  }

  if (!selectedMember && teamView === 'detail') setSelectedMember(mySubordinates[0].name);

  const scoreCl = ts => ts <= 1.5 ? 'bg-red-400 text-white' : ts <= 2.5 ? 'bg-amber-400 text-white' : 'bg-green-500 text-white';

  const memberStats = mySubordinates.map(u => {
    const kpis = (userKPIs[u.name] || []).filter(k => k.status === 'Approved' || k.status === 'Locked');
    const totalScore = kpis.reduce((sum, k) => { const st = kpiMonthStats(k, tv); return sum + (st ? st.scoreXW : 0); }, 0);
    const grade = gradeFromTotal(totalScore);
    return { ...u, kpis, totalScore, grade };
  });

  const tabBtn = (key, label) => (
    <button onClick={() => setTeamView(key)}
      className={`px-3 py-1.5 text-xs font-medium rounded-nlg-input border ${teamView === key ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border'}`}>
      {label}
    </button>
  );

  // ── SUMMARY VIEW ──
  if (teamView === 'summary') {
    const teamMTDByMonth = MONTH_LABELS.map((_, mi) => {
      const scores = memberStats.map(s => s.kpis.reduce((sum, k) => { const st = kpiMonthStats(k, mi); return sum + (st ? st.scoreXW : 0); }, 0));
      const valid = scores.filter((_, i) => memberStats[i].kpis.some(k => k.factor1[mi] !== null && k.factor1[mi] !== undefined));
      return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
    });

    return (
      <div className="mb-5">
        <h1 className="text-xl font-bold text-nlg-text mb-4">Performa Tim</h1>
        <div className="flex gap-1 mb-4">{tabBtn('summary', '📋 Ringkasan Tim')}{tabBtn('detail', '🔍 Detail Anggota')}</div>

        {/* Summary Bar */}
        <div className="overflow-x-auto mb-4">
          <table className="text-xs border-collapse min-w-full">
            <thead>
              <tr>
                <td className="px-3 py-1.5 font-semibold text-nlg-text bg-nlg-rail border border-nlg-border min-w-[140px]">Rata-rata Tim</td>
                {MONTH_LABELS.map((lbl, mi) => {
                  const hasData = teamMTDByMonth[mi] !== null;
                  const isTv = mi === tv;
                  const cls = isTv ? 'bg-nlg-primary text-white font-bold' : hasData ? 'bg-nlg-sidebar text-nlg-text-muted cursor-pointer hover:bg-nlg-primary-tint' : 'bg-nlg-sidebar text-nlg-text-subdued opacity-40';
                  return (
                    <td key={mi} onClick={() => hasData && !isTv && setTeamViewMonthIdx(mi)}
                      className={`px-2 py-1 text-center border border-nlg-border transition-colors ${cls} min-w-[48px]`}>
                      {lbl}{mi === CURRENT_MONTH_IDX ? ' 🔒' : ''}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-3 py-1 text-[11px] font-semibold bg-nlg-rail border border-nlg-border">Avg Total Score</td>
                {teamMTDByMonth.map((ts, mi) => ts === null
                  ? <td key={mi} className="px-2 py-1 text-center border border-nlg-border text-nlg-text-subdued">—</td>
                  : <td key={mi} className={`px-2 py-1 text-center font-bold border border-nlg-border text-[11px] ${scoreCl(ts)} ${mi === tv ? 'ring-2 ring-inset ring-white/50' : ''}`}>{ts.toFixed(2)}</td>
                )}
              </tr>
            </thead>
          </table>
        </div>

        {/* Team Table */}
        <div className="border border-nlg-border rounded-nlg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-nlg-sidebar text-nlg-text-subdued text-[11px] uppercase">
              <tr>
                <th className="text-left px-4 py-2.5">Nama</th>
                <th className="text-left px-4 py-2.5">Dept</th>
                <th className="text-center px-4 py-2.5">Level</th>
                <th className="text-center px-4 py-2.5">KPI Approved</th>
                <th className="text-center px-4 py-2.5">Total Score MTD · {MONTH_LABELS[tv]}</th>
                <th className="text-center px-4 py-2.5">Grade</th>
                <th className="text-center px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {memberStats.map(s => {
                const cl = s.totalScore <= 1.5 ? 'bg-red-500 text-white' : s.totalScore <= 2.5 ? 'bg-amber-400 text-white' : 'bg-green-500 text-white';
                return (
                  <tr key={s.name} className="border-t border-nlg-border hover:bg-nlg-sidebar/40 cursor-pointer"
                    onClick={() => { setTeamView('detail'); setSelectedMember(s.name); setTeamViewMonthIdx(CURRENT_MONTH_IDX); setTeamDashView('table'); }}>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-nlg-text-muted text-sm">{s.dept}</td>
                    <td className="px-4 py-3 text-center"><span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${levelBadge(s.level)}`}>{s.level}</span></td>
                    <td className="px-4 py-3 text-center text-sm">{s.kpis.length} KPI</td>
                    <td className="px-4 py-3 text-center"><span className={`font-bold text-sm px-3 py-1 rounded-full ${cl}`}>{s.totalScore.toFixed(2)}</span></td>
                    <td className="px-4 py-3 text-center"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s.grade.cls}`}>{s.grade.label} · {s.grade.text}</span></td>
                    <td className="px-4 py-3 text-center text-nlg-primary text-[11px] font-medium">Lihat Detail →</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="text-[11px] text-nlg-text-subdued mt-2">Klik baris untuk lihat detail. Klik bulan di summary atas untuk beralih.</div>
      </div>
    );
  }

  // ── DETAIL VIEW ──
  const sel = selectedMember || mySubordinates[0].name;
  const selMeta = users.find(u => u.name === sel) || { level: 'Individual' };
  const showSOMember = selMeta.level !== 'Individual';
  const kpis = (userKPIs[sel] || []).filter(k => k.status === 'Approved' || k.status === 'Locked');
  const totalScore = kpis.reduce((sum, k) => { const st = kpiMonthStats(k, tv); return sum + (st ? st.scoreXW : 0); }, 0);
  // Sengaja hanya menghitung KPI Approved/Locked (lihat filter `kpis` di atas) — Performa Tim adalah
  // sudut pandang Superior, bukan working-draft milik member (beda dgn Dashboard/Planning yg
  // menghitung SEMUA status termasuk Draft) — jadi total bisa < 100% sampai member selesai disetujui,
  // ini disengaja bukan bug. Dibulatkan 2 desimal utk hindari noise floating-point.
  const totalWeight = Math.round(kpis.reduce((s, k) => s + k.weight, 0) * 100 * 100) / 100;

  const mbrMonthlyTotals = MONTH_LABELS.map((_, mi) => {
    const filled = kpis.filter(k => k.factor1[mi] !== null && k.factor1[mi] !== undefined);
    return filled.length ? filled.reduce((s, k) => { const st = kpiMonthStats(k, mi); return s + (st ? st.scoreXW : 0); }, 0) : null;
  });

  const perspOrder = ['Financial', 'Customer', 'Internal Process', 'Learning & Growth'];
  const groups = perspOrder.map(p => ({ persp: p, kpis: kpis.filter(k => k.persp === p) })).filter(g => g.kpis.length);
  const colMonths = MONTH_LABELS.map((_, mi) => mi).filter(mi => mi <= CURRENT_MONTH_IDX);

  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold text-nlg-text mb-4">Performa Tim</h1>
      <div className="flex gap-1 mb-4">{tabBtn('summary', '📋 Ringkasan Tim')}{tabBtn('detail', '🔍 Detail Anggota')}</div>

      {/* Member Selector */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="text-[11px] font-medium text-nlg-text-muted">Anggota:</span>
        {mySubordinates.map(u => (
          <button key={u.name} onClick={() => { setSelectedMember(u.name); setTeamViewMonthIdx(CURRENT_MONTH_IDX); }}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors ${sel === u.name ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border hover:bg-nlg-primary-tint'}`}>
            {u.name.split(' ')[0]} <span className="opacity-60 text-[9px]">{u.dept}</span>
          </button>
        ))}
      </div>

      {/* Summary Bar */}
      <div className="overflow-x-auto mb-4">
        <table className="text-xs border-collapse min-w-full">
          <thead>
            <tr>
              <td className="px-3 py-1.5 font-semibold text-nlg-text bg-nlg-rail border border-nlg-border min-w-[110px]">KPI Score</td>
              {MONTH_LABELS.map((lbl, mi) => {
                const hasData = mbrMonthlyTotals[mi] !== null;
                const isTv = mi === tv;
                const cls = isTv ? 'bg-nlg-primary text-white font-bold' : hasData ? 'bg-nlg-sidebar text-nlg-text-muted cursor-pointer hover:bg-nlg-primary-tint' : 'bg-nlg-sidebar text-nlg-text-subdued opacity-40';
                return (
                  <td key={mi} onClick={() => hasData && !isTv && setTeamViewMonthIdx(mi)}
                    className={`px-2 py-1 text-center border border-nlg-border ${cls} min-w-[52px]`}>
                    {lbl}{mi === CURRENT_MONTH_IDX ? ' 🔒' : ''}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="px-3 py-1 text-[11px] font-semibold bg-nlg-rail border border-nlg-border">Total Score MTD</td>
              {mbrMonthlyTotals.map((ts, mi) => ts === null
                ? <td key={mi} className="px-2 py-1 text-center border border-nlg-border text-nlg-text-subdued">—</td>
                : <td key={mi} className={`px-2 py-1 text-center font-bold border border-nlg-border text-[11px] ${scoreCl(ts)} ${mi === tv ? 'ring-2 ring-inset ring-white/50' : ''}`}>{ts.toFixed(2)}</td>
              )}
            </tr>
          </thead>
        </table>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="text-[11px] text-nlg-text-subdued">Menampilkan: <b className="text-nlg-primary">{MONTH_LABELS[tv]} {ACTIVE_PLAN_YEAR}</b></div>
        <div className="flex gap-1">
          <button onClick={() => setTeamDashView('table')} className={`px-3 py-1.5 text-xs font-medium rounded-nlg-input border ${teamDashView === 'table' ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border'}`}>📊 Table View</button>
          <button onClick={() => setTeamDashView('card')} className={`px-3 py-1.5 text-xs font-medium rounded-nlg-input border ${teamDashView === 'card' ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border'}`}>🗂 Card View</button>
        </div>
      </div>

      {teamDashView === 'card' ? (
        <div className="space-y-5">
          {groups.map(g => {
            const band = PERSP_BAND[g.persp] || PERSP_BAND.Financial;
            const gWeight = (g.kpis.reduce((s, k) => s + k.weight, 0) * 100).toFixed(0);
            return (
              <div key={g.persp}>
                <div className={`flex items-center justify-between px-3 py-2 rounded-t-nlg-card text-white ${band.header}`}>
                  <span className="text-[12px] font-bold">{g.persp}</span>
                  <span className="text-[11px] font-medium opacity-90">{g.kpis.length} KPI · Bobot {gWeight}%</span>
                </div>
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3 rounded-b-nlg-card border border-t-0 ${band.border} ${band.light}`}>
                  {g.kpis.map(k => {
                    // KPI baru disetujui tapi Actual belum diisi (factor1/factor2 null) TIDAK sama dgn
                    // "skor 0/Kurang" — sebelumnya default score=0 bikin SEMUA kartu tampil merah solid
                    // walau belum ada data sama sekali. Sekarang tampilkan state netral "Belum ada Actual".
                    const st = kpiMonthStats(k, tv);
                    const hasMTD = !!st;
                    const ytdVal = calcYTD(k, tv);
                    const hasYTD = k.factor1[tv] !== null && k.factor1[tv] !== undefined;
                    const achYTD = hasYTD ? (k.type === 'Min' ? (2 * k.target - ytdVal) / k.target : ytdVal / k.target) : 0;
                    const scoreYTD = hasYTD ? computeScore(achYTD, k.type) : 0;
                    return (
                      <div key={k.id} className="border border-nlg-border rounded-nlg-card p-3 bg-white">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-nlg-sidebar text-nlg-text-muted">{k.type}</span>
                          {!hasMTD && <span className="text-[9px] text-nlg-text-subdued italic">Belum ada Actual</span>}
                        </div>
                        <div className="font-semibold text-nlg-text text-[13px] mb-1 leading-snug">{k.name}</div>
                        <div className="flex items-center justify-between mb-2 text-[10px] text-nlg-text-subdued">
                          <span>{k.period} · {k.uom}</span>
                          <span className="font-medium text-nlg-primary">Target: {k.target}{k.uom === '%' ? '%' : ''}</span>
                        </div>
                        <div className="flex gap-2">
                          <div className={`flex-1 rounded-nlg-input py-2 text-center ${hasMTD ? scoreBg(st.score) : 'bg-gray-100 text-nlg-text-subdued'}`}>
                            <div className="text-[9px] mb-0.5 opacity-75">%Actual MTD</div>
                            <div className="font-bold text-sm">{hasMTD ? `${(st.ach * 100).toFixed(1)}%` : '—'}</div>
                          </div>
                          <div className={`flex-1 rounded-nlg-input py-2 text-center ${hasYTD ? scoreBg(scoreYTD) : 'bg-gray-100 text-nlg-text-subdued'}`}>
                            <div className="text-[9px] mb-0.5 opacity-75">%Actual YTD</div>
                            <div className="font-bold text-sm">{hasYTD ? `${(achYTD * 100).toFixed(1)}%` : '—'}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-4 text-[11px] text-nlg-text-subdued flex-wrap pt-1">
            <span>🟢 Score ≥2.5 — Baik</span>
            <span>🟡 Score 1.5–2.4 — Cukup</span>
            <span>🔴 Score ≤1.5 — Kurang</span>
            <span>⬜ Belum ada data Actual</span>
          </div>
        </div>
      ) : (
        /* BSC Table */
        <div className="overflow-x-auto rounded-nlg-card border border-nlg-border">
          <table className="border-collapse min-w-full bg-white text-[11px]">
            <thead className="sticky top-0 z-10">
              <tr className="th1 text-white text-[10px]">
                <th rowSpan={2} className="sticky left-0 z-20 th1 px-2 py-2 text-left min-w-[90px] border tbdr align-middle">Perspective</th>
                {showSOMember && <th rowSpan={2} className="sticky left-[90px] z-20 th1 px-2 py-2 text-left min-w-[110px] border tbdr align-middle">Strategic Obj.</th>}
                <th rowSpan={2} className={`${showSOMember ? 'sticky left-[200px]' : 'sticky left-[90px]'} z-20 th1 px-2 py-2 text-left min-w-[140px] border tbdr align-middle`}>KPI</th>
                <th rowSpan={2} className="th1 px-2 py-2 text-center min-w-[42px] border tbdr align-middle">Type</th>
                <th rowSpan={2} className="th1 px-2 py-2 text-center min-w-[36px] border tbdr align-middle">UoM</th>
                <th rowSpan={2} className="th1 px-2 py-2 text-center min-w-[68px] border tbdr align-middle">Periode</th>
                <th rowSpan={2} className="th1 px-2 py-2 text-center min-w-[46px] border tbdr align-middle">Weight</th>
                <th rowSpan={2} className="th1 px-2 py-2 text-center min-w-[52px] border tbdr align-middle">Target</th>
                {colMonths.map(mi => (
                  <th key={mi} colSpan={3} className={`${mi === tv ? 'bg-nlg-primary' : 'tpast'} px-2 py-2 text-center border tbdr`}>
                    {MONTH_LABELS[mi]}-{String(ACTIVE_PLAN_YEAR).slice(2)}{mi === CURRENT_MONTH_IDX ? ' 🔒' : ''}
                  </th>
                ))}
                <th colSpan={2} className="tytd px-2 py-2 text-center border tbdr">YTD</th>
              </tr>
              <tr className="th2 text-white text-[10px]">
                {colMonths.map(mi => (
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
                const pw = (g.kpis.reduce((s, k) => s + k.weight, 0) * 100).toFixed(0);
                return g.kpis.map((k, ki) => {
                  const ytdA = calcYTD(k, tv);
                  const ytdAchv = k.type === 'Min' ? (2 * k.target - ytdA) / k.target : ytdA / k.target;
                  const ytdSc = computeScore(ytdAchv, k.type);
                  const kpiLeft = showSOMember ? 'sticky left-[200px]' : 'sticky left-[90px]';
                  return (
                    <tr key={k.id} className="hover:bg-nlg-sidebar/40">
                      {ki === 0 && (
                        <td className="sticky left-0 z-10 bg-nlg-rail px-2 py-1.5 font-bold text-[11px] border border-nlg-border text-nlg-text align-top" rowSpan={g.kpis.length}>
                          <div>{g.persp}</div>
                          <div className="text-[10px] text-nlg-text-muted font-normal">{pw}%</div>
                        </td>
                      )}
                      {showSOMember && <td className="sticky left-[90px] bg-white px-2 py-1.5 text-[10px] border border-nlg-border text-nlg-text-subdued">{k.so || '—'}</td>}
                      <td className={`${kpiLeft} bg-white px-2 py-1.5 text-[11px] font-medium border border-nlg-border`}>{k.name}</td>
                      <td className="px-1 py-1.5 text-center text-[10px] border border-nlg-border text-nlg-text-muted">{k.type}</td>
                      <td className="px-1 py-1.5 text-center text-[10px] border border-nlg-border text-nlg-text-muted">{k.uom}</td>
                      <td className="px-1 py-1.5 text-center text-[10px] border border-nlg-border text-nlg-text-muted">{k.period}</td>
                      <td className="px-1 py-1.5 text-center text-[10px] border border-nlg-border font-medium">{(k.weight * 100).toFixed(0)}%</td>
                      <td className="px-1 py-1.5 text-center text-[10px] border border-nlg-border font-medium text-nlg-primary">{k.target}{k.uom === '%' ? '%' : ''}</td>
                      {colMonths.map(mi => {
                        const st = kpiMonthStats(k, mi);
                        if (!st) return (
                          <React.Fragment key={mi}>
                            <td className="px-1 py-1 text-center border border-nlg-border text-nlg-text-subdued">—</td>
                            <td className="px-1 py-1 text-center border border-nlg-border text-nlg-text-subdued">—</td>
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
                      <td className={`px-1 py-1.5 text-center border border-nlg-border text-[10px] ${scoreTextColor(ytdSc)}`}>{(ytdAchv * 100).toFixed(1)}%</td>
                      <td className={`px-1 py-1.5 text-center border border-nlg-border font-bold text-[11px] ${scoreBg(ytdSc)}`}>{ytdSc}</td>
                    </tr>
                  );
                });
              })}
              {/* Total Row */}
              <tr className="th1 text-white">
                <td className="sticky left-0 z-10 ttotal px-2 py-2 font-bold text-[11px] border tbdr" colSpan={showSOMember ? 3 : 2}>Total Score</td>
                <td className="border tbdr"></td><td className="border tbdr"></td><td className="border tbdr"></td>
                <td className="text-center text-[10px] font-medium border tbdr">{totalWeight.toFixed(0)}%</td>
                <td className="border tbdr"></td>
                {colMonths.map(mi => {
                  const ts = kpis.reduce((s, k) => { const st = kpiMonthStats(k, mi); return s + (st ? st.scoreXW : 0); }, 0);
                  const tg = gradeFromTotal(ts);
                  const cl = ts <= 1.5 ? 'bg-red-500' : ts <= 2.5 ? 'bg-amber-400' : 'bg-green-500';
                  const ring = mi === tv ? ' ring-2 ring-inset ring-white/40' : '';
                  return (
                    <React.Fragment key={mi}>
                      <td colSpan={2} className="px-2 py-1.5 text-right text-[10px] font-semibold border tbdr">Score:</td>
                      <td className={`px-2 py-2 text-center font-bold text-[12px] border tbdr ${cl}${ring}`}>{ts.toFixed(2)}<br /><span className="text-[10px]">{tg.label}</span></td>
                    </React.Fragment>
                  );
                })}
                {(() => {
                  const ytdTs = kpis.reduce((sum, k) => {
                    const sc = [];
                    for (let i = 0; i <= tv; i++) { const st = kpiMonthStats(k, i); if (st) sc.push(st.score); }
                    return sum + (sc.length ? sc.reduce((a, b) => a + b, 0) / sc.length : 0) * k.weight;
                  }, 0);
                  const ytdGr = gradeFromTotal(ytdTs);
                  const ytdCl = ytdTs <= 1.5 ? 'bg-red-500' : ytdTs <= 2.5 ? 'bg-amber-400' : 'bg-green-500';
                  return (
                    <>
                      <td className="px-2 py-1.5 text-right text-[10px] font-semibold border tbdr">YTD:</td>
                      <td className={`px-2 py-2 text-center font-bold text-[12px] border tbdr ${ytdCl}`}>{ytdTs.toFixed(2)}<br /><span className="text-[10px]">{ytdGr.label}</span></td>
                    </>
                  );
                })()}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
