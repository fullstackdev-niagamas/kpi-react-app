import { useState } from 'react';
import { MONTH_LABELS, ACTIVE_PLAN_YEAR, CURRENT_MONTH_IDX, AVAILABLE_YEARS, MTD_CATEGORIES, YTD_CATEGORIES } from '../data/mockData';
import { useKPIContext } from '../context/KPIContext';
import { Icon } from '../components/Icons';
import { kpiMonthStats, calcMTD, calcYTD, computeAch, computeScore, badgeColorByPersp, scoreBg, scoreTextColor, isRedAchievement, isDueMonth, nextDueMonth } from '../utils/helpers';
import { useToast } from '../context/ToastContext';

export const ActualInput = ({ currentUserName }) => {
  const { userKPIs, updateUserKPI } = useKPIContext();
  const [viewYear, setViewYear] = useState(ACTIVE_PLAN_YEAR);
  const [selectedKpiId, setSelectedKpiId] = useState(null);
  const [submittedIds, setSubmittedIds] = useState([]);
  // Live-edited factor values for the active month (belum di-"Simpan" ke context), keyed by kpi id: { [id]: { f1, f2 } }
  const [drafts, setDrafts] = useState({});
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [justResetName, setJustResetName] = useState(null);
  const [justResetDirection, setJustResetDirection] = useState(null); // 'Draft' | 'Approved'
  const toast = useToast();

  // KPI_DATA (Approved/Locked) milik user yang sedang login — sumber tunggal (Sec. 8), ini yang
  // dianggap "resmi" (ikut gate Submit ke Superior, lihat dueKpis di bawah).
  const approvedKPIs = (userKPIs[currentUserName] || []).filter(k => k.status === 'Approved' || k.status === 'Locked');
  // KPI Draft (mis. hasil "Reset ke Draft" simulasi) — sengaja DITAMPILKAN juga di sini (beda dari
  // desain awal Sec. 6.2 yg cuma Approved/Locked) supaya User bisa uji kesesuaian Factor1/2 & lihat
  // hasil MTD/YTD-nya langsung tanpa perlu submit+approve ulang tiap kali coba kombinasi Formula.
  // TIDAK ikut gate "Submit Semua Actual KPI ke Superior" (lihat dueKpis) — murni pratinjau/simulasi.
  const draftKPIsForPreview = (userKPIs[currentUserName] || []).filter(k => k.status === 'Draft');
  const myKPIs = [...approvedKPIs, ...draftKPIsForPreview];
  const isActive = viewYear === ACTIVE_PLAN_YEAR;
  const m = CURRENT_MONTH_IDX;
  const baseKpi = myKPIs.find(k => k.id === selectedKpiId) || myKPIs[0];

  // Merge draft input into the active-month factors so previews & scores update live sebelum "Simpan".
  const withDraft = (k) => {
    const d = drafts[k.id];
    if (!d) return k;
    const factor1 = [...k.factor1];
    const factor2 = [...k.factor2];
    if (d.f1 !== undefined && d.f1 !== '') factor1[m] = Number(d.f1);
    if (d.f2 !== undefined && d.f2 !== '') factor2[m] = Number(d.f2);
    return { ...k, factor1, factor2 };
  };
  const selectedKpi = baseKpi ? withDraft(baseKpi) : null;
  const setDraft = (field, value) => setDrafts({ ...drafts, [baseKpi.id]: { ...drafts[baseKpi.id], [field]: value } });
  const commitFactors = (k) => {
    const eff = withDraft(k);
    updateUserKPI(currentUserName, k.id, { factor1: eff.factor1, factor2: eff.factor2 });
  };

  // Gate submit — Sec. 6.2/9.1 Project Brief: semua Factor terisi DAN semua KPI Merah punya ≥1 baris PICA lengkap
  const isFilledForMonth = (k) => {
    const eff = withDraft(k);
    return eff.factor1[m] !== null && eff.factor1[m] !== undefined && eff.factor1[m] !== '' &&
      eff.factor2[m] !== null && eff.factor2[m] !== undefined && eff.factor2[m] !== '';
  };
  const isPicaCompleteFor = (k) => ((k.pica && k.pica[m]) || []).some(r => r.pi?.trim() && r.ca?.trim() && r.deadline && r.pic?.trim());
  // Sec. 6.2: "User isi Factor 1 & 2 utk SEMUA KPI PERIODE AKTIF" — KPI Kuartalan/Semesteran/Tahunan
  // HANYA wajib diisi di bulan akhir periodenya (`isDueMonth`), bukan tiap bulan aktif spt Bulanan.
  // Sebelumnya SEMUA KPI (apa pun periodenya) diperlakukan wajib tiap bulan → Submit terblokir utk
  // KPI non-Bulanan di bulan yg bukan periodenya (root cause keluhan user).
  const dueKpis = approvedKPIs.filter(k => isDueMonth(k.period, m));
  const unfilledKpis = dueKpis.filter(k => !isFilledForMonth(k));
  const redKpisMissingPica = dueKpis.filter(k => isFilledForMonth(k) && isRedAchievement(withDraft(k)) && !isPicaCompleteFor(k));
  const canSubmitAll = dueKpis.length > 0 && unfilledKpis.length === 0 && redKpisMissingPica.length === 0;

  const renderYearBar = () => (
    <div className="flex items-center gap-2 mb-4 flex-wrap no-print">
      <span className="text-[11px] font-medium text-nlg-text-muted shrink-0">Tahun KPI:</span>
      {AVAILABLE_YEARS.map(yr => (
        <button key={yr} onClick={() => setViewYear(yr)}
          className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors ${viewYear === yr ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border hover:bg-nlg-primary-tint hover:text-nlg-primary'}`}>
          {yr}{yr === ACTIVE_PLAN_YEAR ? ' 🔓' : ''}
        </button>
      ))}
    </div>
  );

  if (!isActive) {
    return (
      <div className="mb-5">
        <h1 className="text-xl font-bold text-nlg-text mb-5">Input Realisasi (Actual) KPI</h1>
        {renderYearBar()}
        <div className="border border-nlg-border rounded-nlg-card bg-white overflow-hidden">
          <div className="px-4 py-3 bg-nlg-sidebar border-b border-nlg-border flex items-center gap-2">
            <span className="text-sm font-semibold">Data Actual KPI Tahun {viewYear}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-nlg-text-muted">🔒 Read-only</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="th1 text-white text-[10px]">
                <tr>
                  <th className="text-left px-3 py-2 border tbdr">KPI</th>
                  <th className="px-2 py-2 border tbdr">Periode</th>
                  <th className="px-2 py-2 border tbdr">Target</th>
                  {MONTH_LABELS.slice(0, m + 1).map(l => <th key={l} className="px-2 py-2 border tbdr text-center">{l} (Ach%)</th>)}
                  <th className="px-2 py-2 border tbdr text-center tytd">Score YTD</th>
                </tr>
              </thead>
              <tbody>
                {myKPIs.map(k => {
                  const ytd = calcYTD(k, m);
                  const ytdScore = computeScore(computeAch(k.type, k.target, ytd), k.type);
                  return (
                    <tr key={k.id} className="hover:bg-nlg-sidebar/40">
                      <td className="px-3 py-1.5 border border-nlg-border font-medium">{k.name}</td>
                      <td className="px-2 py-1.5 border border-nlg-border text-center text-nlg-text-muted">{k.period}</td>
                      <td className="px-2 py-1.5 border border-nlg-border text-center text-nlg-primary font-medium">{k.target}{k.uom === '%' ? '%' : ''}</td>
                      {MONTH_LABELS.slice(0, m + 1).map((_, mi) => {
                        const st = kpiMonthStats(k, mi);
                        return (
                          <td key={mi} className={`px-2 py-1.5 border border-nlg-border text-center ${st ? scoreTextColor(st.score) : 'text-nlg-text-subdued'}`}>
                            {st ? (st.ach * 100).toFixed(0) + '%' : '—'}
                          </td>
                        );
                      })}
                      <td className={`px-2 py-1.5 border border-nlg-border text-center font-bold ${scoreBg(ytdScore)}`}>{ytdScore}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedKpi) {
    return (
      <div className="mb-5">
        <h1 className="text-xl font-bold text-nlg-text mb-5">Input Realisasi (Actual) KPI</h1>
        {renderYearBar()}
        <div className="border border-dashed border-nlg-border rounded-nlg-card bg-white p-10 text-center">
          <div className="text-nlg-text-subdued text-sm mb-1">Belum ada KPI Approved/Locked untuk diisi realisasinya.</div>
          <div className="text-[11px] text-nlg-text-subdued">Lengkapi &amp; submit <b>Input Planning KPI</b> terlebih dahulu, tunggu disetujui Superior.</div>
        </div>
      </div>
    );
  }

  const isRed = isRedAchievement(selectedKpi);
  const locked = submittedIds.includes(selectedKpi.id);
  const isDraftPreview = selectedKpi.status === 'Draft';
  // Sec. 6.2/7: KPI non-Bulanan cuma wajib diisi di bulan akhir periodenya — di bulan lain, input
  // Factor 1/2 tidak dibuka sama sekali (bukan "belum dibuka" spt bulan depan, tapi memang tidak due).
  // KPI Draft (mode simulasi) mengabaikan aturan ini — User perlu bebas coba isi Factor kapan pun utk
  // uji kesesuaian formula, bukan menunggu bulan due sungguhan.
  const selectedKpiDue = isDraftPreview || isDueMonth(selectedKpi.period, m);
  const selectedKpiNextDue = MONTH_LABELS[nextDueMonth(selectedKpi.period, m + 1)];

  // PICA for this KPI — persisted ke context sebagai k.pica[bulan] (Sec. 9 Project Brief)
  const picaRows = (selectedKpi.pica && selectedKpi.pica[m]) || [];
  const addPicaRow = () => {
    updateUserKPI(currentUserName, selectedKpi.id, { pica: { ...(selectedKpi.pica || {}), [m]: [...picaRows, { pi: '', ca: '', deadline: '', pic: '' }] } });
  };
  const updatePica = (idx, field, value) => {
    const rows = [...picaRows];
    rows[idx] = { ...rows[idx], [field]: value };
    updateUserKPI(currentUserName, selectedKpi.id, { pica: { ...(selectedKpi.pica || {}), [m]: rows } });
  };

  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold text-nlg-text mb-5">Input Realisasi (Actual) KPI</h1>
      {renderYearBar()}

      {/* Ditaruh di sini (bukan di dalam panel Master KPI) krn begitu status berubah jadi Draft, KPI
          itu LANGSUNG hilang dari myKPIs (hanya menampilkan Approved/Locked) — kalau konfirmasi
          "berhasil" ditaruh di dalam panel per-KPI, panel itu sudah keburu berpindah ke KPI lain di
          render yg sama, jadi pesannya tidak akan pernah sempat terlihat (bug pada percobaan pertama). */}
      {justResetName && (
        <div className="mb-4 text-[12px] text-green-700 bg-green-50 border border-green-200 rounded-nlg-input px-3 py-2 flex items-center justify-between">
          <span>
            {justResetDirection === 'Approved'
              ? <>✅ "{justResetName}" berhasil dikembalikan ke <b>Approved</b> — simulasi selesai, status normal kembali.</>
              : <>✅ "{justResetName}" berhasil direset ke Draft. Buka menu <b>Input Planning KPI</b> di sidebar kiri untuk mengedit (termasuk Formula MTD/YTD).</>}
          </span>
          <button onClick={() => setJustResetName(null)} className="text-green-700 hover:text-green-900 font-bold ml-2 shrink-0">✕</button>
        </div>
      )}

      <div className="mb-4 max-w-md">
        <label className="text-xs font-medium text-nlg-text-muted">Pilih KPI — Bulan aktif: <b>{MONTH_LABELS[m]} {ACTIVE_PLAN_YEAR}</b></label>
        <select value={selectedKpi.id} onChange={e => { setSelectedKpiId(e.target.value); setConfirmingReset(false); }}
          className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm">
          {myKPIs.map(k => <option key={k.id} value={k.id}>{k.status === 'Draft' ? '📝 ' : ''}{k.name} — {k.period}{k.status === 'Draft' ? ' (Draft/Simulasi)' : ''}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Left Panel — Master KPI (read-only) */}
        <div className="border border-nlg-border rounded-nlg-card bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wide">Master KPI <span className="text-nlg-text-subdued/70">(read-only — sumber: Input Planning KPI)</span></div>
            {isDraftPreview && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">📝 Draft — Mode Simulasi</span>
            )}
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-[11px] text-nlg-text-subdued">Perspektif</div>
              <span className={`inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${badgeColorByPersp(selectedKpi.persp)}`}>{selectedKpi.persp}</span>
            </div>
            {selectedKpi.so && (
              <div>
                <div className="text-[11px] text-nlg-text-subdued">Strategic Objective</div>
                <div className="font-medium">{selectedKpi.so}</div>
              </div>
            )}
            <div>
              <div className="text-[11px] text-nlg-text-subdued">Nama KPI</div>
              <div className="font-medium">{selectedKpi.name}</div>
            </div>
            <div>
              <div className="text-[11px] text-nlg-text-subdued">Deskripsi/Parameter</div>
              <div className="text-nlg-text-muted">{selectedKpi.desc || '—'}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-nlg-border">
              <div>
                <div className="text-[11px] text-nlg-text-subdued">Weight</div>
                <div className="font-semibold">{(selectedKpi.weight * 100).toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-[11px] text-nlg-text-subdued">Target</div>
                <div className="font-semibold text-nlg-primary">{selectedKpi.target}{selectedKpi.uom === '%' ? '%' : ' ' + selectedKpi.uom}</div>
              </div>
              <div>
                <div className="text-[11px] text-nlg-text-subdued">Kategori Formula MTD</div>
                <div className="font-semibold">{selectedKpi.mtdCat}</div>
                <div className="text-[10px] text-nlg-text-subdued mt-0.5 leading-snug">{MTD_CATEGORIES.find(c => c.id === selectedKpi.mtdCat)?.desc}</div>
              </div>
              <div>
                <div className="text-[11px] text-nlg-text-subdued">Kategori Formula YTD</div>
                <div className="font-semibold">{selectedKpi.ytdCat}</div>
                <div className="text-[10px] text-nlg-text-subdued mt-0.5 leading-snug">{YTD_CATEGORIES.find(c => c.id === selectedKpi.ytdCat)?.desc}</div>
              </div>
            </div>
            <div className="pt-2 border-t border-nlg-border flex items-center justify-between">
              <span className="text-[11px] text-nlg-text-subdued">Periode Pengukuran</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-nlg-sidebar text-nlg-text-muted">{selectedKpi.period}</span>
            </div>
            {/* Field Master KPI (termasuk Formula MTD/YTD) memang dikunci begitu status Approved
                (Sec. 5.3 Project Brief: "Dipilih saat Planning, tidak bisa diubah setelah Approved") —
                aturan ini SENGAJA tidak diubah krn berlaku utk data sungguhan. Tombol ini murni utk
                kebutuhan simulasi/testing (bisa coba-coba kombinasi formula berulang kali): reset
                status KPI ini balik ke Draft supaya bisa diedit lagi di Input Planning KPI, TANPA perlu
                menunggu Superior Reject/Request Revision (yg akan me-revert 1 BATCH penuh sekaligus).
                Tidak berpengaruh ke KPI lain dalam batch yg sama.
                Konfirmasi pakai state React (2-klik), BUKAN window.confirm() — dialog native browser
                tidak selalu bisa diandalkan tampil/berfungsi di semua environment, & tidak ada indikator
                visual kalau aksinya berhasil (kemungkinan root cause laporan user "tidak berubah").
                Begitu KPI ini Draft (mode simulasi), tombol berganti jadi "Kembalikan ke Approved" —
                jalan pintas simulasi (bypass submit+approve ulang) utk selesai coba2 formula & kembali
                ke state semula, tanpa perlu re-submit manual via Planning + Approval Queue. */}
            <div className="pt-2 border-t border-nlg-border">
              {confirmingReset ? (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-nlg-input px-3 py-2">
                    {isDraftPreview
                      ? `Yakin kembalikan "${selectedKpi.name}" ke status Approved? Selesai simulasi formula.`
                      : `Yakin reset "${selectedKpi.name}" ke Draft? Hanya utk kebutuhan simulasi.`}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const name = selectedKpi.name;
                        const newStatus = isDraftPreview ? 'Approved' : 'Draft';
                        updateUserKPI(currentUserName, selectedKpi.id, { status: newStatus });
                        setConfirmingReset(false);
                        setJustResetName(name);
                        setJustResetDirection(newStatus);
                        toast(isDraftPreview
                          ? `"${name}" dikembalikan ke Approved.`
                          : `"${name}" direset ke Draft — edit ulang di Input Planning KPI.`);
                      }}
                      className={`flex-1 text-[11px] font-medium text-white rounded-nlg-input px-3 py-2 ${isDraftPreview ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                    >
                      {isDraftPreview ? '✅ Ya, Kembalikan ke Approved' : '✅ Ya, Reset Sekarang'}
                    </button>
                    <button type="button" onClick={() => setConfirmingReset(false)} className="flex-1 text-[11px] font-medium text-nlg-text-muted border border-nlg-border rounded-nlg-input px-3 py-2">
                      Batal
                    </button>
                  </div>
                </div>
              ) : isDraftPreview ? (
                <button
                  type="button"
                  onClick={() => setConfirmingReset(true)}
                  className="w-full text-[11px] font-medium text-green-700 border border-green-300 bg-green-50 hover:bg-green-100 rounded-nlg-input px-3 py-2"
                >
                  ↩️ Kembalikan ke Approved (selesai simulasi)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingReset(true)}
                  className="w-full text-[11px] font-medium text-amber-700 border border-amber-300 bg-amber-50 hover:bg-amber-100 rounded-nlg-input px-3 py-2"
                >
                  🔧 Reset ke Draft (khusus simulasi) — utk ubah Formula MTD/YTD
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel — Input Realisasi */}
        <div className="border border-nlg-border rounded-nlg-card bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wide">Input Realisasi (Actual)</div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-nlg-primary-tint text-nlg-primary">Bulan aktif: {MONTH_LABELS[m]}</span>
          </div>
          {!selectedKpiDue && (
            <div className="text-[11px] bg-gray-50 border border-nlg-border rounded-nlg-input px-3 py-2 mb-3 text-nlg-text-muted">
              📅 KPI ini berperiode <b>{selectedKpi.period}</b> — tidak wajib diisi bulan {MONTH_LABELS[m]}. Periode berikutnya: <b>{selectedKpiNextDue} {ACTIVE_PLAN_YEAR}</b>.
            </div>
          )}
          <div className="border border-nlg-border rounded-nlg-input overflow-hidden mb-3">
            <table className="w-full">
              <thead className="bg-nlg-sidebar text-nlg-text-subdued text-[10px] uppercase">
                <tr><th className="text-left px-3 py-2">Month</th><th className="px-3 py-2">Status</th><th className="text-right px-3 py-2">Factor 1 / Factor 2</th></tr>
              </thead>
              <tbody className="divide-y divide-nlg-border">
                {MONTH_LABELS.map((label, i) => {
                  const isCurrent = i === m;
                  const isFuture = i > m;
                  const due = isDraftPreview || isDueMonth(selectedKpi.period, i);
                  const filled = selectedKpi.factor1[i] !== null && selectedKpi.factor1[i] !== undefined;
                  const openForInput = isCurrent && due;
                  return (
                    <tr key={label} className={openForInput ? 'bg-nlg-primary-tint' : (isFuture || !due) ? 'opacity-50' : ''}>
                      <td className={`px-3 py-1.5 text-xs font-medium ${openForInput ? 'text-nlg-primary' : 'text-nlg-text'}`}>{label}</td>
                      <td className="px-3 py-1.5 text-center">
                        {!due ? <span className="text-[10px] text-nlg-text-subdued">—</span>
                          : openForInput ? (locked ? <Icon name="lock" className="inline text-nlg-text-subdued" /> : <span className="text-nlg-primary">●</span>)
                          : filled ? <Icon name="check" className="inline text-green-600" />
                          : <Icon name="lock" className="inline text-nlg-text-subdued" />}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        {!due ? (
                          <span className="text-xs text-nlg-text-subdued italic">bukan periode input</span>
                        ) : openForInput && !locked ? (
                          <div className="flex justify-end gap-1.5">
                            <input type="number" step="0.01" value={drafts[baseKpi.id]?.f1 ?? (baseKpi.factor1[i] ?? '')} onChange={e => setDraft('f1', e.target.value)} placeholder="F1" className="w-20 border border-nlg-primary rounded-nlg-input px-2 py-1 text-xs" />
                            <input type="number" step="0.01" value={drafts[baseKpi.id]?.f2 ?? (baseKpi.factor2[i] ?? '')} onChange={e => setDraft('f2', e.target.value)} placeholder="F2" className="w-20 border border-nlg-primary rounded-nlg-input px-2 py-1 text-xs" />
                          </div>
                        ) : filled ? (
                          <span className="text-xs text-nlg-text-muted">{selectedKpi.factor1[i]} / {selectedKpi.factor2[i]}</span>
                        ) : (
                          <span className="text-xs text-nlg-text-subdued italic">belum dibuka</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MTD/YTD Preview — calcMTD/calcYTD (beda dgn kpiMonthStats) TIDAK menjaga null: kategori
              DIRECT/LAST me-return factor1/factor2 mentah, yg masih null selama Factor 1&2 bulan
              berjalan belum diisi (KPI baru Approved, belum pernah Input Actual). `.toFixed()` di null
              crash tanpa error boundary → seluruh halaman blank putih (root cause bug yg dilaporkan). */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-center">
            {(() => {
              const hasF1 = selectedKpi.factor1[m] !== null && selectedKpi.factor1[m] !== undefined;
              const hasF2 = selectedKpi.factor2[m] !== null && selectedKpi.factor2[m] !== undefined;
              const mtdVal = hasF1 && hasF2 ? calcMTD(selectedKpi, m) : null;
              const ytdVal = hasF1 && hasF2 ? calcYTD(selectedKpi, m) : null;
              return (
                <>
                  <div className="bg-nlg-sidebar rounded-nlg-input py-2">
                    <div className="text-[10px] text-nlg-text-subdued">%Actual (MTD)</div>
                    <div className="font-semibold text-sm">{mtdVal !== null && mtdVal !== undefined ? `${mtdVal.toFixed(1)}%` : '—'}</div>
                  </div>
                  <div className="bg-nlg-sidebar rounded-nlg-input py-2">
                    <div className="text-[10px] text-nlg-text-subdued">%Actual (YTD) · {selectedKpi.ytdCat}</div>
                    <div className="font-semibold text-sm">{ytdVal !== null && ytdVal !== undefined ? `${ytdVal.toFixed(1)}%` : '—'}</div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Evidence Upload */}
          <div className="mb-4">
            <label className="text-xs font-medium text-nlg-text-muted">Upload Bukti Pendukung (Evidence)</label>
            <div className="mt-1 border border-dashed border-nlg-border rounded-nlg-input px-3 py-5 text-center text-nlg-text-subdued text-xs cursor-pointer hover:bg-nlg-sidebar">
              <Icon name="upload" className="inline" />
              <div className="mt-1">Klik atau drag file ke sini (PDF/XLSX/JPG, maks 10MB)</div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {!selectedKpiDue ? (
              <span className="text-[11px] text-nlg-text-subdued flex items-center gap-1.5 px-2">📅 Tidak ada yang perlu disimpan — bukan periode input KPI ini</span>
            ) : locked ? (
              <span className="text-[11px] text-nlg-text-subdued flex items-center gap-1.5 px-2"><Icon name="lock" className="inline" /> Bulan {MONTH_LABELS[m]} sudah disubmit — terkunci</span>
            ) : (
              <button onClick={() => { commitFactors(baseKpi); toast(`Realisasi ${baseKpi.name} untuk ${MONTH_LABELS[m]} disimpan.`); }} className="px-4 py-2 text-sm rounded-nlg-input bg-nlg-primary text-white font-medium">Simpan</button>
            )}
          </div>
        </div>
      </div>

      {/* PICA Section for Red KPIs */}
      {isRed && (
        <div className={`border-2 ${picaRows.length > 0 && picaRows.some(r => r.pi && r.ca) ? 'border-green-300 bg-green-50/30' : 'border-red-300 bg-red-50/30'} rounded-nlg-card p-4 mb-3`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-bold text-sm">🔴 PICA Wajib</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">KPI: {selectedKpi.name}</span>
            </div>
            <button onClick={addPicaRow} className="text-[11px] font-medium text-nlg-primary hover:underline">+ Tambah Baris PICA</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-red-100 text-red-700 text-[10px]">
                <tr>
                  <th className="text-left px-2 py-1.5">Problem Identification</th>
                  <th className="text-left px-2 py-1.5">Corrective Action</th>
                  <th className="px-2 py-1.5 text-center">Deadline</th>
                  <th className="px-2 py-1.5 text-center">PIC</th>
                </tr>
              </thead>
              <tbody>
                {picaRows.map((r, i) => (
                  <tr key={i} className="border-t border-nlg-border">
                    <td className="px-1.5 py-1.5">
                      <textarea rows="2" value={r.pi} onChange={e => updatePica(i, 'pi', e.target.value)} placeholder="Identifikasi masalah..."
                        className="w-full text-xs border border-nlg-border rounded px-2 py-1 resize-none focus:border-nlg-primary focus:outline-none" />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <textarea rows="2" value={r.ca} onChange={e => updatePica(i, 'ca', e.target.value)} placeholder="Langkah perbaikan..."
                        className="w-full text-xs border border-nlg-border rounded px-2 py-1 resize-none focus:border-nlg-primary focus:outline-none" />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input type="date" value={r.deadline} onChange={e => updatePica(i, 'deadline', e.target.value)}
                        className="w-full text-xs border border-nlg-border rounded px-2 py-1 focus:border-nlg-primary focus:outline-none" />
                    </td>
                    <td className="px-1.5 py-1.5">
                      <input type="text" value={r.pic} onChange={e => updatePica(i, 'pic', e.target.value)} placeholder="Nama PIC..."
                        className="w-full text-xs border border-nlg-border rounded px-2 py-1 focus:border-nlg-primary focus:outline-none" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {picaRows.length === 0 && (
            <div className="text-center py-4 text-red-600 text-[11px]">Klik "+ Tambah Baris PICA" untuk mulai mengisi.</div>
          )}
        </div>
      )}

      {/* Actual Status List — sebelumnya murni informasi (tidak bisa diklik), jadi KPI Merah yg butuh
          PICA tidak py cara langsung dituju: form PICA cuma muncul utk KPI yg sedang dipilih di
          dropdown "Pilih KPI" atas, User harus tahu & buka dropdown itu sendiri secara manual. Sekarang
          tiap baris bisa diklik utk langsung menjadikannya KPI terpilih (form Input Realisasi + PICA
          di atas otomatis pindah ke KPI itu) — window discroll ke atas supaya langsung terlihat. */}
      <div className="max-w-2xl">
        <div className="text-sm font-semibold mb-2">Status Pengisian Actual — {MONTH_LABELS[m]} {ACTIVE_PLAN_YEAR}</div>
        <div className="text-[11px] text-nlg-text-subdued mb-2">Klik baris KPI untuk membukanya di panel Input Realisasi/PICA di atas.</div>
        <div className="space-y-2 mb-3">
          {myKPIs.map(k => {
            const eff = withDraft(k);
            const st = kpiMonthStats(eff, m);
            const filled = isFilledForMonth(k);
            const isSubmitted = submittedIds.includes(k.id);
            const kRed = filled && isRedAchievement(eff);
            const picaMissing = kRed && !isPicaCompleteFor(k);
            const isSelected = k.id === selectedKpi.id;
            const isDraftRow = k.status === 'Draft';
            const dueThisMonth = isDraftRow || isDueMonth(k.period, m);
            return (
              <button
                key={k.id}
                type="button"
                onClick={() => { setSelectedKpiId(k.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`w-full text-left border ${isDraftRow ? 'border-dashed border-amber-300 bg-amber-50/30' : kRed ? 'border-red-200 bg-red-50/30' : 'border-nlg-border'} ${!dueThisMonth ? 'opacity-60' : ''} ${isSelected ? 'ring-2 ring-nlg-primary' : ''} rounded-nlg-input p-3 bg-white flex items-center justify-between hover:shadow-sm transition-shadow`}
              >
                <div>
                  <div className="font-medium text-sm flex items-center gap-1.5">
                    {kRed ? '🔴 ' : ''}{k.name}
                    {isDraftRow && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">📝 Draft (Simulasi)</span>}
                  </div>
                  <div className="text-[11px] text-nlg-text-muted">{k.persp} · {k.period}</div>
                </div>
                <div className="flex items-center gap-2">
                  {!dueThisMonth ? (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-nlg-text-subdued">📅 Bukan periode input ({k.period})</span>
                  ) : (
                    <>
                      {picaMissing && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">⚠️ Isi PICA →</span>
                      )}
                      {filled && st && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${scoreBg(st.score)}`}>{st.mtd.toFixed(1)}%</span>
                      )}
                      {!isDraftRow && (
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${isSubmitted ? 'bg-green-100 text-green-700' : filled ? 'bg-nlg-primary-tint text-nlg-primary' : 'bg-gray-100 text-nlg-text-muted'}`}>
                          {isSubmitted ? '✅ Submitted' : filled ? '✏️ Terisi' : '⬜ Belum diisi'}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {!canSubmitAll && dueKpis.length === 0 && (
          <div className="text-xs rounded-nlg-input px-3 py-2.5 mb-3 bg-nlg-sidebar text-nlg-text-muted">
            📅 Tidak ada KPI yang wajib diisi Actual bulan {MONTH_LABELS[m]} ini — semua KPI Anda berperiode Kuartalan/Semesteran/Tahunan dan belum masuk bulan akhir periodenya.
          </div>
        )}
        {!canSubmitAll && dueKpis.length > 0 && (
          <div className="text-xs rounded-nlg-input px-3 py-2.5 mb-3 bg-red-50 text-red-700 space-y-1">
            <div className="font-semibold">⚠️ Submit belum bisa dilakukan:</div>
            {unfilledKpis.length > 0 && <div>• {unfilledKpis.length} KPI belum diisi Factor 1/2 bulan {MONTH_LABELS[m]}: {unfilledKpis.map(k => k.name).join(', ')}</div>}
            {redKpisMissingPica.length > 0 && <div>• {redKpisMissingPica.length} KPI Merah belum ada PICA lengkap (PI+CA+Deadline+PIC): {redKpisMissingPica.map(k => k.name).join(', ')}</div>}
          </div>
        )}
        <button onClick={() => { dueKpis.forEach(k => commitFactors(k)); setSubmittedIds(dueKpis.map(k => k.id)); toast('Semua Actual KPI disubmit ke Superior.'); }}
          disabled={!canSubmitAll}
          className="w-full px-4 py-2 text-sm rounded-nlg-input bg-nlg-primary text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed">
          Submit Semua Actual KPI ke Superior
        </button>
      </div>
    </div>
  );
};
