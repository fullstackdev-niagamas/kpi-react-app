import { useState, useRef, useLayoutEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { useKPIContext } from '../../context/KPIContext';
import {
  ACTIVE_PLAN_YEAR,
  AVAILABLE_YEARS,
  MONTH_LABELS,
  CURRENT_MONTH_IDX,
  MASTER_DEPT,
} from '../../data/mockData';
import {
  gradeFromTotal, gradeFromScore, buildDeptAggregates, kpiMonthStats, calcYTD, computeAch, computeScore,
  PERSP_ORDER, PERSP_META, borderByGrade, bgByGrade, textColorByGrade,
} from '../../utils/helpers';

// Tebak perspektif untuk SO lama yang belum punya field persp, agar tetap tampil.
const perspOfSO = (s) => (PERSP_ORDER.includes(s.persp) ? s.persp : 'Financial');

const emptyForm = { id: null, so: '', persp: 'Financial', level: 'Company', dept: 'Company', parentId: null, active: true, linkedTo: [] };

export const StrategyMap = ({ isCS = true }) => {
  const toast = useToast();
  const { sos, addSO, updateSO, deleteSO, users, userKPIs, batches } = useKPIContext();
  const [viewYear, setViewYear] = useState(ACTIVE_PLAN_YEAR);
  const [periodMode, setPeriodMode] = useState('mtd'); // 'mtd' | 'ytd'
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(null); // null = form tertutup

  const containerRef = useRef(null);
  const cardRefs = useRef({});
  const [linkLines, setLinkLines] = useState([]);

  const m = CURRENT_MONTH_IDX;

  // Skor SEKARANG dihitung dari data KPI sungguhan (Sec. 8) — sebelumnya "soDemoScore"/"kpiDemoScore"
  // murni angka acak deterministik dari hash id, TIDAK PERNAH benar2 mencerminkan Actual/Target yg
  // diinput User (temuan terbuka sejak v6.7/v6.9, sekarang diperbaiki). `allDepts` pakai
  // `buildDeptAggregates` — fungsi & sumber data yg SAMA persis dgn Executive Dashboard/Monitoring,
  // supaya Company Score di Strategy Map SELALU identik dgn yg tampil di BSC Company (root cause bug
  // lama sebelum v6.0: angka beda2 antar halaman krn masing2 hitung sendiri2 secara terpisah).
  const allDepts = buildDeptAggregates(users, userKPIs, batches, m);

  // KPI Approved/Locked sungguhan yg `so`-nya cocok nama SO ini — lintas Dept/User mana pun (1 SO bisa
  // ditarget banyak instance dari Dept berbeda, mis. cascade Company → beberapa Dept — lihat v6.27).
  const kpisForSO = (soName) => allDepts.flatMap((d) => d.kpis.filter((k) => k.so === soName));

  // Skor YTD per Dept (analog `deptScoreAt` yg sudah ada di helpers.js, tapi versi YTD — belum ada
  // padanannya di helpers.js krn Executive Dashboard summary cuma menampilkan Company Score MTD).
  const deptYTDScoreAt = (kpisList) => kpisList.reduce((s, k) => {
    const st = kpiMonthStats(k, m);
    if (!st) return s;
    const ach = computeAch(k.type, k.target, calcYTD(k, m));
    return s + computeScore(ach, k.type) * k.weight;
  }, 0);

  // Rata-rata tertimbang score (0-3) utk sekumpulan KPI lintas-dept (mis. kontributor 1 SO) — di-
  // normalisasi thd total bobot KPI yg py data bulan ini, supaya adil walau bobotnya berasal dari
  // "kolam 100%" milik User/Dept yg berbeda-beda (bukan cuma dijumlah mentah spt `deptScoreAt`).
  const weightedAvgScore = (kpisList) => {
    const withData = kpisList.filter((k) => kpiMonthStats(k, m));
    if (withData.length === 0) return null;
    const totalW = withData.reduce((s, k) => s + k.weight, 0);
    if (!totalW) return null;
    const sum = withData.reduce((s, k) => {
      if (periodMode === 'ytd') {
        const ach = computeAch(k.type, k.target, calcYTD(k, m));
        return s + computeScore(ach, k.type) * k.weight;
      }
      return s + kpiMonthStats(k, m).score * k.weight;
    }, 0);
    return sum / totalW;
  };

  const companyScoreMTD = allDepts.length ? allDepts.reduce((s, d) => s + d.score, 0) / allDepts.length : 0;
  const companyScoreYTD = allDepts.length ? allDepts.reduce((s, d) => s + deptYTDScoreAt(d.kpis), 0) / allDepts.length : 0;
  const companyScore = periodMode === 'ytd' ? companyScoreYTD : companyScoreMTD;
  const companyGrade = gradeFromTotal(companyScore);

  const openAdd = (persp) => setForm({ ...emptyForm, persp });
  const openEdit = (s) => setForm({ ...emptyForm, ...s, persp: perspOfSO(s), linkedTo: s.linkedTo || [] });
  const closeForm = () => setForm(null);

  const toggleLinkedTo = (id) => {
    const arr = form.linkedTo || [];
    setForm({ ...form, linkedTo: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] });
  };

  const saveForm = () => {
    if (!form.so.trim()) { toast('Nama Strategic Objective wajib diisi.', 'warn'); return; }
    const payload = {
      ...form,
      so: form.so.trim(),
      dept: form.level === 'Company' ? 'Company' : form.dept,
      parentId: form.level === 'Company' ? null : form.parentId,
      linkedTo: form.level === 'Company' ? (form.linkedTo || []) : [],
    };
    if (form.id) {
      updateSO(form.id, payload);
      toast(`Strategic Objective "${payload.so}" diperbarui.`);
    } else {
      addSO(payload);
      toast(`Strategic Objective "${payload.so}" ditambahkan.`);
    }
    closeForm();
  };

  const removeSO = (s) => {
    deleteSO(s.id);
    toast(`Strategic Objective "${s.so}" dihapus.`, 'danger');
    closeForm();
  };

  // Hitung ulang koordinat garis korelasi antar-kartu SO (linkedTo) berdasarkan posisi DOM aktual —
  // supaya panah tetap presisi walau layout berubah (flex-wrap, Edit Mode, resize window, dsb).
  const recomputeLinks = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();
    const lines = [];
    sos.filter((s) => s.level === 'Company').forEach((s) => {
      (s.linkedTo || []).forEach((targetId) => {
        const fromEl = cardRefs.current[s.id];
        const toEl = cardRefs.current[targetId];
        if (fromEl && toEl) {
          const fr = fromEl.getBoundingClientRect();
          const tr = toEl.getBoundingClientRect();
          lines.push({
            key: `${s.id}->${targetId}`,
            x1: fr.left + fr.width / 2 - cRect.left,
            y1: fr.top + fr.height / 2 - cRect.top,
            x2: tr.left + tr.width / 2 - cRect.left,
            y2: tr.top + tr.height / 2 - cRect.top,
          });
        }
      });
    });
    setLinkLines(lines);
  }, [sos]);

  useLayoutEffect(() => {
    recomputeLinks();
    window.addEventListener('resize', recomputeLinks);
    return () => window.removeEventListener('resize', recomputeLinks);
  }, [recomputeLinks, editMode, periodMode, viewYear, userKPIs, batches]);

  const soForPersp = (persp) => sos.filter((s) => s.level === 'Company' && perspOfSO(s) === persp && (editMode || s.active));
  const deptChildCount = (soId) => sos.filter((d) => d.level === 'Dept' && d.parentId === soId).length;
  const financialSOs = soForPersp('Financial');
  const rootCandidates = financialSOs.filter((s) => deptChildCount(s.id) === 0);
  const rootSO = rootCandidates.length === 1 ? rootCandidates[0] : null;
  const financialBandSOs = rootSO ? financialSOs.filter((s) => s.id !== rootSO.id) : financialSOs;

  const renderSOCard = (s, keyPrefix = '') => {
    const linkedKPIs = kpisForSO(s.so);
    const score = weightedAvgScore(linkedKPIs);
    const grade = score !== null ? gradeFromTotal(score) : null;
    return (
      <div
        key={keyPrefix + s.id}
        ref={(el) => { if (el) cardRefs.current[s.id] = el; }}
        onClick={editMode ? () => openEdit(s) : undefined}
        className={`relative rounded-nlg-input border-2 bg-white overflow-hidden transition-shadow w-56 shrink-0 ${editMode ? 'cursor-pointer hover:shadow-md' : ''} ${!s.active ? 'opacity-50' : ''}`}
        style={{ borderColor: grade ? borderByGrade(grade.label) : '#E5E7EB', zIndex: 2 }}
      >
        <div className="flex items-center justify-between gap-1 px-3 py-2" style={{ background: grade ? bgByGrade(grade.label) : '#F9FAFB' }}>
          <span className="text-[12px] font-bold leading-snug text-nlg-text">{s.so}</span>
          {grade ? (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${grade.cls}`}>{score.toFixed(2)}</span>
          ) : (
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full shrink-0 bg-gray-100 text-nlg-text-subdued">Belum ada data</span>
          )}
        </div>
        {linkedKPIs.length > 0 ? (
          <div className="divide-y divide-nlg-border">
            {linkedKPIs.map((k) => {
              const st = kpiMonthStats(k, m);
              const ach = st ? (periodMode === 'ytd' ? computeAch(k.type, k.target, calcYTD(k, m)) : st.ach) : null;
              const kScore = st ? (periodMode === 'ytd' ? computeScore(ach, k.type) : st.score) : null;
              const kGrade = kScore !== null ? gradeFromScore(kScore) : null;
              return (
                <div key={k.id} className="flex items-center justify-between gap-2 px-3 py-1.5">
                  <span className="text-[10px] text-nlg-text-muted truncate">{k.name}</span>
                  {kGrade ? (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${kGrade.cls}`}>{(ach * 100).toFixed(0)}% · {kScore}</span>
                  ) : (
                    <span className="text-[9px] text-nlg-text-subdued italic shrink-0">Belum ada Actual</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-3 py-1.5 text-[10px] text-nlg-text-subdued italic">Belum ada KPI terhubung</div>
        )}
        {editMode && (
          <div className="px-3 py-1 text-[9px] text-nlg-primary bg-nlg-primary-tint/50 flex items-center justify-between">
            <span>✏️ Klik utk edit</span>
            {(s.linkedTo || []).length > 0 && <span title="Jumlah SO yang didorong">🔗 {s.linkedTo.length}</span>}
          </div>
        )}
      </div>
    );
  };

  const renderBand = (persp, items, isLast) => {
    const meta = PERSP_META[persp];
    const perspScore = weightedAvgScore(items.flatMap((s) => kpisForSO(s.so)));
    const perspGrade = perspScore !== null ? gradeFromTotal(perspScore) : null;
    return (
      <div key={persp}>
        <div className="flex items-stretch gap-3">
          <div className="w-28 shrink-0 rounded-nlg-input flex flex-col items-center justify-center py-3 text-white text-center gap-1" style={{ background: meta.color }}>
            <div className="text-[11px] font-bold leading-tight">{persp}</div>
            <div className="text-[9px] opacity-75">Perspective</div>
            <div className="text-xl font-black mt-1">{perspScore !== null ? perspScore.toFixed(2) : '—'}</div>
            {perspGrade && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${perspGrade.cls}`}>{perspGrade.label} · {perspGrade.text}</span>
            )}
          </div>
          <div className="flex-1 flex flex-wrap gap-3 items-start p-3 rounded-nlg-card border" style={{ borderColor: meta.border, background: meta.light }}>
            {items.map((s) => renderSOCard(s))}
            {items.length === 0 && !editMode && (
              <div className="text-[11px] text-nlg-text-subdued italic py-4 px-2">Belum ada SO aktif</div>
            )}
            {editMode && (
              <button
                onClick={() => openAdd(persp)}
                className="w-40 shrink-0 text-[11px] font-medium text-nlg-primary border border-dashed border-nlg-primary/50 rounded-nlg-input py-3 hover:bg-white/60 self-stretch"
              >
                + Tambah SO
              </button>
            )}
          </div>
        </div>
        {!isLast && (
          <div className="flex justify-center text-nlg-text-subdued text-lg leading-none my-1" title="Cause-effect: perspektif di bawah mendorong perspektif di atas">▲</div>
        )}
      </div>
    );
  };

  return (
    <div className="mb-5">
      {/* Header — judul + info periode & Total Score ditaruh di atas (lebih informatif, tak perlu scroll) */}
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-nlg-text mb-1">Strategy Map {viewYear}</h1>
          <p className="text-sm text-nlg-text-muted">
            {isCS
              ? 'Mode Kelola — aktifkan Edit Mode untuk menambah/mengubah SO. Skor ditarik dari KPI Actual sungguhan.'
              : 'Tampilan Strategy Map BSC — skor dari KPI Actual sungguhan.'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="text-[11px] font-medium text-nlg-text-muted">Periode:</span>
            {AVAILABLE_YEARS.map((yr) => (
              <button
                key={yr}
                onClick={() => setViewYear(yr)}
                className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-colors ${
                  viewYear === yr
                    ? 'bg-nlg-primary text-white border-nlg-primary'
                    : 'bg-white text-nlg-text-muted border-nlg-border hover:bg-nlg-primary-tint'
                }`}
              >
                {yr}
                {yr === ACTIVE_PLAN_YEAR ? ' 🔓' : yr < ACTIVE_PLAN_YEAR ? ' ⏮' : ' ⏭'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-nlg-input border border-nlg-border overflow-hidden text-[11px] font-medium">
              <button
                onClick={() => setPeriodMode('mtd')}
                className={`px-3 py-1 transition-colors ${periodMode === 'mtd' ? 'bg-nlg-primary text-white' : 'bg-white text-nlg-text-muted hover:bg-nlg-primary-tint'}`}
              >
                Bulan Berjalan
              </button>
              <button
                onClick={() => setPeriodMode('ytd')}
                className={`px-3 py-1 transition-colors border-l border-nlg-border ${periodMode === 'ytd' ? 'bg-nlg-primary text-white' : 'bg-white text-nlg-text-muted hover:bg-nlg-primary-tint'}`}
              >
                YTD
              </button>
            </div>
            <span className="text-[11px] text-nlg-text-subdued">{MONTH_LABELS[CURRENT_MONTH_IDX]} {viewYear}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-nlg-text-muted">Total Score{periodMode === 'ytd' ? ' (YTD)' : ' (MTD)'}:</span>
            <span className={`text-base font-black ${textColorByGrade(companyGrade.label)}`}>{companyScore.toFixed(2)}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${companyGrade.cls}`}>{companyGrade.label} · {companyGrade.text}</span>
            <span className="text-[10px] text-nlg-text-subdued">(= Executive Dashboard)</span>
          </div>
        </div>
      </div>

      {/* Company banner — ringkas (skor & periode sudah dipindah ke header atas) */}
      <div
        className="flex items-center gap-5 mb-5 px-5 py-3 rounded-nlg-card text-white"
        style={{ background: 'linear-gradient(135deg,#172B4D,#1e3d6e)' }}
      >
        <div className="flex-1">
          <div className="text-[11px] opacity-60 uppercase tracking-widest mb-0.5">
            PT Niagamas Lestari Gemilang · {MONTH_LABELS[CURRENT_MONTH_IDX]} {viewYear}
          </div>
          <div className="text-[13px] font-semibold opacity-80">
            Company Strategy Map — Balanced Scorecard
          </div>
        </div>
        {isCS && (
          <button
            onClick={() => {
              setEditMode((v) => !v);
              if (!editMode) toast('Edit Mode aktif — klik kartu SO untuk edit, atau "+ Tambah SO" pada tiap kolom.');
            }}
            className={`px-3 py-2 text-xs font-medium rounded-nlg-input border ${
              editMode ? 'bg-amber-400 text-nlg-text border-amber-400' : 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
            }`}
          >
            {editMode ? '✓ Selesai Edit' : '✏️ Edit Mode'}
          </button>
        )}
      </div>

      {/* Strategic Score cascade — SO per perspektif (Financial di atas, Learning & Growth di bawah,
          sesuai alur cause-effect BSC), tiap kartu SO menampilkan KPI Approved/Locked SUNGGUHAN yg
          `so`-nya cocok, beserta Achievement & Score aktualnya (v6.28 — sebelumnya angka demo/acak).
          KPI yg belum py Actual bulan ini tampil "Belum ada Actual" (netral), bukan skor palsu. SO
          Financial tanpa cascade Dept (root/outcome utama) ditonjolkan di atas. Garis putus-putus =
          korelasi antar-SO (diatur via field "🔗 Mendorong" di form Edit). */}
      <div ref={containerRef} className="relative">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1, overflow: 'visible' }}>
          <defs>
            <marker id="som-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="#94a3b8" />
            </marker>
          </defs>
          {linkLines.map((l) => (
            <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4" markerEnd="url(#som-arrow)" />
          ))}
        </svg>
        <div className="relative" style={{ zIndex: 2 }}>
          {rootSO && (
            <div className="flex flex-col items-center mb-1">
              <div className="w-56">{renderSOCard(rootSO, 'root-')}</div>
              <div className="text-nlg-text-subdued text-lg leading-none my-1" title="Didorong oleh SO Financial lainnya">▲</div>
            </div>
          )}
          {renderBand('Financial', financialBandSOs, false)}
          {renderBand('Customer', soForPersp('Customer'), false)}
          {renderBand('Internal Process', soForPersp('Internal Process'), false)}
          {renderBand('Learning & Growth', soForPersp('Learning & Growth'), true)}
        </div>
      </div>

      {/* Legend + footer */}
      <div className="flex items-center gap-5 mt-4 text-[11px] text-nlg-text-subdued flex-wrap">
        <span>🟢 Score ≥2.5 — Baik</span>
        <span>🟡 Score 1.5–2.4 — Cukup</span>
        <span>🔴 Score ≤1.5 — Kurang</span>
        <span>⬜ Belum ada data Actual</span>
        <span>┅➤ Korelasi antar-SO</span>
        <span className="ml-auto">Data: {MONTH_LABELS[CURRENT_MONTH_IDX]} {viewYear} · {periodMode === 'ytd' ? 'YTD' : 'Bulan Berjalan'}</span>
      </div>

      {/* Edit modal */}
      {form && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeForm}>
          <div className="bg-white rounded-nlg-card w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3 border-b border-nlg-border flex items-center justify-between">
              <span className="font-bold text-nlg-text">{form.id ? 'Edit Strategic Objective' : 'Tambah Strategic Objective'}</span>
              <button onClick={closeForm} className="text-nlg-text-subdued hover:text-nlg-text">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-nlg-text-muted">Nama Strategic Objective</label>
                <input
                  autoFocus
                  value={form.so}
                  onChange={(e) => setForm({ ...form, so: e.target.value })}
                  placeholder="mis. Meningkatkan Profitabilitas"
                  className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm focus:border-nlg-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-nlg-text-muted">Perspektif BSC</label>
                <select
                  value={form.persp}
                  onChange={(e) => setForm({ ...form, persp: e.target.value })}
                  className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm"
                >
                  {PERSP_ORDER.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-nlg-text-muted">Level</label>
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                  className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm"
                >
                  <option value="Company">Company</option>
                  <option value="Dept">Dept</option>
                </select>
              </div>
              {form.level === 'Dept' && (
                <div>
                  <label className="text-xs font-medium text-nlg-text-muted">Berlaku untuk Departemen</label>
                  <select
                    value={form.dept}
                    onChange={(e) => setForm({ ...form, dept: e.target.value })}
                    className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm"
                  >
                    {MASTER_DEPT.filter((d) => d !== 'Company' && d !== 'BOD').map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              {form.level === 'Company' && (
                <div>
                  <label className="text-xs font-medium text-nlg-text-muted">🔗 Mendorong (feeds ke) SO Berikut</label>
                  <div className="mt-1 max-h-32 overflow-y-auto border border-nlg-border rounded-nlg-input p-2 space-y-1">
                    {sos.filter((x) => x.level === 'Company' && x.active && x.id !== form.id).map((x) => (
                      <label key={x.id} className="flex items-center gap-2 text-[12px] cursor-pointer">
                        <input type="checkbox" checked={(form.linkedTo || []).includes(x.id)} onChange={() => toggleLinkedTo(x.id)} />
                        <span>{x.so} <span className="text-nlg-text-subdued">({x.persp})</span></span>
                      </label>
                    ))}
                    {sos.filter((x) => x.level === 'Company' && x.active && x.id !== form.id).length === 0 && (
                      <div className="text-[11px] text-nlg-text-subdued italic">Belum ada SO Company lain yang aktif.</div>
                    )}
                  </div>
                  <div className="text-[10px] text-nlg-text-subdued mt-1">Menampilkan panah korelasi di Strategy Map dari SO ini menuju SO yang dicentang.</div>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm text-nlg-text-muted">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Aktif
              </label>
            </div>
            <div className="px-5 py-3 border-t border-nlg-border flex items-center justify-between">
              {form.id ? (
                <button onClick={() => removeSO(form)} className="text-[13px] text-red-600 hover:underline">Hapus</button>
              ) : <span />}
              <div className="flex gap-2">
                <button onClick={closeForm} className="px-4 py-2 text-sm rounded-nlg-input border border-nlg-border text-nlg-text-muted">Batal</button>
                <button onClick={saveForm} className="px-4 py-2 text-sm rounded-nlg-input bg-nlg-primary text-white font-medium">💾 Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
