import { useState } from 'react';
import { ACTIVE_PLAN_YEAR, CURRENT_MONTH_IDX, PERSPECTIVES, MTD_CATEGORIES, YTD_CATEGORIES, AVAILABLE_YEARS } from '../data/mockData';
import { useKPIContext } from '../context/KPIContext';
import { useToast } from '../context/ToastContext';
import { Icon } from '../components/Icons';

// Sec. 4.4 Project Brief: KPI Mandatory bisa berasal dari 3 sumber cascade
const cascadeLabel = (k) => {
  if (k.owner_type === 'company') return '🔗 Company → Cascade ke Dept';
  if (k.owner_type === 'dept') return `✓ Mandatory Dept Level (${k.owner_name})`;
  if (k.owner_type === 'user') return '👤 Mandatory Individual';
  return '';
};

const emptyForm = { persp: 'Financial', so: '', name: '', desc: '', type: 'Max', mtdCat: 'DIRECT', ytdCat: 'LAST', period: 'Bulanan', target: 100, uom: '%', weight: 20 };

export const Planning = ({ currentUserName }) => {
  const { users, sos, kpis, userKPIs, addUserKPI, updateUserKPI, submitUserKPIStatus, addBatch } = useKPIContext();
  const toast = useToast();
  const [viewYear, setViewYear] = useState(ACTIVE_PLAN_YEAR);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [cascadeOverrides, setCascadeOverrides] = useState({});

  const userMeta = users.find(u => u.name === currentUserName?.trim()) || users[0];
  const isActive = viewYear === ACTIVE_PLAN_YEAR;
  const stratObjActive = userMeta.level === 'Company' || userMeta.level === 'Dept';

  // KPI Mandatory dari KPI Builder — 3 sumber cascade (lihat cascadeLabel di atas & Sec. 4.4 Project Brief).
  const cascadedKPIs = kpis.filter(k => k.status === 'Active' && (
    (k.owner_type === 'company' && (k.cascade_depts || []).includes(userMeta.dept)) ||
    (k.owner_type === 'dept' && k.owner_name === userMeta.dept) ||
    (k.owner_type === 'user' && k.owner_name === userMeta.name)
  ));

  // Planning items = KPI instance milik user ini (Sec. 8 — sumber tunggal, dipakai juga oleh
  // Dashboard/ActualInput/History/Team/Monitoring/Executive). Weight disimpan sbg fraksi 0-1
  // (konvensi kpiMonthStats), form pakai persen (0-100) untuk kemudahan input.
  // Dibulatkan 2 desimal — penjumlahan fraksi float (mis. 0.05+0.1+0.15+0.2) bisa menghasilkan noise
  // spt 99.99999999999999 walau scr konsep = 100. Perbandingan "lengkap 100%" pakai toleransi
  // (bukan `=== 100` yg rapuh thd float noise ini — sudah dipakai benar di KPIBuilder.jsx `weightOK`,
  // sebelumnya Planning.jsx belum konsisten, itulah sumber gejala "tidak sinkron" yang dilaporkan).
  const planningItems = userKPIs[currentUserName] || [];
  const totalWeight = Math.round(planningItems.reduce((s, i) => s + i.weight * 100, 0) * 100) / 100;
  const isWeightComplete = Math.abs(totalWeight - 100) < 0.1;
  const draftCount = planningItems.filter(i => i.status === 'Draft').length;
  // Info breakdown Draft vs Submitted+ — totalWeight di atas SUDAH termasuk Draft (dipakai utk gating Submit),
  // draftWeight ditampilkan terpisah murni sbg info progres saat User masih menginput.
  const draftWeight = Math.round(planningItems.filter(i => i.status === 'Draft').reduce((s, i) => s + i.weight * 100, 0) * 100) / 100;

  // Semua field form Planning wajib diisi — tidak boleh ada yang terlewat sebelum Simpan Draft (keputusan user 2026-07-12).
  const validateForm = () => {
    const missing = [];
    if (!form.persp) missing.push('Perspektif BSC');
    if (stratObjActive && !form.so) missing.push('Strategic Objective');
    if (!form.name.trim()) missing.push('Nama KPI');
    if (!form.desc.trim()) missing.push('Deskripsi/Parameter');
    if (!form.type) missing.push('Tipe KPI');
    if (!form.mtdCat) missing.push('Formula MTD');
    if (!form.ytdCat) missing.push('Formula YTD');
    if (!form.period) missing.push('Periode Pengukuran');
    if (form.target === '' || form.target === null) missing.push('Target');
    if (!form.uom) missing.push('UOM');
    if (form.weight === '' || form.weight === null || Number(form.weight) < 1 || Number(form.weight) > 99) missing.push('Bobot (% — 1-99)');
    return missing;
  };

  const saveDraft = () => {
    const missing = validateForm();
    if (missing.length > 0) {
      toast(`Lengkapi field wajib dulu: ${missing.join(', ')}`, 'danger');
      return;
    }
    const base = { ...form, weight: Number(form.weight) / 100, target: Number(form.target), status: 'Draft' };
    if (editingId) {
      updateUserKPI(currentUserName, editingId, base);
    } else {
      addUserKPI(currentUserName, { ...base, factor1: Array(12).fill(null), factor2: Array(12).fill(null) });
    }
    setEditingId(null);
    setForm(emptyForm);
  };

  const submitAll = () => {
    if (!isWeightComplete) return;
    const draftItems = planningItems.filter(i => i.status === 'Draft');
    const draftIds = draftItems.map(i => i.id);
    submitUserKPIStatus(currentUserName, draftIds, 'Submitted');
    // Root cause fix (2026-07-13): submit sebelumnya HANYA mengubah status di userKPIs milik User
    // sendiri, tidak pernah membuat batch di Approval Queue — jadi Superior tidak pernah melihat
    // apa pun utk di-approve, dan status tidak pernah bisa naik ke 'Approved' (Performa Tim/Dashboard
    // yg butuh status itu jadi selalu kosong). `kpiIds` disimpan di batch utk propagasi balik status
    // saat Superior approve/reject/revision (lihat KPIContext.actOnBatch).
    addBatch({
      user: currentUserName, dept: userMeta.dept,
      batch: `Planning Tahun ${viewYear}`, jenis: 'Planning', revisi: 0, status: 'Pending',
      kpiIds: draftIds,
      kpis: draftItems.map(i => ({
        persp: i.persp, so: i.so || '', name: i.name, desc: i.desc || '',
        type: i.type, uom: i.uom, period: i.period,
        mtdCat: i.mtdCat, ytdCat: i.ytdCat,
        target: `${i.target}${i.uom === '%' ? '%' : ''}`, bobot: `${(i.weight * 100).toFixed(0)}%`,
      })),
      focusNote: 'Validasi: struktur KPI, Kategori Formula MTD/YTD, bobot, dan target setiap KPI.',
    });
    toast(`${draftIds.length} KPI berhasil disubmit ke Superior`);
  };

  const renderYearBar = () => (
    <div className="flex items-center gap-2 mb-4 flex-wrap no-print">
      <span className="text-[11px] font-medium text-nlg-text-muted shrink-0">Tahun KPI:</span>
      {AVAILABLE_YEARS.map(yr => (
        <button key={yr} onClick={() => setViewYear(yr)}
          className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors ${viewYear === yr ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border hover:bg-nlg-primary-tint hover:text-nlg-primary'}`}>
          {yr}{yr === ACTIVE_PLAN_YEAR ? ' 🔓' : ''}
        </button>
      ))}
      <span className="text-[10px] text-nlg-text-subdued ml-1">🔓 = tahun aktif, dapat diinput</span>
    </div>
  );

  if (!isActive) {
    return (
      <div className="mb-5">
        <h1 className="text-xl font-bold text-nlg-text mb-5">Input Planning KPI Tahunan</h1>
        {renderYearBar()}
        <div className="flex items-center gap-2 text-[11px] bg-amber-50 border border-amber-200 text-amber-700 rounded-nlg-input px-3 py-2 mb-4">
          🔒 <b>Mode Histori {viewYear}</b> — Data read-only. Tahun aktif: <b>{ACTIVE_PLAN_YEAR}</b>.
          <button onClick={() => setViewYear(ACTIVE_PLAN_YEAR)} className="ml-auto underline font-medium shrink-0">Kembali ke {ACTIVE_PLAN_YEAR}</button>
        </div>
        <div className="border border-nlg-border rounded-nlg-card bg-white overflow-hidden">
          <div className="px-4 py-3 bg-nlg-sidebar border-b border-nlg-border flex items-center gap-2">
            <span className="text-sm font-semibold">Planning KPI Tahun {viewYear}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-nlg-text-muted">🔒 Read-only</span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-nlg-sidebar text-nlg-text-subdued text-[11px] uppercase">
              <tr>
                <th className="text-left px-4 py-2.5">KPI</th>
                <th className="text-left px-4 py-2.5">Perspektif</th>
                <th className="text-center px-4 py-2.5">Type</th>
                <th className="text-center px-4 py-2.5">Target</th>
                <th className="text-center px-4 py-2.5">Bobot</th>
                <th className="text-center px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {planningItems.map(k => (
                <tr key={k.id} className="border-t border-nlg-border">
                  <td className="px-4 py-2.5 font-medium">{k.name}</td>
                  <td className="px-4 py-2.5 text-nlg-text-muted">{k.persp}</td>
                  <td className="px-4 py-2.5 text-center"><span className="text-[11px] px-2 py-0.5 rounded-full bg-nlg-sidebar">{k.type}</span></td>
                  <td className="px-4 py-2.5 text-center">{k.target}{k.uom === '%' ? '%' : ''}</td>
                  <td className="px-4 py-2.5 text-center">{(k.weight * 100).toFixed(0)}%</td>
                  <td className="px-4 py-2.5 text-center"><span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${k.status === 'Draft' ? 'bg-gray-100 text-nlg-text-muted' : 'bg-green-100 text-green-700'}`}>{k.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold text-nlg-text mb-5">Input Planning KPI Tahunan</h1>
      {renderYearBar()}

      <div className="bg-nlg-primary-tint text-nlg-primary text-xs rounded-nlg-input px-4 py-2.5 mb-5 flex items-center gap-2">
        <Icon name="calendar" /> Jendela waktu Planning <b>{ACTIVE_PLAN_YEAR}</b> sedang <b>AKTIF</b> — sisa waktu 12 hari.
      </div>

      {/* Cascaded KPI Section */}
      {cascadedKPIs.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-sm font-bold text-blue-700">🔗 KPI Mandatory (dari KPI Builder)</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{cascadedKPIs.length} KPI</span>
            {(() => {
              const savedCount = cascadedKPIs.filter(k => planningItems.some(p => p.sourceKpiId === k.id)).length;
              return savedCount < cascadedKPIs.length ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">⚠️ {savedCount}/{cascadedKPIs.length} tersimpan ke Planning</span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">✅ Semua tersimpan</span>
              );
            })()}
            <span className="text-[10px] text-nlg-text-subdued ml-2">Ditetapkan CS · Semua field terkunci kecuali Target &amp; Bobot — klik "💾 Simpan ke Planning" tiap kartu utk memasukkannya ke Planning</span>
          </div>
          <div className="space-y-3">
            {cascadedKPIs.map(k => {
              // KPI Mandatory ini dimateralisasi jadi userKPI sungguhan begitu User klik Simpan —
              // ditandai `sourceKpiId` supaya klik Simpan berikutnya meng-update instance yang sama
              // (bukan duplikat), dan otomatis muncul di Dashboard/ActualInput/History/Team spt KPI biasa.
              const savedInstance = planningItems.find(p => p.sourceKpiId === k.id);
              const isEditable = !savedInstance || savedInstance.status === 'Draft';
              const ovr = cascadeOverrides[k.id] || {};
              const baseTarget = savedInstance ? savedInstance.target : k.target;
              const baseWeight = savedInstance ? savedInstance.weight * 100 : k.weight;
              const userTarget = ovr.target !== undefined ? ovr.target : baseTarget;
              const userWeight = ovr.weight !== undefined ? ovr.weight : baseWeight;

              const saveMandatory = () => {
                const payload = {
                  sourceKpiId: k.id, mandatory: true,
                  persp: k.persp, so: k.so || '', name: k.name, desc: k.desc || '',
                  type: k.type, uom: k.uom, period: k.period, mtdCat: k.mtdCat, ytdCat: k.ytdCat,
                  target: Number(userTarget) || 0, weight: (Number(userWeight) || 0) / 100,
                  status: 'Draft',
                };
                if (savedInstance) {
                  updateUserKPI(currentUserName, savedInstance.id, payload);
                  toast('KPI Mandatory diperbarui');
                } else {
                  addUserKPI(currentUserName, { ...payload, factor1: Array(12).fill(null), factor2: Array(12).fill(null) });
                  toast('KPI Mandatory disimpan ke Planning');
                }
                setCascadeOverrides(prev => { const n = { ...prev }; delete n[k.id]; return n; });
              };

              return (
                <div key={k.id} className="border border-blue-200 bg-blue-50/60 rounded-nlg-input p-4 relative">
                  <div className="absolute top-3 right-3">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">{cascadeLabel(k)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">Perspektif BSC</div>
                      <div className="text-sm font-medium text-nlg-text bg-white/80 rounded px-2 py-1.5 border border-blue-100 opacity-80">{k.persp} <span className="text-[10px] text-blue-600">🔒</span></div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">Strategic Objective</div>
                      <div className="text-sm font-medium text-nlg-text bg-white/80 rounded px-2 py-1.5 border border-blue-100 opacity-80">{k.so || '—'} <span className="text-[10px] text-blue-600">🔒</span></div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">Nama KPI</div>
                    <div className="text-sm font-bold text-nlg-text bg-white/80 rounded px-2 py-1.5 border border-blue-100 opacity-80">{k.name} <span className="text-[10px] text-blue-600">🔒</span></div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div>
                      <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">UoM 🔒</div>
                      <div className="text-sm bg-white/80 rounded px-2 py-1.5 border border-blue-100 text-center opacity-80">{k.uom}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">Type 🔒</div>
                      <div className="text-sm bg-white/80 rounded px-2 py-1.5 border border-blue-100 text-center opacity-80">{k.type}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">MTD 🔒</div>
                      <div className="text-sm bg-white/80 rounded px-2 py-1.5 border border-blue-100 text-center opacity-80">{k.mtdCat}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1">YTD 🔒</div>
                      <div className="text-sm bg-white/80 rounded px-2 py-1.5 border border-blue-100 text-center opacity-80">{k.ytdCat}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-blue-200 pt-3">
                    <div>
                      <label className="text-[11px] font-bold text-nlg-primary">✏️ Target (dapat diisi)</label>
                      <input type="number" disabled={!isEditable} value={userTarget}
                        onChange={e => setCascadeOverrides({ ...cascadeOverrides, [k.id]: { ...ovr, target: e.target.value } })}
                        className="mt-1 w-full border-2 border-nlg-primary rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none font-bold disabled:opacity-60 disabled:bg-nlg-sidebar" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-nlg-primary">✏️ Bobot / Weight % (dapat diisi)</label>
                      <input type="number" min="1" max="99" step="1" disabled={!isEditable} value={userWeight}
                        onChange={e => setCascadeOverrides({ ...cascadeOverrides, [k.id]: { ...ovr, weight: e.target.value } })}
                        className="mt-1 w-full border-2 border-nlg-primary rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none font-bold disabled:opacity-60 disabled:bg-nlg-sidebar" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-200">
                    <span className="text-[11px]">
                      {savedInstance ? (
                        <span className={`px-2 py-0.5 rounded-full font-medium ${savedInstance.status === 'Draft' ? 'bg-gray-100 text-nlg-text-muted' : 'bg-green-100 text-green-700'}`}>{savedInstance.status}</span>
                      ) : (
                        <span className="text-amber-700 font-medium">⚠️ Belum disimpan ke Planning</span>
                      )}
                    </span>
                    {isEditable && (
                      <button onClick={saveMandatory} className="px-3 py-1.5 text-xs font-medium rounded-nlg-input bg-nlg-primary text-white hover:bg-nlg-primary/90">
                        💾 {savedInstance ? 'Update' : 'Simpan ke Planning'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mb-4 mt-6">
            <div className="flex-1 h-px bg-nlg-border"></div>
            <span className="text-[11px] font-semibold text-nlg-text-subdued uppercase tracking-wide">KPI Tambahan (Opsional — isi sendiri)</span>
            <div className="flex-1 h-px bg-nlg-border"></div>
          </div>
        </div>
      )}

      {cascadedKPIs.length === 0 && (
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-nlg-border"></div>
          <span className="text-[11px] font-semibold text-nlg-text-subdued uppercase tracking-wide">KPI Tambahan (Opsional — isi sendiri)</span>
          <div className="flex-1 h-px bg-nlg-border"></div>
        </div>
      )}

      {/* Planning Form */}
      <div className="border border-nlg-border rounded-nlg-card p-5 bg-white max-w-2xl">
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); saveDraft(); }}>
          <div>
            <label className="text-xs font-medium text-nlg-text-muted">Perspektif BSC *</label>
            <select required value={form.persp} onChange={e => setForm({ ...form, persp: e.target.value })} className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm">
              {Object.keys(PERSPECTIVES).map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          {stratObjActive && (
            <div>
              <label className="text-xs font-medium text-nlg-text-muted">Strategic Objective * <span className="text-nlg-text-subdued">(khusus level Company/Dept)</span></label>
              <select required value={form.so} onChange={e => setForm({ ...form, so: e.target.value })} className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm">
                <option value="">— Pilih Strategic Objective —</option>
                {sos.filter(s => s.level === 'Dept' && s.active && s.dept === userMeta.dept).map(s => (
                  <option key={s.id} value={s.so}>{s.so}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-nlg-text-muted">Nama KPI * <span className="text-nlg-text-subdued">(free text)</span></label>
            <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="mis. Revenue Growth" className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-nlg-text-muted">Deskripsi/Parameter * <span className="text-nlg-text-subdued">(free text)</span></label>
            <textarea required rows="2" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="mis. Pertumbuhan revenue dibandingkan target tahunan" className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm"></textarea>
          </div>
          <div>
            <label className="text-xs font-medium text-nlg-text-muted">Tipe KPI *</label>
            <select required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm">
              <option value="Max">Max (semakin tinggi semakin baik)</option>
              <option value="Min">Min (semakin rendah semakin baik)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-nlg-border">
            <div>
              <label className="text-xs font-medium text-nlg-text-muted">Kategori Formula MTD *</label>
              <select required value={form.mtdCat} onChange={e => setForm({ ...form, mtdCat: e.target.value })} className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm">
                {MTD_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <div className="text-[11px] text-nlg-text-subdued mt-1">{MTD_CATEGORIES.find(c => c.id === form.mtdCat)?.desc}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-nlg-text-muted">Kategori Formula YTD *</label>
              <select required value={form.ytdCat} onChange={e => setForm({ ...form, ytdCat: e.target.value })} className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm">
                {YTD_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <div className="text-[11px] text-nlg-text-subdued mt-1">{YTD_CATEGORIES.find(c => c.id === form.ytdCat)?.desc}</div>
            </div>
          </div>
          <div className="text-[11px] text-nlg-text-subdued bg-nlg-sidebar rounded-nlg-input px-3 py-2">Kategori MTD & YTD bebas dikombinasikan (6 kombinasi valid). Nilai Factor 1 &amp; Factor 2 baru diisi User saat menu <b>Input Realisasi (Actual)</b> sesuai periode KPI.</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-nlg-text-muted">Periode Pengukuran *</label>
              <select required value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm">
                <option>Bulanan</option><option>Kuartalan</option><option>Semesteran</option><option>Tahunan</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-nlg-text-muted">Target *</label>
              <input required type="number" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-nlg-text-muted">UOM *</label>
              <select required value={form.uom} onChange={e => setForm({ ...form, uom: e.target.value })} className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm">
                <option>%</option><option>Rp</option><option>Unit</option><option>Rasio</option><option>Indeks</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-nlg-text-muted">Bobot (%) *</label>
              <input required type="number" min="1" max="99" step="1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm" />
            </div>
          </div>
          {(() => {
            // Form "KPI Tambahan" defaultnya SUDAH terisi (Bobot=20 dari emptyForm) walau belum
            // disentuh User — kalau totalWeight sudah 100%, preview lama langsung tampil merah
            // "Melebihi 100%" meski User belum benar-benar mengetik KPI baru apa pun (bukan editingId).
            // Ini yg bikin terasa "bug"/tidak sinkron dgn badge hijau "Lengkap" di bawah. Fix: baru
            // hitung & tampilkan preview kalau User sudah menunjukkan niat nyata (Nama KPI diisi) atau
            // sedang mengedit baris existing; kalau form masih polos & total sudah 100%, tampilkan info
            // netral/hijau, bukan alarm merah utk sesuatu yg belum User lakukan.
            const hasIntent = form.name.trim() !== '' || editingId !== null;
            if (!hasIntent) {
              return isWeightComplete ? (
                <div className="text-xs rounded-nlg-input px-3 py-2 bg-green-50 text-green-700">
                  ✅ Total Bobot Anda sudah 100%. Form di bawah ini opsional — isi hanya kalau ingin menambah KPI lain (kurangi bobot salah satu KPI existing dulu agar tidak melebihi 100%).
                </div>
              ) : (
                <div className="text-xs rounded-nlg-input px-3 py-2 bg-nlg-sidebar text-nlg-text-muted">
                  Sisa bobot yang masih bisa dipakai: <b>{Math.round((100 - totalWeight) * 100) / 100}%</b>
                </div>
              );
            }
            // Saat mengedit baris existing, totalWeight SUDAH termasuk bobot lama baris itu — kalau
            // ditambah form.weight (bobot baru baris yg sama) mentah-mentah, bobotnya kehitung dobel.
            // Kurangi dulu bobot lama baris yg sedang diedit sebelum menambahkan bobot barunya.
            const editedItem = editingId ? planningItems.find(p => p.id === editingId) : null;
            const otherItemsWeight = editedItem ? Math.round((totalWeight - editedItem.weight * 100) * 100) / 100 : totalWeight;
            const previewTotal = Math.round((otherItemsWeight + (Number(form.weight) || 0)) * 100) / 100;
            const overLimit = previewTotal > 100.05;
            return (
              <div className={`text-xs rounded-nlg-input px-3 py-2 ${overLimit ? 'bg-red-50 text-red-700' : 'bg-nlg-sidebar text-nlg-text-muted'}`}>
                Bobot KPI lain yang sudah tersimpan: <b>{otherItemsWeight}%</b> + baris ini: <b>{Number(form.weight) || 0}%</b> = <b>{previewTotal}%</b> {overLimit && '⚠️ Melebihi 100%! Kurangi bobot KPI ini atau salah satu KPI lain sebelum disimpan.'}
              </div>
            );
          })()}
          <div className="flex justify-end gap-2 pt-2">
            <button type="submit" className="px-4 py-2 text-sm rounded-nlg-input bg-nlg-primary text-white font-medium">Simpan Draft</button>
          </div>
        </form>
      </div>

      {/* Planning Items List */}
      <div className="max-w-2xl mt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">KPI yang Sudah Diinput (Tahun {ACTIVE_PLAN_YEAR})</div>
        </div>
        <div className="text-[11px] text-nlg-text-subdued mb-3">User <b>tidak submit per baris KPI</b>. Simpan setiap KPI sebagai Draft satu per satu, lalu submit <b>seluruhnya sekaligus</b> ke Superior setelah Total Bobot mencapai 100%.</div>
        <div className="space-y-2 mb-3">
          {planningItems.map(item => (
            <div key={item.id} className="border border-nlg-border rounded-nlg-input p-3 bg-white flex items-center justify-between">
              <div>
                <div className="font-medium text-sm flex items-center gap-1.5">
                  {item.name}
                  {item.mandatory && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">🔗 Mandatory</span>}
                </div>
                <div className="text-[11px] text-nlg-text-muted">{item.persp} · {item.type} · Target: {item.target} · Bobot: {(item.weight * 100).toFixed(0)}%</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${item.status === 'Draft' ? 'bg-gray-100 text-nlg-text-muted' : item.status === 'Submitted' ? 'bg-nlg-primary-tint text-nlg-primary' : 'bg-green-100 text-green-700'}`}>{item.status}</span>
                {item.status === 'Draft' && !item.mandatory && (
                  <button onClick={() => { setForm({ ...item, weight: item.weight * 100 }); setEditingId(item.id); }} className="text-nlg-primary text-[11px] hover:underline">Edit</button>
                )}
                {item.status === 'Draft' && item.mandatory && (
                  <span className="text-[10px] text-nlg-text-subdued italic">edit di kartu Mandatory di atas</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className={`text-xs rounded-nlg-input px-3 py-2.5 mb-3 ${isWeightComplete ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
          Total Bobot: <b>{totalWeight}%</b> {isWeightComplete ? '✅ Lengkap — siap disubmit' : `⚠️ Belum 100% — kurang ${Math.round((100 - totalWeight) * 100) / 100}%`}
          {draftCount > 0 && <span className="opacity-75"> (termasuk {draftCount} KPI Draft: {draftWeight}%)</span>}
        </div>
        <button onClick={submitAll} disabled={!isWeightComplete || draftCount === 0}
          className="w-full px-4 py-2 text-sm rounded-nlg-input bg-nlg-primary text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed">
          Submit Semua KPI ke Superior
        </button>
      </div>
    </div>
  );
};
