import React from 'react';
import { useKPIContext } from '../context/KPIContext';
import { userShowSO, badgeColorByPersp } from '../utils/helpers';

export const Approval = ({ currentUserName }) => {
  const { users, batches, actOnBatch } = useKPIContext();

  // Hanya batch milik subordinate langsung user ini yang tampil (Sec. 3: kapabilitas Approval
  // otomatis dari Master Data User, bukan role terpisah — dan hanya utk timnya sendiri).
  const mySubordinateNames = users.filter(u => u.superior === currentUserName).map(u => u.name);
  const BATCH_DATA = batches.filter(b => mySubordinateNames.includes(b.user));

  const approveAction = (qId, batch, user, action, note) => {
    actOnBatch(qId, action, note, currentUserName);
  };

  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold text-nlg-text mb-1">Approval Queue (Tim Saya)</h1>
      <p className="text-sm text-nlg-text-muted mb-5">Submit dilakukan per batch. Batch dengan 🔴 KPI Merah menyertakan PICA yang perlu dievaluasi.</p>

      <div className="space-y-3">
        {BATCH_DATA.map(q => {
          const redCount = q.kpis.filter(k => k.isRed).length;
          const showSO = userShowSO(users.find(u => u.name === q.user));
          const isFinal = q.status === 'Approved' || q.status === 'Rejected';
          const isMediation = q.status === 'Pending Mediation';

          return (
            <div key={q.id} className={`border ${redCount > 0 ? 'border-red-200' : 'border-nlg-border'} rounded-nlg-card bg-white overflow-hidden`}>
              <div className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${q.jenis === 'Planning' ? 'bg-nlg-primary-tint text-nlg-primary' : 'bg-purple-100 text-purple-700'}`}>{q.jenis}</span>
                    <span className="font-semibold text-sm">{q.batch}</span>
                    {redCount > 0 && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">🔴 {redCount} KPI Merah · PICA Submitted</span>}
                  </div>
                  <div className="text-[11px] text-nlg-text-muted"><b>{q.user}</b> · {q.dept} · {q.kpis.length} KPI · Revisi {q.revisi}/3</div>
                  {q.focusNote && <div className="text-[11px] text-nlg-primary mt-1">{q.focusNote}</div>}
                </div>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${q.revisi >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-nlg-text-muted'}`}>Revisi {q.revisi}/3</span>
              </div>

              <details className="border-t border-nlg-border">
                <summary className="px-4 py-2 text-[11px] text-nlg-primary font-medium cursor-pointer hover:bg-nlg-sidebar">
                  ▶ {q.kpis.length} KPI · Lihat Detail {redCount > 0 ? `& ${redCount} PICA` : ''}
                </summary>
                <div className="px-4 pb-4 bg-nlg-sidebar">
                  <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wide mb-2 mt-3">Data {q.jenis === 'Actual' ? 'Actual' : 'Planning'}</div>
                  <table className="w-full text-[11px] mb-2 bg-white border border-nlg-border rounded">
                    <thead className="bg-nlg-sidebar text-nlg-text-subdued">
                      <tr>
                        {q.jenis === 'Planning' ? (
                          <>
                            <th className="text-left px-2 py-1.5">KPI</th>
                            <th className="text-center px-2 py-1.5">Perspektif</th>
                            {showSO && <th className="text-left px-2 py-1.5">Strategic Obj.</th>}
                            <th className="text-center px-2 py-1.5">Type</th>
                            <th className="text-center px-2 py-1.5">UoM</th>
                            <th className="text-center px-2 py-1.5">Periode</th>
                            <th className="text-center px-2 py-1.5">MTD</th>
                            <th className="text-center px-2 py-1.5">YTD</th>
                            <th className="text-center px-2 py-1.5">Target</th>
                            <th className="text-center px-2 py-1.5">Bobot</th>
                          </>
                        ) : (
                          <>
                            <th className="text-left px-2 py-1.5">KPI</th>
                            <th className="text-center px-2 py-1.5">Factor 1</th>
                            <th className="text-center px-2 py-1.5">Factor 2</th>
                            <th className="text-center px-2 py-1.5">%Actual MTD</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {q.kpis.map((k, i) => (
                        <React.Fragment key={i}>
                          <tr className="border-t border-nlg-border/40">
                            <td className="px-2 py-1.5 font-medium max-w-[180px]">
                              <div>{k.isRed ? '🔴 ' : ''}{k.name}</div>
                              {k.desc && <div className="text-[10px] text-nlg-text-subdued font-normal leading-snug mt-0.5">{k.desc}</div>}
                            </td>
                            {q.jenis === 'Planning' ? (
                              <>
                                <td className="px-2 py-1.5 text-center">{k.persp ? <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badgeColorByPersp(k.persp)}`}>{k.persp}</span> : '—'}</td>
                                {showSO && <td className="px-2 py-1.5 text-[10px] text-nlg-text-muted">{k.so || '—'}</td>}
                                <td className="px-2 py-1.5 text-center">{k.type || '—'}</td>
                                <td className="px-2 py-1.5 text-center">{k.uom || '—'}</td>
                                <td className="px-2 py-1.5 text-center">{k.period || '—'}</td>
                                <td className="px-2 py-1.5 text-center">{k.mtdCat || '—'}</td>
                                <td className="px-2 py-1.5 text-center">{k.ytdCat || '—'}</td>
                                <td className="px-2 py-1.5 text-center text-nlg-primary font-medium">{k.target || '—'}</td>
                                <td className="px-2 py-1.5 text-center font-medium">{k.bobot || '—'}</td>
                              </>
                            ) : (
                              <>
                                <td className="px-2 py-1.5 text-center">{k.f1 || '—'}</td>
                                <td className="px-2 py-1.5 text-center">{k.f2 || '—'}</td>
                                <td className={`px-2 py-1.5 text-center font-semibold ${k.isRed ? 'text-red-600' : 'text-nlg-text'}`}>{k.mtd || '—'}</td>
                              </>
                            )}
                          </tr>
                          {/* PICA rows */}
                          {k.isRed && k.pica && k.pica.length > 0 && (
                            <tr className="bg-red-50/30">
                              <td colSpan={q.jenis === 'Planning' ? (showSO ? 10 : 9) : 4} className="px-3 py-2 border border-red-200">
                                <div className="text-[10px] font-semibold text-red-700 mb-1">📋 PICA (diisi User):</div>
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
                </div>
              </details>

              <div className="px-4 pb-4 pt-3 border-t border-nlg-border">
                {isFinal ? (
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className={`font-medium px-2.5 py-1 rounded-full ${q.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{q.status}</span>
                    <span className="text-nlg-text-subdued">oleh {q.by} · {q.ts}</span>
                    {q.catatan && <span className="italic text-nlg-text-muted">"{q.catatan}"</span>}
                  </div>
                ) : isMediation ? (
                  <div className="text-xs bg-amber-50 text-amber-700 rounded px-3 py-2">⚠️ Batas 3x revisi tercapai — batch ini dialihkan ke <b>Pending Mediation CS</b> sebagai mediator final. {q.catatan && <span className="block italic mt-1">"{q.catatan}"</span>}</div>
                ) : (
                  <>
                    {q.status === 'Request Revision' && (
                      <div className="text-[11px] bg-amber-50 text-amber-700 rounded px-3 py-2 mb-2">Revisi ke-{q.revisi} diminta oleh {q.by} · {q.ts}{q.catatan && <span className="italic"> — "{q.catatan}"</span>}</div>
                    )}
                    {redCount > 0 && (
                      <div className="mb-2">
                        <label className="text-[11px] font-medium text-nlg-text-muted">Catatan Superior untuk PICA <span className="font-normal text-nlg-text-subdued">(evaluasi kecukupan PI/CA)</span></label>
                        <textarea id={`pica_note_${q.id}`} rows="2" placeholder="cth: CA sudah tepat namun perlu timeline lebih ketat..."
                          className="mt-1 w-full text-xs border border-nlg-border rounded px-3 py-2"></textarea>
                      </div>
                    )}
                    <textarea id={`aq_note_${q.id}`} rows="2" placeholder="Catatan (opsional)..." className="w-full text-xs border border-nlg-border rounded px-3 py-2 mb-2"></textarea>
                    <div className="flex gap-2">
                      <button onClick={() => approveAction(q.id, q.batch, q.user, 'approve', document.getElementById(`aq_note_${q.id}`)?.value)} className="px-3 py-1.5 text-xs font-medium rounded bg-green-600 text-white">Approve</button>
                      <button onClick={() => approveAction(q.id, q.batch, q.user, 'revision', document.getElementById(`aq_note_${q.id}`)?.value)} className="px-3 py-1.5 text-xs font-medium rounded bg-amber-500 text-white">Request Revision</button>
                      <button onClick={() => approveAction(q.id, q.batch, q.user, 'reject', document.getElementById(`aq_note_${q.id}`)?.value)} className="px-3 py-1.5 text-xs font-medium rounded border border-nlg-border text-nlg-text-muted">Reject</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
