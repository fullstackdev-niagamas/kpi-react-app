import React from 'react';
import { MONTH_LABELS } from '../data/mockData';
import { kpiMonthStats, scoreBg, scoreTextColor, PERSP_META } from '../utils/helpers';
import { FEATURES } from '../config/features';

// Drill-down 1 KPI: riwayat bulanan PENUH (semua bulan aktif, bukan cuma bulan yang sedang dilihat +
// sparkline Trend) + PICA (kalau ada bulan Merah). Dibuka dgn klik nama KPI di BSC Table View.
// Modal dipilih drpd expand-row supaya tidak perlu re-hitung rowSpan Perspective per grup — lebih
// aman thd perubahan kolom ke depan. Dipakai identik di Dashboard Saya & Performa Tim (read-only;
// edit PICA tetap hanya lewat Input Realisasi (Actual), Sec. 9 Project Brief).
export const KPIDetailModal = ({ kpi, activeMonths, year, viewMonthIdx, onClose }) => {
  if (!kpi) return null;
  const meta = PERSP_META[kpi.persp] || PERSP_META.Financial;
  const picaMonths = FEATURES.PICA_ENABLED ? activeMonths.filter(mi => (kpi.pica?.[mi] || []).length > 0) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-nlg-card shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-nlg-border" style={{ background: meta.light }}>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: meta.textColor }}>
              {kpi.persp}{kpi.so ? ` · ${kpi.so}` : ''}
            </div>
            <div className="text-[15px] font-bold text-nlg-text mt-0.5">{kpi.name}</div>
            <div className="text-[11px] text-nlg-text-subdued mt-1">
              {kpi.type} · {kpi.uom} · {kpi.period} · Bobot {(kpi.weight * 100).toFixed(0)}% · Target {kpi.target}{kpi.uom === '%' ? '%' : ''}
            </div>
          </div>
          <button onClick={onClose} className="text-nlg-text-subdued hover:text-nlg-text text-lg leading-none shrink-0">✕</button>
        </div>

        <div className="px-5 py-4">
          <div className="text-[11px] font-semibold text-nlg-text-subdued uppercase tracking-wide mb-2">Riwayat Bulanan {year}</div>
          <div className="overflow-x-auto rounded-nlg-input border border-nlg-border">
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-nlg-sidebar text-nlg-text-muted">
                  <th className="px-2 py-1.5 text-left border-b border-nlg-border">Bulan</th>
                  <th className="px-2 py-1.5 text-center border-b border-nlg-border">Actual</th>
                  <th className="px-2 py-1.5 text-center border-b border-nlg-border">Ach%</th>
                  <th className="px-2 py-1.5 text-center border-b border-nlg-border">Score</th>
                </tr>
              </thead>
              <tbody>
                {activeMonths.map(mi => {
                  const st = kpiMonthStats(kpi, mi);
                  const isViewed = mi === viewMonthIdx;
                  return (
                    <tr key={mi} className={isViewed ? 'bg-nlg-primary-tint/50' : ''}>
                      <td className="px-2 py-1.5 border-b border-nlg-border font-medium">{MONTH_LABELS[mi]}{isViewed ? ' •' : ''}</td>
                      {st ? (
                        <>
                          <td className="px-2 py-1.5 text-center border-b border-nlg-border">{st.mtd.toFixed(1)}{kpi.uom === '%' ? '%' : ''}</td>
                          <td className={`px-2 py-1.5 text-center border-b border-nlg-border ${scoreTextColor(st.score)}`}>{(st.ach * 100).toFixed(1)}%</td>
                          <td className="px-2 py-1.5 text-center border-b border-nlg-border">
                            <span className={`inline-flex items-center justify-center w-6 h-5 rounded-full font-bold ${scoreBg(st.score)}`}>{st.score}</span>
                          </td>
                        </>
                      ) : (
                        <td colSpan={3} className="px-2 py-1.5 text-center border-b border-nlg-border text-nlg-text-subdued italic">Belum ada data</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {picaMonths.length > 0 && (
            <div className="mt-4">
              <div className="text-[11px] font-semibold text-red-600 uppercase tracking-wide mb-2">🔴 PICA (Problem Identification & Corrective Action)</div>
              <div className="space-y-2">
                {picaMonths.map(mi => (kpi.pica[mi] || []).map((row, i) => (
                  <div key={`${mi}-${i}`} className="border border-red-200 bg-red-50/40 rounded-nlg-input p-3 text-[11px]">
                    <div className="font-semibold text-red-700 mb-1">{MONTH_LABELS[mi]} {year}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-nlg-text-subdued">Problem Identification:</span> {row.pi || '—'}</div>
                      <div><span className="text-nlg-text-subdued">Corrective Action:</span> {row.ca || '—'}</div>
                      <div><span className="text-nlg-text-subdued">Deadline:</span> {row.deadline || '—'}</div>
                      <div><span className="text-nlg-text-subdued">PIC:</span> {row.pic || '—'}</div>
                    </div>
                  </div>
                )))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
