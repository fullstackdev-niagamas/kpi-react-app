import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { USER_MASTER as initialUsers, SO_LIST as initialSO, UOM_LIST as initialUOM, CS_KPI_LIBRARY as initialKPIs, APPROVAL_BATCH_DATA as initialBatches, INITIAL_USER_KPIS as initialUserKPIs } from '../data/mockData';

const KPIContext = createContext();

export const useKPIContext = () => useContext(KPIContext);

// Versi skema data. Naikkan angka ini bila struktur default (mockData) berubah
// agar cache localStorage lama otomatis di-reset dan tidak menghilangkan field baru.
const DATA_VERSION = '4';

// Helper untuk load dari localStorage atau gunakan default.
// Jika versi skema berbeda, buang cache lama dan pakai default terbaru.
const loadData = (key, defaultData) => {
  try {
    const savedVersion = localStorage.getItem('kpi_data_version');
    if (savedVersion !== DATA_VERSION) return defaultData;
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {
    /* ignore corrupt cache */
  }
  return defaultData;
};

export const KPIProvider = ({ children }) => {
  const [users, setUsers] = useState(() => loadData('kpi_users', initialUsers));
  const [sos, setSos] = useState(() => loadData('kpi_sos', initialSO));
  const [uoms, setUoms] = useState(() => loadData('kpi_uoms', initialUOM));
  const [kpis, setKpis] = useState(() => loadData('kpi_kpis', initialKPIs));
  const [batches, setBatches] = useState(() => loadData('kpi_batches', initialBatches));
  const [userKPIs, setUserKPIs] = useState(() => loadData('kpi_userKPIs', initialUserKPIs));
  // KPI Mandatory yang ditandai "Tidak Relevan" oleh Individual di Planning.jsx — { [userName]: [kpiTemplateId] }.
  // Merujuk ke id template KPI Builder (`kpis`), bukan instance userKPIs (karena KPI yg di-dismiss sengaja
  // TIDAK dimaterialisasi jadi userKPI). Key baru, tidak perlu naikkan DATA_VERSION (fallback {} aman).
  const [dismissedMandatory, setDismissedMandatory] = useState(() => loadData('kpi_dismissedMandatory', {}));

  // Tandai versi skema setelah data awal termuat, agar migrasi hanya sekali.
  useEffect(() => { localStorage.setItem('kpi_data_version', DATA_VERSION); }, []);

  // Simpan ke localStorage setiap kali state berubah
  useEffect(() => { localStorage.setItem('kpi_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('kpi_sos', JSON.stringify(sos)); }, [sos]);
  useEffect(() => { localStorage.setItem('kpi_uoms', JSON.stringify(uoms)); }, [uoms]);
  useEffect(() => { localStorage.setItem('kpi_kpis', JSON.stringify(kpis)); }, [kpis]);
  useEffect(() => { localStorage.setItem('kpi_batches', JSON.stringify(batches)); }, [batches]);
  useEffect(() => { localStorage.setItem('kpi_userKPIs', JSON.stringify(userKPIs)); }, [userKPIs]);
  useEffect(() => { localStorage.setItem('kpi_dismissedMandatory', JSON.stringify(dismissedMandatory)); }, [dismissedMandatory]);

  // Id generator dengan komponen random — Date.now() saja bisa collide kalau addX() dipanggil
  // berkali-kali secara sinkron dalam satu handler (mis. cascade SO ke banyak Dept sekaligus).
  const genId = (prefix) => `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Migrasi/self-heal sekali jalan (2026-07-13): sebelum fix ini, `submitAll()` di Planning.jsx
  // mengubah status KPI jadi 'Submitted' TANPA pernah membuat batch Approval — jadi submission yang
  // sudah terlanjur dilakukan sebelum fix (mis. 10 KPI Indri) kekal 'Submitted' tanpa batch, Superior
  // tidak pernah melihatnya, dan User tidak bisa submit ulang (tombol nonaktif krn sudah tidak Draft).
  // Deteksi KPI 'Submitted' yang belum tercakup batch manapun, buatkan batch otomatis utk itu.
  //
  // `migrationRanRef` WAJIB ada — React 18 StrictMode (main.jsx) sengaja me-mount→cleanup→mount ulang
  // sekali di dev utk setiap komponen, jadi effect dgn `[]` deps TETAP terpanggil 2x di initial mount.
  // Tanpa guard ini, migrasi di atas jalan 2x dgn `batches` closure yg sama (belum ke-update dari
  // panggilan pertama) → 2 batch "Migrasi Otomatis" duplikat persis dibuat (bug nyata yg sempat
  // terjadi ke Indri). Ref bertahan lintas double-invoke StrictMode krn instance komponen tidak
  // benar2 di-unmount, jadi guard ini cukup & aman.
  const migrationRanRef = useRef(false);
  useEffect(() => {
    if (migrationRanRef.current) return;
    migrationRanRef.current = true;

    const batchedIds = new Set(batches.flatMap(b => b.kpiIds || []));
    const healedBatches = [];
    Object.entries(userKPIs).forEach(([userName, items]) => {
      const orphaned = (items || []).filter(k => k.status === 'Submitted' && !batchedIds.has(k.id));
      if (orphaned.length === 0) return;
      const meta = users.find(u => u.name === userName);
      healedBatches.push({
        id: genId('aq'), user: userName, dept: meta?.dept || '',
        batch: 'Planning (Migrasi Otomatis)', jenis: 'Planning', revisi: 0, status: 'Pending',
        kpiIds: orphaned.map(k => k.id),
        kpis: orphaned.map(k => ({
          persp: k.persp, so: k.so || '', name: k.name, desc: k.desc || '',
          type: k.type, uom: k.uom, period: k.period, mtdCat: k.mtdCat, ytdCat: k.ytdCat,
          target: `${k.target}${k.uom === '%' ? '%' : ''}`, bobot: `${(k.weight * 100).toFixed(0)}%`,
        })),
        focusNote: 'Batch dibuat otomatis oleh sistem — submission ini sempat tidak tercatat di Approval Queue sebelum perbaikan (v6.17).',
      });
    });

    // Sekaligus bersihkan duplikat "Migrasi Otomatis" yg sudah KEBURU tercipta dari bug di atas
    // (mis. utk Indri) — collapse batch dgn user + set kpiIds yg identik & masih 'Pending', sisakan 1.
    setBatches(prev => {
      const withHealed = healedBatches.length > 0 ? [...prev, ...healedBatches] : prev;
      const seen = new Set();
      return withHealed.filter(b => {
        if (b.batch !== 'Planning (Migrasi Otomatis)' || b.status !== 'Pending') return true;
        const key = `${b.user}::${(b.kpiIds || []).slice().sort().join(',')}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });

    // Self-heal (2026-07-17): `factorNote`/`suggestedFactor1`/`suggestedFactor2` ditambahkan ke skema
    // KPI TANPA menaikkan DATA_VERSION (sengaja — menaikkannya akan mereset SEMUA data localStorage,
    // termasuk progress testing User yg sedang berjalan, bukan cuma field baru ini). Akibatnya instance
    // KPI yg sudah kepalang tercache SEBELUM field ini ada (mis. dibuat ulang lewat "Simpan ke Planning"
    // pas masih versi lama) tidak akan pernah punya field baru itu walau sudah ada di mockData terbaru.
    // Tambal sekali jalan: cocokkan via `sourceKpiId` (bertahan lintas reset/Draft/Approve, beda dgn
    // `id` instance yg regenerate tiap kali "Simpan ke Planning") ke seed asli di INITIAL_USER_KPIS,
    // isi HANYA field yg masih kosong di instance — tidak pernah menimpa data yg User sudah ubah manual.
    const seedInstances = Object.values(initialUserKPIs).flat();
    setUserKPIs(prev => {
      let changed = false;
      const next = {};
      Object.entries(prev).forEach(([userName, items]) => {
        next[userName] = (items || []).map(k => {
          if (!k.sourceKpiId) return k;
          const seed = seedInstances.find(sk => sk.sourceKpiId === k.sourceKpiId);
          const template = initialKPIs.find(sk => sk.id === k.sourceKpiId);
          const patch = {};
          if (!k.factorNote && (seed?.factorNote || template?.factorNote)) patch.factorNote = seed?.factorNote || template?.factorNote;
          if (seed) {
            if (!k.suggestedFactor1 && seed.suggestedFactor1) patch.suggestedFactor1 = seed.suggestedFactor1;
            if (!k.suggestedFactor2 && seed.suggestedFactor2) patch.suggestedFactor2 = seed.suggestedFactor2;
          }
          if (!k.indicatorCategory && template?.indicatorCategory) patch.indicatorCategory = template.indicatorCategory;
          if (Object.keys(patch).length === 0) return k;
          changed = true;
          return { ...k, ...patch };
        });
      });
      return changed ? next : prev;
    });

    // Sama halnya utk `kpis` (KPI Builder library, Sec. 4/9) — `factorNote` + tagging integrasi
    // (`dataSuggestionEnabled`/`dataSourceLabel`/`integrationKey`, ditambahkan 2026-07-17) bisa hilang
    // di localStorage lama. Match by `id` (stabil, template KPI Builder cuma di-update bukan regenerate).
    setKpis(prev => {
      let changed = false;
      const next = prev.map(k => {
        const seed = initialKPIs.find(sk => sk.id === k.id);
        if (!seed) return k;
        const patch = {};
        if (!k.factorNote && seed.factorNote) patch.factorNote = seed.factorNote;
        if (k.dataSuggestionEnabled === undefined && seed.dataSuggestionEnabled) patch.dataSuggestionEnabled = seed.dataSuggestionEnabled;
        if (!k.dataSourceLabel && seed.dataSourceLabel) patch.dataSourceLabel = seed.dataSourceLabel;
        if (!k.integrationKey && seed.integrationKey) patch.integrationKey = seed.integrationKey;
        if (!k.indicatorCategory && seed.indicatorCategory) patch.indicatorCategory = seed.indicatorCategory;
        if (Object.keys(patch).length === 0) return k;
        changed = true;
        return { ...k, ...patch };
      });
      return changed ? next : prev;
    });
  }, []);

  // --- CRUD Users ---
  // setX pakai functional updater (prev => ...) supaya beberapa panggilan addX() berturut-turut
  // dalam satu event handler tetap terakumulasi, tidak saling menimpa closure state yang stale.
  const addUser = (user) => setUsers(prev => [...prev, user]);
  const updateUser = (idx, updatedUser) => setUsers(prev => prev.map((u, i) => i === idx ? updatedUser : u));
  const deleteUser = (idx) => setUsers(prev => prev.filter((_, i) => i !== idx));

  // --- CRUD SOs ---
  const addSO = (so) => setSos(prev => [...prev, { id: so.id || genId('so'), ...so }]);
  const updateSO = (id, updatedSO) => setSos(prev => prev.map(s => s.id === id ? updatedSO : s));
  const deleteSO = (id) => setSos(prev => prev.filter(s => s.id !== id));

  // --- CRUD UOMs ---
  const addUOM = (uom) => setUoms(prev => [...prev, { id: uom.id || genId('u'), ...uom }]);
  const updateUOM = (id, updatedUOM) => setUoms(prev => prev.map(u => u.id === id ? updatedUOM : u));
  const deleteUOM = (id) => setUoms(prev => prev.filter(u => u.id !== id));

  // --- CRUD KPIs ---
  const addKPI = (kpi) => setKpis(prev => [...prev, { id: kpi.id || genId('kpi'), ...kpi }]);
  const updateKPI = (id, updatedKPI) => setKpis(prev => prev.map(k => k.id === id ? updatedKPI : k));
  const deleteKPI = (id) => setKpis(prev => prev.filter(k => k.id !== id));

  // --- Approval Queue → Pending Mediation workflow (Sec. 6.4 Project Brief) ---
  // Superior: approve / revision / reject per batch. 3x revision tanpa kesepakatan → status 'Pending Mediation',
  // batch terkunci dari Approval Queue dan otomatis tampil di Pending Mediation Queue (CS).
  const addBatch = (batch) => setBatches(prev => [...prev, { ...batch, id: batch.id || genId('aq') }]);

  const actOnBatch = (id, action, note, actor) => {
    const ts = new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const b = batches.find(x => x.id === id);
    setBatches(prev => prev.map(x => {
      if (x.id !== id) return x;
      if (action === 'approve') return { ...x, status: 'Approved', by: actor, ts, catatan: note || '' };
      if (action === 'reject') return { ...x, status: 'Rejected', by: actor, ts, catatan: note || '' };
      if (action === 'revision') {
        const revisi = (x.revisi || 0) + 1;
        return { ...x, revisi, status: revisi >= 3 ? 'Pending Mediation' : 'Request Revision', by: actor, ts, catatan: note || '' };
      }
      return x;
    }));
    // Propagasi hasil approval ke status userKPIs sungguhan (Sec. 8, sumber tunggal) — sebelumnya
    // actOnBatch cuma mengubah status batch itu sendiri, TIDAK PERNAH menyentuh userKPIs, jadi KPI
    // yang sudah di-approve tetap kekal berstatus 'Submitted' selamanya (Performa Tim/Dashboard yg
    // butuh status Approved/Locked jadi tidak pernah terisi). Batch lama dari seed mockData yang tidak
    // punya `kpiIds` (milik user mock yg sudah tidak ada di roster) otomatis dilewati, aman.
    if (b && b.kpiIds && b.kpiIds.length > 0) {
      const newStatus = action === 'approve' ? 'Approved' : (action === 'reject' || action === 'revision') ? 'Draft' : null;
      if (newStatus) {
        setUserKPIs(prev => ({
          ...prev,
          [b.user]: (prev[b.user] || []).map(k => b.kpiIds.includes(k.id) ? { ...k, status: newStatus } : k),
        }));
      }
    }
  };

  // --- Per-User KPI instances (Planning + Actual) — Sec. 8 Project Brief ---
  // Sumber tunggal untuk Dashboard/Planning/ActualInput/History/Team, dan basis agregasi live
  // Dept/Company di Monitoring & Executive (Dept = gabungan userKPIs milik semua user di Dept itu).
  const addUserKPI = (userName, kpi) => setUserKPIs(prev => ({
    ...prev,
    [userName]: [...(prev[userName] || []), { ...kpi, id: kpi.id || genId('uk') }],
  }));
  const updateUserKPI = (userName, kpiId, updates) => setUserKPIs(prev => ({
    ...prev,
    [userName]: (prev[userName] || []).map(k => k.id === kpiId ? { ...k, ...updates } : k),
  }));
  const deleteUserKPI = (userName, kpiId) => setUserKPIs(prev => ({
    ...prev,
    [userName]: (prev[userName] || []).filter(k => k.id !== kpiId),
  }));
  // Hapus SEMUA KPI (Planning + Actual) milik satu user sekaligus — dipakai QA Testing Tools
  // (src/config/features.js QA_MODE_ENABLED) utk reset cepat sebelum uji ulang alur dari awal.
  const resetAllUserKPIs = (userName) => setUserKPIs(prev => ({ ...prev, [userName]: [] }));
  // Bersihkan HANYA data Actual (factor1/factor2 → 12 bulan null) milik satu user, Planning (weight/
  // target/formula/status) TIDAK disentuh — dipakai QA Testing Tools utk uji ulang Actual Jan-Des dari
  // nol tanpa perlu mengulang Planning. Beda dari resetAllUserKPIs yg menghapus KPI sepenuhnya.
  const resetActualDataOnly = (userName) => setUserKPIs(prev => ({
    ...prev,
    [userName]: (prev[userName] || []).map(k => ({
      ...k,
      factor1: k.factor1.map(() => null),
      factor2: k.factor2.map(() => null),
    })),
  }));
  // Hapus field suggestedFactor1/2 (Data Suggestion mock, lihat Project Brief Sec. 6.2 "Data
  // Suggestion") dari SEMUA KPI milik satu user — dipakai QA Testing Tools saat user ingin uji
  // kesesuaian formula vs sumber eksternal (mis. Excel) TANPA gangguan kolom saran/validasi
  // "sama persis dgn suggestion" yg cuma relevan utk alur produksi data automation nantinya.
  const clearSuggestedData = (userName) => setUserKPIs(prev => ({
    ...prev,
    [userName]: (prev[userName] || []).map(({ suggestedFactor1, suggestedFactor2, ...rest }) => rest),
  }));
  // Batalkan approval Planning sebelumnya secara MENYELURUH: semua KPI Approved/Locked milik user
  // ini dikembalikan ke Draft (bisa diedit lagi di Planning.jsx — sama spt tombol "Reset ke Draft"
  // per-KPI yg sudah ada di ActualInput.jsx, tapi sekaligus semuanya) DAN batch Planning lama user
  // ini (baik yg sudah Approved maupun masih Pending) dihapus dari Approval Queue/Riwayat Submission,
  // supaya Superior tidak melihat approval basi begitu User submit ulang dari awal. Batch jenis Actual
  // sengaja TIDAK disentuh — di luar cakupan "batalkan approval KPI ke Superior" (Planning).
  const resetApprovedToDraft = (userName) => {
    setUserKPIs(prev => ({
      ...prev,
      [userName]: (prev[userName] || []).map(k => (k.status === 'Approved' || k.status === 'Locked') ? { ...k, status: 'Draft' } : k),
    }));
    setBatches(prev => prev.filter(b => !(b.user === userName && b.jenis === 'Planning')));
  };
  // Submit batch Planning: ubah status sekumpulan KPI milik userName sekaligus (mis. semua Draft → Submitted).
  const submitUserKPIStatus = (userName, kpiIds, newStatus) => setUserKPIs(prev => ({
    ...prev,
    [userName]: (prev[userName] || []).map(k => kpiIds.includes(k.id) ? { ...k, status: newStatus } : k),
  }));

  // --- KPI Mandatory "Tidak Relevan" (Fase 1) — lihat komentar dismissedMandatory di atas ---
  const dismissMandatoryKPI = (userName, kpiTemplateId) => setDismissedMandatory(prev => ({
    ...prev,
    [userName]: [...new Set([...(prev[userName] || []), kpiTemplateId])],
  }));
  const undismissMandatoryKPI = (userName, kpiTemplateId) => setDismissedMandatory(prev => ({
    ...prev,
    [userName]: (prev[userName] || []).filter(id => id !== kpiTemplateId),
  }));

  return (
    <KPIContext.Provider value={{
      users, addUser, updateUser, deleteUser,
      sos, addSO, updateSO, deleteSO,
      uoms, addUOM, updateUOM, deleteUOM,
      kpis, addKPI, updateKPI, deleteKPI,
      batches, addBatch, actOnBatch,
      userKPIs, addUserKPI, updateUserKPI, deleteUserKPI, submitUserKPIStatus, resetAllUserKPIs, resetActualDataOnly, clearSuggestedData, resetApprovedToDraft,
      dismissedMandatory, dismissMandatoryKPI, undismissMandatoryKPI,
    }}>
      {children}
    </KPIContext.Provider>
  );
};
