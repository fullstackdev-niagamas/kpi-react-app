import { useState } from 'react';
import { MONTH_LABELS, ACTIVE_PLAN_YEAR, CURRENT_MONTH_IDX, AVAILABLE_YEARS, MTD_CATEGORIES, YTD_CATEGORIES } from '../data/mockData';
import { useKPIContext } from '../context/KPIContext';
import { Icon } from '../components/Icons';
import { kpiMonthStats, kpiYTDStats, calcMTD, calcYTD, badgeColorByPersp, scoreBg, scoreTextColor, isRedAchievement, isDueMonth, nextDueMonth } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { FEATURES } from '../config/features';

// Ganti 1 elemen array Factor pada index tertentu tanpa mutasi — dipakai QA Testing Tools utk nulis
// langsung ke context per-bulan (beda dari alur draft+Simpan normal yg cuma menyasar bulan aktif `m`).
const patchArrAt = (arr, idx, rawVal) => {
  const next = [...arr];
  next[idx] = rawVal === '' ? null : Number(rawVal);
  return next;
};

const round2 = (v) => Math.round(Number(v) * 100) / 100;
// KPI yg punya Data Suggestion: nilai Actual yg diinput User wajib SAMA PERSIS (2 desimal) dgn nilai
// saran — mencegah typo saat menyalin data dari sumber eksternal. `null` = belum ada suggestion utk
// bulan itu (bebas input spt biasa) ATAU field belum diisi sama sekali (bukan mismatch, cuma "belum diisi").
const suggestionMismatch = (val, suggested) => {
  if (suggested === null || suggested === undefined) return false;
  if (val === null || val === undefined || val === '') return false;
  return round2(val) !== round2(suggested);
};

export const ActualInput = ({ currentUserName }) => {
  const { userKPIs, updateUserKPI, resetAllUserKPIs, resetActualDataOnly, clearSuggestedData, resetApprovedToDraft } = useKPIContext();
  const [viewYear, setViewYear] = useState(ACTIVE_PLAN_YEAR);
  const [selectedKpiId, setSelectedKpiId] = useState(null);
  const [submittedIds, setSubmittedIds] = useState([]);
  // Live-edited factor values for the active month (belum di-"Simpan" ke context), keyed by kpi id: { [id]: { f1, f2 } }
  const [drafts, setDrafts] = useState({});
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [justResetName, setJustResetName] = useState(null);
  const [justResetDirection, setJustResetDirection] = useState(null); // 'Draft' | 'Approved'
  // ── QA Testing Tools (FEATURES.QA_MODE_ENABLED) ── murni utk simulasi uji formula/flow, tidak
  // menyentuh CURRENT_MONTH_IDX global / gate submit bulan aktif yang sesungguhnya.
  const [qaMode, setQaMode] = useState(false);
  const [qaUnlockedMonths, setQaUnlockedMonths] = useState([0, 1, 2, 3, 4, 5]); // Jan-Jun
  const [qaConfirmingDelete, setQaConfirmingDelete] = useState(false);
  const [qaConfirmingActualReset, setQaConfirmingActualReset] = useState(false);
  const [qaConfirmingClearSuggestions, setQaConfirmingClearSuggestions] = useState(false);
  const [qaConfirmingUnapprove, setQaConfirmingUnapprove] = useState(false);
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
  const hasAnySuggestion = myKPIs.some(k => k.suggestedFactor1 || k.suggestedFactor2);
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
  // Data Suggestion (Sec. QA/integrasi eksternal) — salin nilai saran ke Factor 1/2 bulan `i`. Menulis
  // lewat 2 jalur berbeda tergantung status baris: draft (bulan aktif `m`, blm "Simpan") vs langsung ke
  // context (bulan lain yg dibuka via QA Mode) — DIBUAT SEBAGAI 1 update atomik per jalur, bukan 2
  // panggilan setDraft/updateUserKPI berurutan, supaya F1 tidak ketimpa krn closure `drafts` basi.
  const applySuggestion = (i) => {
    const s1 = selectedKpi.suggestedFactor1?.[i];
    const s2 = selectedKpi.suggestedFactor2?.[i];
    if (s1 == null && s2 == null) return;
    if (i === m) {
      setDrafts(prev => ({ ...prev, [baseKpi.id]: { ...prev[baseKpi.id], ...(s1 != null ? { f1: s1 } : {}), ...(s2 != null ? { f2: s2 } : {}) } }));
    } else {
      updateUserKPI(currentUserName, selectedKpi.id, {
        ...(s1 != null ? { factor1: patchArrAt(selectedKpi.factor1, i, String(s1)) } : {}),
        ...(s2 != null ? { factor2: patchArrAt(selectedKpi.factor2, i, String(s2)) } : {}),
      });
    }
    toast('Data Suggestion diterapkan ke Factor 1/2 — silakan cek sebelum Simpan.');
  };
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
  const redKpisMissingPica = FEATURES.PICA_ENABLED ? dueKpis.filter(k => isFilledForMonth(k) && isRedAchievement(withDraft(k)) && !isPicaCompleteFor(k)) : [];
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
                  // Null-safe (root cause bug 2026-07-22): lihat catatan `kpiYTDStats` di helpers.js.
                  const stYTD = kpiYTDStats(k, m);
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
                      <td className={`px-2 py-1.5 border border-nlg-border text-center font-bold ${stYTD ? scoreBg(stYTD.score) : 'text-nlg-text-subdued'}`}>{stYTD ? stYTD.score : '—'}</td>
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
  // QA Mode bisa membuka bulan aktif `m` juga (lihat qaEditable di tabel bawah) meski KPI ini sedang
  // "tidak due" — dipakai utk konsisten-kan pesan/tombol di luar tabel (banner & area Simpan) supaya
  // tidak lagi bilang "bukan periode input" padahal baris `m` di tabel sudah kebuka utk diketik.
  const qaEditableCurrent = FEATURES.QA_MODE_ENABLED && qaMode && qaUnlockedMonths.includes(m);
  // Bulan yg dipakai utk preview %Actual (MTD)/(YTD) di bawah tabel — normalnya SELALU `m` (bulan aktif
  // sungguhan), DAN TETAP `m` selama `m` sudah terisi (supaya konsisten dgn "Status Pengisian Actual"
  // yg juga selalu berbasis `m` — bug sebelumnya: preview ini malah mengambil bulan QA lain yg lebih
  // baru walau `m` sendiri sudah ada datanya, jadi bisa beda dgn status list di bawah). Fallback ke
  // bulan TERISI PALING BARU di antara bulan yg dibuka QA HANYA kalau `m` sendiri masih kosong — supaya
  // saat user isi Actual Jan..Jun tapi Feb belum sempat diisi, preview tidak nampil kosong percuma.
  // TIDAK memengaruhi kalkulasi resmi Executive/Monitoring/Reports (tetap CURRENT_MONTH_IDX asli).
  const previewMonth = (() => {
    if (!(FEATURES.QA_MODE_ENABLED && qaMode)) return m;
    const mFilled = selectedKpi.factor1[m] !== null && selectedKpi.factor1[m] !== undefined && selectedKpi.factor2[m] !== null && selectedKpi.factor2[m] !== undefined;
    if (mFilled) return m;
    const candidates = qaUnlockedMonths.filter(i => i !== m).sort((a, b) => b - a);
    const filled = candidates.find(i => selectedKpi.factor1[i] !== null && selectedKpi.factor1[i] !== undefined && selectedKpi.factor2[i] !== null && selectedKpi.factor2[i] !== undefined);
    return filled !== undefined ? filled : m;
  })();

  // Gate "sama persis dgn Data Suggestion" (khusus bulan aktif `m`, jalur draft+Simpan) — `selectedKpi`
  // sudah termerge dgn draft (lihat withDraft), jadi factor1[m]/factor2[m] di sini = nilai yg SEDANG
  // diketik User, blm tentu sudah "Simpan". KPI tanpa suggestion utk bulan ini tidak terpengaruh sama sekali.
  // Selama QA Mode aktif (`qaMode`), Data Suggestion disembunyikan total (lihat sugg1/sugg2 di tabel
  // bawah) — gate ini ikut dinonaktifkan konsisten, supaya Simpan bulan aktif tidak pernah terkunci
  // gara-gara suggestion yg memang sedang tidak ditampilkan ke User.
  const mismatchF1 = !qaMode && suggestionMismatch(selectedKpi.factor1[m], selectedKpi.suggestedFactor1?.[m]);
  const mismatchF2 = !qaMode && suggestionMismatch(selectedKpi.factor2[m], selectedKpi.suggestedFactor2?.[m]);
  const hasSuggestionMismatch = mismatchF1 || mismatchF2;

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

      {FEATURES.QA_MODE_ENABLED && (
        <div className="mb-5 border-2 border-dashed border-purple-300 bg-purple-50/40 rounded-nlg-card p-4">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="text-[12px] font-bold text-purple-700">🧪 Testing Tools — khusus simulasi, bukan alur produksi sesungguhnya</div>
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-purple-700 cursor-pointer">
              <input type="checkbox" checked={qaMode} onChange={e => setQaMode(e.target.checked)} />
              Aktifkan QA Mode
            </label>
          </div>
          {qaMode && (
            <div className="space-y-3">
              <div>
                <div className="text-[11px] font-medium text-purple-700 mb-1">Buka input Factor 1/2 utk bulan berikut (termasuk bulan aktif {MONTH_LABELS[m]} — QA Mode bisa override periode yg sebenarnya "tidak due", mis. KPI Kuartalan/Semesteran):</div>
                <div className="flex gap-1.5 flex-wrap">
                  {MONTH_LABELS.map((label, i) => (
                    <label key={i} className={`text-[11px] font-medium px-2 py-1 rounded-full border cursor-pointer ${qaUnlockedMonths.includes(i) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-700 border-purple-200'}`}>
                      <input type="checkbox" className="hidden" checked={qaUnlockedMonths.includes(i)}
                        onChange={() => setQaUnlockedMonths(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i].sort((a, b) => a - b))} />
                      {label}{i === m ? ' (aktif)' : ''}
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-purple-200">
                {qaConfirmingUnapprove ? (
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-nlg-input px-3 py-2">
                      Yakin batalkan approval Planning <b>{currentUserName}</b>? {approvedKPIs.length} KPI (Approved/Locked) kembali ke Draft — bisa diedit ulang di Input Planning KPI, dan riwayat batch Planning yang sudah/masih diapprove Superior akan dihapus dari Approval Queue &amp; Riwayat Submission (siap disubmit ulang dari awal).
                    </div>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => {
                        resetApprovedToDraft(currentUserName);
                        setQaConfirmingUnapprove(false);
                        toast(`Approval Planning ${currentUserName} dibatalkan — ${approvedKPIs.length} KPI kembali ke Draft.`);
                      }} className="flex-1 text-[11px] font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-nlg-input px-3 py-2">
                        ✅ Ya, Batalkan Approval Sekarang
                      </button>
                      <button type="button" onClick={() => setQaConfirmingUnapprove(false)} className="flex-1 text-[11px] font-medium text-nlg-text-muted border border-nlg-border rounded-nlg-input px-3 py-2">
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setQaConfirmingUnapprove(true)} disabled={approvedKPIs.length === 0}
                    className="text-[11px] font-medium text-amber-700 border border-amber-300 bg-amber-50 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-nlg-input px-3 py-2">
                    🔓 Batalkan Approval — reset SEMUA KPI Approved/Locked ke Draft (edit &amp; submit ulang ke Superior)
                  </button>
                )}
              </div>
              <div className="pt-2 border-t border-purple-200">
                {qaConfirmingActualReset ? (
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-nlg-input px-3 py-2">
                      Yakin bersihkan SEMUA data Actual (Factor 1/2, Jan–Des) milik <b>{currentUserName}</b> di seluruh KPI ({myKPIs.length} KPI)? Planning (weight/target/formula/status) TIDAK ikut terhapus — hanya Actual yang direset ke kosong, siap diisi ulang dari nol.
                    </div>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => {
                        resetActualDataOnly(currentUserName);
                        setQaConfirmingActualReset(false);
                        setDrafts({});
                        toast(`Semua data Actual milik ${currentUserName} dibersihkan — Planning tetap utuh.`);
                      }} className="flex-1 text-[11px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-nlg-input px-3 py-2">
                        ✅ Ya, Bersihkan Actual Sekarang
                      </button>
                      <button type="button" onClick={() => setQaConfirmingActualReset(false)} className="flex-1 text-[11px] font-medium text-nlg-text-muted border border-nlg-border rounded-nlg-input px-3 py-2">
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setQaConfirmingActualReset(true)} disabled={myKPIs.length === 0}
                    className="text-[11px] font-medium text-red-700 border border-red-300 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-nlg-input px-3 py-2">
                    🧹 Bersihkan Semua Actual {currentUserName} (Jan–Des) — Planning tetap utuh, siap uji ulang
                  </button>
                )}
              </div>
              <div className="pt-2 border-t border-purple-200">
                {qaConfirmingClearSuggestions ? (
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-nlg-input px-3 py-2">
                      Yakin hapus kolom Data Suggestion (Saran F1/F2) dari SEMUA KPI milik <b>{currentUserName}</b>? Ini data mock demo (belum ada integrasi sungguhan — lihat Project Brief Sec. 6.2), dihapus khusus utk sesi testing ini supaya tidak ada gangguan validasi "sama persis dgn suggestion" saat Anda uji formula vs Excel.
                    </div>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => {
                        clearSuggestedData(currentUserName);
                        setQaConfirmingClearSuggestions(false);
                        toast(`Data Suggestion milik ${currentUserName} dihapus untuk sesi testing ini.`);
                      }} className="flex-1 text-[11px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-nlg-input px-3 py-2">
                        ✅ Ya, Hapus Data Suggestion Sekarang
                      </button>
                      <button type="button" onClick={() => setQaConfirmingClearSuggestions(false)} className="flex-1 text-[11px] font-medium text-nlg-text-muted border border-nlg-border rounded-nlg-input px-3 py-2">
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setQaConfirmingClearSuggestions(true)} disabled={!hasAnySuggestion}
                    className="text-[11px] font-medium text-red-700 border border-red-300 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-nlg-input px-3 py-2">
                    🚫 Hapus Data Suggestion {currentUserName} — kosongkan kolom Saran F1/F2 utk sesi testing ini
                  </button>
                )}
              </div>
              <div className="pt-2 border-t border-purple-200">
                {qaConfirmingDelete ? (
                  <div className="space-y-1.5">
                    <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-nlg-input px-3 py-2">
                      Yakin hapus SEMUA KPI (Planning + Actual) milik <b>{currentUserName}</b>? Tidak bisa dibatalkan — {myKPIs.length} KPI akan hilang.
                    </div>
                    <div className="flex gap-1.5">
                      <button type="button" onClick={() => {
                        resetAllUserKPIs(currentUserName);
                        setQaConfirmingDelete(false);
                        setSelectedKpiId(null);
                        toast(`Semua KPI milik ${currentUserName} dihapus.`);
                      }} className="flex-1 text-[11px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-nlg-input px-3 py-2">
                        ✅ Ya, Hapus Semua Sekarang
                      </button>
                      <button type="button" onClick={() => setQaConfirmingDelete(false)} className="flex-1 text-[11px] font-medium text-nlg-text-muted border border-nlg-border rounded-nlg-input px-3 py-2">
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setQaConfirmingDelete(true)} disabled={myKPIs.length === 0}
                    className="text-[11px] font-medium text-red-700 border border-red-300 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-nlg-input px-3 py-2">
                    🗑️ Hapus Semua KPI {currentUserName} (Planning + Actual) — reset total utk testing ulang
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
            {selectedKpi.factorNote && (
              <div className="pt-2 border-t border-nlg-border">
                <div className="text-[11px] text-nlg-primary font-medium">Catatan Factor 1/2</div>
                <div className="font-medium">{selectedKpi.factorNote}</div>
              </div>
            )}
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
                ke state semula, tanpa perlu re-submit manual via Planning + Approval Queue.
                Sebelumnya SELALU tampil terlepas dari FEATURES.QA_MODE_ENABLED (bug — lolos dari gate
                QA lain, ditemukan dari laporan user 2026-07-20: masih muncul utk user real "Morren
                Andriyanto" walau QA Mode sudah dimatikan). Sekarang ikut dikunci di belakang flag yg
                sama spt Testing Tools lain, supaya tidak ada jalur bypass status Approved di real
                simulation/produksi. */}
            {FEATURES.QA_MODE_ENABLED && (
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
            )}
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
              {qaEditableCurrent && <> <b>QA Mode tetap membuka input bulan ini</b> utk simulasi — lihat baris {MONTH_LABELS[m]} di tabel bawah.</>}
            </div>
          )}
          {selectedKpi.factorNote && (
            <div className="text-[10px] text-nlg-text-subdued mb-2">{selectedKpi.factorNote}</div>
          )}
          <div className="border border-nlg-border rounded-nlg-input overflow-hidden mb-3">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-nlg-sidebar text-nlg-text-subdued text-[10px] uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Month</th>
                  <th className="px-3 py-2">Status</th>
                  <th colSpan={2} className="px-2 py-2 text-center leading-tight" title="Rekomendasi dari sumber data eksternal (data automation) — acuan sebelum input ulang di Factor 1/2">
                    <div>Data Suggest</div>
                    <div>Factor 1 / Factor 2</div>
                  </th>
                  <th className="text-right px-3 py-2 leading-tight">
                    <div>Actual Data</div>
                    <div>Factor 1 / Factor 2</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nlg-border">
                {MONTH_LABELS.map((label, i) => {
                  const isCurrent = i === m;
                  const isFuture = i > m;
                  const due = isDraftPreview || isDueMonth(selectedKpi.period, i);
                  const filled = selectedKpi.factor1[i] !== null && selectedKpi.factor1[i] !== undefined;
                  const openForInput = isCurrent && due;
                  // QA Testing Tools: bulan yg dicentang di panel testing bisa diedit langsung (tulis
                  // ke context per-keystroke, beda dari alur draft+Simpan normal yg cuma utk bulan `m`).
                  // Termasuk bulan aktif (isCurrent) — supaya QA Mode bisa override gate `due` (mis.
                  // KPI Kuartalan/Semesteran yg bulan aktifnya bukan periode wajib isi) utk uji menyeluruh.
                  const qaEditable = FEATURES.QA_MODE_ENABLED && qaMode && qaUnlockedMonths.includes(i);
                  const editableNow = qaEditable || (openForInput && !locked);
                  // Selama QA Mode aktif, Data Suggestion (kolom Saran F1/F2 + validasi "sama persis")
                  // otomatis disembunyikan total — user testing formula murni tanpa gangguan data mock
                  // ini, tidak perlu klik tombol "Hapus Data Suggestion" terpisah dulu tiap sesi QA.
                  const sugg1 = qaMode ? null : selectedKpi.suggestedFactor1?.[i];
                  const sugg2 = qaMode ? null : selectedKpi.suggestedFactor2?.[i];
                  const hasSuggestion = sugg1 != null || sugg2 != null;
                  // `selectedKpi.factor1/2[i]` sudah benar utk kedua jalur: utk i===m sudah termerge
                  // draft (lihat withDraft), utk qaEditable = nilai live di context (tanpa draft).
                  const rowMismatchF1 = editableNow && suggestionMismatch(selectedKpi.factor1[i], sugg1);
                  const rowMismatchF2 = editableNow && suggestionMismatch(selectedKpi.factor2[i], sugg2);
                  const rowHasMismatch = rowMismatchF1 || rowMismatchF2;
                  return (
                    <tr key={label} className={openForInput ? 'bg-nlg-primary-tint' : qaEditable ? 'bg-purple-50' : (isFuture || !due) ? 'opacity-50' : ''}>
                      <td className={`px-3 py-1.5 text-xs font-medium ${openForInput ? 'text-nlg-primary' : qaEditable ? 'text-purple-700' : 'text-nlg-text'}`}>{label}</td>
                      <td className="px-3 py-1.5 text-center">
                        {qaEditable ? <span title="QA Mode — bulan dibuka utk testing">🧪</span>
                          : !due ? <span className="text-[10px] text-nlg-text-subdued">—</span>
                          : openForInput ? (locked ? <Icon name="lock" className="inline text-nlg-text-subdued" /> : <span className="text-nlg-primary">●</span>)
                          : filled ? <Icon name="check" className="inline text-green-600" />
                          : <Icon name="lock" className="inline text-nlg-text-subdued" />}
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs text-nlg-text-subdued">{sugg1 ?? '–'}</td>
                      <td className="px-2 py-1.5 text-right text-xs text-nlg-text-subdued whitespace-nowrap">
                        {sugg2 ?? '–'}
                        {hasSuggestion && editableNow && (
                          <button type="button" onClick={() => applySuggestion(i)} title="Pakai nilai ini ke Factor 1/2"
                            className="ml-1 text-purple-600 hover:text-purple-800">📥</button>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        {qaEditable ? (
                          <div>
                            <div className="flex justify-end gap-1.5">
                              <input type="number" step="0.01" value={selectedKpi.factor1[i] ?? ''}
                                onChange={e => updateUserKPI(currentUserName, selectedKpi.id, { factor1: patchArrAt(selectedKpi.factor1, i, e.target.value) })}
                                placeholder="F1" title={selectedKpi.factorNote || 'Factor 1'} className={`w-20 rounded-nlg-input px-2 py-1 text-xs border ${rowMismatchF1 ? 'border-red-500 bg-red-50' : 'border-purple-400'}`} />
                              <input type="number" step="0.01" value={selectedKpi.factor2[i] ?? ''}
                                onChange={e => updateUserKPI(currentUserName, selectedKpi.id, { factor2: patchArrAt(selectedKpi.factor2, i, e.target.value) })}
                                placeholder="F2" title={selectedKpi.factorNote || 'Factor 2'} className={`w-20 rounded-nlg-input px-2 py-1 text-xs border ${rowMismatchF2 ? 'border-red-500 bg-red-50' : 'border-purple-400'}`} />
                            </div>
                            {rowHasMismatch && <div className="text-[9px] text-red-600 mt-0.5">⚠️ Beda dari Data Suggestion (QA Mode — tetap tersimpan)</div>}
                          </div>
                        ) : !due ? (
                          <span className="text-xs text-nlg-text-subdued italic">bukan periode input</span>
                        ) : openForInput && !locked ? (
                          <div>
                            <div className="flex justify-end gap-1.5">
                              <input type="number" step="0.01" value={drafts[baseKpi.id]?.f1 ?? (baseKpi.factor1[i] ?? '')} onChange={e => setDraft('f1', e.target.value)} placeholder="F1" title={selectedKpi.factorNote || 'Factor 1'} className={`w-20 rounded-nlg-input px-2 py-1 text-xs border ${rowMismatchF1 ? 'border-red-500 bg-red-50' : 'border-nlg-primary'}`} />
                              <input type="number" step="0.01" value={drafts[baseKpi.id]?.f2 ?? (baseKpi.factor2[i] ?? '')} onChange={e => setDraft('f2', e.target.value)} placeholder="F2" title={selectedKpi.factorNote || 'Factor 2'} className={`w-20 rounded-nlg-input px-2 py-1 text-xs border ${rowMismatchF2 ? 'border-red-500 bg-red-50' : 'border-nlg-primary'}`} />
                            </div>
                            {rowHasMismatch && <div className="text-[9px] text-red-600 mt-0.5">⚠️ Beda dari Data Suggestion — periksa kembali, Simpan terkunci</div>}
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
          </div>

          {/* MTD/YTD Preview — calcMTD/calcYTD (beda dgn kpiMonthStats) TIDAK menjaga null: kategori
              DIRECT/LAST me-return factor1/factor2 mentah, yg masih null selama Factor 1&2 bulan
              berjalan belum diisi (KPI baru Approved, belum pernah Input Actual). `.toFixed()` di null
              crash tanpa error boundary → seluruh halaman blank putih (root cause bug yg dilaporkan). */}
          {FEATURES.QA_MODE_ENABLED && qaMode && previewMonth !== m && (
            <div className="text-[10px] text-purple-700 mb-1">🧪 Bulan {MONTH_LABELS[m]} masih kosong — preview di bawah memakai bulan terisi terakhir (QA): <b>{MONTH_LABELS[previewMonth]}</b></div>
          )}
          <div className="grid grid-cols-2 gap-2 mb-3 text-center">
            {(() => {
              const hasF1 = selectedKpi.factor1[previewMonth] !== null && selectedKpi.factor1[previewMonth] !== undefined;
              const hasF2 = selectedKpi.factor2[previewMonth] !== null && selectedKpi.factor2[previewMonth] !== undefined;
              const mtdVal = hasF1 && hasF2 ? calcMTD(selectedKpi, previewMonth) : null;
              const ytdVal = hasF1 && hasF2 ? calcYTD(selectedKpi, previewMonth) : null;
              return (
                <>
                  <div className="bg-nlg-sidebar rounded-nlg-input py-2">
                    <div className="text-[10px] text-nlg-text-subdued">%Actual (MTD) · {MONTH_LABELS[previewMonth]}</div>
                    <div className="font-semibold text-sm">{mtdVal !== null && mtdVal !== undefined ? `${mtdVal.toFixed(1)}%` : '—'}</div>
                  </div>
                  <div className="bg-nlg-sidebar rounded-nlg-input py-2">
                    <div className="text-[10px] text-nlg-text-subdued">%Actual (YTD) · {selectedKpi.ytdCat} s.d. {MONTH_LABELS[previewMonth]}</div>
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

          {/* QA Mode (qaEditableCurrent) sengaja TIDAK ikut ditampilkan banner ini — sudah ada warning
              inline per-baris di tabel ("Beda dari Data Suggestion (QA Mode — tetap tersimpan)") yg
              tidak mengunci Simpan, krn QA Mode memang dirancang bebas simulasi Actual ≠ Suggestion. */}
          {hasSuggestionMismatch && !qaEditableCurrent && (
            <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-nlg-input px-3 py-2 mb-3">
              ⚠️ Factor {mismatchF1 && mismatchF2 ? '1 & 2' : mismatchF1 ? '1' : '2'} yang Anda input tidak sama persis dengan Data Suggestion — periksa kembali kemungkinan salah ketik. Simpan dikunci sampai nilainya sama persis (2 desimal).
            </div>
          )}
          <div className="flex justify-end gap-2">
            {qaEditableCurrent ? (
              <span className="text-[11px] text-purple-700 flex items-center gap-1.5 px-2">🧪 QA Mode — nilai bulan {MONTH_LABELS[m]} tersimpan otomatis begitu diketik (tanpa perlu Simpan)</span>
            ) : !selectedKpiDue ? (
              <span className="text-[11px] text-nlg-text-subdued flex items-center gap-1.5 px-2">📅 Tidak ada yang perlu disimpan — bukan periode input KPI ini</span>
            ) : locked ? (
              <span className="text-[11px] text-nlg-text-subdued flex items-center gap-1.5 px-2"><Icon name="lock" className="inline" /> Bulan {MONTH_LABELS[m]} sudah disubmit — terkunci</span>
            ) : (
              <button onClick={() => { commitFactors(baseKpi); toast(`Realisasi ${baseKpi.name} untuk ${MONTH_LABELS[m]} disimpan.`); }} disabled={hasSuggestionMismatch}
                className="px-4 py-2 text-sm rounded-nlg-input bg-nlg-primary text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed">Simpan</button>
            )}
          </div>
        </div>
      </div>

      {/* PICA Section for Red KPIs — di belakang feature flag, lihat src/config/features.js */}
      {FEATURES.PICA_ENABLED && isRed && (
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
            const picaMissing = FEATURES.PICA_ENABLED && kRed && !isPicaCompleteFor(k);
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
