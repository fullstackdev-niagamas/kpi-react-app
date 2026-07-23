import React, { useState } from 'react';
import { useKPIContext } from '../../context/KPIContext';
import { useToast } from '../../context/ToastContext';
import { MASTER_DEPT, CURRENT_MONTH_IDX, MONTH_LABELS } from '../../data/mockData';
import { kpiMonthStats, gradeFromScore } from '../../utils/helpers';

const PERSP_COLORS = {
  Financial: 'bg-purple-100 text-purple-700',
  Customer: 'bg-blue-100 text-blue-700',
  'Internal Process': 'bg-orange-100 text-orange-700',
  'Learning & Growth': 'bg-teal-100 text-teal-700',
};
const TYPE_COLORS = { Max: 'bg-green-100 text-green-700', Min: 'bg-red-100 text-red-700' };
// Aksen kartu KPI di Cascade & Alignment Tree — 1 warna per perspektif, senada dgn PERSP_COLORS.
const PERSP_BORDER = {
  Financial: 'border-l-purple-500',
  Customer: 'border-l-blue-500',
  'Internal Process': 'border-l-orange-500',
  'Learning & Growth': 'border-l-teal-500',
};
const PERSP_TEXT = {
  Financial: 'text-purple-700',
  Customer: 'text-blue-700',
  'Internal Process': 'text-orange-700',
  'Learning & Growth': 'text-teal-700',
};
const statusPill = (st) => st === 'Active' ? 'bg-green-100 text-green-700' : st === 'Locked' ? 'bg-nlg-text text-white' : 'bg-gray-100 text-nlg-text-muted';
const STATUS_CYCLE = { Draft: 'Active', Active: 'Locked', Locked: 'Draft' };

export const KPIBuilder = () => {
  const { sos, uoms, kpis, addKPI, updateKPI, deleteKPI, users, userKPIs, updateUserKPI, dismissedMandatory } = useKPIContext();
  const toast = useToast();
  const [viewMode, setViewMode] = useState('template'); // 'template' | 'registry'
  const [selectedNode, setSelectedNode] = useState('company');
  const [expandedNodes, setExpandedNodes] = useState({ company: true });
  // Korelasi KPI Company → performa aktual tiap instance Dept yg meng-cascade-nya (via `sourceKpiId`,
  // lihat v6.13) — badge "🔗 N dept" sebelumnya cuma angka statis, tidak ada cara melihat KORELASI
  // nyata (siapa yg sudah Simpan ke Planning, & berapa Achievement/Score aktualnya).
  const [expandedCascadeId, setExpandedCascadeId] = useState(null);
  const getCascadeInstances = (k) => (k.cascade_depts || []).map((dept) => {
    const deptUsers = users.filter((u) => u.dept === dept);
    const instances = deptUsers.flatMap((u) =>
      (userKPIs[u.name] || [])
        .filter((uk) => uk.sourceKpiId === k.id)
        .map((uk) => ({ userName: u.name, instance: uk }))
    );
    return { dept, instances };
  });

  // ── Registrasi & Label Data Suggest ── Sec. 8 Project Brief: hanya KPI User yang statusnya sudah
  // Approved/Locked (mandatory maupun ad-hoc) yang masuk daftar ini, dan hanya CS yang bisa memberi
  // label "Data Suggest" (Planning.jsx/ActualInput.jsx tidak pernah expose kontrol ini ke User).
  const [regSearch, setRegSearch] = useState('');
  const [regDeptFilter, setRegDeptFilter] = useState('');
  const [regExpandedId, setRegExpandedId] = useState(null);
  const [regForm, setRegForm] = useState(null);

  const registryRows = users.flatMap((u) =>
    (userKPIs[u.name] || [])
      .filter((k) => k.status === 'Approved' || k.status === 'Locked')
      .map((k) => ({ owner: u.name, dept: u.dept, kpi: k }))
  ).filter((row) => {
    if (regDeptFilter && row.dept !== regDeptFilter) return false;
    if (!regSearch.trim()) return true;
    const q = regSearch.trim().toLowerCase();
    return row.kpi.name.toLowerCase().includes(q) || row.owner.toLowerCase().includes(q);
  });
  const regDepts = [...new Set(users.map((u) => u.dept))].sort();

  // KPI mandatory (`sourceKpiId`) mewarisi template company/dept sbg titik awal isian label — CS tetap
  // bisa ubah bebas, template cuma pre-fill supaya tidak ngetik ulang nama sumber utk tiap instance dept.
  const openRegLabel = (row) => {
    const k = row.kpi;
    const template = k.sourceKpiId ? kpis.find((t) => t.id === k.sourceKpiId) : null;
    setRegExpandedId(k.id);
    setRegForm({
      enabled: k.dataSuggestionEnabled ?? template?.dataSuggestionEnabled ?? false,
      sourceLabel: k.dataSourceLabel ?? template?.dataSourceLabel ?? '',
      integrationKey: k.integrationKey ?? template?.integrationKey ?? '',
      suggestedFactor1: k.suggestedFactor1 ? [...k.suggestedFactor1] : Array(12).fill(null),
      suggestedFactor2: k.suggestedFactor2 ? [...k.suggestedFactor2] : Array(12).fill(null),
    });
  };
  const closeRegLabel = () => { setRegExpandedId(null); setRegForm(null); };
  const setRegMonthValue = (field, i, val) => {
    const num = val === '' ? null : Number(val);
    setRegForm((prev) => ({ ...prev, [field]: prev[field].map((v, idx) => (idx === i ? num : v)) }));
  };
  const saveRegLabel = (row) => {
    updateUserKPI(row.owner, row.kpi.id, {
      dataSuggestionEnabled: regForm.enabled,
      dataSourceLabel: regForm.sourceLabel.trim(),
      integrationKey: regForm.integrationKey.trim(),
      // Nonaktifkan → kosongkan nilai saran (bukan cuma sembunyikan) supaya kolom "Data Suggest" &
      // validasi "harus sama 2 desimal" di ActualInput.jsx ikut nonaktif total, bukan cuma visual.
      suggestedFactor1: regForm.enabled ? regForm.suggestedFactor1 : null,
      suggestedFactor2: regForm.enabled ? regForm.suggestedFactor2 : null,
    });
    toast(regForm.enabled ? `Label Data Suggest "${regForm.sourceLabel || '(tanpa nama)'}" disimpan utk ${row.owner}` : 'Data Suggest dinonaktifkan');
    closeRegLabel();
  };

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const defaultForm = {
    persp: 'Financial', so: '', name: '', desc: '', uom: '%', type: 'Max',
    period: 'Bulanan', weight: 10, target: 100, mtdCat: 'RATIO', ytdCat: 'SUM',
    status: 'Draft', cascade_depts: [], factorNote: '',
    indicatorCategory: '',
  };
  const [formData, setFormData] = useState(defaultForm);

  // SO discope per level node yang dipilih (bukan flat list semua SO aktif) —
  // mencegah SO Company & SO Dept cascade (nama sama, entry berbeda) tampil dobel/silang-dept di dropdown.
  const activeSOs = sos.filter((s) => {
    if (!s.active) return false;
    if (selectedNode === 'company') return s.level === 'Company';
    if (selectedNode.startsWith('dept:')) return s.level === 'Dept' && s.dept === selectedNode.slice(5);
    return false;
  });
  const activeUOMs = uoms.filter((u) => u.active);
  const showSOField = selectedNode === 'company' || selectedNode.startsWith('dept:');

  const toggleNode = (e, key) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleOpenForm = (id = null) => {
    if (id) {
      setEditingId(id);
      setFormData({ ...defaultForm, ...kpis.find((k) => k.id === id) });
    } else {
      setEditingId(null);
      setFormData(defaultForm);
    }
    setIsFormOpen(true);
  };

  // Semua field form KPI wajib diisi — tidak boleh ada yang terlewat sebelum Simpan (keputusan user 2026-07-12).
  const validateForm = () => {
    const missing = [];
    if (!formData.persp) missing.push('1. Perspektif BSC');
    if (showSOField && !formData.so) missing.push('2. Strategic Objective');
    if (!formData.name.trim()) missing.push('3. Nama KPI');
    if (!formData.desc.trim()) missing.push('4. Deskripsi/Parameter');
    if (!formData.uom) missing.push('5. UoM');
    if (!formData.type) missing.push('6. Type (Polaritas)');
    if (!formData.period) missing.push('7. Periode');
    if (formData.weight === '' || formData.weight === null || Number(formData.weight) < 1 || Number(formData.weight) > 99) missing.push('8. Bobot (% — 1-99)');
    if (formData.target === '' || formData.target === null) missing.push('9. Target');
    if (!formData.mtdCat) missing.push('10. Formula MTD');
    if (!formData.ytdCat) missing.push('11. Formula YTD');
    return missing;
  };

  const handleSave = (e) => {
    e.preventDefault();
    const missing = validateForm();
    if (missing.length > 0) {
      toast(`Lengkapi field wajib dulu: ${missing.join(', ')}`, 'danger');
      return;
    }
    const owner_type = selectedNode === 'company' ? 'company' : selectedNode.startsWith('dept:') ? 'dept' : 'user';
    const owner_name = selectedNode === 'company' ? 'PT NLG' : selectedNode.slice(5);

    const payload = {
      ...formData,
      name: formData.name.trim(),
      owner_type,
      owner_name,
      weight: Number(formData.weight) || 0,
      target: Number(formData.target) || 0,
      cascade_depts: owner_type === 'company' ? (formData.cascade_depts || []) : [],
    };

    if (editingId) {
      updateKPI(editingId, payload);
      toast('KPI diperbarui');
    } else {
      addKPI(payload);
      toast('KPI ditambahkan');
    }
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleDelete = (k) => {
    if (k.status === 'Locked') { toast('KPI Locked tidak dapat dihapus', 'warn'); return; }
    if (window.confirm('Hapus KPI ini dari library?')) {
      deleteKPI(k.id);
      toast('KPI dihapus', 'warn');
    }
  };

  const cycleStatus = (k) => {
    const next = STATUS_CYCLE[k.status] || 'Draft';
    updateKPI(k.id, { ...k, status: next });
    toast(`Status → ${next}`);
  };

  const toggleCascade = (dept) => {
    const arr = formData.cascade_depts || [];
    if (arr.includes(dept)) {
      setFormData({ ...formData, cascade_depts: arr.filter((d) => d !== dept) });
    } else {
      setFormData({ ...formData, cascade_depts: [...arr, dept] });
    }
  };

  // Build org tree — include all depts (even without users) so CS can pre-assign
  const allDepts = MASTER_DEPT.filter((d) => d !== 'Company');
  users.forEach((u) => { if (allDepts.indexOf(u.dept) < 0 && u.dept !== 'Company') allDepts.push(u.dept); });
  allDepts.sort();

  // Node 'BOD' = representasi org unit Direksi, tapi KPI-nya = agregasi Company (lihat isBODAggregateNode).
  // Label singkat "CEO" saja (bukan "Company Level (BOD/CEO)") — di sidebar tree yang sempit, label
  // "Company Level" tepat di bawah root "PT Niagamas Lestari Ge..." terbaca seperti 2 level company yang
  // bersaing/duplikat. Konteks "BOD" & "= Agregasi Company" dipindah ke tooltip badge 🏢 (lihat renderTree)
  // dan banner guardrail saat node ini dipilih — supaya penjelasan tetap ada tanpa memenuhi label.
  // Child individual disembunyikan dari tree (bukan dihapus dari data) karena node Dept BOD & node User-nya
  // menampilkan banner guardrail yang identik — cukup 1 titik akses.
  const companyNode = {
    key: 'company', label: 'PT Niagamas Lestari Gemilang', type: 'Company',
    children: allDepts.map((d) => ({
      key: `dept:${d}`, label: d === 'BOD' ? 'CEO' : d, type: 'Dept',
      children: d === 'BOD' ? [] : users.filter((u) => u.dept === d).map((u) => ({
        key: `user:${u.name}`, label: `${u.name} (${u.position || 'Staff'})`, type: 'Individual', children: [],
      })),
    })),
  };

  // Termasuk KPI Company yang di-cascade ke dept ini (cascade_depts) — sebelumnya tidak dihitung sehingga
  // badge tree tampil kosong walau CS sudah cascade KPI Company ke dept tsb (root cause keluhan user).
  const kpiCountFor = (key) => kpis.filter((k) =>
    (key === 'company' && k.owner_type === 'company') ||
    (key.startsWith('dept:') && k.owner_type === 'dept' && k.owner_name === key.slice(5)) ||
    (key.startsWith('dept:') && k.owner_type === 'company' && (k.cascade_depts || []).includes(key.slice(5))) ||
    (key.startsWith('user:') && k.owner_type === 'user' && k.owner_name === key.slice(5))
  ).length;

  const renderTree = (n, depth) => {
    const isSelected = selectedNode === n.key;
    const isExpanded = expandedNodes[n.key] || false;
    const hasKids = n.children && n.children.length > 0;
    const isBODNode = n.key === 'dept:BOD';
    const noUsers = n.type === 'Dept' && n.children.length === 0 && !isBODNode;
    const indentPx = depth * 16;

    const levelCls = n.type === 'Company' ? 'bg-purple-100 text-purple-700' : n.type === 'Dept' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-nlg-text-muted';
    const rowCls = isSelected ? 'bg-nlg-primary-tint border border-nlg-primary' : 'hover:bg-nlg-sidebar';
    const labelCls = isSelected ? 'text-nlg-primary font-semibold' : 'text-nlg-text';
    const cnt = kpiCountFor(n.key);

    return (
      <div key={n.key}>
        <div
          className={`flex items-center gap-1.5 py-1.5 px-2 rounded-nlg-input cursor-pointer transition-colors border border-transparent ${rowCls}`}
          style={{ marginLeft: `${indentPx}px` }}
          onClick={() => { setSelectedNode(n.key); setIsFormOpen(false); setEditingId(null); }}
        >
          {hasKids ? (
            <button onClick={(e) => toggleNode(e, n.key)} className="text-nlg-text-subdued text-xs w-4 text-center shrink-0">
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : <span className="w-4 shrink-0"></span>}
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${levelCls}`}>{n.type[0]}</span>
          <span className={`text-[12px] flex-1 truncate ${labelCls}${noUsers ? ' opacity-50' : ''}`}>{n.label}</span>
          {cnt > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-nlg-primary text-white shrink-0">{cnt}</span>}
          {noUsers && <span className="text-[9px] text-nlg-text-subdued shrink-0">—</span>}
          {isBODNode && <span className="text-[10px] shrink-0" title="Dept: BOD (Direktur Utama) — KPI = Agregasi Company Level, bukan Dept tersendiri">🏢</span>}
        </div>
        {hasKids && isExpanded && (
          <div>{n.children.map((c) => renderTree(c, depth + 1))}</div>
        )}
      </div>
    );
  };

  const nodeKPIs = kpis.filter((k) =>
    (selectedNode === 'company' && k.owner_type === 'company') ||
    (selectedNode.startsWith('dept:') && k.owner_type === 'dept' && k.owner_name === selectedNode.slice(5)) ||
    (selectedNode.startsWith('user:') && k.owner_type === 'user' && k.owner_name === selectedNode.slice(5))
  );

  // KPI Company yang di-cascade (cascade_depts) ke dept ini — dimiliki & diedit di node Company, hanya
  // ditampilkan read-only di sini agar CS bisa verifikasi cascade sudah landing di dept yang tepat.
  const cascadedToDept = selectedNode.startsWith('dept:')
    ? kpis.filter((k) => k.owner_type === 'company' && (k.cascade_depts || []).includes(selectedNode.slice(5)))
    : [];

  const nodeLabel = selectedNode === 'company' ? 'PT NLG' : selectedNode.slice(5);
  const nodeType = selectedNode === 'company' ? 'Level Company' : selectedNode.startsWith('dept:') ? 'Level Dept' : 'Level Individual';

  // KPI BOD = agregasi Company itu sendiri (keputusan user) — bukan KPI individual/Dept terpisah.
  // Cegah CS membuat KPI redundan untuk node BOD atau user dengan Level KPI = Company.
  const selectedUserObj = selectedNode.startsWith('user:') ? users.find((u) => u.name === selectedNode.slice(5)) : null;
  const isBODAggregateNode = selectedNode === 'dept:BOD' || selectedUserObj?.level === 'Company';

  // "N KPI terdefinisi" di header node Individual cuma menghitung TEMPLATE (owner_type='user') — hampir
  // selalu 0 krn KPI Individual biasanya lahir dari cascade mandatory Company/Dept + KPI Tambahan ad-hoc
  // User sendiri, bukan template per-orang. Panel ini menjawabnya dari sisi REGISTRASI sungguhan
  // (userKPIs, sama sumber dgn tab Registrasi) supaya node kosong tidak terbaca "orang ini belum py KPI".
  const selectedUserKPIs = selectedUserObj ? (userKPIs[selectedUserObj.name] || []) : [];
  const userRegSummary = selectedUserObj ? {
    total: selectedUserKPIs.length,
    approved: selectedUserKPIs.filter((k) => k.status === 'Approved' || k.status === 'Locked').length,
    draft: selectedUserKPIs.filter((k) => k.status === 'Draft').length,
    submitted: selectedUserKPIs.filter((k) => k.status === 'Submitted').length,
    mandatory: selectedUserKPIs.filter((k) => k.mandatory).length,
    performanceIndicator: selectedUserKPIs.filter((k) => !k.mandatory).length,
    bobotApproved: selectedUserKPIs.filter((k) => k.status === 'Approved' || k.status === 'Locked').reduce((s, k) => s + Number(k.weight || 0) * 100, 0),
    suggestActive: selectedUserKPIs.filter((k) => k.dataSuggestionEnabled).length,
  } : null;

  // Cascade & Alignment Tree — permintaan user: node Individual di Kelola Template harusnya
  // menggambarkan garis cascade Company→Dept→Individual & alignment ke SO, bukan form "+Tambah KPI"
  // (yg jarang dipakai krn KPI Individual mayoritas lahir dari cascade, bukan dibuat manual per-orang).
  // 3 sumber sama persis dgn `getMandatoryKPIsFor` (dipakai Planning.jsx) TAPI tanpa filter status
  // 'Active' — CS perlu lihat Draft juga (User tidak, itu benar & sengaja beda, lihat v6.10).
  const findInstance = (templateId) => selectedUserKPIs.find((uk) => uk.sourceKpiId === templateId);
  const companyCascadeKPIs = selectedUserObj
    ? kpis.filter((k) => k.owner_type === 'company' && (k.cascade_depts || []).includes(selectedUserObj.dept))
    : [];
  const deptMandatoryKPIs = selectedUserObj
    ? kpis.filter((k) => k.owner_type === 'dept' && k.owner_name === selectedUserObj.dept)
    : [];
  const individualMandatoryKPIs = nodeKPIs; // owner_type='user', owner_name=orang ini — sudah dihitung di atas
  const performanceIndicatorKPIs = selectedUserKPIs.filter((k) => !k.mandatory);

  const activeCnt = nodeKPIs.filter((k) => k.status === 'Active').length;
  const draftCnt = nodeKPIs.filter((k) => k.status === 'Draft').length;
  const lockedCnt = nodeKPIs.filter((k) => k.status === 'Locked').length;
  const totalWeight = nodeKPIs.filter((k) => k.status !== 'Draft').reduce((s, k) => s + Number(k.weight || 0), 0);
  // Total termasuk Draft — murni info progres saat CS sedang input (Draft belum dihitung "resmi",
  // baru berlaku sebagai KPI aktif setelah status di-cycle ke Active — lihat totalWeight di atas).
  const draftWeight = nodeKPIs.filter((k) => k.status === 'Draft').reduce((s, k) => s + Number(k.weight || 0), 0);
  const totalWeightWithDraft = totalWeight + draftWeight;
  const weightOK = Math.abs(totalWeight - 100) < 0.1;
  const weightCls = totalWeight > 100 ? 'text-red-600 font-bold' : weightOK ? 'text-green-700 font-bold' : 'text-amber-600 font-medium';

  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold text-nlg-text mb-1">KPI Setup / Builder</h1>
      <p className="text-sm text-nlg-text-muted mb-5">Definisikan struktur KPI per level. KPI Active akan tampil di Planning form masing-masing User.</p>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => setViewMode('template')} className={`px-3 py-1.5 text-[12px] font-medium rounded-full border transition-colors ${viewMode === 'template' ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border hover:bg-nlg-sidebar'}`}>🗂 Kelola Template</button>
        <button onClick={() => setViewMode('registry')} className={`px-3 py-1.5 text-[12px] font-medium rounded-full border transition-colors ${viewMode === 'registry' ? 'bg-nlg-primary text-white border-nlg-primary' : 'bg-white text-nlg-text-muted border-nlg-border hover:bg-nlg-sidebar'}`}>✅ Registrasi &amp; Label Data Suggest ({registryRows.length})</button>
      </div>

      {viewMode === 'template' && (
      <div className="flex flex-col md:flex-row gap-4">
        {/* Org tree */}
        <div className="w-full md:w-56 shrink-0">
          <div className="border border-nlg-border rounded-nlg-card bg-white p-3 sticky top-[80px] max-h-[calc(100vh-180px)] overflow-y-auto">
            <div className="text-[10px] font-semibold text-nlg-text-subdued uppercase tracking-wide mb-0.5">Org. Tree</div>
            <div className="text-[10px] text-nlg-text-subdued mb-1">{allDepts.length} dept · {users.length} user · Klik node untuk kelola KPI</div>
            <div className="text-[9px] text-amber-600 mb-2">Dept tanpa user: bisa pre-assign KPI</div>
            {renderTree(companyNode, 0)}
          </div>
        </div>

        {/* Main panel */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3 px-4 py-2.5 bg-[#172B4D] rounded-nlg-card text-white">
            <div>
              <div className="text-sm font-bold">{nodeLabel}</div>
              <div className="text-[10px] opacity-60">{nodeType} · {nodeKPIs.length} KPI terdefinisi</div>
            </div>
            {!isFormOpen && !isBODAggregateNode && !selectedUserObj && (
              <button onClick={() => handleOpenForm()} className="px-3 py-1.5 text-xs font-medium rounded border border-white/30 bg-white/10 text-white hover:bg-white/20">+ Tambah KPI</button>
            )}
          </div>

          {selectedUserObj && !isBODAggregateNode && !isFormOpen && (
            <div className="border border-nlg-border bg-white rounded-nlg-card p-4 mb-4">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="text-[11px] font-bold text-nlg-text-subdued uppercase tracking-wide">📋 Ringkasan Registrasi KPI — {selectedUserObj.name}</div>
                <button onClick={() => { setRegSearch(selectedUserObj.name); setViewMode('registry'); }} className="text-[11px] font-medium text-nlg-primary hover:underline">🏷 Kelola Label di Registrasi →</button>
              </div>
              {userRegSummary.total === 0 ? (
                <div className="text-[12px] text-nlg-text-subdued">Belum ada KPI yang disimpan ke Planning oleh {selectedUserObj.name} sama sekali (mandatory maupun KPI Tambahan).</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                    <div className="bg-nlg-sidebar rounded-nlg-input px-3 py-2">
                      <div className="text-[9px] text-nlg-text-subdued uppercase">Approved/Locked</div>
                      <div className="text-lg font-bold text-green-700">{userRegSummary.approved}<span className="text-[11px] font-normal text-nlg-text-subdued"> / {userRegSummary.total} KPI</span></div>
                    </div>
                    <div className="bg-nlg-sidebar rounded-nlg-input px-3 py-2">
                      <div className="text-[9px] text-nlg-text-subdued uppercase">Belum Final</div>
                      <div className="text-lg font-bold text-amber-600">{userRegSummary.draft + userRegSummary.submitted}<span className="text-[11px] font-normal text-nlg-text-subdued"> ({userRegSummary.draft} Draft · {userRegSummary.submitted} Submitted)</span></div>
                    </div>
                    <div className="bg-nlg-sidebar rounded-nlg-input px-3 py-2">
                      <div className="text-[9px] text-nlg-text-subdued uppercase">Mandatory vs Performance Indicator</div>
                      <div className="text-lg font-bold text-nlg-text">{userRegSummary.mandatory}<span className="text-[11px] font-normal text-nlg-text-subdued"> Mandatory · </span>{userRegSummary.performanceIndicator}<span className="text-[11px] font-normal text-nlg-text-subdued"> PI</span></div>
                    </div>
                    <div className="bg-nlg-sidebar rounded-nlg-input px-3 py-2">
                      <div className="text-[9px] text-nlg-text-subdued uppercase">Data Suggest Aktif</div>
                      <div className="text-lg font-bold text-purple-700">{userRegSummary.suggestActive}<span className="text-[11px] font-normal text-nlg-text-subdued"> / {userRegSummary.approved} Approved</span></div>
                    </div>
                  </div>
                  {userRegSummary.approved > 0 && (
                    <div className={`text-[11px] ${Math.abs(userRegSummary.bobotApproved - 100) < 0.1 ? 'text-green-700' : 'text-amber-600'}`}>
                      Total Bobot KPI Approved/Locked: <b>{userRegSummary.bobotApproved.toFixed(0)}%</b> {Math.abs(userRegSummary.bobotApproved - 100) < 0.1 ? '✅' : '⚠️ belum genap 100% — masih ada KPI lain yg belum Approved'}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {isBODAggregateNode && !isFormOpen && (
            <div className="border border-blue-200 bg-blue-50 rounded-nlg-card p-4 mb-4 text-[12px] text-blue-800 flex items-start gap-2">
              <span className="text-lg leading-none">🏢</span>
              <div>
                <div className="font-bold mb-0.5">KPI BOD = Agregasi Company</div>
                <div className="text-blue-700">Performa BOD/Direktur Utama diukur dari agregasi otomatis skor seluruh Dept (lihat Executive Dashboard) — bukan KPI individual/Dept terpisah. Tidak perlu menambahkan KPI di node ini.</div>
              </div>
            </div>
          )}

          {!isFormOpen && cascadedToDept.length > 0 && (
            <div className="border border-blue-200 bg-blue-50/60 rounded-nlg-card p-4 mb-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[12px] font-bold text-blue-700">🔗 KPI Cascade dari Company ({cascadedToDept.length})</span>
                <span className="text-[10px] text-blue-700/80">— Mandatory utk dept ini, dimiliki &amp; diedit di node <button onClick={() => setSelectedNode('company')} className="underline font-semibold">PT NLG</button></span>
              </div>
              {cascadedToDept.some((k) => k.status === 'Draft') && (
                <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-nlg-input px-2.5 py-1.5 mb-2">
                  ⚠️ {cascadedToDept.filter((k) => k.status === 'Draft').length} KPI masih <b>Draft</b> — belum tampil di Input Planning KPI user manapun di dept ini sampai statusnya diubah ke <b>Active</b> (klik pill status di node PT NLG).
                </div>
              )}
              <div className="space-y-1.5">
                {cascadedToDept.map((k) => (
                  <div key={k.id} className="flex items-center justify-between gap-2 bg-white/80 border border-blue-100 rounded-nlg-input px-3 py-2 text-[11px]">
                    <div className="min-w-0">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full mr-1.5 ${PERSP_COLORS[k.persp] || 'bg-gray-100'}`}>{k.persp}</span>
                      <span className="font-medium">{k.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-nlg-text-muted">
                      <span>Target: <b className="text-nlg-primary">{k.target}</b></span>
                      <span>Bobot: <b>{k.weight}%</b></span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusPill(k.status)}`}>{k.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isFormOpen && (
            <div className="bg-white border border-nlg-border rounded-nlg-card overflow-hidden mb-4 shadow-sm">
              <div className="px-5 py-3 bg-[#172B4D] text-white flex items-center justify-between">
                <div className="text-sm font-bold">{editingId ? '✏️ Edit KPI' : `➕ Tambah KPI Baru — ${nodeLabel}`}</div>
                <button onClick={() => { setIsFormOpen(false); setEditingId(null); }} className="text-white/70 hover:text-white text-lg font-bold leading-none">✕</button>
              </div>
              <form onSubmit={handleSave} className="p-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[11px] font-semibold text-nlg-text-muted block mb-1">1. Perspektif BSC *</label>
                    <select required value={formData.persp} onChange={(e) => setFormData({ ...formData, persp: e.target.value })} className="w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none">
                      <option>Financial</option>
                      <option>Customer</option>
                      <option>Internal Process</option>
                      <option>Learning & Growth</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-nlg-text-muted block mb-1">2. Strategic Objective {showSOField && '*'}</label>
                    <select required={showSOField} value={formData.so} onChange={(e) => setFormData({ ...formData, so: e.target.value })} className="w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none">
                      <option value="">— Pilih SO —</option>
                      {activeSOs.map((s) => <option key={s.id} value={s.so}>{s.so}</option>)}
                    </select>
                  </div>
                  {showSOField && (
                    <div className="col-span-2">
                      <label className="text-[11px] font-semibold text-nlg-text-muted block mb-1">2a. Kategori Indikator <span className="font-normal text-nlg-text-subdued">(opsional)</span></label>
                      <select value={formData.indicatorCategory} onChange={(e) => setFormData({ ...formData, indicatorCategory: e.target.value })} className="w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none">
                        <option value="">— Belum diklasifikasikan —</option>
                        <option value="Leading">Leading — indikator proses/prediktif</option>
                        <option value="Lagging">Lagging — indikator hasil/outcome</option>
                      </select>
                      <div className="text-[10px] text-nlg-text-subdued mt-0.5"><b>Leading</b>: mendorong hasil, bisa dipengaruhi jangka pendek (mis. jumlah training, cycle time). <b>Lagging</b>: hasil akhir, baru terlihat setelah beberapa periode (mis. revenue, customer satisfaction). Hanya utk KPI Company/Dept — level Individual tidak diklasifikasikan.</div>
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-nlg-text-muted block mb-1">3. Nama KPI *</label>
                    <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nama KPI yang terukur..." className="w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-nlg-text-muted block mb-1">4. Deskripsi / Parameter *</label>
                    <textarea required value={formData.desc} onChange={(e) => setFormData({ ...formData, desc: e.target.value })} rows="2" placeholder="Operasional definisi, formula, sumber data..." className="w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none resize-none"></textarea>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-nlg-text-muted block mb-1">4a. Catatan Factor 1/2 <span className="font-normal text-nlg-text-subdued">(opsional)</span></label>
                    <input value={formData.factorNote} onChange={(e) => setFormData({ ...formData, factorNote: e.target.value })} placeholder="mis. F1 = Individual KPI Tercapai (jumlah) · F2 = Total Eligible Employee (jumlah)" className="w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none" />
                    <div className="text-[10px] text-nlg-text-subdued mt-0.5">Tampil di Input Realisasi User, tepat di titik input F1/F2 — mencegah salah tafsir data yang diinput.</div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-nlg-text-muted block mb-1">5. UoM *</label>
                    <select required value={formData.uom} onChange={(e) => setFormData({ ...formData, uom: e.target.value })} className="w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none">
                      {activeUOMs.map((u) => <option key={u.id} value={u.satuan}>{u.satuan}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-nlg-text-muted block mb-1">6. Type (Polaritas) *</label>
                    <select required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none">
                      <option>Max</option>
                      <option>Min</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-nlg-text-muted block mb-1">7. Periode *</label>
                    <select required value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })} className="w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none">
                      <option>Bulanan</option>
                      <option>Kuartalan</option>
                      <option>Semesteran</option>
                      <option>Tahunan</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-nlg-text-muted block mb-1">8. Bobot (%) *</label>
                    <input required type="number" min="1" max="99" step="1" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className="w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none" />
                    <div className="text-[10px] text-nlg-text-subdued mt-0.5">Total aktif: <b>{totalWeight}%</b> {weightOK ? '✅' : '⚠️'}{draftCnt > 0 && <> · Termasuk Draft: <b>{totalWeightWithDraft}%</b></>}</div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-nlg-text-muted block mb-1">9. Target *</label>
                    <input required type="number" value={formData.target} onChange={(e) => setFormData({ ...formData, target: e.target.value })} className="w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-nlg-text-muted block mb-1">10. Formula MTD *</label>
                    <select required value={formData.mtdCat} onChange={(e) => setFormData({ ...formData, mtdCat: e.target.value })} className="w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none">
                      <option>DIRECT</option>
                      <option>RATIO</option>
                    </select>
                    <div className="text-[10px] text-nlg-text-subdued mt-0.5">DIRECT=F1 · RATIO=F1÷F2×100</div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-nlg-text-muted block mb-1">11. Formula YTD *</label>
                    <select required value={formData.ytdCat} onChange={(e) => setFormData({ ...formData, ytdCat: e.target.value })} className="w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-nlg-primary outline-none">
                      <option>LAST</option>
                      <option>SUM</option>
                      <option>AVG</option>
                    </select>
                    <div className="text-[10px] text-nlg-text-subdued mt-0.5">LAST=terakhir · SUM=kumulatif · AVG=rata-rata</div>
                  </div>
                </div>

                <div className="border-t border-nlg-border pt-4 mb-4">
                  <div className="text-[11px] text-purple-700 bg-purple-50 border border-purple-200 rounded-nlg-input px-3 py-2 flex items-start gap-2">
                    <span className="text-sm leading-none">🔌</span>
                    <span>Label <b>Data Suggest</b> (sumber &amp; nilai rekomendasi eksternal) tidak lagi diset di sini — kelola per-KPI User yang sudah <b>Approved</b> lewat tab <b>"✅ Registrasi &amp; Label Data Suggest"</b> di atas. Ini mencegah label terpasang di template sebelum KPI-nya benar-benar disetujui, dan sekaligus mencakup KPI Tambahan (ad-hoc) yang tidak punya template sama sekali.</span>
                  </div>
                </div>

                {selectedNode === 'company' && (
                  <div className="border-t border-nlg-border pt-4 mb-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[11px] font-bold text-blue-700">🔗 Cascade ke Dept (KPI Mandatory)</span>
                      <span className="text-[10px] text-nlg-text-subdued">— centang dept yg wajib terima KPI ini. Field kecuali Target &amp; Bobot dikunci di sisi user.</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 p-3 bg-blue-50 rounded-nlg-input border border-blue-200">
                      {MASTER_DEPT.filter((d) => d !== 'Company' && d !== 'BOD').map((d) => (
                        <label key={d} className="flex items-center gap-1.5 text-[11px] cursor-pointer hover:text-blue-700 py-0.5">
                          <input type="checkbox" className="accent-blue-600" checked={(formData.cascade_depts || []).includes(d)} onChange={() => toggleCascade(d)} />
                          <span className="leading-tight">{d}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button type="submit" className="px-5 py-2 text-sm rounded-nlg-input bg-nlg-primary text-white font-medium hover:bg-nlg-primary/90">💾 Simpan KPI</button>
                  <button type="button" onClick={() => { setIsFormOpen(false); setEditingId(null); }} className="px-4 py-2 text-sm rounded-nlg-input border border-nlg-border text-nlg-text-muted bg-white hover:bg-nlg-sidebar">Batal</button>
                </div>
              </form>
            </div>
          )}

          {!isFormOpen && !selectedUserObj && (nodeKPIs.length > 0 ? (
            <>
              {/* Kolom dipadatkan (padding lebih kecil, Formula MTD+YTD digabung 1 kolom, min-width
                  diperkecil + truncate+title) supaya tabel 12 kolom ini semaksimal mungkin muat tanpa
                  perlu geser horizontal di layar biasa (mis. 1440px) — berlaku ke semua user/halaman
                  serupa (lebar canvas app juga sudah dinaikkan di AppShell.jsx). */}
              <div className="overflow-x-auto border border-nlg-border rounded-nlg-card">
                <table className="w-full text-sm">
                  <thead className="bg-[#172B4D] text-white text-[10px] uppercase">
                    <tr>
                      <th className="px-2 py-2 text-left">Perspektif</th>
                      {showSOField && <th className="px-2 py-2 text-left min-w-[100px] max-w-[120px]">Strategic Obj.</th>}
                      <th className="px-2 py-2 text-left min-w-[110px]">Nama KPI</th>
                      <th className="px-2 py-2 text-left min-w-[130px]">Deskripsi</th>
                      <th className="px-2 py-2 text-center">UoM</th>
                      <th className="px-2 py-2 text-center">Type</th>
                      <th className="px-2 py-2 text-center">Periode</th>
                      <th className="px-2 py-2 text-center">Bobot</th>
                      <th className="px-2 py-2 text-center">Target</th>
                      <th className="px-2 py-2 text-center">Formula</th>
                      <th className="px-2 py-2 text-center">Status</th>
                      <th className="px-2 py-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {nodeKPIs.map((k) => (
                      <React.Fragment key={k.id}>
                      <tr className={`border-t border-nlg-border hover:bg-nlg-sidebar/30 ${k.status === 'Draft' ? 'opacity-60' : ''}`}>
                        <td className="px-2 py-2"><span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${PERSP_COLORS[k.persp] || 'bg-gray-100'}`}>{k.persp}</span></td>
                        {showSOField && <td className="px-2 py-2 text-[11px] text-nlg-text-muted max-w-[120px] truncate" title={k.so || ''}>{k.so || '—'}</td>}
                        <td className="px-2 py-2 max-w-[150px]">
                          <div className="font-medium text-[12px] leading-snug">{k.name}</div>
                          {k.indicatorCategory && (
                            <div className="mt-1">
                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${k.indicatorCategory === 'Leading' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'}`}>
                                {k.indicatorCategory === 'Leading' ? '⏩' : '🎯'} {k.indicatorCategory}
                              </span>
                            </div>
                          )}
                          {k.dataSuggestionEnabled && (
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700" title={k.integrationKey ? `Kode Integrasi: ${k.integrationKey}` : 'Data Suggestion aktif'}>
                                🔌 {k.dataSourceLabel || 'Data Suggestion aktif'}
                              </span>
                            </div>
                          )}
                          {k.cascade_depts && k.cascade_depts.length > 0 && (
                            <div className="mt-1">
                              <button
                                onClick={() => setExpandedCascadeId(expandedCascadeId === k.id ? null : k.id)}
                                className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
                                title="Lihat korelasi & performa aktual tiap Dept"
                              >
                                🔗 {k.cascade_depts.length} dept {expandedCascadeId === k.id ? '▲' : '▼'}
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 text-[10px] text-nlg-text-subdued max-w-[160px]"><div className="leading-snug line-clamp-2" title={k.desc || ''}>{k.desc ? (k.desc.length > 70 ? k.desc.substring(0, 70) + '…' : k.desc) : '—'}</div></td>
                        <td className="px-2 py-2 text-center text-[11px] text-nlg-text-muted">{k.uom}</td>
                        <td className="px-2 py-2 text-center"><span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${TYPE_COLORS[k.type] || 'bg-gray-100'}`}>{k.type}</span></td>
                        <td className="px-2 py-2 text-center text-[11px]">{k.period}</td>
                        <td className="px-2 py-2 text-center font-medium">{k.weight}%</td>
                        <td className="px-2 py-2 text-center font-bold text-nlg-primary">{k.target}</td>
                        <td className="px-2 py-2 text-center text-[10px] font-medium leading-tight whitespace-nowrap">{k.mtdCat}<br />{k.ytdCat}</td>
                        <td className="px-2 py-2 text-center">
                          <button onClick={() => cycleStatus(k)} title="Klik untuk ubah status" className={`text-[11px] font-medium px-2 py-0.5 rounded-full cursor-pointer ${statusPill(k.status)}`}>{k.status}</button>
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => handleOpenForm(k.id)} className="text-nlg-primary text-[11px] font-medium hover:underline">Edit</button>
                            <button onClick={() => handleDelete(k)} className="text-red-500 text-[11px] font-medium hover:underline">Hapus</button>
                          </div>
                        </td>
                      </tr>
                      {expandedCascadeId === k.id && (
                        <tr>
                          <td colSpan={showSOField ? 11 : 10} className="px-3 py-3 bg-blue-50/50 border-t border-blue-100">
                            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-2">
                              🔗 Korelasi "{k.name}" — Company → Dept ({MONTH_LABELS[CURRENT_MONTH_IDX]})
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {getCascadeInstances(k).map(({ dept, instances }) => {
                                // Statistik pasif adopsi Fase 1 "Tandai Tidak Relevan" — murni visibilitas
                                // (bukan gate), jadi bukti objektif kapan cascade_depts ini perlu dipersempit
                                // atau Fase 2 (kurasi Dept Head) mulai dibutuhkan, bukan berdasar firasat.
                                const deptUserCount = users.filter((u) => u.dept === dept).length;
                                const dismissedInDept = users.filter((u) => u.dept === dept && (dismissedMandatory[u.name] || []).includes(k.id)).length;
                                const untouchedCount = Math.max(0, deptUserCount - instances.length - dismissedInDept);
                                return (
                                <div key={dept} className="bg-white border border-blue-100 rounded-nlg-input p-2.5">
                                  <div className="text-[11px] font-bold text-nlg-text mb-1">{dept}</div>
                                  <div className="text-[9px] text-nlg-text-subdued mb-1.5">
                                    {instances.length} tersimpan · {dismissedInDept} ditandai tidak relevan · {untouchedCount} belum ditinjau <span className="opacity-70">(dari {deptUserCount} user)</span>
                                  </div>
                                  {instances.length === 0 ? (
                                    <div className="text-[10px] text-nlg-text-subdued italic">Belum ada User di dept ini yg "Simpan ke Planning" KPI mandatory ini.</div>
                                  ) : (
                                    <div className="space-y-1">
                                      {instances.map(({ userName, instance }) => {
                                        const st = kpiMonthStats(instance, CURRENT_MONTH_IDX);
                                        const grade = st ? gradeFromScore(st.score) : null;
                                        return (
                                          <div key={instance.id} className="flex items-center justify-between text-[10px]">
                                            <span className="text-nlg-text-muted">{userName} <span className="px-1.5 py-0.5 rounded-full bg-nlg-sidebar text-nlg-text-subdued ml-1">{instance.status}</span></span>
                                            {grade ? (
                                              <span className={`font-bold px-1.5 py-0.5 rounded-full ${grade.cls}`}>{(st.ach * 100).toFixed(0)}% · {st.score}</span>
                                            ) : (
                                              <span className="text-nlg-text-subdued italic">Belum ada Actual</span>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-3 text-[11px] flex-wrap gap-2">
                <span className="text-nlg-text-subdued">{activeCnt} aktif · {draftCnt} draft · {lockedCnt} locked</span>
                <span className={weightCls}>
                  Total bobot aktif: {totalWeight}% {weightOK ? '✅' : totalWeight > 100 ? '⚠️ Melebihi 100%' : '⚠️ Belum 100%'}
                  {draftCnt > 0 && <span className="text-nlg-text-subdued font-normal"> · Termasuk {draftCnt} Draft ({draftWeight}%): {totalWeightWithDraft}%</span>}
                </span>
              </div>
            </>
          ) : !isBODAggregateNode && cascadedToDept.length === 0 && (
            <div className="text-center py-10 border border-dashed border-nlg-border rounded-nlg-card">
              <div className="text-nlg-text-subdued text-sm mb-1">Belum ada KPI untuk <b>{nodeLabel}</b></div>
              <div className="text-[11px] text-nlg-text-subdued">Klik "+ Tambah KPI" untuk mulai mendefinisikan struktur KPI.</div>
            </div>
          ))}

          {/* Cascade & Alignment Tree — diagram kotak+garis (permintaan user 2026-07-22, contoh awal
              di-preview lewat Artifact terpisah pakai data nyata Indri sblm dibangun di sini). Beda dari
              versi list v6.38: sekarang box-and-line spt org chart, data tetap 100% live dari `kpis`/
              `userKPIs` (bukan hardcode spt di Artifact). Connector pure-CSS ada di index.css
              (`.cascade-tree`), krn Tailwind tidak bisa ekspresikan ::before/::after connector garis. */}
          {!isFormOpen && selectedUserObj && !isBODAggregateNode && (() => {
            const leafNode = (k, inst, st, grade) => (
              <li key={k.id}>
                <div className={`node-box text-left w-[210px] bg-white border-l-4 ${PERSP_BORDER[k.persp] || 'border-l-gray-300'} border-y border-r border-nlg-border rounded-nlg-input px-3 py-2`}>
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wide ${PERSP_TEXT[k.persp] || 'text-nlg-text-muted'}`}>{k.persp}</span>
                    {k.so && <span className="text-[9px] text-nlg-text-subdued">· 🎯 {k.so}</span>}
                  </div>
                  <div className="text-[12px] font-semibold text-nlg-text leading-snug mb-1">{k.name}</div>
                  {inst ? (
                    grade ? (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${grade.cls}`}>{inst.status} · {(st.ach * 100).toFixed(0)}% · {st.score}</span>
                    ) : (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-nlg-text-muted">{inst.status} · Belum ada Actual</span>
                    )
                  ) : (
                    <span className="text-[10px] text-amber-700 italic">Belum disimpan ke Planning</span>
                  )}
                </div>
              </li>
            );
            const groups = [
              { key: 'company', label: '🔗 Cascade dari Company', items: companyCascadeKPIs },
              { key: 'dept', label: `🏬 Mandatory Dept`, items: deptMandatoryKPIs },
              { key: 'indiv', label: '👤 Mandatory Individual', items: individualMandatoryKPIs },
              { key: 'pi', label: '🎯 Performance Indicator', items: performanceIndicatorKPIs },
            ];
            return (
              <div>
                <div className="text-[11px] text-nlg-text-subdued mb-3">🌳 Cascading &amp; Alignment — garis KPI dari Company/Dept sampai ke instance milik <b>{selectedUserObj.name}</b>. Geser ke samping kalau tabnya lebar.</div>
                <div className="overflow-x-auto border border-nlg-border rounded-nlg-card bg-nlg-sidebar/40 py-6">
                  <ul className="cascade-tree">
                    <li>
                      <div className="node-box inline-block bg-nlg-text text-white rounded-nlg-input px-4 py-2.5">
                        <div className="text-[9px] uppercase tracking-wide text-white/60">Company</div>
                        <div className="text-[13px] font-bold">PT Niagamas Lestari Gemilang</div>
                      </div>
                      <ul>
                        <li>
                          <div className="node-box inline-block bg-nlg-primary-tint border border-nlg-primary rounded-nlg-input px-4 py-2">
                            <div className="text-[9px] uppercase tracking-wide text-nlg-primary/70">Dept</div>
                            <div className="text-[13px] font-bold text-nlg-primary">{selectedUserObj.dept}</div>
                          </div>
                          <ul>
                            <li>
                              <div className="node-box inline-block bg-nlg-primary-tint border-2 border-nlg-primary rounded-nlg-input px-4 py-2 shadow-sm">
                                <div className="text-[9px] uppercase tracking-wide text-nlg-primary/70">Individual</div>
                                <div className="text-[13px] font-bold text-nlg-primary">{selectedUserObj.name}</div>
                                {selectedUserObj.position && <div className="text-[10px] text-nlg-text-muted">{selectedUserObj.position}</div>}
                              </div>
                              <ul>
                                {groups.map((g) => (
                                  <li key={g.key}>
                                    <div className="node-box inline-block bg-white border border-dashed border-nlg-border rounded-nlg-input px-3 py-1.5">
                                      <div className="text-[11px] font-bold text-nlg-text-subdued whitespace-nowrap">{g.label}</div>
                                      <div className="text-[9px] text-nlg-text-subdued">{g.items.length} KPI</div>
                                    </div>
                                    {g.items.length > 0 ? (
                                      <ul>
                                        {g.items.map((k) => {
                                          const inst = g.key === 'pi' ? k : findInstance(k.id);
                                          const st = inst ? kpiMonthStats(inst, CURRENT_MONTH_IDX) : null;
                                          const grade = st ? gradeFromScore(st.score) : null;
                                          return leafNode(k, inst, st, grade);
                                        })}
                                      </ul>
                                    ) : g.key === 'indiv' ? (
                                      <ul>
                                        <li>
                                          <div className="node-box w-[210px]">
                                            <button onClick={() => handleOpenForm()} className="text-[11px] text-nlg-primary font-medium hover:underline bg-white border border-dashed border-nlg-border rounded-nlg-input px-3 py-2 w-full">+ Tambah KPI Mandatory khusus individu ini</button>
                                          </div>
                                        </li>
                                      </ul>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
            );
          })()}

          {!isFormOpen && !selectedUserObj && (
            <div className="mt-4 bg-nlg-sidebar rounded-nlg-input px-4 py-3 space-y-1 text-[11px] text-nlg-text-muted">
              <div>• <b>Draft</b> — sedang disusun, belum tampil di User Planning form</div>
              <div>• <b>Active</b> — tampil di Planning form User sebagai KPI yang harus diisi target</div>
              <div>• <b>Locked</b> — sudah approved &amp; berjalan, tidak dapat diedit/dihapus</div>
              <div>• <b>DIRECT</b> = MTD diambil langsung dari Factor 1 &nbsp;|&nbsp; <b>RATIO</b> = Factor1 / Factor2 × 100</div>
              <div>• <b>LAST</b> = YTD = nilai bulan terakhir &nbsp;|&nbsp; <b>SUM</b> = kumulatif &nbsp;|&nbsp; <b>AVG</b> = rata-rata</div>
            </div>
          )}
        </div>
      </div>
      )}

      {viewMode === 'registry' && (
        <div>
          <div className="text-[11px] text-nlg-text-subdued mb-3">
            Semua KPI User (mandatory maupun KPI Tambahan/ad-hoc) yang statusnya sudah <b>Approved</b>/<b>Locked</b> — sesuai KPI Planning yang disetujui Superior masing-masing. Hanya CS yang bisa memberi label <b>Data Suggest</b> di sini; User tidak punya kontrol ini di Planning/Input Realisasi.
          </div>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <input value={regSearch} onChange={(e) => setRegSearch(e.target.value)} placeholder="Cari nama KPI atau User..." className="border border-nlg-border rounded-nlg-input px-3 py-1.5 text-sm bg-white focus:border-nlg-primary outline-none w-64" />
            <select value={regDeptFilter} onChange={(e) => setRegDeptFilter(e.target.value)} className="border border-nlg-border rounded-nlg-input px-3 py-1.5 text-sm bg-white focus:border-nlg-primary outline-none">
              <option value="">Semua Dept</option>
              {regDepts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {registryRows.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-nlg-border rounded-nlg-card">
              <div className="text-nlg-text-subdued text-sm mb-1">Belum ada KPI User berstatus Approved/Locked{regSearch || regDeptFilter ? ' yang cocok dgn filter ini' : ''}.</div>
              {!regSearch && !regDeptFilter && <div className="text-[11px] text-nlg-text-subdued">KPI otomatis muncul di sini begitu Superior meng-approve batch Planning-nya (menu Approval Queue).</div>}
            </div>
          ) : (
            <div className="border border-nlg-border rounded-nlg-card overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#172B4D] text-white text-[10px] uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">User</th>
                    <th className="px-3 py-2 text-left">Dept</th>
                    <th className="px-3 py-2 text-left min-w-[160px]">KPI</th>
                    <th className="px-2 py-2 text-center">Sumber</th>
                    <th className="px-2 py-2 text-center">Status</th>
                    <th className="px-2 py-2 text-left min-w-[140px]">Label Data Suggest</th>
                    <th className="px-2 py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {registryRows.map((row) => {
                    const k = row.kpi;
                    const isExpanded = regExpandedId === k.id;
                    return (
                      <React.Fragment key={k.id}>
                        <tr className="border-t border-nlg-border hover:bg-nlg-sidebar/30">
                          <td className="px-3 py-2 font-medium text-[12px]">{row.owner}</td>
                          <td className="px-3 py-2 text-[11px] text-nlg-text-muted">{row.dept}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full mr-1.5 ${PERSP_COLORS[k.persp] || 'bg-gray-100'}`}>{k.persp}</span>
                            <span className="text-[12px] font-medium">{k.name}</span>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${k.mandatory ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-nlg-text-muted'}`}>{k.mandatory ? 'Mandatory' : 'Performance Indicator'}</span>
                          </td>
                          <td className="px-2 py-2 text-center"><span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusPill(k.status)}`}>{k.status}</span></td>
                          <td className="px-2 py-2">
                            {k.dataSuggestionEnabled ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700" title={k.integrationKey ? `Kode Integrasi: ${k.integrationKey}` : ''}>🔌 {k.dataSourceLabel || 'Aktif'}</span>
                            ) : (
                              <span className="text-[10px] text-nlg-text-subdued">— Belum dilabel</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <button onClick={() => (isExpanded ? closeRegLabel() : openRegLabel(row))} className="text-nlg-primary text-[11px] font-medium hover:underline">{isExpanded ? 'Tutup' : '🏷 Kelola Label'}</button>
                          </td>
                        </tr>
                        {isExpanded && regForm && (
                          <tr>
                            <td colSpan={7} className="px-3 py-3 bg-purple-50/50 border-t border-purple-100">
                              <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wide mb-2">🏷 Label Data Suggest — {k.name} ({row.owner})</div>
                              <label className="flex items-center gap-2 text-[11px] font-bold text-purple-700 cursor-pointer mb-2">
                                <input type="checkbox" className="accent-purple-600" checked={regForm.enabled} onChange={(e) => setRegForm({ ...regForm, enabled: e.target.checked })} />
                                Aktifkan Data Suggestion utk KPI instance ini
                              </label>
                              {regForm.enabled && (
                                <>
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                      <label className="text-[11px] font-semibold text-nlg-text-muted block mb-1">Sumber Data / Sistem Eksternal</label>
                                      <input value={regForm.sourceLabel} onChange={(e) => setRegForm({ ...regForm, sourceLabel: e.target.value })} placeholder="mis. SAP HCM — Employee Headcount" className="w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-purple-500 outline-none" />
                                    </div>
                                    <div>
                                      <label className="text-[11px] font-semibold text-nlg-text-muted block mb-1">Kode Integrasi <span className="font-normal text-nlg-text-subdued">(referensi tim IT/API)</span></label>
                                      <input value={regForm.integrationKey} onChange={(e) => setRegForm({ ...regForm, integrationKey: e.target.value })} placeholder="mis. sap-hcm.headcount.dept-cs" className="w-full border border-nlg-border rounded-nlg-input px-3 py-2 text-sm bg-white focus:border-purple-500 outline-none" />
                                    </div>
                                  </div>
                                  {k.factorNote && <div className="text-[10px] text-nlg-text-subdued mb-1.5">{k.factorNote}</div>}
                                  <div className="text-[10px] text-nlg-text-subdued mb-2">Isi nilai hasil "retrieve" dari sistem eksternal per bulan (simulasi — integrasi API sungguhan di luar sistem ini). Nilai ini akan tampil sbg kolom "Data Suggest" di Input Realisasi User, dan User wajib input Actual sama persis (2 desimal) dgn nilai ini.</div>
                                  <div className="overflow-x-auto border border-purple-200 rounded-nlg-input mb-2">
                                    <table className="w-full text-[11px]">
                                      <thead className="bg-purple-100 text-purple-700 uppercase text-[9px]">
                                        <tr>
                                          <th className="px-2 py-1.5 text-left">Bulan</th>
                                          {MONTH_LABELS.map((lbl) => <th key={lbl} className="px-1.5 py-1.5 text-center">{lbl}</th>)}
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-purple-100">
                                        <tr>
                                          <td className="px-2 py-1 font-medium text-nlg-text-muted">Factor 1</td>
                                          {MONTH_LABELS.map((_, i) => (
                                            <td key={i} className="px-1 py-1"><input type="number" step="0.01" value={regForm.suggestedFactor1[i] ?? ''} onChange={(e) => setRegMonthValue('suggestedFactor1', i, e.target.value)} className="w-16 border border-nlg-border rounded px-1 py-0.5 text-[11px] text-right focus:border-purple-500 outline-none" /></td>
                                          ))}
                                        </tr>
                                        <tr>
                                          <td className="px-2 py-1 font-medium text-nlg-text-muted">Factor 2</td>
                                          {MONTH_LABELS.map((_, i) => (
                                            <td key={i} className="px-1 py-1"><input type="number" step="0.01" value={regForm.suggestedFactor2[i] ?? ''} onChange={(e) => setRegMonthValue('suggestedFactor2', i, e.target.value)} className="w-16 border border-nlg-border rounded px-1 py-0.5 text-[11px] text-right focus:border-purple-500 outline-none" /></td>
                                          ))}
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </>
                              )}
                              <div className="flex gap-2">
                                <button onClick={() => saveRegLabel(row)} className="px-4 py-1.5 text-xs rounded-nlg-input bg-nlg-primary text-white font-medium hover:bg-nlg-primary/90">💾 Simpan Label</button>
                                <button onClick={closeRegLabel} className="px-3 py-1.5 text-xs rounded-nlg-input border border-nlg-border text-nlg-text-muted bg-white hover:bg-nlg-sidebar">Batal</button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
