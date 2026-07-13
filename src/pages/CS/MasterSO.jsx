import React, { useState } from 'react';
import { useKPIContext } from '../../context/KPIContext';
import { useToast } from '../../context/ToastContext';
import { MASTER_DEPT } from '../../data/mockData';

const PERSP_META = {
  Financial: { badge: 'bg-purple-100 text-purple-700', icon: 'F' },
  Customer: { badge: 'bg-blue-100 text-blue-700', icon: 'C' },
  'Internal Process': { badge: 'bg-orange-100 text-orange-700', icon: 'IP' },
  'Learning & Growth': { badge: 'bg-teal-100 text-teal-700', icon: 'LG' },
};
const PERSP_ORDER = ['Financial', 'Customer', 'Internal Process', 'Learning & Growth'];

export const MasterSO = () => {
  const { sos, addSO, updateSO, deleteSO, kpis } = useKPIContext();
  const toast = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ level: 'Company', persp: 'Financial', parentId: '', dept: '', so: '', active: true, cascadeDepts: [] });

  const companySOs = sos.filter((s) => s.level === 'Company');
  const deptSOs = sos.filter((s) => s.level === 'Dept');

  const openAdd = (level) => {
    setEditingId(null);
    setForm({ level, persp: 'Financial', parentId: '', dept: level === 'Dept' ? '' : 'Company', so: '', active: true, cascadeDepts: [] });
    setFormOpen(true);
  };

  const openEdit = (id) => {
    const s = sos.find((x) => x.id === id);
    if (!s) return;
    setEditingId(id);
    const existingCascadeDepts = s.level === 'Company' ? deptSOs.filter((d) => d.parentId === id).map((d) => d.dept) : [];
    setForm({ level: s.level, persp: s.persp, parentId: s.parentId || '', dept: s.dept || '', so: s.so, active: s.active, cascadeDepts: existingCascadeDepts });
    setFormOpen(true);
  };

  const toggleCascadeDept = (d) => {
    const arr = form.cascadeDepts || [];
    setForm({ ...form, cascadeDepts: arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d] });
  };

  const handleSave = () => {
    if (!form.so.trim()) { toast('Nama SO wajib diisi', 'danger'); return; }
    if (form.level === 'Dept' && !form.dept) { toast('Pilih Dept untuk SO Dept Level', 'danger'); return; }
    const soName = form.so.trim();
    const payload = {
      so: soName,
      level: form.level,
      persp: form.persp,
      dept: form.level === 'Company' ? 'Company' : form.dept,
      parentId: form.level === 'Dept' ? (form.parentId || null) : null,
      active: form.active,
    };

    // Cascade otomatis: SO Company + centang Dept → buat SO Dept Level sekaligus (nama & perspektif sama),
    // ter-link sebagai turunan (parentId). Dept yang sudah punya turunan (saat edit) tidak diduplikasi.
    const addMissingCascades = (companyId) => {
      const existingChildDepts = new Set(sos.filter((s) => s.parentId === companyId).map((s) => s.dept));
      (form.cascadeDepts || []).forEach((d) => {
        if (!existingChildDepts.has(d)) {
          addSO({ so: soName, level: 'Dept', persp: form.persp, dept: d, parentId: companyId, active: true });
        }
      });
    };

    if (editingId !== null) {
      updateSO(editingId, { ...payload, id: editingId });
      toast('SO diperbarui');
      if (form.level === 'Company') addMissingCascades(editingId);
    } else {
      const newId = `so${Date.now()}_${Math.floor(Math.random() * 100000)}`;
      addSO({ ...payload, id: newId });
      toast('SO ditambahkan');
      if (form.level === 'Company') addMissingCascades(newId);
    }
    setFormOpen(false);
    setEditingId(null);
  };

  const toggleStatus = (s) => {
    updateSO(s.id, { ...s, active: !s.active });
    toast(!s.active ? 'SO diaktifkan' : 'SO dinonaktifkan', !s.active ? 'success' : 'warn');
  };

  const handleDelete = (id) => {
    if (window.confirm('Hapus SO ini?')) {
      deleteSO(id);
      toast('SO dihapus', 'warn');
    }
  };

  const kpiCountForSO = (soName) => kpis.filter((k) => k.so === soName).length;
  const deptCovered = [...new Set(deptSOs.map((s) => s.dept))].length;
  const kpiLinked = kpis.filter((k) => k.so).length;

  // Company rows grouped/ordered by perspective
  const companyRows = PERSP_ORDER.flatMap((persp) => companySOs.filter((s) => s.persp === persp));

  // Dept SOs grouped by dept
  const deptGroups = {};
  deptSOs.forEach((s) => { (deptGroups[s.dept] = deptGroups[s.dept] || []).push(s); });

  const cardCls = 'border border-nlg-border rounded-nlg-card px-4 py-3 bg-white';

  return (
    <div className="mb-5 relative">
      <h1 className="text-xl font-bold text-nlg-text mb-1">Master Strategic Objective</h1>
      <p className="text-sm text-nlg-text-muted mb-5">Kelola SO dua layer: Company Level (Strategy Map) dan Dept Level (Planning form User).</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className={cardCls}><div className="text-[10px] text-nlg-text-subdued uppercase tracking-wide mb-1">SO Company Level</div><div className="text-2xl font-bold">{companySOs.filter((s) => s.active).length}</div></div>
        <div className={cardCls}><div className="text-[10px] text-nlg-text-subdued uppercase tracking-wide mb-1">SO Dept Level</div><div className="text-2xl font-bold">{deptSOs.filter((s) => s.active).length}</div></div>
        <div className="border border-nlg-primary/30 bg-nlg-primary-tint rounded-nlg-card px-4 py-3"><div className="text-[10px] text-nlg-primary uppercase tracking-wide mb-1">Dept Tercakup</div><div className="text-2xl font-bold text-nlg-primary">{deptCovered}</div></div>
        <div className={cardCls}><div className="text-[10px] text-nlg-text-subdued uppercase tracking-wide mb-1">KPI Terhubung</div><div className="text-2xl font-bold">{kpiLinked}</div></div>
      </div>

      {/* Company section */}
      <div className="border border-nlg-border rounded-nlg-card overflow-hidden mb-5">
        <div className="flex items-center gap-3 px-5 py-3 bg-[#172B4D] text-white">
          <span className="text-sm font-bold">🏢 SO Company Level</span>
          <span className="text-[11px] opacity-60 hidden md:inline">Tampil di Strategy Map · Tidak muncul di Planning form User</span>
          <button onClick={() => openAdd('Company')} className="ml-auto px-3 py-1 text-xs font-medium rounded bg-white/10 border border-white/20 hover:bg-white/20">+ Tambah SO Company</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-nlg-text-subdued bg-nlg-sidebar">
              <tr>
                <th className="text-left px-4 py-2">Strategic Objective</th>
                <th className="text-center px-4 py-2">Dept. Cascade (SO Turunan)</th>
                <th className="text-center px-4 py-2">KPI Terhubung</th>
                <th className="text-center px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {companyRows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-4 text-center text-nlg-text-subdued text-sm">Belum ada SO Company Level</td></tr>
              )}
              {companyRows.map((s) => {
                const meta = PERSP_META[s.persp] || { badge: 'bg-gray-100 text-nlg-text-muted', icon: '?' };
                const children = deptSOs.filter((d) => d.parentId === s.id);
                const kpiCnt = kpiCountForSO(s.so);
                return (
                  <tr key={s.id} className={`border-t border-nlg-border ${s.active ? '' : 'opacity-50 bg-nlg-sidebar/30'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta.badge}`}>{meta.icon}</span>
                        <span className="font-medium text-sm">{s.so}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {children.length > 0 ? (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {children.map((c) => <span key={c.id} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">{c.dept}</span>)}
                        </div>
                      ) : <span className="text-[11px] text-nlg-text-subdued">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {kpiCnt > 0 ? <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-nlg-primary-tint text-nlg-primary">{kpiCnt} KPI</span> : <span className="text-nlg-text-subdued text-[11px]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleStatus(s)} className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-nlg-text-muted'}`}>{s.active ? 'Aktif' : 'Nonaktif'}</button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(s.id)} className="text-nlg-primary text-xs hover:underline mr-2">Edit</button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-500 text-xs hover:underline">Hapus</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dept section */}
      <div className="border border-nlg-border rounded-nlg-card overflow-hidden mb-5">
        <div className="flex items-center gap-3 px-5 py-3 bg-nlg-sidebar border-b border-nlg-border">
          <span className="text-sm font-bold text-nlg-text">🏬 SO Dept Level</span>
          <span className="text-[11px] text-nlg-text-subdued hidden md:inline">Muncul di Planning form User sesuai Dept.</span>
          <button onClick={() => openAdd('Dept')} className="ml-auto px-3 py-1 text-xs font-medium rounded-nlg-input border border-nlg-border bg-white hover:bg-nlg-primary-tint text-nlg-primary">+ Tambah SO Dept.</button>
        </div>
        {Object.keys(deptGroups).length === 0 ? (
          <div className="px-4 py-6 text-center text-nlg-text-subdued text-sm">Belum ada SO Dept Level. Tambahkan dengan mengklik "+ Tambah SO Dept." di atas.</div>
        ) : (
          Object.keys(deptGroups).map((dept) => {
            const items = deptGroups[dept];
            return (
              <div key={dept} className="border-t border-nlg-border">
                <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                  <span className="text-[11px] font-semibold text-blue-700">{dept}</span>
                  <span className="text-[10px] text-blue-500 ml-2">{items.length} SO</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-[10px] uppercase text-nlg-text-subdued">
                      <tr>
                        <th className="text-left px-4 py-1.5">SO Dept.</th>
                        <th className="text-center px-4 py-1.5">SO Parent (Company)</th>
                        <th className="text-center px-4 py-1.5">Status</th>
                        <th className="text-right px-4 py-1.5">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((s) => {
                        const parent = sos.find((c) => c.id === s.parentId);
                        const meta = PERSP_META[s.persp] || { badge: 'bg-gray-100 text-nlg-text-muted' };
                        return (
                          <tr key={s.id} className={`border-t border-nlg-border/50 ${s.active ? '' : 'opacity-50'}`}>
                            <td className="px-4 py-2.5"><span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full mr-2 ${meta.badge}`}>{(s.persp || '').substring(0, 3)}</span><span className="text-sm font-medium">{s.so}</span></td>
                            <td className="px-4 py-2.5 text-center text-[11px] text-nlg-text-subdued">{parent ? `⬆ ${parent.so}` : '—'}</td>
                            <td className="px-4 py-2.5 text-center"><button onClick={() => toggleStatus(s)} className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-nlg-text-muted'}`}>{s.active ? 'Aktif' : 'Nonaktif'}</button></td>
                            <td className="px-4 py-2.5 text-right whitespace-nowrap">
                              <button onClick={() => openEdit(s.id)} className="text-nlg-primary text-xs hover:underline mr-2">Edit</button>
                              <button onClick={() => handleDelete(s.id)} className="text-red-500 text-xs hover:underline">Hapus</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form panel */}
      {formOpen && (
        <div className="border-2 border-nlg-primary rounded-nlg-card p-5 bg-nlg-primary-tint max-w-xl mt-2">
          <div className="text-sm font-bold text-nlg-primary mb-4">{editingId !== null ? 'Edit Strategic Objective' : 'Tambah Strategic Objective Baru'}</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-nlg-text-muted">Level SO *</label>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value, dept: e.target.value === 'Company' ? 'Company' : '', parentId: e.target.value === 'Company' ? '' : form.parentId })} className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white">
                <option value="Company">🏢 Company Level</option>
                <option value="Dept">🏬 Dept Level</option>
              </select>
              <div className="text-[10px] text-nlg-text-subdued mt-1">Company = Strategy Map · Dept = Planning form User</div>
            </div>
            <div>
              <label className="text-xs font-medium text-nlg-text-muted">Perspektif BSC *</label>
              <select value={form.persp} onChange={(e) => setForm({ ...form, persp: e.target.value })} className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white">
                {PERSP_ORDER.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            {form.level === 'Dept' && (
              <div>
                <label className="text-xs font-medium text-nlg-text-muted">SO Parent (Company Level)</label>
                <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white">
                  <option value="">— Pilih SO Parent —</option>
                  {companySOs.filter((s) => s.active).map((s) => <option key={s.id} value={s.id}>[{s.persp}] {s.so}</option>)}
                </select>
                <div className="text-[10px] text-nlg-text-subdued mt-1">SO Dept. ini merupakan cascade dari SO Company di atas</div>
              </div>
            )}
            {form.level === 'Dept' && (
              <div>
                <label className="text-xs font-medium text-nlg-text-muted">Berlaku untuk Dept. *</label>
                <select value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })} className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white">
                  <option value="">— Pilih Dept —</option>
                  {MASTER_DEPT.filter((d) => d !== 'Company' && d !== 'BOD').map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
            )}
            <div className="col-span-2">
              <label className="text-xs font-medium text-nlg-text-muted">Nama Strategic Objective *</label>
              <input value={form.so} onChange={(e) => setForm({ ...form, so: e.target.value })} placeholder="mis. Meningkatkan Profitabilitas..." className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none" />
            </div>
          </div>

          {form.level === 'Company' && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[11px] font-bold text-blue-700">🔗 Cascade sekaligus ke Dept. (opsional)</span>
                <span className="text-[10px] text-nlg-text-subdued">— centang Dept yang langsung dibuatkan SO Dept Level turunannya (nama &amp; perspektif sama, otomatis ter-link).</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 p-3 bg-blue-50 rounded-nlg-input border border-blue-200 max-h-40 overflow-y-auto">
                {MASTER_DEPT.filter((d) => d !== 'Company' && d !== 'BOD').map((d) => (
                  <label key={d} className="flex items-center gap-1.5 text-[11px] cursor-pointer hover:text-blue-700 py-0.5">
                    <input type="checkbox" className="accent-blue-600" checked={(form.cascadeDepts || []).includes(d)} onChange={() => toggleCascadeDept(d)} />
                    <span className="leading-tight">{d}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 text-sm rounded-nlg-input bg-nlg-primary text-white font-medium">💾 Simpan</button>
            <button onClick={() => { setFormOpen(false); setEditingId(null); }} className="px-4 py-2 text-sm rounded-nlg-input border border-nlg-border text-nlg-text-muted bg-white">Batal</button>
          </div>
        </div>
      )}
    </div>
  );
};
