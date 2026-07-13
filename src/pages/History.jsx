import React, { useState } from 'react';
import { ACTIVE_PLAN_YEAR, AVAILABLE_YEARS } from '../data/mockData';
import { useKPIContext } from '../context/KPIContext';
import { statusPill, userShowSO } from '../utils/helpers';

export const History = ({ currentUserName }) => {
  const { users, batches, userKPIs } = useKPIContext();
  const [viewYear, setViewYear] = useState(ACTIVE_PLAN_YEAR);
  const userMeta = users.find(u => u.name === currentUserName?.trim()) || users[0];
  const showSOHist = userShowSO(userMeta);

  const myKPIs = userKPIs[currentUserName] || [];
  // Dibulatkan 2 desimal + toleransi utk cek "lengkap 100%" (bukan `=== 100` yg rapuh thd noise
  // floating-point dari penjumlahan fraksi weight) — konsisten dgn Planning.jsx.
  const myTotalWeight = Math.round(myKPIs.reduce((s, k) => s + k.weight * 100, 0) * 100) / 100;
  const myWeightComplete = Math.abs(myTotalWeight - 100) < 0.1;
  const myDraftCount = myKPIs.filter(k => k.status === 'Draft').length;
  const mySubmittedLockedCount = myKPIs.length - myDraftCount;

  // Riwayat batch milik user ini — sumber sama dengan Approval Queue/Mediation (KPIContext.batches),
  // jadi status di sini otomatis sinkron begitu Superior/CS bertindak (Sec. 8 — sumber tunggal).
  const BATCHES = batches
    .filter(b => b.user === currentUserName)
    .map(b => ({
      id: b.id, batch: b.batch, jenis: b.jenis,
      jumlahKPI: b.kpis.length,
      totalBobot: b.jenis === 'Planning' ? b.kpis.reduce((s, k) => s + (parseFloat(k.bobot) || 0), 0) : null,
      revisi: b.revisi || 0, status: b.status,
      kpis: b.kpis,
      catatan: b.catatan || (b.by ? `${b.status} oleh ${b.by} · ${b.ts}` : 'Menunggu approval Superior'),
    }));

  const renderYearBar = () => (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <span className="text-[11px] font-medium text-nlg-text-muted shrink-0">Tahun KPI:</span>
      {AVAILABLE_YEARS.map(yr => (
        <button key={yr} onClick={() => setViewYear(yr)}
          className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors ${viewYear === yr ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border'}`}>
          {yr}{yr === ACTIVE_PLAN_YEAR ? ' 🔓' : ''}
        </button>
      ))}
    </div>
  );

  const stPillCls = (st) => {
    const map = { Draft: 'bg-gray-100 text-nlg-text-muted', Submitted: 'bg-nlg-primary-tint text-nlg-primary', Approved: 'bg-green-100 text-green-700', Rejected: 'bg-red-100 text-red-700', Locked: 'bg-nlg-text text-white' };
    return map[st] || 'bg-gray-100 text-nlg-text-muted';
  };

  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold text-nlg-text mb-1">Riwayat Submission</h1>
      <p className="text-sm text-nlg-text-muted mb-5">Riwayat batch submission KPI Anda.</p>
      {renderYearBar()}

      <div className="border border-nlg-border rounded-nlg-card bg-white p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] text-nlg-text-subdued">Total Bobot Planning KPI Anda (Tahun {ACTIVE_PLAN_YEAR})</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold">{myTotalWeight.toFixed(0)}%</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${myWeightComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{myWeightComplete ? '✅ Lengkap' : '⚠️ Belum 100%'}</span>
          </div>
        </div>
        <div className="text-[11px] text-nlg-text-subdued text-right">{myDraftCount} KPI Draft · {mySubmittedLockedCount} KPI Submitted/Locked</div>
      </div>

      <div className="space-y-2">
        {BATCHES.map(b => (
          <div key={b.id} className="border border-nlg-border rounded-nlg-card bg-white overflow-hidden">
            <details>
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-nlg-sidebar select-none">
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${b.jenis === 'Planning' ? 'bg-nlg-primary-tint text-nlg-primary' : 'bg-purple-100 text-purple-700'}`}>{b.jenis}</span>
                  <div>
                    <div className="font-semibold text-sm">{b.batch}</div>
                    <div className="text-[11px] text-nlg-text-muted">{b.jumlahKPI} KPI{b.totalBobot !== null ? ` · Total Bobot ${b.totalBobot}%` : ''} · Revisi {b.revisi}/3</div>
                  </div>
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${stPillCls(b.status)}`}>{b.status}</span>
              </summary>
              <div className="border-t border-nlg-border px-4 py-3 bg-nlg-sidebar">
                <table className="w-full text-[11px] mb-2">
                  <thead className="text-nlg-text-subdued border-b border-nlg-border">
                    <tr>
                      <th className="text-left py-1 pr-3">KPI</th>
                      {b.jenis === 'Planning' ? (
                        <>
                          {showSOHist && <th className="text-left py-1 pr-3">Strategic Obj.</th>}
                          <th className="text-center py-1 pr-2">MTD Cat</th>
                          <th className="text-center py-1 pr-2">YTD Cat</th>
                          <th className="text-center py-1 pr-2">Target</th>
                          <th className="text-center py-1">Bobot</th>
                        </>
                      ) : (
                        <>
                          <th className="text-center py-1 pr-2">Factor 1</th>
                          <th className="text-center py-1 pr-2">Factor 2</th>
                          <th className="text-center py-1">%Actual MTD</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {b.kpis.map((k, i) => (
                      <React.Fragment key={i}>
                        <tr className="border-t border-nlg-border/40">
                          <td className="py-1.5 font-medium text-nlg-text pr-3">{k.isRed ? '🔴 ' : ''}{k.name}</td>
                          {b.jenis === 'Planning' ? (
                            <>
                              {showSOHist && <td className="py-1.5 pr-3 text-nlg-text-muted">{k.so || '—'}</td>}
                              <td className="py-1.5 text-center pr-2">{k.mtdCat}</td>
                              <td className="py-1.5 text-center pr-2">{k.ytdCat}</td>
                              <td className="py-1.5 text-center text-nlg-primary font-medium pr-2">{k.target}</td>
                              <td className="py-1.5 text-center font-medium">{k.bobot}</td>
                            </>
                          ) : (
                            <>
                              <td className="py-1.5 text-center pr-2">{k.f1}</td>
                              <td className="py-1.5 text-center pr-2">{k.f2}</td>
                              <td className={`py-1.5 text-center font-semibold ${k.isRed ? 'text-red-600' : 'text-nlg-text'}`}>{k.mtd}</td>
                            </>
                          )}
                        </tr>
                        {k.isRed && k.pica && k.pica.length > 0 && (
                          <tr className="border-t border-red-200 bg-red-50/30">
                            <td colSpan={b.jenis === 'Planning' ? (showSOHist ? 6 : 5) : 4} className="px-2 py-2">
                              <div className="text-[10px] font-semibold text-red-700 mb-1.5">PICA — Problem Identification & Corrective Action:</div>
                              {k.pica.map((p, pi) => (
                                <div key={pi} className="text-[10px] bg-white border border-red-200 rounded p-2 mb-1">
                                  <div className="grid grid-cols-2 gap-2 mb-1">
                                    <div><b>PI:</b> {p.pi}</div>
                                    <div><b>CA:</b> {p.ca}</div>
                                  </div>
                                  <div className="flex gap-4 text-nlg-text-subdued">
                                    <span>Deadline: <b>{p.deadline}</b></span>
                                    <span>PIC: <b>{p.pic}</b></span>
                                  </div>
                                </div>
                              ))}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                <div className="text-[11px] text-nlg-text-subdued italic mt-1">{b.catatan}</div>
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
};


