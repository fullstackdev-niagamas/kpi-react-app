import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { exportReportExcel } from '../../utils/excel';
import {
  AVAILABLE_YEARS,
  ACTIVE_PLAN_YEAR,
  MONTH_LABELS,
  CURRENT_MONTH_IDX,
} from '../../data/mockData';
import { useKPIContext } from '../../context/KPIContext';
import { kpiMonthStats, gradeFromTotal, buildDeptAggregates } from '../../utils/helpers';
import { FEATURES } from '../../config/features';

const CONTENT_SECTIONS = [
  { id: 'exec', label: 'Executive Summary (Company Score + 4 Perspektif)' },
  { id: 'cascade', label: 'Cascading Dept Scorecard' },
  { id: 'detail', label: 'KPI Detail per Dept (bulan terpilih)' },
  ...(FEATURES.PICA_ENABLED ? [{ id: 'pica', label: 'PICA Log (KPI Merah + Action Plan)' }] : []),
];

// Build periode options: 12 months (MTD) + roll-up YTD windows.
const buildPeriodeOptions = (year) => {
  const months = MONTH_LABELS.map((m, i) => ({ value: `m${i}`, label: `${m} ${year} (MTD)` }));
  return [
    ...months,
    { value: 'q1', label: `Q1 ${year} (YTD)` },
    { value: 'q2', label: `Q2 ${year} (YTD)` },
    { value: 's1', label: `S1 ${year} (YTD)` },
    { value: 'fy', label: `Full Year ${year} (YTD)` },
  ];
};

export const Reports = () => {
  const { users, userKPIs, batches } = useKPIContext();
  const toast = useToast();
  const [year, setYear] = useState(ACTIVE_PLAN_YEAR);
  const [periode, setPeriode] = useState('m' + CURRENT_MONTH_IDX);
  const [scope, setScope] = useState('Seluruh Company');
  const [checked, setChecked] = useState({ exec: true, cascade: true, detail: true, pica: FEATURES.PICA_ENABLED });
  const [showPreview, setShowPreview] = useState(false);

  // Dept live dari data sungguhan (Sec. 8) — sama dengan Monitoring/Executive.
  const allDepts = buildDeptAggregates(users, userKPIs, batches, CURRENT_MONTH_IDX);
  const periodeOptions = buildPeriodeOptions(year);
  const periodeLabel = periodeOptions.find((p) => p.value === periode)?.label || '';
  const scopeDepts =
    scope === 'Seluruh Company' ? allDepts.map((d) => d.dept) : [scope];

  const toggleContent = (id) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  // Dipakai bersama oleh Preview (di layar) & Export Excel/Print — supaya isi yang di-preview User
  // dijamin identik dgn yang benar2 di-export, bukan 2 implementasi terpisah yg bisa divergen.
  const buildSections = () => {
    const sections = [];

    // 1. Executive Summary — company/dept scores & grades.
    if (checked.exec) {
      const rows = [
        [`Executive Summary — ${scope} — ${periodeLabel}`],
        [],
        ['Scope', 'Total Score', 'Grade', 'Submitted', 'Approved', 'Pending'],
      ];
      const targetRows =
        scope === 'Seluruh Company'
          ? allDepts
          : allDepts.filter((d) => d.dept === scope);
      // Company aggregate row (only when whole-company scope). Dept dgn score null (belum ada KPI
      // terisi bulan ini) dikeluarkan dari rata2 — konsisten dgn deptScoreAt (exclude & re-normalize).
      if (scope === 'Seluruh Company') {
        const scoredRows = targetRows.filter((d) => d.score !== null);
        const compScore = scoredRows.length
          ? scoredRows.reduce((a, d) => a + d.score, 0) / scoredRows.length
          : null;
        const cg = gradeFromTotal(compScore);
        rows.push([
          'Company (Rata-rata)',
          compScore !== null ? compScore.toFixed(2) : '—',
          `${cg.label} — ${cg.text}`,
          targetRows.reduce((a, d) => a + d.submitted, 0),
          targetRows.reduce((a, d) => a + d.approved, 0),
          targetRows.reduce((a, d) => a + d.pending, 0),
        ]);
      }
      targetRows.forEach((d) => {
        const g = gradeFromTotal(d.score);
        rows.push([
          d.dept,
          d.score !== null ? d.score.toFixed(2) : '—',
          `${g.label} — ${g.text}`,
          d.submitted,
          d.approved,
          d.pending,
        ]);
      });
      sections.push({ name: 'Executive Summary', rows });
    }

    // 2. Cascading Dept Scorecard — per-dept score rows.
    if (checked.cascade) {
      const rows = [
        [`Cascading Dept Scorecard — ${periodeLabel}`],
        [],
        ['Departemen', 'Total Score', 'Grade', '% Approved'],
      ];
      allDepts.filter((d) => scopeDepts.includes(d.dept)).forEach((d) => {
        const g = gradeFromTotal(d.score);
        const pctApproved = d.submitted ? Math.round((d.approved / d.submitted) * 100) : 0;
        rows.push([d.dept, d.score !== null ? d.score.toFixed(2) : '—', `${g.label} — ${g.text}`, `${pctApproved}%`]);
      });
      sections.push({ name: 'Cascading Scorecard', rows });
    }

    // 3. KPI Detail per Dept — per-dept KPI rows (score at CURRENT_MONTH_IDX).
    if (checked.detail) {
      const rows = [
        [`KPI Detail per Dept — ${periodeLabel}`],
        [],
        ['Departemen', 'KPI', 'Perspektif', 'Weight', 'Target', 'Actual (MTD)', 'Ach%', 'Score'],
      ];
      scopeDepts.forEach((dept) => {
        (allDepts.find((d) => d.dept === dept)?.kpis || []).forEach((k) => {
          const st = kpiMonthStats(k, CURRENT_MONTH_IDX);
          rows.push([
            dept,
            k.name,
            k.persp,
            `${Math.round(k.weight * 100)}%`,
            `${k.target} ${k.uom}`,
            st ? st.mtd.toFixed(1) : '-',
            st ? `${(st.ach * 100).toFixed(0)}%` : '-',
            st ? st.score : '-',
          ]);
        });
      });
      sections.push({ name: 'KPI Detail', rows });
    }

    // 4. PICA Log — at-risk (red) KPIs needing an action plan.
    if (checked.pica) {
      const rows = [
        [`PICA Log — KPI Merah — ${periodeLabel}`],
        [],
        ['Departemen', 'KPI', 'Perspektif', 'Score', 'Ach%', 'Status'],
      ];
      let found = 0;
      scopeDepts.forEach((dept) => {
        (allDepts.find((d) => d.dept === dept)?.kpis || []).forEach((k) => {
          const st = kpiMonthStats(k, CURRENT_MONTH_IDX);
          if (st && st.score <= 1) {
            found += 1;
            rows.push([
              dept,
              k.name,
              k.persp,
              st.score,
              `${(st.ach * 100).toFixed(0)}%`,
              'Perlu Action Plan',
            ]);
          }
        });
      });
      if (!found) rows.push(['—', 'Tidak ada KPI merah pada periode ini', '', '', '', '']);
      sections.push({ name: 'PICA Log', rows });
    }

    return sections;
  };

  const handleExport = () => {
    const anyChecked = Object.values(checked).some(Boolean);
    if (!anyChecked) {
      toast('Pilih minimal satu konten laporan.', 'warn');
      return;
    }
    exportReportExcel(`Laporan_Strategis_${scope}_${year}`, buildSections());
    toast(`Laporan diexport ke Excel — ${scope} · ${periodeLabel}.`);
  };

  const handlePrint = () => {
    const anyChecked = Object.values(checked).some(Boolean);
    if (!anyChecked) {
      toast('Pilih minimal satu konten laporan.', 'warn');
      return;
    }
    // Dulu window.print() langsung mencetak halaman apa adanya (cuma form pengaturan, bukan isi
    // laporan) — sekarang pastikan Preview terbuka dulu (berisi tabel sungguhan) baru trigger print,
    // supaya "Print / PDF" benar-benar mencetak konten laporan, bukan panel pengaturan.
    setShowPreview(true);
    setTimeout(() => window.print(), 80);
  };

  return (
    <div>
      <div className="mb-5 no-print">
        <h1 className="text-xl font-bold text-nlg-text">Laporan Strategis</h1>
        <p className="text-sm text-nlg-text-muted mt-1">
          Export data KPI untuk periode yang dipilih.
        </p>
      </div>

      {/* Year toggle */}
      <div className="flex items-center gap-2 mb-5 flex-wrap no-print">
        <span className="text-[11px] font-medium text-nlg-text-muted shrink-0">
          Periode Laporan:
        </span>
        {AVAILABLE_YEARS.map((yr) => {
          const active = year === yr;
          const marker =
            yr === ACTIVE_PLAN_YEAR ? ' 🔓' : yr < ACTIVE_PLAN_YEAR ? ' ⏮' : ' ⏭';
          return (
            <button
              key={yr}
              type="button"
              onClick={() => setYear(yr)}
              className={
                'px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors ' +
                (active
                  ? 'bg-nlg-primary text-white border-nlg-primary'
                  : 'bg-white text-nlg-text-muted border-nlg-border hover:bg-nlg-primary-tint')
              }
            >
              {yr}
              {marker}
            </button>
          );
        })}
        <span className="text-[10px] text-nlg-text-subdued ml-2">
          Tahun yang dipilih: <b>{year}</b>
        </span>
      </div>

      {/* Form card */}
      <div className="border border-nlg-border rounded-nlg-card bg-white p-5 max-w-lg no-print">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-nlg-text-muted">Periode</label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white"
            >
              {periodeOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-nlg-text-muted">Scope</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white"
            >
              <option>Seluruh Company</option>
              {allDepts.map((d) => (
                <option key={d.dept}>{d.dept}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <label className="text-xs font-medium text-nlg-text-muted block">
            Konten Laporan
          </label>
          {CONTENT_SECTIONS.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={checked[c.id]}
                onChange={() => toggleContent(c.id)}
                className="accent-nlg-primary"
              />
              {c.label}
            </label>
          ))}
        </div>

        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="flex-1 px-4 py-2 text-sm rounded-nlg-input border border-nlg-primary text-nlg-primary font-medium hover:bg-nlg-primary-tint"
          >
            {showPreview ? '🙈 Sembunyikan Preview' : '👁️ Preview Laporan'}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex-1 px-4 py-2 text-sm rounded-nlg-input bg-nlg-primary text-white font-medium"
          >
            📥 Export ke Excel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 px-4 py-2 text-sm rounded-nlg-input border border-nlg-border text-nlg-text-muted"
          >
            🖨️ Print / PDF
          </button>
        </div>
      </div>

      {/* Preview — sumber data SAMA persis dengan yg di-export (buildSections()), supaya User bisa
          verifikasi isi laporan dulu sebelum export/print, bukan cuma tebak-tebak dari checkbox. */}
      {showPreview && (
        <div className="border border-nlg-border rounded-nlg-card bg-white p-5 mt-4">
          <div className="flex items-center justify-between mb-4 no-print">
            <div>
              <div className="text-sm font-bold text-nlg-text">👁️ Preview Laporan</div>
              <div className="text-[11px] text-nlg-text-subdued">{scope} · {periodeLabel}</div>
            </div>
            <span className="text-[10px] text-nlg-text-subdued">Isi persis sama dengan hasil Export/Print</span>
          </div>
          {buildSections().length === 0 ? (
            <div className="text-sm text-nlg-text-subdued text-center py-8">Pilih minimal satu konten laporan untuk melihat preview.</div>
          ) : (
            buildSections().map((section) => {
              const [titleRow, , headerRow, ...dataRows] = section.rows;
              return (
                <div key={section.name} className="mb-6 last:mb-0">
                  <div className="text-sm font-bold text-nlg-text mb-2">{titleRow[0]}</div>
                  <div className="overflow-x-auto border border-nlg-border rounded-nlg-card">
                    <table className="w-full text-[11px]">
                      <thead className="bg-[#172B4D] text-white">
                        <tr>{headerRow.map((h, hi) => <th key={hi} className="px-2 py-1.5 text-left whitespace-nowrap">{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {dataRows.map((row, ri) => (
                          <tr key={ri} className="border-t border-nlg-border hover:bg-nlg-sidebar/40">
                            {row.map((cell, ci) => <td key={ci} className="px-2 py-1.5 whitespace-nowrap">{cell}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
