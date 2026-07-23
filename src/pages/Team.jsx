import React, { useState, useEffect } from 'react';
import { ACTIVE_PLAN_YEAR, AVAILABLE_YEARS, MONTH_LABELS, CURRENT_MONTH_IDX, TABLE_THEMES } from '../data/mockData';
import { useKPIContext } from '../context/KPIContext';
import { kpiMonthStats, kpiYTDStats, gradeFromTotal, scoreBg, scoreTextColor, levelBadge, PERSP_META, deptScoreAt, deptScoreYTD } from '../utils/helpers';
import { TrendSparkline } from '../components/TrendSparkline';
import { KPIDetailModal } from '../components/KPIDetailModal';
import { FEATURES } from '../config/features';
import { exportDashboardExcel } from '../utils/excel';
import { useToast } from '../context/ToastContext';

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
  // Sejak mirror-penuh ke Dashboard Saya (2026-07-21, lihat komentar `kpis` di Detail View di bawah),
  // Detail Anggota juga menampilkan KPI Draft/Submitted — filter "Draft" ditambahkan spt Dashboard Saya.
  const [teamStatusFilter, setTeamStatusFilter] = useState('all'); // all | red | draft
  const [teamDetailKpi, setTeamDetailKpi] = useState(null);
  // Ditambahkan supaya Detail Anggota jadi mirror sungguhan dari Dashboard Saya (keluhan user
  // 2026-07-21: kedua tampilan seharusnya konsisten krn cuma beda sudut pandang — Superior melihat
  // punya subordinate, User melihat punya sendiri) — viewYear cuma kosmetik spt di Dashboard.jsx
  // (belum ada snapshot data per-tahun sungguhan, lihat Project Brief Sec. 6.1), tableTheme sama
  // persis pola Dashboard.jsx (CSS var global di document.documentElement).
  const [teamViewYear, setTeamViewYear] = useState(ACTIVE_PLAN_YEAR);
  const [teamTableTheme, setTeamTableTheme] = useState('navy');
  const toast = useToast();

  useEffect(() => {
    const t = TABLE_THEMES[teamTableTheme] || TABLE_THEMES.navy;
    const root = document.documentElement;
    Object.entries(t.vars).forEach(([k, val]) => root.style.setProperty(k, val));
  }, [teamTableTheme]);

  const mySubordinates = users.filter(u => u.superior === (currentUserName || 'Budi Santoso'));
  const tv = teamViewMonthIdx;
  const teamIsActiveYear = teamViewYear === ACTIVE_PLAN_YEAR;

  if (!mySubordinates.length) {
    return (
      <div className="mb-5">
        <h1 className="text-xl font-bold text-nlg-text">Performa Tim</h1>
        <p className="text-sm text-nlg-text-muted mt-1">Tidak ada anggota tim yang terdaftar di bawah Anda di Master Data User.</p>
      </div>
    );
  }

  if (!selectedMember && teamView === 'detail') setSelectedMember(mySubordinates[0].name);

  const scoreCl = ts => ts === null ? 'bg-gray-200 text-nlg-text-subdued' : ts <= 1.5 ? 'bg-red-400 text-white' : ts <= 2.5 ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white';

  // KEPUTUSAN DIREVISI (2026-07-21): sebelumnya sengaja difilter Approved/Locked-only ("sudut pandang
  // Superior menilai yang sudah final") — user melaporkan (dgn screenshot) angka Total Score Performa
  // Tim jadi BEDA dari Dashboard Saya milik member yg sama, padahal seharusnya mirror persis. Setelah
  // dikonfirmasi ke user (konflik protokol poin A: opsi "mirror penuh" vs "tetap difilter tapi
  // transparan"), user memilih MIRROR PENUH — jadi filter Approved/Locked-only DIHAPUS, semua status
  // (Draft/Submitted/Approved/Rejected/Locked) ikut dihitung, persis logic `dashKPIs` di Dashboard.jsx.
  // `totalScore` bisa null (member ini belum py KPI terisi bulan `tv` sama sekali) — lihat deptScoreAt
  // (helpers.js): KPI kosong dikeluarkan dari kalkulasi, bobotnya TIDAK ikut jadi penyebut (exclude &
  // re-normalize, konsisten dgn Dashboard/Executive/Monitoring/Reports/StrategyMap).
  const memberStats = mySubordinates.map(u => {
    const kpis = (userKPIs[u.name] || []).map(k => ({ ...k, isDraftOnly: k.status === 'Draft' }));
    const totalScore = deptScoreAt(kpis, tv);
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
    // Rata-rata Total Score antar-anggota tim di bulan mi — member yg sama sekali belum ada KPI
    // terisi bulan itu (deptScoreAt null) dikeluarkan dari rata2, bukan dihitung 0.
    const teamMTDByMonth = MONTH_LABELS.map((_, mi) => {
      const valid = memberStats.map(s => deptScoreAt(s.kpis, mi)).filter(v => v !== null);
      return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
    });
    // Rata-rata YTD antar-anggota — pola sama dgn teamMTDByMonth di atas, dihitung via deptScoreYTD
    // (menghormati kategori LAST/SUM/AVG per KPI, bukan rata2 skor bulanan mentah — lihat komentar
    // deptScoreYTD di helpers.js). Konsisten dgn Dashboard Saya & Detail Anggota yg sudah py baris ini.
    const teamYTDByMonth = MONTH_LABELS.map((_, mi) => {
      const valid = memberStats.map(s => deptScoreYTD(s.kpis, mi)).filter(v => v !== null);
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
                <td className="px-3 py-1 text-[11px] font-semibold bg-nlg-rail border border-nlg-border">Avg Total Score MTD</td>
                {teamMTDByMonth.map((ts, mi) => ts === null
                  ? <td key={mi} className="px-2 py-1 text-center border border-nlg-border text-nlg-text-subdued">—</td>
                  : <td key={mi} className={`px-2 py-1 text-center font-bold border border-nlg-border text-[11px] ${scoreCl(ts)} ${mi === tv ? 'ring-2 ring-inset ring-white/50' : ''}`}>{ts.toFixed(2)}</td>
                )}
              </tr>
              <tr>
                <td className="px-3 py-1 text-[11px] font-semibold bg-nlg-rail border border-nlg-border">Avg Total Score YTD</td>
                {teamYTDByMonth.map((ts, mi) => ts === null
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
                <th className="text-center px-4 py-2.5">Total KPI</th>
                <th className="text-center px-4 py-2.5">Total Score MTD · {MONTH_LABELS[tv]}</th>
                <th className="text-center px-4 py-2.5">Grade</th>
                <th className="text-center px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {memberStats.map(s => {
                const cl = s.totalScore === null ? 'bg-gray-200 text-nlg-text-subdued' : s.totalScore <= 1.5 ? 'bg-red-500 text-white' : s.totalScore <= 2.5 ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white';
                return (
                  <tr key={s.name} className="border-t border-nlg-border hover:bg-nlg-sidebar/40 cursor-pointer"
                    onClick={() => { setTeamView('detail'); setSelectedMember(s.name); setTeamViewMonthIdx(CURRENT_MONTH_IDX); setTeamDashView('table'); }}>
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-nlg-text-muted text-sm">{s.dept}</td>
                    <td className="px-4 py-3 text-center"><span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${levelBadge(s.level)}`}>{s.level}</span></td>
                    <td className="px-4 py-3 text-center text-sm">{s.kpis.length} KPI</td>
                    <td className="px-4 py-3 text-center"><span className={`font-bold text-sm px-3 py-1 rounded-full ${cl}`}>{s.totalScore !== null ? s.totalScore.toFixed(2) : '—'}</span></td>
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
  // KEPUTUSAN DIREVISI (2026-07-21): sebelumnya difilter Approved/Locked-only ("sudut pandang Superior
  // menilai yang sudah final, beda dgn Dashboard/Planning yg menghitung SEMUA status") — user
  // melaporkan (screenshot) Total Score Detail Anggota beda dari Dashboard Saya member yg sama.
  // Dikonfirmasi ke user via protokol poin A (opsi "mirror penuh" vs "tetap difilter tapi transparan")
  // — user memilih MIRROR PENUH. Filter dihapus, semua status (Draft/Submitted/Approved/Rejected/
  // Locked) ikut dihitung, persis logic `dashKPIs` di Dashboard.jsx (termasuk `isDraftOnly` utk styling).
  const kpis = (userKPIs[sel] || []).map(k => ({ ...k, isDraftOnly: k.status === 'Draft' }));
  // Dibulatkan 2 desimal utk hindari noise floating-point (mis. 99.99999999999999), konsisten dgn
  // Dashboard.jsx/Planning.jsx (satu-satunya sumber data yg sama, userKPIs).
  const totalWeight = Math.round(kpis.reduce((s, k) => s + k.weight, 0) * 100 * 100) / 100;

  // deptScoreAt/deptScoreYTD (helpers.js) — sumber bersama spt di Dashboard/Executive/Monitoring, KPI
  // yg belum terisi bulan ybs dikeluarkan dari kalkulasi (exclude & re-normalize thd bobot terisi).
  const mbrMonthlyTotals = MONTH_LABELS.map((_, mi) => deptScoreAt(kpis, mi));
  const mbrMonthlyYTDTotals = MONTH_LABELS.map((_, mi) => deptScoreYTD(kpis, mi));

  const perspOrder = ['Financial', 'Customer', 'Internal Process', 'Learning & Growth'];
  const filteredMemberKPIs = teamStatusFilter === 'red'
    ? kpis.filter(k => { const st = kpiMonthStats(k, tv); return st && st.score <= 1; })
    : teamStatusFilter === 'draft'
    ? kpis.filter(k => k.isDraftOnly)
    : kpis;
  const groups = perspOrder.map(p => ({ persp: p, kpis: filteredMemberKPIs.filter(k => k.persp === p) })).filter(g => g.kpis.length);
  const colMonths = MONTH_LABELS.map((_, mi) => mi).filter(mi => mi <= CURRENT_MONTH_IDX);
  // Bulan aktif selain yang sedang dilihat (tv) diringkas jadi satu kolom Trend (sparkline) — format
  // identik Dashboard Saya, supaya tabel tidak melebar N-bulan x 3-kolom spt hasil export Excel.
  const trendMonths = colMonths.filter(mi => mi !== tv);
  const trendLabel = trendMonths.length > 1
    ? `${MONTH_LABELS[trendMonths[0]]}–${MONTH_LABELS[trendMonths[trendMonths.length - 1]]}`
    : trendMonths.length === 1 ? MONTH_LABELS[trendMonths[0]] : '';

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

      {/* KEY PERFORMANCE INDICATOR — profil anggota terpilih, mirror persis Dashboard Saya milik
          User sendiri (renderSummaryHeader di Dashboard.jsx), supaya Superior melihat konteks yang
          sama persis dgn yang dilihat member-nya, bukan cuma tabel skor tanpa identitas. */}
      <div className="border border-nlg-border rounded-nlg-card bg-white mb-4 overflow-hidden shadow-sm">
        <div className="bg-[#172B4D] text-white px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-bold tracking-wide">KEY PERFORMANCE INDICATOR</span>
        </div>
        <div className="grid grid-cols-3 border-b border-nlg-border">
          <div className="px-5 py-3 border-r border-nlg-border">
            <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">Name</div>
            <div className="font-semibold text-nlg-text text-[15px]">{selMeta.name || '—'}</div>
          </div>
          <div className="px-5 py-3 border-r border-nlg-border">
            <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">Position</div>
            <div className="font-semibold text-nlg-text text-[15px]">{selMeta.position || '—'}</div>
          </div>
          <div className="px-5 py-3">
            <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">Department</div>
            <div className="font-semibold text-nlg-text text-[15px]">{selMeta.dept || '—'}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 border-b border-nlg-border">
          <div className="px-5 py-3 border-r border-nlg-border">
            <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">NIK</div>
            <div className="font-semibold text-nlg-text font-mono text-[15px]">{selMeta.nik || '—'}</div>
          </div>
          <div className="px-5 py-3 border-r border-nlg-border">
            <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">Branch</div>
            <div className="font-semibold text-nlg-text text-[15px]">{selMeta.branch || '—'}</div>
          </div>
          <div className="px-5 py-3">
            <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">Superior</div>
            <div className="font-semibold text-nlg-text text-[15px]">{selMeta.superior || '—'}</div>
          </div>
        </div>
        <div className="grid grid-cols-3">
          <div className="px-5 py-3 border-r border-nlg-border">
            <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">Email</div>
            <div className="text-[13px] text-nlg-primary">{selMeta.email || '—'}</div>
          </div>
          <div className="px-5 py-3 border-r border-nlg-border">
            <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">Level KPI</div>
            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${levelBadge(selMeta.level)}`}>{selMeta.level}</span>
          </div>
          <div className="px-5 py-3">
            <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wider mb-1">KPI Periode</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {AVAILABLE_YEARS.map(yr => (
                <button key={yr} onClick={() => { setTeamViewYear(yr); setTeamViewMonthIdx(CURRENT_MONTH_IDX); }}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded border transition-colors ${teamViewYear === yr ? 'bg-nlg-primary text-white border-nlg-primary' : 'border-nlg-border text-nlg-text-muted hover:bg-nlg-primary-tint'}`}>
                  {yr}{yr === ACTIVE_PLAN_YEAR ? '🔓' : ''}
                </button>
              ))}
              {!teamIsActiveYear && <span className="text-[10px] text-amber-600 ml-1">🔒 read-only</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="overflow-x-auto mb-4">
        <table className="text-xs border-collapse min-w-full">
          <thead>
            <tr>
              <td className="px-3 py-1.5 font-semibold text-nlg-text bg-nlg-rail border border-nlg-border min-w-[110px]">KPI Score {teamViewYear}</td>
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
            <tr>
              <td className="px-3 py-1 text-[11px] font-semibold bg-nlg-rail border border-nlg-border">Total Score YTD</td>
              {mbrMonthlyYTDTotals.map((ts, mi) => ts === null
                ? <td key={mi} className="px-2 py-1 text-center border border-nlg-border text-nlg-text-subdued">—</td>
                : <td key={mi} className={`px-2 py-1 text-center font-bold border border-nlg-border text-[11px] ${scoreCl(ts)} ${mi === tv ? 'ring-2 ring-inset ring-white/50' : ''}`}>{ts.toFixed(2)}</td>
              )}
            </tr>
          </thead>
        </table>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-[11px] text-nlg-text-subdued">
          Menampilkan: <b className="text-nlg-primary">{MONTH_LABELS[tv]} {teamViewYear}</b>
          {(tv !== CURRENT_MONTH_IDX || !teamIsActiveYear) && <span className="ml-1 opacity-60">· Aktif input: {MONTH_LABELS[CURRENT_MONTH_IDX]} {ACTIVE_PLAN_YEAR} 🔒</span>}
        </div>
        <div className="flex gap-1 items-center">
          {Object.entries(TABLE_THEMES).map(([key, t]) => (
            <button key={key} onClick={() => setTeamTableTheme(key)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded border ${teamTableTheme === key ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border'}`}>
              {t.label}
            </button>
          ))}
          <div className="w-px h-4 bg-nlg-border mx-1"></div>
          <button onClick={() => setTeamDashView('table')} className={`px-3 py-1.5 text-xs font-medium rounded-nlg-input border ${teamDashView === 'table' ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border'}`}>📊 Table View</button>
          <button onClick={() => setTeamDashView('card')} className={`px-3 py-1.5 text-xs font-medium rounded-nlg-input border ${teamDashView === 'card' ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border'}`}>🗂 Card View</button>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <span className="text-[11px] text-nlg-text-subdued mr-1">Filter:</span>
        <button onClick={() => setTeamStatusFilter('all')} className={`px-2.5 py-1 text-[11px] font-medium rounded-full border ${teamStatusFilter === 'all' ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border hover:bg-nlg-sidebar'}`}>Semua ({kpis.length})</button>
        <button onClick={() => setTeamStatusFilter('red')} className={`px-2.5 py-1 text-[11px] font-medium rounded-full border ${teamStatusFilter === 'red' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}>
          🔴 Merah ({kpis.filter(k => { const st = kpiMonthStats(k, tv); return st && st.score <= 1; }).length})
        </button>
        <button onClick={() => setTeamStatusFilter('draft')} className={`px-2.5 py-1 text-[11px] font-medium rounded-full border ${teamStatusFilter === 'draft' ? 'bg-gray-600 text-white border-gray-600' : 'bg-white text-nlg-text-muted border-nlg-border hover:bg-nlg-sidebar'}`}>
          📝 Draft ({kpis.filter(k => k.isDraftOnly).length})
        </button>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] text-nlg-text-subdued ml-auto">Export:</span>
        <button onClick={() => { exportDashboardExcel(selMeta, kpis, teamViewYear); toast(`Performa ${selMeta.name} diexport ke Excel (.xlsx).`); }} className="px-3 py-1.5 text-[11px] font-medium rounded-nlg-input border border-nlg-border text-nlg-text-muted bg-white hover:bg-nlg-sidebar flex items-center gap-1.5">📥 Excel (.xlsx)</button>
        <button onClick={() => window.print()} className="px-3 py-1.5 text-[11px] font-medium rounded-nlg-input border border-nlg-border text-nlg-text-muted bg-white hover:bg-nlg-sidebar flex items-center gap-1.5">🖨️ Print / PDF</button>
      </div>

      {groups.length === 0 ? (
        <div className="border border-nlg-border rounded-nlg-card p-8 text-center text-[12px] text-nlg-text-subdued">
          Tidak ada KPI yang cocok dengan filter ini. <button onClick={() => setTeamStatusFilter('all')} className="text-nlg-primary hover:underline font-medium">Reset filter</button>
        </div>
      ) : teamDashView === 'card' ? (
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
                    // `hasYTD` sebelumnya cuma cek bulan `tv` (salah utk kategori SUM/AVG yg py data di
                    // bulan lain) & `achYTD` dihitung manual tanpa guard KPI kosong-total (root cause bug
                    // 2026-07-22, sama spt Dashboard.jsx) — diganti `kpiYTDStats` null-safe & sadar kategori.
                    const stYTD = kpiYTDStats(k, tv);
                    const hasYTD = !!stYTD;
                    const achYTD = hasYTD ? stYTD.ach : 0;
                    const scoreYTD = hasYTD ? stYTD.score : 0;
                    return (
                      <div
                        key={k.id}
                        className={`border border-nlg-border rounded-nlg-card p-3 bg-white cursor-pointer hover:shadow-md transition-shadow ${k.isDraftOnly ? 'opacity-70' : ''}`}
                        onClick={() => setTeamDetailKpi(k)}
                        title={FEATURES.PICA_ENABLED ? 'Klik untuk lihat detail riwayat & PICA' : 'Klik untuk lihat detail riwayat'}
                      >
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
                        {k.isDraftOnly && <div className="text-[10px] text-nlg-text-subdued text-center pt-2 mt-2 border-t border-nlg-border">Draft — belum disubmit</div>}
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
          <table className="border-collapse min-w-full bg-white text-[11px] tbl-zebra tbl-clean">
            <thead className="sticky top-0 z-10">
              <tr className="th1 text-white text-[10px]">
                <th rowSpan={2} className="sticky left-0 z-20 th1 px-2 py-2 text-left min-w-[90px] border tbdr align-middle">Perspective</th>
                {showSOMember && <th rowSpan={2} className="sticky left-[90px] z-20 th1 px-2 py-2 text-left min-w-[110px] border tbdr align-middle">Strategic Obj.</th>}
                <th rowSpan={2} className={`${showSOMember ? 'sticky left-[200px]' : 'sticky left-[90px]'} sticky-shadow z-20 th1 px-2 py-2 text-left min-w-[140px] border tbdr align-middle`}>KPI</th>
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
                  {MONTH_LABELS[tv]}-{String(teamViewYear).slice(2)}{tv === CURRENT_MONTH_IDX && teamIsActiveYear ? ' 🔒' : ''}
                </th>
                <th colSpan={2} className="tytd px-2 py-2 text-center border tbdr">YTD (Jan–{MONTH_LABELS[tv]}, {teamViewYear})</th>
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
                const pw = (g.kpis.reduce((s, k) => s + k.weight, 0) * 100).toFixed(0);
                return g.kpis.map((k, ki) => {
                  // Null-safe (root cause bug 2026-07-22): lihat catatan `kpiYTDStats` di helpers.js.
                  // Sengaja TIDAK digating `k.isDraftOnly` (root cause bug 2026-07-23, lihat catatan
                  // Dashboard.jsx `renderKPICard`) — status Draft (mis. dari QA Mode) tidak berarti
                  // datanya kosong; kolom MTD di bawah ini sudah lebih dulu benar (tidak pernah
                  // digating isDraftOnly), YTD menyusul supaya konsisten.
                  const stYTD = kpiYTDStats(k, tv);
                  const kpiLeft = showSOMember ? 'sticky left-[200px]' : 'sticky left-[90px]';
                  return (
                    <tr key={k.id} className={`hover:bg-nlg-sidebar/40 ${k.isDraftOnly ? 'opacity-75 bg-gray-50/50' : ''}`}>
                      {ki === 0 && (
                        <td
                          className="sticky left-0 z-10 px-2 py-1.5 font-bold text-[11px] border border-nlg-border align-top"
                          style={{ background: PERSP_META[g.persp].light, borderLeft: `4px solid ${PERSP_META[g.persp].color}`, color: PERSP_META[g.persp].textColor }}
                          rowSpan={g.kpis.length}
                        >
                          <div>{g.persp}</div>
                          <div className="text-[10px] font-normal opacity-70">{pw}%</div>
                        </td>
                      )}
                      {showSOMember && <td className="sticky left-[90px] bg-white px-2 py-1.5 text-[10px] border border-nlg-border text-nlg-text-subdued">{k.so || '—'}</td>}
                      <td
                        className={`${kpiLeft} sticky-shadow bg-white px-2 py-1.5 text-[11px] font-medium border border-nlg-border cursor-pointer hover:text-nlg-primary hover:underline`}
                        onClick={() => setTeamDetailKpi(k)}
                        title={FEATURES.PICA_ENABLED ? 'Klik untuk lihat detail riwayat & PICA' : 'Klik untuk lihat detail riwayat'}
                      >
                        {k.name}
                        {k.isDraftOnly && <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-gray-100 text-nlg-text-subdued">{k.status}</span>}
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
                                tooltip: st ? `${MONTH_LABELS[mi]} ${teamViewYear} — Actual ${st.mtd.toFixed(1)}${k.uom === '%' ? '%' : ''} · Ach ${(st.ach * 100).toFixed(1)}% · Score ${st.score}` : `${MONTH_LABELS[mi]} ${teamViewYear} — belum ada data`,
                              };
                            })}
                            onSelectMonth={setTeamViewMonthIdx}
                          />
                        </td>
                      )}
                      {(() => {
                        const st = kpiMonthStats(k, tv);
                        if (!st) return (
                          <>
                            <td className="px-1 py-1 text-center border border-nlg-border text-nlg-text-subdued">—</td>
                            <td className="px-1 py-1 text-center border border-nlg-border text-nlg-text-subdued">—</td>
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
                <td className="sticky left-0 z-10 ttotal px-2 py-2 font-bold text-[11px] border tbdr" colSpan={showSOMember ? 3 : 2}>Total Score</td>
                <td className="border tbdr"></td><td className="border tbdr"></td><td className="border tbdr"></td>
                <td className="text-center text-[10px] font-medium border tbdr">{totalWeight.toFixed(0)}%</td>
                <td className="border tbdr"></td>
                {trendMonths.length > 0 && (
                  <td className="border tbdr text-center align-middle">
                    <TrendSparkline
                      points={trendMonths.map(mi => ({
                        mi,
                        value: mbrMonthlyTotals[mi],
                        tooltip: mbrMonthlyTotals[mi] !== null ? `${MONTH_LABELS[mi]} ${teamViewYear} — Total Score ${mbrMonthlyTotals[mi].toFixed(2)}` : `${MONTH_LABELS[mi]} ${teamViewYear} — belum ada data`,
                      }))}
                      onSelectMonth={setTeamViewMonthIdx}
                    />
                  </td>
                )}
                {(() => {
                  const ts = mbrMonthlyTotals[tv];
                  const tg = gradeFromTotal(ts);
                  const cl = ts === null ? 'bg-gray-300' : ts <= 1.5 ? 'bg-red-500' : ts <= 2.5 ? 'bg-yellow-400 text-black' : 'bg-green-500';
                  return (
                    <>
                      <td colSpan={2} className="px-2 py-1.5 text-right text-[10px] font-semibold border tbdr">Score {MONTH_LABELS[tv]}:</td>
                      <td className={`px-2 py-2 text-center font-bold text-[12px] border tbdr ${cl}`}>{ts !== null ? ts.toFixed(2) : '—'}<br /><span className="text-[10px]">{tg.label}</span></td>
                    </>
                  );
                })()}
                {(() => {
                  const ytdTs = mbrMonthlyYTDTotals[tv];
                  const ytdGr = gradeFromTotal(ytdTs);
                  const ytdCl = ytdTs === null ? 'bg-gray-300' : ytdTs <= 1.5 ? 'bg-red-500' : ytdTs <= 2.5 ? 'bg-yellow-400 text-black' : 'bg-green-500';
                  return (
                    <>
                      <td className="px-2 py-1.5 text-right text-[10px] font-semibold border tbdr">YTD:</td>
                      <td className={`px-2 py-2 text-center font-bold text-[12px] border tbdr ${ytdCl}`}>{ytdTs !== null ? ytdTs.toFixed(2) : '—'}<br /><span className="text-[10px]">{ytdGr.label}</span></td>
                    </>
                  );
                })()}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <KPIDetailModal kpi={teamDetailKpi} activeMonths={colMonths} year={teamViewYear} viewMonthIdx={tv} onClose={() => setTeamDetailKpi(null)} />
    </div>
  );
};
