import React, { useState } from 'react';
import { useKPIContext } from '../../context/KPIContext';
import { useToast } from '../../context/ToastContext';
import { MASTER_DEPT, MASTER_POSITION_BY_DEPT, MASTER_BRANCH, MASTER_LEVEL_KPI } from '../../data/mockData';
import { levelBadge } from '../../utils/helpers';
import { downloadMasterUserTemplate, importMasterUserExcel } from '../../utils/excel';

const positionsFor = (dept) => MASTER_POSITION_BY_DEPT[dept] || [];

const emptyForm = {
  name: '', nik: '', dept: MASTER_DEPT[0], position: positionsFor(MASTER_DEPT[0])[0] || '',
  branch: MASTER_BRANCH[0], superior: '-', email: '', level: 'Individual',
};

// Saat Dept berubah, reset Job Position ke pilihan pertama yang valid untuk Dept tsb (kalau posisi lama tak lagi cocok).
const onDeptChange = (form, dept) => {
  const opts = positionsFor(dept);
  return { ...form, dept, position: opts.includes(form.position) ? form.position : (opts[0] || '') };
};

export const MasterUser = () => {
  const { users, addUser, updateUser, deleteUser } = useKPIContext();
  const toast = useToast();
  const [editingIdx, setEditingIdx] = useState(null); // index of user being edited inline
  const [editForm, setEditForm] = useState(emptyForm);
  const [addForm, setAddForm] = useState(emptyForm);

  const isApprover = (u) => users.some((x) => x.superior === u.name);

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditForm({ ...emptyForm, ...users[idx] });
  };

  const saveEdit = (idx) => {
    if (!editForm.name.trim()) { toast('Nama wajib diisi', 'danger'); return; }
    updateUser(idx, { ...editForm, name: editForm.name.trim() });
    setEditingIdx(null);
    toast('User diperbarui');
  };

  const handleDelete = (idx) => {
    if (window.confirm('Hapus user ini?')) {
      deleteUser(idx);
      toast('User dihapus', 'warn');
    }
  };

  const handleAdd = () => {
    if (!addForm.name.trim()) { toast('Nama wajib diisi', 'danger'); return; }
    if (users.some((u) => u.name === addForm.name.trim())) { toast('Nama sudah ada', 'danger'); return; }
    addUser({ ...addForm, name: addForm.name.trim() });
    setAddForm(emptyForm);
    toast('User ditambahkan');
  };

  const handleImport = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    importMasterUserExcel(file, users)
      .then((list) => {
        list.forEach(addUser);
        toast(list.length > 0 ? `${list.length} user berhasil diimport` : 'Tidak ada user baru untuk diimport', list.length > 0 ? 'success' : 'warn');
      })
      .catch(() => toast('Gagal membaca file Excel', 'danger'));
    e.target.value = '';
  };

  const inputCls = 'w-full text-xs border border-nlg-border rounded px-2 py-1 bg-white focus:border-nlg-primary outline-none';
  const approverCount = users.filter(isApprover).length;
  const soFieldCount = users.filter((u) => u.level !== 'Individual').length;

  return (
    <div className="mb-5 relative">
      <h1 className="text-xl font-bold text-nlg-text mb-1">Master Data User</h1>
      <p className="text-sm text-nlg-text-muted mb-5">Mapping karyawan ke sistem KPI. Sesuai template: Employee Name, NIK, Dept, Job Position, Branch, Superior, Email, Level KPI.</p>

      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap text-[11px]">
          <span className="bg-nlg-primary-tint text-nlg-primary px-2.5 py-1 rounded-full">👤 {users.length} user</span>
          <span className="bg-nlg-sidebar text-nlg-text-muted px-2.5 py-1 rounded-full">🔑 {approverCount} approver</span>
          <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">📋 {soFieldCount} dengan SO Field</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 px-4 py-2.5 bg-nlg-primary-tint border border-nlg-primary/20 rounded-nlg-input flex-wrap">
        <span className="text-[11px] text-nlg-primary font-medium">📥 Upload Massal via Excel:</span>
        <button onClick={() => downloadMasterUserTemplate()} className="px-3 py-1.5 text-[11px] font-medium rounded border border-green-300 text-green-700 bg-white hover:bg-green-50 flex items-center gap-1">⬇️ Download Template</button>
        <span className="text-[11px] text-nlg-text-subdued">→ isi data → upload:</span>
        <label className="px-3 py-1.5 text-[11px] font-medium rounded border border-nlg-primary text-nlg-primary bg-white hover:bg-nlg-primary-tint cursor-pointer flex items-center gap-1">
          📤 Upload Excel
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
        </label>
        <span className="text-[10px] text-nlg-text-subdued ml-auto">Format: Employee Name · NIK · Dept · Job Position · Branch · Superior · Email · Level KPI</span>
      </div>

      <div className="overflow-x-auto border border-nlg-border rounded-nlg-card mb-4">
        <table className="w-full text-sm">
          <thead className="bg-[#172B4D] text-white text-[10px] uppercase">
            <tr>
              <th className="text-left px-3 py-2.5 min-w-[130px]">Employee Name</th>
              <th className="text-left px-3 py-2.5 min-w-[90px]">NIK</th>
              <th className="text-left px-3 py-2.5 min-w-[150px]">Dept.</th>
              <th className="text-left px-3 py-2.5 min-w-[160px]">Job Position</th>
              <th className="text-left px-3 py-2.5 min-w-[90px]">Branch</th>
              <th className="text-left px-3 py-2.5 min-w-[120px]">Superior</th>
              <th className="text-left px-3 py-2.5 min-w-[170px]">Email</th>
              <th className="text-left px-3 py-2.5 min-w-[120px]">Level KPI</th>
              <th className="text-left px-3 py-2.5 w-24">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => {
              if (editingIdx === i) {
                return (
                  <tr key={i} className="border-t border-nlg-border bg-nlg-primary-tint/20">
                    <td className="px-2 py-1.5"><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputCls + ' min-w-[120px]'} /></td>
                    <td className="px-2 py-1.5"><input value={editForm.nik} onChange={(e) => setEditForm({ ...editForm, nik: e.target.value })} className={inputCls + ' min-w-[90px]'} placeholder="NIK" /></td>
                    <td className="px-2 py-1.5"><select value={editForm.dept} onChange={(e) => setEditForm(onDeptChange(editForm, e.target.value))} className={inputCls + ' min-w-[140px]'}>{MASTER_DEPT.map((d) => <option key={d}>{d}</option>)}</select></td>
                    <td className="px-2 py-1.5"><select value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} className={inputCls + ' min-w-[160px]'}>{positionsFor(editForm.dept).map((p) => <option key={p}>{p}</option>)}</select></td>
                    <td className="px-2 py-1.5"><select value={editForm.branch} onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })} className={inputCls}>{MASTER_BRANCH.map((b) => <option key={b}>{b}</option>)}</select></td>
                    <td className="px-2 py-1.5"><select value={editForm.superior} onChange={(e) => setEditForm({ ...editForm, superior: e.target.value })} className={inputCls}><option value="-">—</option>{users.filter((x) => x.name !== u.name).map((x) => <option key={x.name}>{x.name}</option>)}</select></td>
                    <td className="px-2 py-1.5"><input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputCls + ' min-w-[160px]'} placeholder="email@niagamas.com" /></td>
                    <td className="px-2 py-1.5"><select value={editForm.level} onChange={(e) => setEditForm({ ...editForm, level: e.target.value })} className={inputCls + ' min-w-[150px]'}>{MASTER_LEVEL_KPI.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</select></td>
                    <td className="px-2 py-1.5 text-right whitespace-nowrap">
                      <button onClick={() => saveEdit(i)} className="text-[11px] px-2.5 py-1 rounded bg-nlg-primary text-white font-medium">Simpan</button>
                      <button onClick={() => setEditingIdx(null)} className="text-[11px] px-2.5 py-1 rounded border border-nlg-border text-nlg-text-muted ml-1">Batal</button>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={i} className="border-t border-nlg-border hover:bg-nlg-sidebar/30">
                  <td className="px-3 py-2.5 font-medium whitespace-nowrap">{u.name}</td>
                  <td className="px-3 py-2.5 font-mono text-[12px] text-nlg-text-muted">{u.nik || '—'}</td>
                  <td className="px-3 py-2.5 text-[12px] text-nlg-text-muted">{u.dept}</td>
                  <td className="px-3 py-2.5 text-[12px] text-nlg-text-muted">{u.position || '—'}</td>
                  <td className="px-3 py-2.5 text-[12px] text-nlg-text-muted">{u.branch || '—'}</td>
                  <td className="px-3 py-2.5 text-[12px] text-nlg-text-muted">{u.superior || '—'}</td>
                  <td className="px-3 py-2.5 text-[11px] text-nlg-primary">{u.email || '—'}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${levelBadge(u.level)}`}>{u.level}</span>
                      {isApprover(u) && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-nlg-primary-tint text-nlg-primary">+AQ</span>}
                      {u.level !== 'Individual' && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">+SO</span>}
                      {u.level === 'Company' && <span title="KPI diukur via agregasi Company otomatis — tidak perlu KPI individual di KPI Builder" className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">🏢 KPI = Company Aggregate</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(i)} className="text-nlg-primary text-xs font-medium hover:underline mr-2">Edit</button>
                    <button onClick={() => handleDelete(i)} className="text-red-500 text-xs font-medium hover:underline">Hapus</button>
                  </td>
                </tr>
              );
            })}

            {/* Add-new row */}
            <tr className="border-t-2 border-nlg-primary bg-green-50/20">
              <td className="px-2 py-1.5"><input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} placeholder="Nama lengkap..." className={inputCls + ' min-w-[120px]'} /></td>
              <td className="px-2 py-1.5"><input value={addForm.nik} onChange={(e) => setAddForm({ ...addForm, nik: e.target.value })} placeholder="NIK..." className={inputCls} /></td>
              <td className="px-2 py-1.5"><select value={addForm.dept} onChange={(e) => setAddForm(onDeptChange(addForm, e.target.value))} className={inputCls}>{MASTER_DEPT.map((d) => <option key={d}>{d}</option>)}</select></td>
              <td className="px-2 py-1.5"><select value={addForm.position} onChange={(e) => setAddForm({ ...addForm, position: e.target.value })} className={inputCls}>{positionsFor(addForm.dept).map((p) => <option key={p}>{p}</option>)}</select></td>
              <td className="px-2 py-1.5"><select value={addForm.branch} onChange={(e) => setAddForm({ ...addForm, branch: e.target.value })} className={inputCls}>{MASTER_BRANCH.map((b) => <option key={b}>{b}</option>)}</select></td>
              <td className="px-2 py-1.5"><select value={addForm.superior} onChange={(e) => setAddForm({ ...addForm, superior: e.target.value })} className={inputCls}><option value="-">— (Tidak ada / Langsung ke CS)</option>{users.map((x) => <option key={x.name}>{x.name}</option>)}</select></td>
              <td className="px-2 py-1.5"><input value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} placeholder="email@niagamas.com" className={inputCls + ' min-w-[160px]'} /></td>
              <td className="px-2 py-1.5"><select value={addForm.level} onChange={(e) => setAddForm({ ...addForm, level: e.target.value })} className={inputCls + ' min-w-[150px]'}>{MASTER_LEVEL_KPI.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}</select></td>
              <td className="px-2 py-1.5 text-right"><button onClick={handleAdd} className="text-[11px] px-2.5 py-1 rounded bg-green-600 text-white font-medium whitespace-nowrap">+ Tambah</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-nlg-sidebar rounded-nlg-input px-4 py-3 text-[11px] text-nlg-text-muted space-y-1">
        <div>• <b>+AQ</b>: Approval Queue aktif (ada subordinate yang mapping ke user ini)</div>
        <div>• <b>+SO</b>: Field Strategic Objective aktif di Planning KPI (Level Dept &amp; Company)</div>
        <div>• Superior "<b>—</b>": Submission langsung ke Corporate Strategy sebagai mediator final</div>
      </div>
    </div>
  );
};
