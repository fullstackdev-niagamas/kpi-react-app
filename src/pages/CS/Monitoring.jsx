import { useState } from 'react';
import { MONTH_LABELS, ACTIVE_PLAN_YEAR, AVAILABLE_YEARS, CURRENT_MONTH_IDX } from '../../data/mockData';
import { useKPIContext } from '../../context/KPIContext';
import { kpiMonthStats, gradeFromTotal, gradeFromScore, badgeColorByPersp, buildDeptAggregates } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

// Distribusi grade KPI dalam satu dept (B/C/K) di bulan mi
function gradeDistribution(kpis, mi) {
  const dist = { B: 0, C: 0, K: 0 };
  kpis.forEach(k => {
    const st = kpiMonthStats(k, mi);
    if (!st) return;
    const g = gradeFromScore(st.score).label;
    dist[g] = (dist[g] || 0) + 1;
  });
  return dist;
}

function redCount(kpis, mi) {
  return kpis.filter(k => { const st = kpiMonthStats(k, mi); return st && st.score <= 1; }).length;
}

export const Monitoring = () => {
  const { users, userKPIs, batches } = useKPIContext();
  const [viewYear, setViewYear] = useState(ACTIVE_PLAN_YEAR);
  const [viewMonth, setViewMonth] = useState(CURRENT_MONTH_IDX);
  const [selectedDept, setSelectedDept] = useState(null);
  const toast = useToast();

  // Dept & Score dihitung live dari users + userKPIs + batches sungguhan (Sec. 8) — bukan dataset
  // statis terpisah. Dept tanpa KPI (mis. BOD) otomatis tidak tampil — lihat buildDeptAggregates.
  const depts = buildDeptAggregates(users, userKPIs, batches, viewMonth);

  const totalDept = depts.length;
  const submitted = depts.reduce((s, d) => s + d.submitted, 0);
  const approved = depts.reduce((s, d) => s + d.approved, 0);
  const pending = depts.reduce((s, d) => s + d.pending, 0);
  const submitRate = submitted ? Math.round((approved / submitted) * 100) : 0;
  const companyScore = totalDept ? depts.reduce((s, d) => s + d.score, 0) / totalDept : 0;
  const companyGrade = gradeFromTotal(companyScore);
  const totalRed = depts.reduce((s, d) => s + redCount(d.kpis, viewMonth), 0);
  const allRed = depts.flatMap(d => d.kpis.filter(k => { const st = kpiMonthStats(k, viewMonth); return st && st.score <= 1; }).map(k => ({ ...k, dept: d.dept })));

  // ── DRILL DOWN ──
  if (selectedDept) {
    const dept = depts.find(d => d.dept === selectedDept);
    const kpis = dept?.kpis || [];
    return (
      <div className="mb-5">
        <h1 className="text-xl font-bold text-nlg-text mb-1">Monitoring — {selectedDept}</h1>
        <button onClick={() => setSelectedDept(null)} className="text-sm text-nlg-primary hover:underline mb-4 inline-block">← Kembali ke ringkasan</button>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="border border-nlg-border rounded-nlg-card bg-white p-4"><div className="text-[10px] font-semibold text-nlg-text-subdued uppercase mb-1">Score ({MONTH_LABELS[viewMonth]})</div><div className={`text-2xl font-bold ${dept.score >= 2.5 ? 'text-green-600' : dept.score >= 1.5 ? 'text-amber-500' : 'text-red-600'}`}>{dept.score.toFixed(2)}</div></div>
          <div className="border border-nlg-border rounded-nlg-card bg-white p-4"><div className="text-[10px] font-semibold text-nlg-text-subdued uppercase mb-1">Submitted</div><div className="text-2xl font-bold text-nlg-primary">{dept.submitted}</div></div>
          <div className="border border-nlg-border rounded-nlg-card bg-white p-4"><div className="text-[10px] font-semibold text-nlg-text-subdued uppercase mb-1">Approved</div><div className="text-2xl font-bold text-green-600">{dept.approved}</div></div>
          <div className="border border-nlg-border rounded-nlg-card bg-white p-4"><div className="text-[10px] font-semibold text-nlg-text-subdued uppercase mb-1">Pending</div><div className="text-2xl font-bold text-amber-500">{dept.pending}</div></div>
        </div>
        <div className="border border-nlg-border rounded-nlg-card bg-white overflow-hidden">
          <div className="px-4 py-3 bg-nlg-sidebar border-b border-nlg-border text-sm font-semibold">Detail KPI di {selectedDept}</div>
          <table className="w-full text-sm text-left">
            <thead className="text-nlg-text-subdued text-[11px] uppercase border-b border-nlg-border">
              <tr><th className="px-4 py-3">KPI</th><th className="px-4 py-3">Perspektif</th><th className="px-4 py-3 text-center">%Actual MTD</th><th className="px-4 py-3 text-center">Score</th></tr>
            </thead>
            <tbody className="divide-y divide-nlg-border">
              {kpis.map(k => {
                const st = kpiMonthStats(k, viewMonth);
                const g = st ? gradeFromScore(st.score) : null;
                return (
                  <tr key={k.id} className="hover:bg-nlg-sidebar/40">
                    <td className="px-4 py-3 font-medium">{k.name}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] px-1.5 py-0.5 rounded ${badgeColorByPersp(k.persp)}`}>{k.persp}</span></td>
                    <td className="px-4 py-3 text-center">{st ? st.mtd.toFixed(1) + (k.uom === '%' ? '%' : '') : '—'}</td>
                    <td className="px-4 py-3 text-center">{g ? <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${g.cls}`}>{st.score} · {g.label}</span> : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold text-nlg-text mb-1">Monitoring Dashboard</h1>
      <p className="text-sm text-nlg-text-muted mb-5">Pantau status submission & performa KPI seluruh Departemen.</p>

      {/* Year/Month selector */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-nlg-text-muted">Tahun:</span>
          {AVAILABLE_YEARS.map(yr => (
            <button key={yr} onClick={() => setViewYear(yr)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors ${viewYear === yr ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border'}`}>
              {yr}{yr === ACTIVE_PLAN_YEAR ? ' 🔓' : ''}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-medium text-nlg-text-muted shrink-0">Bulan:</span>
          {MONTH_LABELS.map((lbl, mi) => (
            <button key={mi} onClick={() => mi <= CURRENT_MONTH_IDX && setViewMonth(mi)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-full border transition-colors ${viewMonth === mi ? 'bg-nlg-primary text-white border-nlg-primary' : mi <= CURRENT_MONTH_IDX ? 'bg-white text-nlg-text-muted border-nlg-border hover:bg-nlg-primary-tint' : 'bg-nlg-sidebar text-nlg-text-subdued border-nlg-border opacity-40 cursor-default'}`}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Header cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="border border-nlg-border rounded-nlg-card bg-[#172B4D] text-white p-4">
          <div className="text-[10px] font-semibold text-white/70 uppercase mb-1">Total Score Company</div>
          <div className="text-2xl font-bold">{companyScore.toFixed(2)}</div>
          <span className={`mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded-full ${companyGrade.cls}`}>{companyGrade.text}</span>
        </div>
        <div className="border border-nlg-border rounded-nlg-card bg-white p-4"><div className="text-[10px] font-semibold text-nlg-text-subdued uppercase mb-1">Submit Rate</div><div className="text-2xl font-bold text-green-600">{submitRate}%</div></div>
        <div className="border border-nlg-border rounded-nlg-card bg-white p-4"><div className="text-[10px] font-semibold text-nlg-text-subdued uppercase mb-1">Pending Approval</div><div className="text-2xl font-bold text-amber-500">{pending}</div></div>
        <div className="border border-nlg-border rounded-nlg-card bg-white p-4"><div className="text-[10px] font-semibold text-nlg-text-subdued uppercase mb-1">🔴 KPI Merah</div><div className="text-2xl font-bold text-red-600">{totalRed}</div></div>
        <div className="border border-nlg-border rounded-nlg-card bg-white p-4"><div className="text-[10px] font-semibold text-nlg-text-subdued uppercase mb-1">Dept Aktif</div><div className="text-2xl font-bold text-nlg-primary">{totalDept}</div></div>
      </div>

      {/* Performa per Departemen (heatmap) */}
      <div className="border border-nlg-border rounded-nlg-card bg-white overflow-hidden mb-6">
        <div className="px-4 py-3 bg-nlg-sidebar border-b border-nlg-border flex items-center justify-between">
          <span className="text-sm font-semibold">Performa per Departemen</span>
          <span className="text-[10px] text-nlg-text-muted">🟢 Baik ≥2.5 · 🟡 Cukup 1.5–2.5 · 🔴 Kurang &lt;1.5</span>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-nlg-text-subdued text-[11px] uppercase border-b border-nlg-border">
            <tr>
              <th className="px-4 py-3">Departemen</th>
              <th className="px-4 py-3 text-center">Avg Score</th>
              <th className="px-4 py-3">Distribusi KPI (B/C/K)</th>
              <th className="px-4 py-3">Submission</th>
              <th className="px-4 py-3 text-center">Flag</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-nlg-border">
            {depts.map((d, i) => {
              const g = gradeFromTotal(d.score);
              const dist = gradeDistribution(d.kpis, viewMonth);
              const totalK = dist.B + dist.C + dist.K || 1;
              const reds = redCount(d.kpis, viewMonth);
              const flag = reds > 0 ? { icon: '⚠️', txt: 'merah', cls: 'text-red-600' } : d.pending > 0 ? { icon: '🕓', txt: 'pending', cls: 'text-amber-600' } : { icon: '✅', txt: 'OK', cls: 'text-green-600' };
              return (
                <tr key={i} className="hover:bg-nlg-sidebar/40">
                  <td className="px-4 py-3 font-medium text-nlg-text cursor-pointer hover:text-nlg-primary" onClick={() => setSelectedDept(d.dept)}>{d.dept}</td>
                  <td className="px-4 py-3 text-center"><span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full ${g.cls}`}>{d.score.toFixed(2)} {g.label}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-3 w-32 rounded-full overflow-hidden bg-nlg-sidebar">
                        <div className="bg-green-500" style={{ width: `${(dist.B / totalK) * 100}%` }}></div>
                        <div className="bg-amber-400" style={{ width: `${(dist.C / totalK) * 100}%` }}></div>
                        <div className="bg-red-500" style={{ width: `${(dist.K / totalK) * 100}%` }}></div>
                      </div>
                      <span className="text-[10px] text-nlg-text-muted">{dist.B}/{dist.C}/{dist.K}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-nlg-sidebar overflow-hidden"><div className="h-full bg-nlg-primary" style={{ width: `${d.submitted ? (d.approved / d.submitted) * 100 : 0}%` }}></div></div>
                      <span className="text-[10px] text-nlg-text-muted">{d.approved}/{d.submitted}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-center text-[11px] font-medium ${flag.cls}`}>{flag.icon} {flag.txt}</td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button onClick={() => setSelectedDept(d.dept)} className="text-nlg-primary hover:underline text-[11px] font-medium mr-2">Detail</button>
                    <button onClick={() => toast(`Reminder pengisian KPI dikirim ke ${d.dept}.`)} className="text-nlg-primary hover:underline text-[11px] font-medium">Kirim Reminder</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* KPI at Risk */}
      <div className="border border-nlg-border rounded-nlg-card bg-white overflow-hidden mb-6">
        <div className="px-4 py-3 bg-nlg-sidebar border-b border-nlg-border text-sm font-semibold">🔴 KPI at Risk (Zona Merah)</div>
        {allRed.length === 0 ? (
          <div className="p-6 text-center text-green-600 text-sm">🟢 Tidak ada KPI di zona merah bulan ini.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-nlg-text-subdued text-[11px] uppercase border-b border-nlg-border">
              <tr><th className="px-4 py-3">KPI</th><th className="px-4 py-3">Dept</th><th className="px-4 py-3">Perspektif</th><th className="px-4 py-3 text-center">%Actual MTD</th><th className="px-4 py-3 text-center">Score</th></tr>
            </thead>
            <tbody className="divide-y divide-nlg-border">
              {allRed.map((k, i) => {
                const st = kpiMonthStats(k, viewMonth);
                return (
                  <tr key={i} className="hover:bg-red-50/40">
                    <td className="px-4 py-3 font-medium">{k.name}</td>
                    <td className="px-4 py-3 text-nlg-text-muted">{k.dept}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] px-1.5 py-0.5 rounded ${badgeColorByPersp(k.persp)}`}>{k.persp}</span></td>
                    <td className="px-4 py-3 text-center text-red-600 font-bold">{st ? st.mtd.toFixed(1) : '—'}{k.uom === '%' ? '%' : ''}</td>
                    <td className="px-4 py-3 text-center"><span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{st?.score} · K</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Per Dept (user level substitute) */}
      <div className="border border-nlg-border rounded-nlg-card bg-white overflow-hidden">
        <div className="px-4 py-3 bg-nlg-sidebar border-b border-nlg-border text-sm font-semibold">Detail Score per Departemen</div>
        <table className="w-full text-sm text-left">
          <thead className="text-nlg-text-subdued text-[11px] uppercase border-b border-nlg-border">
            <tr><th className="px-4 py-3">Departemen</th><th className="px-4 py-3 text-center">Jumlah KPI</th><th className="px-4 py-3 text-center">Score MTD</th><th className="px-4 py-3 text-center">KPI Merah</th><th className="px-4 py-3 text-center">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-nlg-border">
            {depts.map((d, i) => {
              const g = gradeFromTotal(d.score);
              const reds = redCount(d.kpis, viewMonth);
              return (
                <tr key={i} className="hover:bg-nlg-sidebar/40">
                  <td className="px-4 py-3 font-medium">{d.dept}</td>
                  <td className="px-4 py-3 text-center">{d.kpis.length}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${g.cls}`}>{d.score.toFixed(2)}</span></td>
                  <td className="px-4 py-3 text-center">{reds > 0 ? <span className="text-red-600 font-bold">{reds}</span> : '0'}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${d.pending > 0 ? 'bg-nlg-primary-tint text-nlg-primary' : 'bg-green-100 text-green-700'}`}>{d.pending > 0 ? 'Pending' : 'Approved'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
