import * as XLSX from 'xlsx';
import { MONTH_LABELS, CURRENT_MONTH_IDX, MASTER_DEPT, MASTER_POSITION_BY_DEPT, MASTER_BRANCH, MASTER_LEVEL_KPI } from '../data/mockData';
import { kpiMonthStats, calcYTD, computeAch, computeScore } from './helpers';

// ── Export Dashboard KPI (BSC) ke Excel ──
export function exportDashboardExcel(userMeta, kpis, year) {
  const wb = XLSX.utils.book_new();
  const rows = [];

  rows.push(['KEY PERFORMANCE INDICATOR — ' + year]);
  rows.push(['Nama', userMeta?.name || '-', '', 'Departemen', userMeta?.dept || '-']);
  rows.push(['NIK', userMeta?.nik || '-', '', 'Jabatan', userMeta?.position || '-']);
  rows.push(['Branch', userMeta?.branch || '-', '', 'Level KPI', userMeta?.level || '-']);
  rows.push([]);

  const monthsToShow = CURRENT_MONTH_IDX + 1;
  const header = ['Perspektif', 'KPI', 'Type', 'UoM', 'Periode', 'Weight', 'Target'];
  for (let m = 0; m < monthsToShow; m++) {
    header.push(`${MONTH_LABELS[m]} Actual`, `${MONTH_LABELS[m]} Ach%`, `${MONTH_LABELS[m]} Score`);
  }
  header.push('Ach% YTD', 'Score YTD');
  rows.push(header);

  kpis.forEach((k) => {
    const row = [k.persp, k.name, k.type, k.uom, k.period, `${Math.round((k.weight <= 1 ? k.weight * 100 : k.weight))}%`, k.target];
    for (let m = 0; m < monthsToShow; m++) {
      const st = kpiMonthStats(k, m);
      if (st) {
        row.push(st.mtd.toFixed(1), (st.ach * 100).toFixed(0) + '%', st.score);
      } else {
        row.push('-', '-', '-');
      }
    }
    const ytd = calcYTD(k, CURRENT_MONTH_IDX);
    const ytdAch = computeAch(k.type, k.target, ytd);
    const ytdScore = computeScore(ytdAch, k.type);
    row.push((ytdAch * 100).toFixed(0) + '%', ytdScore);
    rows.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Dashboard KPI');
  XLSX.writeFile(wb, `KPI_Dashboard_${(userMeta?.name || 'user').replace(/\s+/g, '_')}_${year}.xlsx`);
}

// ── Download template Master User ──
// Sheet 1 pakai header sederhana (name/nik/dept/...) — cocok untuk isi cepat.
// Sheet 2 jadi referensi lengkap Dept → Job Position (mengikuti template resmi HR).
export function downloadMasterUserTemplate() {
  const wb = XLSX.utils.book_new();
  const userSheet = XLSX.utils.aoa_to_sheet([
    ['name', 'nik', 'dept', 'position', 'branch', 'superior', 'email', 'level'],
    ['Contoh Nama', '202400001', 'Sales Traditional Market', 'Key Account Management', 'Jakarta', 'Budi Santoso', 'contoh@niagamas.com', 'Individual'],
  ]);
  XLSX.utils.book_append_sheet(wb, userSheet, 'Master User');

  const refRows = [['Dept.', 'Job Position']];
  MASTER_DEPT.forEach((d) => {
    (MASTER_POSITION_BY_DEPT[d] || []).forEach((p) => refRows.push([d, p]));
  });
  refRows.push([]);
  refRows.push(['Branch Name']);
  MASTER_BRANCH.forEach((b) => refRows.push([b]));
  refRows.push([]);
  refRows.push(['Level KPI']);
  MASTER_LEVEL_KPI.forEach((l) => refRows.push([l.label]));
  const refSheet = XLSX.utils.aoa_to_sheet(refRows);
  XLSX.utils.book_append_sheet(wb, refSheet, 'Referensi Dropdown');

  XLSX.writeFile(wb, 'Template_Master_User.xlsx');
}

// Alias header yang dikenali — mendukung template internal (name/dept/...) MAUPUN
// template resmi HR (Employee Name/Dept./Job Position/Branch Name/Level KPI/...).
const HEADER_ALIASES = {
  name: ['name', 'employee name', 'nama', 'nama lengkap'],
  nik: ['nik', 'employee id', 'id'],
  dept: ['dept', 'dept.', 'department', 'departemen'],
  position: ['position', 'job position', 'jabatan'],
  branch: ['branch', 'branch name', 'cabang'],
  superior: ['superior', 'atasan'],
  email: ['email'],
  level: ['level', 'level kpi'],
};
const normalizeHeader = (h) => String(h ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

// Baris header tidak selalu di baris pertama (template resmi punya baris judul & "dropdown" hint
// sebelum header sungguhan) — scan beberapa baris pertama untuk menemukan baris yang punya kolom "name".
function findHeaderRowIndex(rows) {
  const limit = Math.min(rows.length, 10);
  for (let i = 0; i < limit; i++) {
    const cells = (rows[i] || []).map(normalizeHeader);
    if (cells.some((c) => HEADER_ALIASES.name.includes(c))) return i;
  }
  return 0;
}

// ── Import Master User dari Excel ──
export function importMasterUserExcel(file, existingUsers) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        const headerIdx = findHeaderRowIndex(rawRows);
        const headerCells = (rawRows[headerIdx] || []).map(normalizeHeader);
        const colIndex = {};
        Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
          const idx = headerCells.findIndex((c) => aliases.includes(c));
          if (idx >= 0) colIndex[field] = idx;
        });

        const existingNames = new Set(existingUsers.map((u) => u.name));
        const imported = [];
        for (let r = headerIdx + 1; r < rawRows.length; r++) {
          const row = rawRows[r] || [];
          const get = (field) => (colIndex[field] !== undefined ? String(row[colIndex[field]] ?? '').trim() : '');
          const name = get('name');
          if (!name || name.toLowerCase() === 'dropdown' || existingNames.has(name)) continue;
          // Cell dropdown resmi HR berisi label deskriptif, mis. "Individual (Kapabilitas Otomatis: User biasa)" — ambil token sebelum "(" saja.
          const level = (get('level').split('(')[0].trim().replace(/\.$/, '')) || 'Individual';
          imported.push({
            name,
            nik: get('nik'),
            dept: get('dept'),
            position: get('position'),
            branch: get('branch'),
            superior: get('superior') || '-',
            email: get('email'),
            level,
          });
          existingNames.add(name); // cegah duplikat dalam file yang sama
        }
        resolve(imported);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ── Export laporan generik (Reports page) ──
export function exportReportExcel(title, sections) {
  const wb = XLSX.utils.book_new();
  sections.forEach((s) => {
    const ws = XLSX.utils.aoa_to_sheet(s.rows);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  });
  XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}.xlsx`);
}
