export const PERSPECTIVES = {
  'Financial':        { color: 'purple', label: 'Financial' },
  'Customer':          { color: 'blue',   label: 'Customer' },
  'Internal Process':  { color: 'orange', label: 'Internal Process' },
  'Learning & Growth':  { color: 'teal',   label: 'Learning & Growth' },
};

export const MTD_CATEGORIES = [
  { id: 'DIRECT', label: 'DIRECT', desc: 'Mengambil langsung satu Actual Data (Factor 1) yang diisi pada bulan berjalan, tanpa operasi tambahan.' },
  { id: 'RATIO',  label: 'RATIO',  desc: 'Membandingkan Actual Data pertama (Factor 1) terhadap Actual Data kedua (Factor 2) yang diisi pada bulan berjalan.' },
];
export const YTD_CATEGORIES = [
  { id: 'LAST', label: 'LAST', desc: 'Mengkalkulasi achievement "terakhir" yang diisi di sistem — biasanya untuk KPI yang sifatnya snapshot/tidak bisa dikumulatifkan.' },
  { id: 'SUM',  label: 'SUM',  desc: 'Mengkalkulasi dengan cara menjumlahkan Factor 1 & Factor 2 dari Januari s.d. bulan berjalan, baru dibandingkan (cumulative ratio).' },
  { id: 'AVG',  label: 'AVG',  desc: 'Mengkalkulasi dengan cara merata-ratakan %Actual (MTD) yang sudah dihasilkan tiap bulan dari Januari s.d. bulan berjalan.' },
];

export const CURRENT_MONTH_IDX = 1; // 1 = Feb
export const ACTIVE_PLAN_YEAR = 2027;
export const AVAILABLE_YEARS = [2025, 2026, 2027];
export const MONTH_LABELS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

export const USER_MASTER = [
  { name: 'Dewi Anggraini',  nik: '202112001', dept: 'Sales Traditional Market', position: 'Key Account Management', branch: 'Jakarta',  superior: 'Budi Santoso',  email: 'dewi.anggraini@niagamas.com',   level: 'Individual' },
  { name: 'Rian Pratama',    nik: '202012002', dept: 'Finance, Accounting & Tax', position: 'Finance',               branch: 'Jakarta',  superior: 'Budi Santoso',  email: 'rian.pratama@niagamas.com',     level: 'Individual' },
  { name: 'Siti Lestari',    nik: '201912003', dept: 'Supply Chain',              position: 'Inventory Control',     branch: 'Cikupa',   superior: 'Budi Santoso',  email: 'siti.lestari@niagamas.com',     level: 'Individual' },
  { name: 'Budi Santoso',    nik: '201512004', dept: 'Corporate Strategy',        position: 'Corporate Strategy Officer', branch: 'Jakarta', superior: 'Hendra Wijaya', email: 'budi.santoso@niagamas.com', level: 'Dept' },
  { name: 'Hendra Wijaya',   nik: '200512005', dept: 'BOD',                       position: 'Direktur Utama',        branch: 'Jakarta',  superior: '-',             email: 'hendra.wijaya@niagamas.com',    level: 'Company' },
];

// Sumber tunggal data KPI (Planning + Actual) per User — dikelola live via KPIContext.userKPIs.
// Menggantikan trio lama yang saling terputus (KPI_DATA generik, TEAM_KPI_DATA per-nama, DEPT_KPI_DATA per-Dept):
// sekarang skor Dept & Company dihitung dengan mengagregasi INITIAL_USER_KPIS milik user-user di Dept tsb.
// Hendra Wijaya (BOD, level Company) sengaja [] — KPI BOD = agregasi Company itu sendiri, bukan KPI personal terpisah.
export const INITIAL_USER_KPIS = {
  'Dewi Anggraini': [
    { id: 'd1', name: 'Revenue Growth',           persp: 'Financial',         weight: 0.30, period: 'Bulanan',    status: 'Approved', so: null, mtdCat: 'RATIO',  ytdCat: 'SUM',  factor1: [92,95,null,null,null,null,null,null,null,null,null,null], factor2: [100,100,null,null,null,null,null,null,null,null,null,null], type: 'Max', uom: '%', target: 100, desc: 'Pertumbuhan revenue vs target tahunan' },
    { id: 'd2', name: 'On Budget Cost',            persp: 'Financial',         weight: 0.20, period: 'Bulanan',    status: 'Approved', so: null, mtdCat: 'RATIO',  ytdCat: 'AVG',  factor1: [97,99,null,null,null,null,null,null,null,null,null,null], factor2: [100,100,null,null,null,null,null,null,null,null,null,null], type: 'Max', uom: '%', target: 100, desc: 'Realisasi biaya vs budget' },
    { id: 'd3', name: 'Customer Satisfaction',    persp: 'Customer',           weight: 0.25, period: 'Kuartalan',  status: 'Approved', so: null, mtdCat: 'DIRECT', ytdCat: 'LAST', factor1: [86,88,null,null,null,null,null,null,null,null,null,null], factor2: [86,88.5,null,null,null,null,null,null,null,null,null,null], type: 'Max', uom: 'Indeks', target: 90, desc: 'Indeks kepuasan pelanggan' },
    { id: 'd4', name: 'On Time Delivery Rate',    persp: 'Internal Process',   weight: 0.15, period: 'Bulanan',    status: 'Approved', so: null, mtdCat: 'RATIO',  ytdCat: 'SUM',  factor1: [94,96,null,null,null,null,null,null,null,null,null,null], factor2: [95,95,null,null,null,null,null,null,null,null,null,null], type: 'Max', uom: '%', target: 95, desc: 'Persentase pengiriman tepat waktu' },
    { id: 'd5', name: 'Training Completion Rate', persp: 'Learning & Growth',  weight: 0.10, period: 'Semesteran', status: 'Approved', so: null, mtdCat: 'DIRECT', ytdCat: 'LAST', factor1: [70,78,null,null,null,null,null,null,null,null,null,null], factor2: [70,78,null,null,null,null,null,null,null,null,null,null], type: 'Max', uom: '%', target: 100, desc: 'Penyelesaian training wajib' },
  ],
  'Rian Pratama': [
    { id: 'r1', name: 'Budget Variance',          persp: 'Financial',         weight: 0.35, period: 'Bulanan',    status: 'Approved', so: null, mtdCat: 'RATIO',  ytdCat: 'AVG',  factor1: [98,100,null,null,null,null,null,null,null,null,null,null], factor2: [100,100,null,null,null,null,null,null,null,null,null,null], type: 'Max', uom: '%', target: 100, desc: 'Penyerapan anggaran vs alokasi' },
    { id: 'r2', name: 'Report Accuracy',          persp: 'Internal Process',   weight: 0.35, period: 'Bulanan',    status: 'Approved', so: null, mtdCat: 'DIRECT', ytdCat: 'AVG',  factor1: [95,97,null,null,null,null,null,null,null,null,null,null], factor2: [95,97,null,null,null,null,null,null,null,null,null,null], type: 'Max', uom: '%', target: 98, desc: 'Akurasi laporan keuangan bulanan' },
    { id: 'r3', name: 'AR Turnover',              persp: 'Financial',         weight: 0.30, period: 'Kuartalan',  status: 'Approved', so: null, mtdCat: 'RATIO',  ytdCat: 'LAST', factor1: [4.2,4.5,null,null,null,null,null,null,null,null,null,null], factor2: [5,5,null,null,null,null,null,null,null,null,null,null], type: 'Max', uom: 'Rasio', target: 5, desc: 'Rasio perputaran piutang' },
  ],
  'Siti Lestari': [
    { id: 's1', name: 'Defect Rate', persp: 'Internal Process', weight: 0.40, period: 'Bulanan', status: 'Approved', so: null, mtdCat: 'RATIO', ytdCat: 'AVG', factor1: [3,2,null,null,null,null,null,null,null,null,null,null], factor2: [2,2,null,null,null,null,null,null,null,null,null,null], type: 'Min', uom: '%', target: 2, desc: 'Persentase produk defect per output',
      pica: { 1: [{ pi: 'Defect rate Jan melebihi target — bahan baku batch #A22 tidak memenuhi spec', ca: 'Hold batch #A22, lakukan re-inspection; tingkatkan QC incoming material', deadline: '2027-02-15', pic: 'QC Lead' }]}
    },
    { id: 's2', name: 'On Time Delivery', persp: 'Customer', weight: 0.35, period: 'Bulanan', status: 'Approved', so: null, mtdCat: 'RATIO', ytdCat: 'SUM', factor1: [88,91,null,null,null,null,null,null,null,null,null,null], factor2: [95,95,null,null,null,null,null,null,null,null,null,null], type: 'Max', uom: '%', target: 95, desc: 'Tepat waktu pengiriman ke customer' },
    { id: 's3', name: 'Inventory Accuracy', persp: 'Internal Process', weight: 0.25, period: 'Kuartalan', status: 'Approved', so: null, mtdCat: 'DIRECT', ytdCat: 'LAST', factor1: [94,95,null,null,null,null,null,null,null,null,null,null], factor2: [94,95,null,null,null,null,null,null,null,null,null,null], type: 'Max', uom: '%', target: 98, desc: 'Akurasi stok vs catatan sistem' },
  ],
  'Budi Santoso': [
    { id: 'b1', name: 'Revenue Growth',             persp: 'Financial',         weight: 0.30, period: 'Bulanan',    status: 'Approved',  so: 'Meningkatkan Profitabilitas', mtdCat: 'RATIO',  ytdCat: 'SUM',  factor1: [92, 95, null,null,null,null,null,null,null,null,null,null], factor2: [100, 100, null,null,null,null,null,null,null,null,null,null], type: 'Max', uom: '%', target: 100, desc: 'Pertumbuhan revenue dibandingkan target tahunan' },
    { id: 'b2', name: 'On Budget Cost',             persp: 'Financial',         weight: 0.20, period: 'Bulanan',    status: 'Submitted', so: 'Efisiensi Biaya Operasional', mtdCat: 'RATIO',  ytdCat: 'AVG',  factor1: [97, 99, null,null,null,null,null,null,null,null,null,null], factor2: [100, 100, null,null,null,null,null,null,null,null,null,null], type: 'Max', uom: '%', target: 100, desc: 'Realisasi biaya dibandingkan budget yang disetujui' },
    { id: 'b3', name: 'Customer Satisfaction Index', persp: 'Customer',         weight: 0.25, period: 'Kuartalan',  status: 'Draft',     so: 'Meningkatkan Loyalitas Pelanggan', mtdCat: 'DIRECT', ytdCat: 'LAST', factor1: [86, 88, null,null,null,null,null,null,null,null,null,null], factor2: [86, 88.5, null,null,null,null,null,null,null,null,null,null], type: 'Max', uom: 'Indeks', target: 90, desc: 'Indeks kepuasan pelanggan hasil survey kuartalan' },
    { id: 'b4', name: 'On Time Delivery Rate',      persp: 'Internal Process',  weight: 0.15, period: 'Bulanan',    status: 'Approved',  so: 'Keandalan Proses Operasional', mtdCat: 'RATIO',  ytdCat: 'SUM',  factor1: [94, 96, null,null,null,null,null,null,null,null,null,null], factor2: [95, 95, null,null,null,null,null,null,null,null,null,null], type: 'Max', uom: '%', target: 95, desc: 'Persentase pengiriman yang tepat waktu' },
    { id: 'b5', name: 'Training Completion Rate',   persp: 'Learning & Growth', weight: 0.10, period: 'Semesteran', status: 'Locked',    so: 'Pengembangan Kapabilitas SDM', mtdCat: 'DIRECT', ytdCat: 'LAST', factor1: [70, 78, null,null,null,null,null,null,null,null,null,null], factor2: [70, 78, null,null,null,null,null,null,null,null,null,null], type: 'Max', uom: '%', target: 100, desc: 'Persentase penyelesaian training wajib karyawan' },
  ],
  'Hendra Wijaya': [],
};

// Approval Queue batches — status & revisi bersifat live (dikelola via KPIContext.actOnBatch).
// Saat revisi mencapai 3x, status otomatis 'Pending Mediation' dan batch muncul di Mediation Queue CS (Sec. 6.4).
export const APPROVAL_BATCH_DATA = [
  {
    id: 'aq1', user: 'Dewi Anggraini', dept: 'Sales Traditional Market',
    batch: 'Planning Tahun ' + 2027, jenis: 'Planning', revisi: 0, status: 'Pending',
    kpis: [
      { name: 'Revenue Growth', so: 'Meningkatkan Profitabilitas', mtdCat: 'RATIO', ytdCat: 'SUM', target: '100%', bobot: '30%' },
      { name: 'On Budget Cost', so: 'Efisiensi Biaya Operasional', mtdCat: 'RATIO', ytdCat: 'AVG', target: '100%', bobot: '20%' },
      { name: 'Customer Satisfaction Index', so: 'Meningkatkan Loyalitas Pelanggan', mtdCat: 'DIRECT', ytdCat: 'LAST', target: '90', bobot: '25%' },
      { name: 'On Time Delivery Rate', so: 'Keandalan Proses Operasional', mtdCat: 'RATIO', ytdCat: 'SUM', target: '95%', bobot: '15%' },
      { name: 'Training Completion Rate', so: 'Pengembangan Kapabilitas SDM', mtdCat: 'DIRECT', ytdCat: 'LAST', target: '100%', bobot: '10%' },
    ],
    focusNote: 'Validasi: struktur KPI, Kategori Formula MTD/YTD, bobot, dan target setiap KPI.',
  },
  {
    id: 'aq2', user: 'Rian Pratama', dept: 'Finance, Accounting & Tax',
    batch: 'Actual Jan ' + 2027, jenis: 'Actual', revisi: 1, status: 'Request Revision',
    by: 'Budi Santoso', ts: '18 Jan 2027, 09.10', catatan: 'Mohon lampirkan bukti rekonsiliasi On Budget Cost.',
    kpis: [
      { name: 'Revenue Growth', f1: '95', f2: '100', mtd: '95.0%' },
      { name: 'On Budget Cost', f1: '99', f2: '100', mtd: '99.0%' },
      { name: 'On Time Delivery Rate', f1: '96', f2: '95', mtd: '101.1%' },
      { name: 'Training Completion Rate', f1: '78', f2: '78', mtd: '78.0%' },
    ],
    focusNote: 'Validasi: akuntabilitas & validitas data Actual (Factor 1/Factor 2).',
  },
  {
    id: 'aq3', user: 'Siti Lestari', dept: 'Supply Chain',
    batch: 'Actual Feb ' + 2027, jenis: 'Actual', revisi: 3, status: 'Pending Mediation',
    by: 'Budi Santoso', ts: '20 Feb 2027, 14.32', catatan: 'Perbedaan interpretasi formula komponen "Total Populasi" pada Defect Rate — belum ada kesepakatan setelah 3x revisi.',
    kpis: [
      { name: 'Defect Rate', f1: '3', f2: '2', mtd: '150.0%', isRed: true,
        pica: [
          { pi: 'Defect rate Jan melebihi target — bahan baku batch #A22 tidak memenuhi spec', ca: 'Hold batch #A22, lakukan re-inspection; tingkatkan QC incoming material', deadline: '2027-02-15', pic: 'QC Lead' }
        ]
      },
      { name: 'On Time Delivery', f1: '88', f2: '95', mtd: '92.6%' },
      { name: 'Inventory Accuracy', f1: '94', f2: '94', mtd: '94.0%' },
    ],
    focusNote: '',
  },
];

// Sumber: Template_master_user_KPI_System.xlsx (HR) — Job Position cascading per Dept.
export const MASTER_POSITION_BY_DEPT = {
  'BOD': ['Direksi', 'Direktur Utama'],
  'Corporate Strategy': ['Corporate Strategy Officer'],
  'Customer Service': ['Customer Service', 'Driver'],
  'E-Commerce': ['Admin Sales Online', 'Admin Social Media', 'Business Development Project', 'Desain Grafis', 'Digital Marketing', 'E Commerce', 'Key Account Management', 'Merchant Acquisition', 'Produser', 'Sales Online', 'Video Editor & Videographer', 'Video Support', 'Welder Talent'],
  'Finance, Accounting & Tax': ['Accounting', 'AR', 'Cashier', 'Collector', 'Finance', 'Head of Finance Accounting & Tax', 'Import', 'Inventory Control', 'Puchasing & Import', 'Senior Tax', 'Tax'],
  'HRGA': ['ART', 'Comben', 'Driver Direksi', 'GA', 'Head of HRGA', 'Helper GA', 'Junior Recruitment Specialist', 'Office Boy', 'Receptionist', 'Recruitment', 'Secretary', 'Security', 'Staff HR'],
  'Internal Audit': ['Internal Audit Officer'],
  'IT': ['Data Analyst', 'Full Stack Developer', 'Head of IT', 'IT Support'],
  'Marketing Offline': ['Admin Branding Nasional', 'Admin Marketing & Promotion', 'Head of Sales Area 1', 'Marketing & Promotion', 'Marketing Operation', 'Marketing Support Officer', 'SPB', 'SPB Toko Kuat', 'SPG Toko Kuat'],
  'Marketing Online': ['Admin Sos-Med & Host', 'Desain Grafis', 'Videographer'],
  'Product Power Tools': ['Jr Product Specialist', 'Power Tools Specialist'],
  'Product Welding, Compressor & GR Tools': ['Ass Product', 'Product', 'Product Welding', 'Product Welding Specialist', 'Sales Industri', 'Teknisi dan Product Compressor & General Tools'],
  'Sales Modern Market': ['Admin Sales', 'Sales Modern Market', 'SPB Depo Bandung', 'SPB Depo Bekasi', 'SPB Depo Lampung', 'SPB Depo Malang', 'SPB Depo Medan', 'SPB Depo Serpong', 'SPB Depo Sidoarjo'],
  'Sales Traditional Market': ['Account Executive', 'Admin Cabang', 'Admin Finance', 'Admin Online', 'Admin Sales', 'Ass.Manager Sales', 'Branch Manager', 'Head of Sales Area 2', 'Helper Warehouse', 'Sales Account Executive', 'Sales Account Executive Hand tools'],
  'Supply Chain': ['Admin Inventory', 'Admin Inventory Online', 'Admin Inventory Sparepart', 'Checker Outbond', 'Checker Packing & Loading', 'Driver', 'Helper Warehouse', 'Inventory', 'Logistic', 'Operator Forklift', 'Rework & Racking', 'Supply Chain', 'Warehouse', 'Warehouse & Operational Logistic'],
  'Teknisi': ['Teknisi'],
};

// Daftar Dept resmi NLG — diturunkan dari MASTER_POSITION_BY_DEPT agar selalu konsisten (single source of truth).
// Catatan: 'BOD' menggantikan 'Company' — 'Company' bukan Dept sungguhan, hanya root node di KPI Builder org tree.
export const MASTER_DEPT = Object.keys(MASTER_POSITION_BY_DEPT);

// Flat unique list — dipertahankan untuk kompatibilitas pemakaian yang butuh daftar posisi tanpa filter Dept.
export const MASTER_POSITION = [...new Set(Object.values(MASTER_POSITION_BY_DEPT).flat())];

export const MASTER_BRANCH = [
  'Bandung','Banjarmasin','Cikupa','Denpasar','Jakarta','Lampung',
  'Makassar','Medan','Palembang','Pontianak','Semarang','Surabaya','Yogyakarta'
];

// Level KPI — label deskriptif sesuai template HR, value tetap 'Individual'|'Dept'|'Company'.
export const MASTER_LEVEL_KPI = [
  { value: 'Individual', label: 'Individual (Kapabilitas Otomatis: User biasa)' },
  { value: 'Dept', label: 'Dept. (Kapabilitas: +Approval Queue +SO Field)' },
  { value: 'Company', label: 'Company (Kapabilitas: +Approval Queue +SO Field)' },
];

export const CS_KPI_LIBRARY = [
  { id: 'cs1', desc: 'Mengukur pertumbuhan pendapatan perusahaan dibandingkan target tahunan yang telah ditetapkan.', owner_type:'company', owner_name:'PT NLG', persp:'Financial', so:'Meningkatkan Profitabilitas', name:'Revenue Growth', type:'Max', uom:'%', period:'Bulanan', mtdCat:'RATIO', ytdCat:'SUM', target:100, weight:35, status:'Active', cascade_depts: ['Sales Traditional Market','Sales Modern Market','Finance, Accounting & Tax','Corporate Strategy'] },
  { id: 'cs2', desc: 'Mengukur realisasi biaya operasional dibandingkan anggaran yang disetujui (budget accuracy).', owner_type:'company', owner_name:'PT NLG', persp:'Financial', so:'Efisiensi Biaya Operasional', name:'On Budget Cost', type:'Max', uom:'%', period:'Bulanan', mtdCat:'RATIO', ytdCat:'AVG', target:100, weight:25, status:'Active', cascade_depts: ['Finance, Accounting & Tax'] },
  { id: 'cs3', desc: 'Skor kepuasan pelanggan hasil survei kuartalan menggunakan skala CSI/NPS terstandarisasi.', owner_type:'company', owner_name:'PT NLG', persp:'Customer', so:'Meningkatkan Loyalitas Pelanggan', name:'Customer Satisfaction Index', type:'Max', uom:'Indeks', period:'Kuartalan', mtdCat:'DIRECT', ytdCat:'LAST', target:90, weight:20, status:'Active', cascade_depts: ['Customer Service','Sales Traditional Market','Sales Modern Market'] },
  { id: 'cs4', desc: 'Persentase pengiriman yang tepat waktu sesuai SLA.', owner_type:'company', owner_name:'PT NLG', persp:'Internal Process', so:'Keandalan Proses Operasional', name:'On Time Delivery Rate', type:'Max', uom:'%', period:'Bulanan', mtdCat:'RATIO', ytdCat:'SUM', target:95, weight:10, status:'Active', cascade_depts: ['Supply Chain'] },
  { id: 'cs5', desc: 'Persentase karyawan yang menyelesaikan program training wajib dalam periode semester berjalan.', owner_type:'company', owner_name:'PT NLG', persp:'Learning & Growth', so:'Pengembangan Kapabilitas SDM', name:'Training Completion Rate', type:'Max', uom:'%', period:'Semesteran', mtdCat:'DIRECT', ytdCat:'LAST', target:100, weight:10, status:'Active', cascade_depts: ['HRGA'] },
  { id: 'cs6', cascade_depts: [], desc: 'Pencapaian target penjualan Sales Traditional Market vs target yang ditetapkan CS.', owner_type:'dept', owner_name:'Sales Traditional Market', persp:'Financial', so:'Pertumbuhan Revenue', name:'Sales Achievement vs Target', type:'Max', uom:'%', period:'Bulanan', mtdCat:'RATIO', ytdCat:'SUM', target:100, weight:40, status:'Active' },
  { id: 'cs7', cascade_depts: [], desc: 'Tingkat retensi pelanggan existing pada sales territory Traditional Market.', owner_type:'dept', owner_name:'Sales Traditional Market', persp:'Customer', so:'Meningkatkan Loyalitas Pelanggan', name:'Customer Retention Rate', type:'Max', uom:'%', period:'Kuartalan', mtdCat:'RATIO', ytdCat:'AVG', target:90, weight:30, status:'Active' },
  { id: 'cs8', cascade_depts: [], desc: 'Selisih antara realisasi biaya dengan budget yang disetujui.', owner_type:'dept', owner_name:'Finance, Accounting & Tax', persp:'Financial', so:'Efisiensi Biaya Operasional', name:'Budget Variance', type:'Min', uom:'%', period:'Bulanan', mtdCat:'RATIO', ytdCat:'AVG', target:5, weight:50, status:'Active' },
  { id: 'cs9', cascade_depts: [], desc: 'Target penjualan individual Dewi Anggraini berdasarkan alokasi wilayah dan segmen pelanggan.', owner_type:'user', owner_name:'Dewi Anggraini', persp:'Financial', so:null, name:'Individual Sales Target', type:'Max', uom:'%', period:'Bulanan', mtdCat:'RATIO', ytdCat:'SUM', target:100, weight:50, status:'Draft' },
];

export const TREND_LABELS = ['Jan','Feb','Mar','Apr','Mei','Jun'];
export const TREND_SCORE  = [2.1, 2.3, 2.2, 2.5, 2.6, 2.7];

export const SO_LIST = [
  { id: 'so1', so: 'Meningkatkan Profitabilitas', level: 'Company', dept: 'Company', persp: 'Financial', parentId: null, active: true },
  { id: 'so2', so: 'Efisiensi Biaya Operasional', level: 'Company', dept: 'Company', persp: 'Financial', parentId: null, active: true },
  { id: 'so3', so: 'Meningkatkan Loyalitas Pelanggan', level: 'Company', dept: 'Company', persp: 'Customer', parentId: null, active: true },
  { id: 'so4', so: 'Keandalan Proses Operasional', level: 'Company', dept: 'Company', persp: 'Internal Process', parentId: null, active: true },
  { id: 'so5', so: 'Pengembangan Kapabilitas SDM', level: 'Company', dept: 'Company', persp: 'Learning & Growth', parentId: null, active: true },
  { id: 'so6', so: 'Meningkatkan Pangsa Pasar Modern', level: 'Dept', dept: 'Sales Modern Market', persp: 'Customer', parentId: 'so3', active: true },
  { id: 'so7', so: 'Optimalisasi Working Capital', level: 'Dept', dept: 'Finance, Accounting & Tax', persp: 'Financial', parentId: 'so1', active: true },
  { id: 'so8', so: 'Pertumbuhan Revenue', level: 'Dept', dept: 'Sales Traditional Market', persp: 'Financial', parentId: 'so1', active: true },
  { id: 'so9', so: 'Peningkatan Kualitas Layanan CS', level: 'Dept', dept: 'Customer Service', persp: 'Customer', parentId: 'so3', active: true },
  { id: 'so10', so: 'Keandalan Rantai Pasok', level: 'Dept', dept: 'Supply Chain', persp: 'Internal Process', parentId: 'so4', active: true },
  { id: 'so11', so: 'Pengembangan Talenta Internal', level: 'Dept', dept: 'HRGA', persp: 'Learning & Growth', parentId: 'so5', active: true },
  { id: 'so12', so: 'Digitalisasi Proses Bisnis', level: 'Dept', dept: 'IT', persp: 'Internal Process', parentId: 'so4', active: false },
];

export const UOM_LIST = [
  { id: 'u1', satuan: '%', keterangan: 'Persentase', contoh: 'On Time Delivery 95%', active: true },
  { id: 'u2', satuan: 'Rp', keterangan: 'Nilai Rupiah', contoh: 'Revenue Rp 12 M', active: true },
  { id: 'u3', satuan: 'Unit', keterangan: 'Jumlah unit/pcs', contoh: 'Penjualan 1.200 unit', active: true },
  { id: 'u4', satuan: 'Rasio', keterangan: 'Perbandingan (x)', contoh: 'AR Turnover 5x', active: true },
  { id: 'u5', satuan: 'Indeks', keterangan: 'Skor indeks/skala', contoh: 'CSI Indeks 90', active: true },
  { id: 'u6', satuan: 'Hari', keterangan: 'Durasi hari', contoh: 'Lead time 3 hari', active: true },
  { id: 'u7', satuan: 'Orang', keterangan: 'Jumlah karyawan', contoh: 'Training 50 orang', active: true },
  { id: 'u8', satuan: 'Kali', keterangan: 'Frekuensi kejadian', contoh: 'Audit 4 kali/tahun', active: false },
];

// Table themes for BSC table headers
export const TABLE_THEMES = {
  navy:   { label: '● Navy',   vars: {'--th1':'#172B4D','--th2':'#1e3561','--th-text':'#ffffff','--tpast':'#2d3f5e','--ttotal':'#0f1f38','--tytd':'#1a4d3a'} },
  silver: { label: '◉ Silver', vars: {'--th1':'#64748B','--th2':'#94A3B8','--th-text':'#ffffff','--tpast':'#CBD5E1','--ttotal':'#475569','--tytd':'#1a4d3a'} },
  pearl:  { label: '○ Pearl',  vars: {'--th1':'#CBD5E1','--th2':'#E2E8F0','--th-text':'#334155','--tpast':'#F1F5F9','--ttotal':'#94A3B8','--tytd':'#dcfce7'} },
};
