import React, { useState } from 'react';
import { useKPIContext } from '../../context/KPIContext';
import { useToast } from '../../context/ToastContext';
import { MTD_CATEGORIES, YTD_CATEGORIES } from '../../data/mockData';

const emptyForm = { satuan: '', keterangan: '', contoh: '', active: true };

export const MasterUOM = () => {
  const { uoms, addUOM, updateUOM, deleteUOM } = useKPIContext();
  const toast = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (id) => {
    const u = uoms.find((x) => x.id === id);
    if (!u) return;
    setEditingId(id);
    setForm({ satuan: u.satuan, keterangan: u.keterangan || '', contoh: u.contoh || '', active: u.active });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.satuan.trim()) { toast('Satuan wajib diisi', 'danger'); return; }
    const payload = { satuan: form.satuan.trim(), keterangan: form.keterangan.trim(), contoh: form.contoh.trim(), active: form.active };
    if (editingId !== null) {
      updateUOM(editingId, { ...payload, id: editingId });
      toast('UoM diperbarui');
    } else {
      addUOM(payload);
      toast('UoM ditambahkan');
    }
    setFormOpen(false);
    setEditingId(null);
  };

  const toggleStatus = (u) => {
    updateUOM(u.id, { ...u, active: !u.active });
    toast(!u.active ? 'UoM diaktifkan' : 'UoM dinonaktifkan', !u.active ? 'success' : 'warn');
  };

  const handleDelete = (id) => {
    if (window.confirm('Hapus UoM ini?')) {
      deleteUOM(id);
      toast('UoM dihapus', 'warn');
    }
  };

  const activeCount = uoms.filter((u) => u.active).length;
  const inactiveCount = uoms.filter((u) => !u.active).length;

  return (
    <div className="mb-5 relative">
      <h1 className="text-xl font-bold text-nlg-text mb-1">Master UOM</h1>
      <p className="text-sm text-nlg-text-muted mb-5">Daftar satuan pengukuran (Unit of Measurement) yang tersedia di dropdown Input Planning KPI. Dikelola oleh Corporate Strategy.</p>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="text-[11px] text-nlg-text-subdued">{activeCount} aktif · {inactiveCount} nonaktif</div>
        <button onClick={openAdd} className="px-3 py-2 text-xs font-medium rounded-nlg-input bg-nlg-primary text-white flex items-center gap-1.5">+ Tambah UOM</button>
      </div>

      <div className="border border-nlg-border rounded-nlg-card overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-nlg-sidebar text-nlg-text-subdued text-[11px] uppercase">
              <tr>
                <th className="text-left px-4 py-2.5">Satuan</th>
                <th className="text-left px-4 py-2.5">Keterangan</th>
                <th className="text-left px-4 py-2.5">Contoh Penggunaan</th>
                <th className="text-center px-4 py-2.5">Status</th>
                <th className="text-right px-4 py-2.5">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {uoms.map((u) => (
                <tr key={u.id} className={`border-t border-nlg-border ${!u.active ? 'opacity-50' : ''} hover:bg-nlg-sidebar/30`}>
                  <td className="px-4 py-2.5 font-medium font-mono">{u.satuan}</td>
                  <td className="px-4 py-2.5 text-nlg-text-muted">{u.keterangan || '—'}</td>
                  <td className="px-4 py-2.5 text-[11px] text-nlg-text-subdued">{u.contoh || '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button onClick={() => toggleStatus(u)} className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${u.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-nlg-text-muted'}`}>{u.active ? 'Aktif' : 'Nonaktif'}</button>
                  </td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(u.id)} className="text-nlg-primary text-xs font-medium hover:underline mr-2">Edit</button>
                    <button onClick={() => handleDelete(u.id)} className="text-red-500 text-xs font-medium hover:underline">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <div className="border border-nlg-primary rounded-nlg-card p-4 bg-nlg-primary-tint max-w-lg mb-5">
          <div className="text-sm font-semibold mb-3">{editingId !== null ? 'Edit UOM' : 'Tambah UOM Baru'}</div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-nlg-text-muted">Satuan <span className="text-red-500">*</span></label>
              <input value={form.satuan} onChange={(e) => setForm({ ...form, satuan: e.target.value })} placeholder="cth: %, Rp (Juta), Indeks" className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-nlg-text-muted">Keterangan</label>
              <input value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="cth: Persentase capaian" className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-nlg-text-muted">Contoh Penggunaan</label>
              <input value={form.contoh} onChange={(e) => setForm({ ...form, contoh: e.target.value })} placeholder="cth: Revenue Growth, Budget Variance" className="mt-1 w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} className="px-4 py-2 text-sm rounded-nlg-input bg-nlg-primary text-white font-medium">Simpan</button>
              <button onClick={() => { setFormOpen(false); setEditingId(null); }} className="px-4 py-2 text-sm rounded-nlg-input border border-nlg-border text-nlg-text-muted bg-white">Batal</button>
            </div>
          </div>
        </div>
      )}

      {/* Reference panels: MTD / YTD formula categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="border border-nlg-border rounded-nlg-card bg-white overflow-hidden">
          <div className="px-4 py-3 bg-nlg-sidebar border-b border-nlg-border">
            <div className="text-[11px] font-semibold text-nlg-text-subdued uppercase tracking-wide">Kategori Formula MTD</div>
          </div>
          <div className="p-4 space-y-3">
            {MTD_CATEGORIES.map((c) => (
              <div key={c.id} className="text-sm">
                <div className="font-bold text-nlg-text">{c.label}</div>
                <div className="text-[11px] text-nlg-text-muted mt-0.5">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-nlg-border rounded-nlg-card bg-white overflow-hidden">
          <div className="px-4 py-3 bg-nlg-sidebar border-b border-nlg-border">
            <div className="text-[11px] font-semibold text-nlg-text-subdued uppercase tracking-wide">Kategori Formula YTD</div>
          </div>
          <div className="p-4 space-y-3">
            {YTD_CATEGORIES.map((c) => (
              <div key={c.id} className="text-sm">
                <div className="font-bold text-nlg-text">{c.label}</div>
                <div className="text-[11px] text-nlg-text-muted mt-0.5">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
