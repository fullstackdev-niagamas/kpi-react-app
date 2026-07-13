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
  {
    "name": "Indri Wahyuningrum",
    "nik": "202500472",
    "dept": "Corporate Strategy",
    "position": "Corporate Strategy Officer",
    "branch": "Jakarta",
    "superior": "Andrian Hartono",
    "email": "indri.wahyuningrum@niagamas.com",
    "level": "Dept"
  },
  {
    "name": "Abu Tholib",
    "nik": "201500059",
    "dept": "HRGA",
    "position": "Head of HRGA",
    "branch": "Jakarta",
    "superior": "Andrian Hartono",
    "email": "abu.tholib@niagamas.com",
    "level": "Dept"
  },
  {
    "name": "Eko Kurniawan",
    "nik": "202500462",
    "dept": "HRGA",
    "position": "Recruitment",
    "branch": "Jakarta",
    "superior": "Abu Tholib",
    "email": "eko.kurniawan@niagamas.com",
    "level": "Individual"
  },
  {
    "name": "Gracecilia Tasya Chintiago",
    "nik": "202500533",
    "dept": "HRGA",
    "position": "Junior Recruitment Specialist",
    "branch": "Jakarta",
    "superior": "Eko Kurniawan",
    "email": "recruitment@niagamas.com",
    "level": "Individual"
  },
  {
    "name": "Mathilda Paulin Jokohael",
    "nik": "202200242",
    "dept": "HRGA",
    "position": "Comben",
    "branch": "Jakarta",
    "superior": "Abu Tholib",
    "email": "hrd@niagamas.com",
    "level": "Individual"
  },
  {
    "name": "Morren Andriyanto",
    "nik": "201100032",
    "dept": "Sales Traditional Market",
    "position": "Head of Sales Area 1",
    "branch": "Jakarta",
    "superior": "Andrian Hartono",
    "email": "morren.andriyanto@niagamas.com",
    "level": "Dept"
  },
  {
    "name": "Rizaldi Faisal",
    "nik": "201600069",
    "dept": "Sales Traditional Market",
    "position": "Account Executive",
    "branch": "Jakarta",
    "superior": "Morren Andriyanto",
    "email": "rizaldi.faisal@niagamas.com",
    "level": "Individual"
  },
  {
    "name": "I Gede Ari Raditya",
    "nik": "202500541",
    "dept": "Sales Traditional Market",
    "position": "Sales Account Executive",
    "branch": "Jakarta",
    "superior": "Rizaldi Faisal",
    "email": "sales1@niagamas.com",
    "level": "Individual"
  },
  {
    "name": "Aditya Pratama",
    "nik": "202500561",
    "dept": "Sales Traditional Market",
    "position": "Sales Account Executive",
    "branch": "Jakarta",
    "superior": "Rizaldi Faisal",
    "email": "sales1@niagamas.com",
    "level": "Individual"
  },
  {
    "name": "Andrian Hartono",
    "nik": "198600004",
    "dept": "Company",
    "position": "Direktur Utama",
    "branch": "Jakarta",
    "superior": "-",
    "email": "ceo@niagamas.com",
    "level": "Company"
  }
];

// Sumber tunggal data KPI (Planning + Actual) per User — dikelola live via KPIContext.userKPIs.
// Menggantikan trio lama yang saling terputus (KPI_DATA generik, TEAM_KPI_DATA per-nama, DEPT_KPI_DATA per-Dept):
// sekarang skor Dept & Company dihitung dengan mengagregasi INITIAL_USER_KPIS milik user-user di Dept tsb.
// Hendra Wijaya (BOD, level Company) sengaja [] — KPI BOD = agregasi Company itu sendiri, bukan KPI personal terpisah.
export const INITIAL_USER_KPIS = {
  "Dewi Anggraini": [
    {
      "id": "d1",
      "name": "Revenue Growth",
      "persp": "Financial",
      "weight": 0.3,
      "period": "Bulanan",
      "status": "Approved",
      "strategicObj": null,
      "mtdCat": "RATIO",
      "ytdCat": "SUM",
      "factor1": [
        92,
        95,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        100,
        100,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "type": "Max",
      "uom": "%",
      "target": 100,
      "desc": "Pertumbuhan revenue vs target tahunan"
    },
    {
      "id": "d2",
      "name": "On Budget Cost",
      "persp": "Financial",
      "weight": 0.2,
      "period": "Bulanan",
      "status": "Approved",
      "strategicObj": null,
      "mtdCat": "RATIO",
      "ytdCat": "AVG",
      "factor1": [
        97,
        99,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        100,
        100,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "type": "Max",
      "uom": "%",
      "target": 100,
      "desc": "Realisasi biaya vs budget"
    },
    {
      "id": "d3",
      "name": "Customer Satisfaction",
      "persp": "Customer",
      "weight": 0.25,
      "period": "Kuartalan",
      "status": "Approved",
      "strategicObj": null,
      "mtdCat": "DIRECT",
      "ytdCat": "LAST",
      "factor1": [
        86,
        88,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        86,
        88.5,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "type": "Max",
      "uom": "Indeks",
      "target": 90,
      "desc": "Indeks kepuasan pelanggan"
    },
    {
      "id": "d4",
      "name": "On Time Delivery Rate",
      "persp": "Internal Process",
      "weight": 0.15,
      "period": "Bulanan",
      "status": "Approved",
      "strategicObj": null,
      "mtdCat": "RATIO",
      "ytdCat": "SUM",
      "factor1": [
        94,
        96,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        95,
        95,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "type": "Max",
      "uom": "%",
      "target": 95,
      "desc": "Persentase pengiriman tepat waktu"
    },
    {
      "id": "d5",
      "name": "Training Completion Rate",
      "persp": "Learning & Growth",
      "weight": 0.1,
      "period": "Semesteran",
      "status": "Approved",
      "strategicObj": null,
      "mtdCat": "DIRECT",
      "ytdCat": "LAST",
      "factor1": [
        70,
        78,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        70,
        78,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "type": "Max",
      "uom": "%",
      "target": 100,
      "desc": "Penyelesaian training wajib"
    }
  ],
  "Rian Pratama": [
    {
      "id": "r1",
      "name": "Budget Variance",
      "persp": "Financial",
      "weight": 0.35,
      "period": "Bulanan",
      "status": "Approved",
      "strategicObj": null,
      "mtdCat": "RATIO",
      "ytdCat": "AVG",
      "factor1": [
        98,
        100,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        100,
        100,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "type": "Max",
      "uom": "%",
      "target": 100,
      "desc": "Penyerapan anggaran vs alokasi"
    },
    {
      "id": "r2",
      "name": "Report Accuracy",
      "persp": "Internal Process",
      "weight": 0.35,
      "period": "Bulanan",
      "status": "Approved",
      "strategicObj": null,
      "mtdCat": "DIRECT",
      "ytdCat": "AVG",
      "factor1": [
        95,
        97,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        95,
        97,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "type": "Max",
      "uom": "%",
      "target": 98,
      "desc": "Akurasi laporan keuangan bulanan"
    },
    {
      "id": "r3",
      "name": "AR Turnover",
      "persp": "Financial",
      "weight": 0.3,
      "period": "Kuartalan",
      "status": "Approved",
      "strategicObj": null,
      "mtdCat": "RATIO",
      "ytdCat": "LAST",
      "factor1": [
        4.2,
        4.5,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        5,
        5,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "type": "Max",
      "uom": "Rasio",
      "target": 5,
      "desc": "Rasio perputaran piutang"
    }
  ],
  "Siti Lestari": [
    {
      "id": "s1",
      "name": "Defect Rate",
      "persp": "Internal Process",
      "weight": 0.4,
      "period": "Bulanan",
      "status": "Approved",
      "strategicObj": null,
      "mtdCat": "RATIO",
      "ytdCat": "AVG",
      "factor1": [
        3,
        2,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        2,
        2,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "type": "Min",
      "uom": "%",
      "target": 2,
      "desc": "Persentase produk defect per output",
      "pica": {
        "1": [
          {
            "pi": "Defect rate Jan melebihi target — bahan baku batch #A22 tidak memenuhi spec",
            "ca": "Hold batch #A22, lakukan re-inspection; tingkatkan QC incoming material",
            "deadline": "2027-02-15",
            "pic": "QC Lead"
          }
        ]
      }
    },
    {
      "id": "s2",
      "name": "On Time Delivery",
      "persp": "Customer",
      "weight": 0.35,
      "period": "Bulanan",
      "status": "Approved",
      "strategicObj": null,
      "mtdCat": "RATIO",
      "ytdCat": "SUM",
      "factor1": [
        88,
        91,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        95,
        95,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "type": "Max",
      "uom": "%",
      "target": 95,
      "desc": "Tepat waktu pengiriman ke customer"
    },
    {
      "id": "s3",
      "name": "Inventory Accuracy",
      "persp": "Internal Process",
      "weight": 0.25,
      "period": "Kuartalan",
      "status": "Approved",
      "strategicObj": null,
      "mtdCat": "DIRECT",
      "ytdCat": "LAST",
      "factor1": [
        94,
        95,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        94,
        95,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "type": "Max",
      "uom": "%",
      "target": 98,
      "desc": "Akurasi stok vs catatan sistem"
    }
  ],
  "Budi Santoso": [
    {
      "id": "b1",
      "name": "Revenue Growth",
      "persp": "Financial",
      "weight": 0.3,
      "period": "Bulanan",
      "status": "Approved",
      "strategicObj": "Meningkatkan Profitabilitas",
      "mtdCat": "RATIO",
      "ytdCat": "SUM",
      "factor1": [
        92,
        95,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        100,
        100,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "type": "Max",
      "uom": "%",
      "target": 100,
      "desc": "Pertumbuhan revenue dibandingkan target tahunan"
    },
    {
      "id": "b2",
      "name": "On Budget Cost",
      "persp": "Financial",
      "weight": 0.2,
      "period": "Bulanan",
      "status": "Submitted",
      "strategicObj": "Efisiensi Biaya Operasional",
      "mtdCat": "RATIO",
      "ytdCat": "AVG",
      "factor1": [
        97,
        99,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        100,
        100,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "type": "Max",
      "uom": "%",
      "target": 100,
      "desc": "Realisasi biaya dibandingkan budget yang disetujui"
    },
    {
      "id": "b3",
      "name": "Customer Satisfaction Index",
      "persp": "Customer",
      "weight": 0.25,
      "period": "Kuartalan",
      "status": "Draft",
      "strategicObj": "Meningkatkan Loyalitas Pelanggan",
      "mtdCat": "DIRECT",
      "ytdCat": "LAST",
      "factor1": [
        86,
        88,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        86,
        88.5,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "type": "Max",
      "uom": "Indeks",
      "target": 90,
      "desc": "Indeks kepuasan pelanggan hasil survey kuartalan"
    },
    {
      "id": "b4",
      "name": "On Time Delivery Rate",
      "persp": "Internal Process",
      "weight": 0.15,
      "period": "Bulanan",
      "status": "Approved",
      "strategicObj": "Keandalan Proses Operasional",
      "mtdCat": "RATIO",
      "ytdCat": "SUM",
      "factor1": [
        94,
        96,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        95,
        95,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "type": "Max",
      "uom": "%",
      "target": 95,
      "desc": "Persentase pengiriman yang tepat waktu"
    },
    {
      "id": "b5",
      "name": "Training Completion Rate",
      "persp": "Learning & Growth",
      "weight": 0.1,
      "period": "Semesteran",
      "status": "Locked",
      "strategicObj": "Pengembangan Kapabilitas SDM",
      "mtdCat": "DIRECT",
      "ytdCat": "LAST",
      "factor1": [
        70,
        78,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        70,
        78,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "type": "Max",
      "uom": "%",
      "target": 100,
      "desc": "Persentase penyelesaian training wajib karyawan"
    }
  ],
  "Hendra Wijaya": [],
  "Indri Wahyuningrum": [
    {
      "persp": "Internal Process",
      "so": "Develop KPI",
      "name": "Timeliness of Strategic Reports (HOD Material Meeting)",
      "desc": "(Reports submitted on schedule ÷ Total reports) × 100%\nSLA = H-1 ",
      "type": "Max",
      "mtdCat": "DIRECT",
      "ytdCat": "LAST",
      "period": "Bulanan",
      "target": 100,
      "uom": "%",
      "weight": 0.1,
      "status": "Draft",
      "factor1": [
        null,
        100,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        null,
        100,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "id": "uk1783910297850_kpmk9"
    },
    {
      "sourceKpiId": "kpi1783892898591_42ati",
      "mandatory": true,
      "persp": "Internal Process",
      "so": "Business Process Excellence",
      "name": "Audit Score Index",
      "desc": "Achievement Audit Score Index",
      "type": "Max",
      "uom": "Point",
      "period": "Bulanan",
      "mtdCat": "RATIO",
      "ytdCat": "LAST",
      "target": 100,
      "weight": 0.05,
      "status": "Approved",
      "factor1": [
        null,
        95,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        null,
        100,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "id": "uk1783911278942_32z3v"
    },
    {
      "sourceKpiId": "kpi1783893106556_ey0y2",
      "mandatory": true,
      "persp": "Internal Process",
      "so": "Business Process Excellence",
      "name": "Annual Plan KPI cascading",
      "desc": "#Individual KPI / Total eligible employee",
      "type": "Max",
      "uom": "%",
      "period": "Bulanan",
      "mtdCat": "RATIO",
      "ytdCat": "LAST",
      "target": 100,
      "weight": 0.2,
      "status": "Approved",
      "factor1": [
        null,
        188,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        null,
        206,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "id": "uk1783911284612_85f5y"
    },
    {
      "sourceKpiId": "kpi1783893321417_rhqzq",
      "mandatory": true,
      "persp": "Learning & Growth",
      "so": "Winning Team",
      "name": "Training Realization",
      "desc": "Realization Training/Plan",
      "type": "Max",
      "uom": "%",
      "period": "Bulanan",
      "mtdCat": "RATIO",
      "ytdCat": "LAST",
      "target": 100,
      "weight": 0.05,
      "status": "Approved",
      "factor1": [
        null,
        100,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        null,
        100,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "id": "uk1783911289624_7wee6"
    },
    {
      "sourceKpiId": "kpi1783893498110_at5cm",
      "mandatory": true,
      "persp": "Learning & Growth",
      "so": "Information Technology",
      "name": "Automation & Digitalization Completion",
      "desc": "Automation Completion % = (Jumlah proses terotomasi/Jumlah target proses untuk otomatisasi)*100%",
      "type": "Max",
      "uom": "%",
      "period": "Bulanan",
      "mtdCat": "DIRECT",
      "ytdCat": "LAST",
      "target": 100,
      "weight": 0.1,
      "status": "Approved",
      "factor1": [
        null,
        50,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        null,
        100,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "id": "uk1783911293663_dbyur",
      "pica": {
        "1": [
          {
            "pi": "Masih dalam tahap development KPI System - stage UAT ",
            "ca": "Menindaklanjuti UAT sesuai timeline",
            "deadline": "2026-07-31",
            "pic": "Indri "
          }
        ]
      }
    },
    {
      "persp": "Internal Process",
      "so": "Develop KPI",
      "name": "% KPI Achievement Improvement (Company-wide)",
      "desc": "(Jumlah KPI yang meningkat performanya (Red --> Yellow or Yellow --> Green) ÷ Total KPI yang diukur) × 100%\nPeriod : Quarterly or Semesterly Performance",
      "type": "Max",
      "mtdCat": "RATIO",
      "ytdCat": "LAST",
      "period": "Kuartalan",
      "target": 100,
      "uom": "%",
      "weight": 0.15,
      "status": "Draft",
      "factor1": [
        null,
        15,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        null,
        29,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "id": "uk1783911998227_m5bw7",
      "pica": {
        "1": [
          {
            "pi": "KPI belum mencapai target",
            "ca": "Diskusi root cause dan corrective action dengan KPI Owner ",
            "deadline": "2026-07-31",
            "pic": "Indri & KPI Owner"
          }
        ]
      }
    },
    {
      "persp": "Internal Process",
      "so": "Business Process Excellence",
      "name": "Sistem untuk setiap Dept.",
      "desc": "#Dokumen Prosedur Kerja atau Prosedur Operasional Standar yang berhasil dibuat terhadap Total Dokumen sesuai issue atau kebutuhan",
      "type": "Max",
      "mtdCat": "RATIO",
      "ytdCat": "LAST",
      "period": "Kuartalan",
      "target": 100,
      "uom": "%",
      "weight": 0.1,
      "status": "Draft",
      "factor1": [
        null,
        7,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        null,
        9,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "id": "uk1783912055899_dikvo",
      "pica": {
        "1": [
          {
            "pi": "Belum menentukan timeline untuk oenyelesaian dokumen",
            "ca": "Diskusi dengan process owner",
            "deadline": "2026-07-31",
            "pic": "Indri & Process Owner"
          }
        ]
      }
    },
    {
      "persp": "Internal Process",
      "so": "Develop KPI",
      "name": "Calendar of Events Completion Rate",
      "desc": "(No. of events/activities established ÷ No. of planned events) × 100%",
      "type": "Max",
      "mtdCat": "RATIO",
      "ytdCat": "SUM",
      "period": "Bulanan",
      "target": 100,
      "uom": "%",
      "weight": 0.1,
      "status": "Draft",
      "factor1": [
        null,
        12,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        null,
        13,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "id": "uk1783912115981_yfy2c"
    },
    {
      "persp": "Internal Process",
      "so": "Develop KPI",
      "name": "Dashboard Availability  (Dept. & Individual Level)",
      "desc": "#Dashboard Available/Target",
      "type": "Max",
      "mtdCat": "RATIO",
      "ytdCat": "LAST",
      "period": "Bulanan",
      "target": 100,
      "uom": "%",
      "weight": 0.1,
      "status": "Draft",
      "factor1": [
        null,
        193,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        null,
        204,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "id": "uk1783912241893_lx9x3"
    },
    {
      "persp": "Internal Process",
      "so": "Business Process Excellence",
      "name": "Improvement / Ad-hoc Projects",
      "desc": "Realization/Target Improvement or Ad-hoc",
      "type": "Max",
      "mtdCat": "RATIO",
      "ytdCat": "SUM",
      "period": "Bulanan",
      "target": 100,
      "uom": "%",
      "weight": 0.05,
      "status": "Draft",
      "factor1": [
        null,
        2,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "factor2": [
        null,
        2,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      ],
      "id": "uk1783912292423_5hdc7"
    }
  ]
};

// Approval Queue batches — status & revisi bersifat live (dikelola via KPIContext.actOnBatch).
// Saat revisi mencapai 3x, status otomatis 'Pending Mediation' dan batch muncul di Mediation Queue CS (Sec. 6.4).
export const APPROVAL_BATCH_DATA = [
  {
    "id": "aq1",
    "user": "Dewi Anggraini",
    "dept": "Sales Traditional Market",
    "batch": "Planning Tahun 2027",
    "jenis": "Planning",
    "revisi": 0,
    "status": "Pending",
    "kpis": [
      {
        "name": "Revenue Growth",
        "so": "Meningkatkan Profitabilitas",
        "mtdCat": "RATIO",
        "ytdCat": "SUM",
        "target": "100%",
        "bobot": "30%"
      },
      {
        "name": "On Budget Cost",
        "so": "Efisiensi Biaya Operasional",
        "mtdCat": "RATIO",
        "ytdCat": "AVG",
        "target": "100%",
        "bobot": "20%"
      },
      {
        "name": "Customer Satisfaction Index",
        "so": "Meningkatkan Loyalitas Pelanggan",
        "mtdCat": "DIRECT",
        "ytdCat": "LAST",
        "target": "90",
        "bobot": "25%"
      },
      {
        "name": "On Time Delivery Rate",
        "so": "Keandalan Proses Operasional",
        "mtdCat": "RATIO",
        "ytdCat": "SUM",
        "target": "95%",
        "bobot": "15%"
      },
      {
        "name": "Training Completion Rate",
        "so": "Pengembangan Kapabilitas SDM",
        "mtdCat": "DIRECT",
        "ytdCat": "LAST",
        "target": "100%",
        "bobot": "10%"
      }
    ],
    "focusNote": "Validasi: struktur KPI, Kategori Formula MTD/YTD, bobot, dan target setiap KPI."
  },
  {
    "id": "aq2",
    "user": "Rian Pratama",
    "dept": "Finance, Accounting & Tax",
    "batch": "Actual Jan 2027",
    "jenis": "Actual",
    "revisi": 1,
    "status": "Request Revision",
    "by": "Budi Santoso",
    "ts": "18 Jan 2027, 09.10",
    "catatan": "Mohon lampirkan bukti rekonsiliasi On Budget Cost.",
    "kpis": [
      {
        "name": "Revenue Growth",
        "f1": "95",
        "f2": "100",
        "mtd": "95.0%"
      },
      {
        "name": "On Budget Cost",
        "f1": "99",
        "f2": "100",
        "mtd": "99.0%"
      },
      {
        "name": "On Time Delivery Rate",
        "f1": "96",
        "f2": "95",
        "mtd": "101.1%"
      },
      {
        "name": "Training Completion Rate",
        "f1": "78",
        "f2": "78",
        "mtd": "78.0%"
      }
    ],
    "focusNote": "Validasi: akuntabilitas & validitas data Actual (Factor 1/Factor 2)."
  },
  {
    "id": "aq3",
    "user": "Siti Lestari",
    "dept": "Supply Chain",
    "batch": "Actual Feb 2027",
    "jenis": "Actual",
    "revisi": 3,
    "status": "Pending Mediation",
    "by": "Budi Santoso",
    "ts": "20 Feb 2027, 14.32",
    "catatan": "Perbedaan interpretasi formula komponen \"Total Populasi\" pada Defect Rate — belum ada kesepakatan setelah 3x revisi.",
    "kpis": [
      {
        "name": "Defect Rate",
        "f1": "3",
        "f2": "2",
        "mtd": "150.0%",
        "isRed": true,
        "pica": [
          {
            "pi": "Defect rate Jan melebihi target — bahan baku batch #A22 tidak memenuhi spec",
            "ca": "Hold batch #A22, lakukan re-inspection; tingkatkan QC incoming material",
            "deadline": "2027-02-15",
            "pic": "QC Lead"
          }
        ]
      },
      {
        "name": "On Time Delivery",
        "f1": "88",
        "f2": "95",
        "mtd": "92.6%"
      },
      {
        "name": "Inventory Accuracy",
        "f1": "94",
        "f2": "94",
        "mtd": "94.0%"
      }
    ],
    "focusNote": ""
  },
  {
    "id": "aq1783915733816_hctg1",
    "user": "Budi Santoso",
    "dept": "",
    "batch": "Planning (Migrasi Otomatis)",
    "jenis": "Planning",
    "revisi": 0,
    "status": "Pending",
    "kpiIds": [
      "b2"
    ],
    "kpis": [
      {
        "persp": "Financial",
        "so": "",
        "name": "On Budget Cost",
        "desc": "Realisasi biaya dibandingkan budget yang disetujui",
        "type": "Max",
        "uom": "%",
        "period": "Bulanan",
        "mtdCat": "RATIO",
        "ytdCat": "AVG",
        "target": "100%",
        "bobot": "20%"
      }
    ],
    "focusNote": "Batch dibuat otomatis oleh sistem — submission ini sempat tidak tercatat di Approval Queue sebelum perbaikan (v6.17)."
  },
  {
    "id": "aq1783915733816_953g8",
    "user": "Indri Wahyuningrum",
    "dept": "Corporate Strategy",
    "batch": "Planning (Migrasi Otomatis)",
    "jenis": "Planning",
    "revisi": 0,
    "status": "Approved",
    "kpiIds": [
      "uk1783910297850_kpmk9",
      "uk1783911278942_32z3v",
      "uk1783911284612_85f5y",
      "uk1783911289624_7wee6",
      "uk1783911293663_dbyur",
      "uk1783911998227_m5bw7",
      "uk1783912055899_dikvo",
      "uk1783912115981_yfy2c",
      "uk1783912241893_lx9x3",
      "uk1783912292423_5hdc7"
    ],
    "kpis": [
      {
        "persp": "Internal Process",
        "so": "Develop KPI",
        "name": "Timeliness of Strategic Reports (HOD Material Meeting)",
        "desc": "(Reports submitted on schedule ÷ Total reports) × 100%\nSLA = H-1 ",
        "type": "Max",
        "uom": "%",
        "period": "Bulanan",
        "mtdCat": "DIRECT",
        "ytdCat": "LAST",
        "target": "100%",
        "bobot": "10%"
      },
      {
        "persp": "Internal Process",
        "so": "Business Process Excellence",
        "name": "Audit Score Index",
        "desc": "Achievement Audit Score Index",
        "type": "Max",
        "uom": "Point",
        "period": "Bulanan",
        "mtdCat": "RATIO",
        "ytdCat": "LAST",
        "target": "100",
        "bobot": "5%"
      },
      {
        "persp": "Internal Process",
        "so": "Business Process Excellence",
        "name": "Annual Plan KPI cascading",
        "desc": "#Individual KPI / Total eligible employee",
        "type": "Max",
        "uom": "%",
        "period": "Bulanan",
        "mtdCat": "RATIO",
        "ytdCat": "LAST",
        "target": "100%",
        "bobot": "20%"
      },
      {
        "persp": "Learning & Growth",
        "so": "Winning Team",
        "name": "Training Realization",
        "desc": "Realization Training/Plan",
        "type": "Max",
        "uom": "%",
        "period": "Bulanan",
        "mtdCat": "RATIO",
        "ytdCat": "LAST",
        "target": "100%",
        "bobot": "5%"
      },
      {
        "persp": "Learning & Growth",
        "so": "Information Technology",
        "name": "Automation & Digitalization Completion",
        "desc": "Automation Completion % = (Jumlah proses terotomasi/Jumlah target proses untuk otomatisasi)*100%",
        "type": "Max",
        "uom": "%",
        "period": "Bulanan",
        "mtdCat": "DIRECT",
        "ytdCat": "LAST",
        "target": "100%",
        "bobot": "10%"
      },
      {
        "persp": "Internal Process",
        "so": "Develop KPI",
        "name": "% KPI Achievement Improvement (Company-wide)",
        "desc": "(Jumlah KPI yang meningkat performanya (Red --> Yellow or Yellow --> Green) ÷ Total KPI yang diukur) × 100%\nPeriod : Quarterly or Semesterly Performance",
        "type": "Max",
        "uom": "%",
        "period": "Kuartalan",
        "mtdCat": "RATIO",
        "ytdCat": "LAST",
        "target": "100%",
        "bobot": "15%"
      },
      {
        "persp": "Internal Process",
        "so": "Business Process Excellence",
        "name": "Sistem untuk setiap Dept.",
        "desc": "#Dokumen Prosedur Kerja atau Prosedur Operasional Standar yang berhasil dibuat terhadap Total Dokumen sesuai issue atau kebutuhan",
        "type": "Max",
        "uom": "%",
        "period": "Kuartalan",
        "mtdCat": "RATIO",
        "ytdCat": "LAST",
        "target": "100%",
        "bobot": "10%"
      },
      {
        "persp": "Internal Process",
        "so": "Develop KPI",
        "name": "Calendar of Events Completion Rate",
        "desc": "(No. of events/activities established ÷ No. of planned events) × 100%",
        "type": "Max",
        "uom": "%",
        "period": "Bulanan",
        "mtdCat": "RATIO",
        "ytdCat": "LAST",
        "target": "100%",
        "bobot": "10%"
      },
      {
        "persp": "Internal Process",
        "so": "Develop KPI",
        "name": "Dashboard Availability  (Dept. & Individual Level)",
        "desc": "#Dashboard Available/Target",
        "type": "Max",
        "uom": "%",
        "period": "Bulanan",
        "mtdCat": "RATIO",
        "ytdCat": "LAST",
        "target": "100%",
        "bobot": "10%"
      },
      {
        "persp": "Internal Process",
        "so": "Business Process Excellence",
        "name": "Improvement / Ad-hoc Projects",
        "desc": "Realization/Target Improvement or Ad-hoc",
        "type": "Max",
        "uom": "%",
        "period": "Bulanan",
        "mtdCat": "RATIO",
        "ytdCat": "LAST",
        "target": "100%",
        "bobot": "5%"
      }
    ],
    "focusNote": "Batch dibuat otomatis oleh sistem — submission ini sempat tidak tercatat di Approval Queue sebelum perbaikan (v6.17).",
    "by": "Andrian Hartono",
    "ts": "13 Jul 2026, 11.26",
    "catatan": "Approved. Let's execute"
  }
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
  {
    "id": "cs9",
    "cascade_depts": [],
    "desc": "Target penjualan individual Dewi Anggraini berdasarkan alokasi wilayah dan segmen pelanggan.",
    "owner_type": "user",
    "owner_name": "Dewi Anggraini",
    "persp": "Financial",
    "so": null,
    "name": "Individual Sales Target",
    "type": "Max",
    "uom": "%",
    "period": "Bulanan",
    "mtdCat": "RATIO",
    "ytdCat": "SUM",
    "target": 100,
    "weight": 50,
    "status": "Draft"
  },
  {
    "persp": "Financial",
    "so": "Increase Profitability",
    "name": "EBT",
    "desc": "Actual/Target",
    "uom": "%",
    "type": "Max",
    "period": "Bulanan",
    "weight": 10,
    "target": 5,
    "mtdCat": "DIRECT",
    "ytdCat": "LAST",
    "status": "Active",
    "cascade_depts": [],
    "id": "kpi1783867823369_8vudt",
    "owner_type": "company",
    "owner_name": "PT NLG"
  },
  {
    "id": "kpi1783869944952_1nkwd",
    "persp": "Financial",
    "so": "Increase Revenue Growth",
    "name": "Revenue Achievement",
    "desc": "Actual/Target",
    "uom": "Rp",
    "type": "Max",
    "period": "Bulanan",
    "weight": 30,
    "target": 100,
    "mtdCat": "RATIO",
    "ytdCat": "SUM",
    "status": "Active",
    "cascade_depts": [
      "Sales Traditional Market"
    ],
    "owner_type": "company",
    "owner_name": "PT NLG"
  },
  {
    "persp": "Financial",
    "so": "Cost Effectiveness",
    "name": "On Budget Cost",
    "desc": "Realisasi Biaya/ Budget Biaya (in IDR)",
    "uom": "Rp",
    "type": "Min",
    "period": "Bulanan",
    "weight": 4,
    "target": 100,
    "mtdCat": "RATIO",
    "ytdCat": "SUM",
    "status": "Active",
    "cascade_depts": [
      "HRGA",
      "Sales Traditional Market"
    ],
    "id": "kpi1783891703710_y3jeq",
    "owner_type": "company",
    "owner_name": "PT NLG"
  },
  {
    "id": "kpi1783891966696_yrupm",
    "persp": "Financial",
    "so": "Maintain Liquidity",
    "name": "AR Rate Ratio",
    "desc": "AR / Sales",
    "uom": "Point",
    "type": "Min",
    "period": "Bulanan",
    "weight": 6,
    "target": 1.07,
    "mtdCat": "DIRECT",
    "ytdCat": "LAST",
    "status": "Active",
    "cascade_depts": [
      "Sales Traditional Market"
    ],
    "owner_type": "company",
    "owner_name": "PT NLG"
  },
  {
    "persp": "Customer",
    "so": "Enduser CSI",
    "name": "On Time Delivery Rate",
    "desc": "Total order yang memenuhi SLA​ / Jumlah order × 100% (SLA Delivery = 90% Lead Time 2days)",
    "uom": "%",
    "type": "Max",
    "period": "Bulanan",
    "weight": 4,
    "target": 90,
    "mtdCat": "RATIO",
    "ytdCat": "SUM",
    "status": "Active",
    "cascade_depts": [],
    "id": "kpi1783892058427_rnsy0",
    "owner_type": "company",
    "owner_name": "PT NLG"
  },
  {
    "persp": "Customer",
    "so": "Dealer Relationship Management",
    "name": "9V 9R",
    "desc": "Update 9V & 9R Toko yang dilakukan Roadshow / Total Aktifitas Roadshow",
    "uom": "%",
    "type": "Max",
    "period": "Bulanan",
    "weight": 7,
    "target": 100,
    "mtdCat": "RATIO",
    "ytdCat": "AVG",
    "status": "Active",
    "cascade_depts": [
      "Sales Traditional Market"
    ],
    "id": "kpi1783892151698_sugbd",
    "owner_type": "company",
    "owner_name": "PT NLG"
  },
  {
    "persp": "Customer",
    "so": "Distribution Network",
    "name": "%Toko Potensi Contribution",
    "desc": "Aktual omset toko potensi/Total aktual omset",
    "uom": "%",
    "type": "Max",
    "period": "Bulanan",
    "weight": 2,
    "target": 100,
    "mtdCat": "RATIO",
    "ytdCat": "SUM",
    "status": "Active",
    "cascade_depts": [
      "Sales Traditional Market"
    ],
    "id": "kpi1783892430705_ec7g0",
    "owner_type": "company",
    "owner_name": "PT NLG"
  },
  {
    "id": "kpi1783892655649_0p3w0",
    "persp": "Customer",
    "so": "Dealer Relationship Management",
    "name": "#NOO",
    "desc": "Actual NOO / Target NOO",
    "uom": "Number",
    "type": "Max",
    "period": "Bulanan",
    "weight": 2,
    "target": 15,
    "mtdCat": "RATIO",
    "ytdCat": "LAST",
    "status": "Active",
    "cascade_depts": [
      "Sales Traditional Market"
    ],
    "owner_type": "company",
    "owner_name": "PT NLG"
  },
  {
    "id": "kpi1783892721763_nnvnf",
    "persp": "Internal Process",
    "so": "Quality Index",
    "name": "Quality Index",
    "desc": "Total FOC / Total Penjualan",
    "uom": "%",
    "type": "Min",
    "period": "Bulanan",
    "weight": 4,
    "target": 2,
    "mtdCat": "RATIO",
    "ytdCat": "SUM",
    "status": "Active",
    "cascade_depts": [],
    "owner_type": "company",
    "owner_name": "PT NLG"
  },
  {
    "id": "kpi1783892798264_1ws51",
    "persp": "Internal Process",
    "so": "Stock & Asset Management",
    "name": "Aging Stock Level",
    "desc": "Nilai atau Unit Aging Stock (9 months) / Total Nilai atau Unit Persediaan × 100%",
    "uom": "%",
    "type": "Min",
    "period": "Bulanan",
    "weight": 6,
    "target": 30,
    "mtdCat": "DIRECT",
    "ytdCat": "LAST",
    "status": "Active",
    "cascade_depts": [
      "Sales Traditional Market"
    ],
    "owner_type": "company",
    "owner_name": "PT NLG"
  },
  {
    "persp": "Internal Process",
    "so": "Business Process Excellence",
    "name": "Audit Score Index",
    "desc": "Achievement Audit Score Index",
    "uom": "Point",
    "type": "Max",
    "period": "Bulanan",
    "weight": 3,
    "target": 100,
    "mtdCat": "RATIO",
    "ytdCat": "LAST",
    "status": "Active",
    "cascade_depts": [
      "Corporate Strategy",
      "Sales Traditional Market",
      "HRGA"
    ],
    "id": "kpi1783892898591_42ati",
    "owner_type": "company",
    "owner_name": "PT NLG"
  },
  {
    "persp": "Internal Process",
    "so": "Business Process Excellence",
    "name": "Performance Review",
    "desc": "Ontime review status karyawan/total review status karyawan",
    "uom": "%",
    "type": "Max",
    "period": "Bulanan",
    "weight": 3,
    "target": 100,
    "mtdCat": "RATIO",
    "ytdCat": "SUM",
    "status": "Active",
    "cascade_depts": [
      "HRGA"
    ],
    "id": "kpi1783893050619_7efam",
    "owner_type": "company",
    "owner_name": "PT NLG"
  },
  {
    "persp": "Internal Process",
    "so": "Business Process Excellence",
    "name": "Annual Plan KPI cascading",
    "desc": "#Individual KPI / Total eligible employee",
    "uom": "%",
    "type": "Max",
    "period": "Bulanan",
    "weight": 3,
    "target": 100,
    "mtdCat": "RATIO",
    "ytdCat": "LAST",
    "status": "Active",
    "cascade_depts": [
      "Corporate Strategy"
    ],
    "id": "kpi1783893106556_ey0y2",
    "owner_type": "company",
    "owner_name": "PT NLG"
  },
  {
    "id": "kpi1783893253441_1qw46",
    "persp": "Learning & Growth",
    "so": "Winning Team",
    "name": "MPP Fulfillment",
    "desc": "Employee Fulfillment/Total MPP",
    "uom": "%",
    "type": "Max",
    "period": "Bulanan",
    "weight": 6,
    "target": 100,
    "mtdCat": "RATIO",
    "ytdCat": "LAST",
    "status": "Active",
    "cascade_depts": [
      "HRGA"
    ],
    "owner_type": "company",
    "owner_name": "PT NLG"
  },
  {
    "id": "kpi1783893321417_rhqzq",
    "persp": "Learning & Growth",
    "so": "Winning Team",
    "name": "Training Realization",
    "desc": "Realization Training/Plan",
    "uom": "%",
    "type": "Max",
    "period": "Bulanan",
    "weight": 5,
    "target": 100,
    "mtdCat": "RATIO",
    "ytdCat": "LAST",
    "status": "Active",
    "cascade_depts": [
      "Sales Traditional Market",
      "Corporate Strategy",
      "HRGA"
    ],
    "owner_type": "company",
    "owner_name": "PT NLG"
  },
  {
    "id": "kpi1783893498110_at5cm",
    "persp": "Learning & Growth",
    "so": "Information Technology",
    "name": "Automation & Digitalization Completion",
    "desc": "Automation Completion % = (Jumlah proses terotomasi/Jumlah target proses untuk otomatisasi)*100%",
    "uom": "%",
    "type": "Max",
    "period": "Bulanan",
    "weight": 5,
    "target": 100,
    "mtdCat": "DIRECT",
    "ytdCat": "LAST",
    "status": "Active",
    "cascade_depts": [
      "Corporate Strategy",
      "Sales Traditional Market",
      "HRGA"
    ],
    "owner_type": "company",
    "owner_name": "PT NLG"
  }
];

export const TREND_LABELS = ['Jan','Feb','Mar','Apr','Mei','Jun'];
export const TREND_SCORE  = [2.1, 2.3, 2.2, 2.5, 2.6, 2.7];

export const SO_LIST = [
  {
    "id": "so1783864815725_75906",
    "so": "Increase Profitability",
    "level": "Company",
    "persp": "Financial",
    "dept": "Company",
    "parentId": null,
    "active": true
  },
  {
    "id": "so1783864839275_48805",
    "so": "Increase Revenue Growth",
    "level": "Company",
    "persp": "Financial",
    "dept": "Company",
    "parentId": null,
    "active": true
  },
  {
    "id": "so1783864839276_l6i5k",
    "so": "Increase Revenue Growth",
    "level": "Dept",
    "persp": "Financial",
    "dept": "Sales Traditional Market",
    "parentId": "so1783864839275_48805",
    "active": true
  },
  {
    "id": "so1783864873060_52918",
    "so": "Cost Effectiveness",
    "level": "Company",
    "persp": "Financial",
    "dept": "Company",
    "parentId": null,
    "active": true
  },
  {
    "id": "so1783864873061_5egu2",
    "so": "Cost Effectiveness",
    "level": "Dept",
    "persp": "Financial",
    "dept": "Sales Traditional Market",
    "parentId": "so1783864873060_52918",
    "active": true
  },
  {
    "id": "so1783864873061_eebr0",
    "so": "Cost Effectiveness",
    "level": "Dept",
    "persp": "Financial",
    "dept": "HRGA",
    "parentId": "so1783864873060_52918",
    "active": true
  },
  {
    "id": "so1783864893925_2903",
    "so": "Maintain Liquidity",
    "level": "Company",
    "persp": "Financial",
    "dept": "Company",
    "parentId": null,
    "active": true
  },
  {
    "id": "so1783864893926_u707n",
    "so": "Maintain Liquidity",
    "level": "Dept",
    "persp": "Financial",
    "dept": "Sales Traditional Market",
    "parentId": "so1783864893925_2903",
    "active": true
  },
  {
    "so": "Enduser CSI",
    "level": "Company",
    "persp": "Customer",
    "dept": "Company",
    "parentId": null,
    "active": true,
    "id": "so1783864912237_8985"
  },
  {
    "id": "so1783864938466_1392",
    "so": "Dealer Relationship Management",
    "level": "Company",
    "persp": "Customer",
    "dept": "Company",
    "parentId": null,
    "active": true
  },
  {
    "id": "so1783864938467_vl1o3",
    "so": "Dealer Relationship Management",
    "level": "Dept",
    "persp": "Customer",
    "dept": "Sales Traditional Market",
    "parentId": "so1783864938466_1392",
    "active": true
  },
  {
    "id": "so1783864961468_31535",
    "so": "Distribution Network",
    "level": "Company",
    "persp": "Customer",
    "dept": "Company",
    "parentId": null,
    "active": true
  },
  {
    "id": "so1783864961468_2v964",
    "so": "Distribution Network",
    "level": "Dept",
    "persp": "Customer",
    "dept": "Sales Traditional Market",
    "parentId": "so1783864961468_31535",
    "active": true
  },
  {
    "id": "so1783865002018_24264",
    "so": "Quality Index",
    "level": "Company",
    "persp": "Internal Process",
    "dept": "Company",
    "parentId": null,
    "active": true
  },
  {
    "id": "so1783865027996_25312",
    "so": "Stock & Asset Management",
    "level": "Company",
    "persp": "Internal Process",
    "dept": "Company",
    "parentId": null,
    "active": true
  },
  {
    "id": "so1783865027996_syia2",
    "so": "Stock & Asset Management",
    "level": "Dept",
    "persp": "Internal Process",
    "dept": "Sales Traditional Market",
    "parentId": "so1783865027996_25312",
    "active": true
  },
  {
    "so": "Business Process Excellence",
    "level": "Company",
    "persp": "Internal Process",
    "dept": "Company",
    "parentId": null,
    "active": true,
    "id": "so1783865053220_18647"
  },
  {
    "id": "so1783865053221_0pdjs",
    "so": "Business Process Excellence",
    "level": "Dept",
    "persp": "Internal Process",
    "dept": "Sales Traditional Market",
    "parentId": "so1783865053220_18647",
    "active": true
  },
  {
    "id": "so1783865053221_oqxds",
    "so": "Business Process Excellence",
    "level": "Dept",
    "persp": "Internal Process",
    "dept": "HRGA",
    "parentId": "so1783865053220_18647",
    "active": true
  },
  {
    "id": "so1783865079622_29952",
    "so": "Product Innovation",
    "level": "Company",
    "persp": "Internal Process",
    "dept": "Company",
    "parentId": null,
    "active": true
  },
  {
    "so": "Winning Team",
    "level": "Company",
    "persp": "Learning & Growth",
    "dept": "Company",
    "parentId": null,
    "active": true,
    "id": "so1783865107280_20165"
  },
  {
    "id": "so1783865107281_ltzqu",
    "so": "Winning Team",
    "level": "Dept",
    "persp": "Learning & Growth",
    "dept": "Sales Traditional Market",
    "parentId": "so1783865107280_20165",
    "active": true
  },
  {
    "id": "so1783865107281_asq17",
    "so": "Winning Team",
    "level": "Dept",
    "persp": "Learning & Growth",
    "dept": "HRGA",
    "parentId": "so1783865107280_20165",
    "active": true
  },
  {
    "so": "Information Technology",
    "level": "Company",
    "persp": "Learning & Growth",
    "dept": "Company",
    "parentId": null,
    "active": true,
    "id": "so1783865140971_97791"
  },
  {
    "id": "so1783865140972_gewob",
    "so": "Information Technology",
    "level": "Dept",
    "persp": "Learning & Growth",
    "dept": "Sales Traditional Market",
    "parentId": "so1783865140971_97791",
    "active": true
  },
  {
    "id": "so1783865140972_rxbd9",
    "so": "Information Technology",
    "level": "Dept",
    "persp": "Learning & Growth",
    "dept": "HRGA",
    "parentId": "so1783865140971_97791",
    "active": true
  },
  {
    "id": "so1783905951711_8lb13",
    "so": "Business Process Excellence",
    "level": "Dept",
    "persp": "Internal Process",
    "dept": "Corporate Strategy",
    "parentId": "so1783865053220_18647",
    "active": true
  },
  {
    "id": "so1783905966576_44wqw",
    "so": "Winning Team",
    "level": "Dept",
    "persp": "Learning & Growth",
    "dept": "Corporate Strategy",
    "parentId": "so1783865107280_20165",
    "active": true
  },
  {
    "id": "so1783905973994_udmhq",
    "so": "Information Technology",
    "level": "Dept",
    "persp": "Learning & Growth",
    "dept": "Corporate Strategy",
    "parentId": "so1783865140971_97791",
    "active": true
  },
  {
    "id": "so1783910164805_51824",
    "so": "Develop KPI",
    "level": "Dept",
    "persp": "Internal Process",
    "dept": "Corporate Strategy",
    "parentId": null,
    "active": true
  }
];

export const UOM_LIST = [
  {
    "id": "u1",
    "satuan": "%",
    "keterangan": "Persentase",
    "contoh": "On Time Delivery 95%",
    "active": true
  },
  {
    "id": "u2",
    "satuan": "Rp",
    "keterangan": "Nilai Rupiah",
    "contoh": "Revenue Rp 12 M",
    "active": true
  },
  {
    "id": "u3",
    "satuan": "Unit",
    "keterangan": "Jumlah unit/pcs",
    "contoh": "Penjualan 1.200 unit",
    "active": true
  },
  {
    "id": "u4",
    "satuan": "Rasio",
    "keterangan": "Perbandingan (x)",
    "contoh": "AR Turnover 5x",
    "active": true
  },
  {
    "id": "u5",
    "satuan": "Indeks",
    "keterangan": "Skor indeks/skala",
    "contoh": "CSI Indeks 90",
    "active": true
  },
  {
    "id": "u6",
    "satuan": "Hari",
    "keterangan": "Durasi hari",
    "contoh": "Lead time 3 hari",
    "active": true
  },
  {
    "id": "u7",
    "satuan": "Orang",
    "keterangan": "Jumlah karyawan",
    "contoh": "Training 50 orang",
    "active": true
  },
  {
    "satuan": "Kali",
    "keterangan": "Frekuensi kejadian",
    "contoh": "Audit 4 kali/tahun",
    "active": true,
    "id": "u8"
  },
  {
    "id": "u1783891811793_yyrrr",
    "satuan": "Point",
    "keterangan": "Point",
    "contoh": "AR Rate Ratio",
    "active": true
  },
  {
    "id": "u1783892530930_fk44j",
    "satuan": "Number",
    "keterangan": "Jumlah Angka",
    "contoh": "Number of NOO",
    "active": true
  }
];

// Table themes for BSC table headers
export const TABLE_THEMES = {
  navy:   { label: '● Navy',   vars: {'--th1':'#172B4D','--th2':'#1e3561','--th-text':'#ffffff','--tpast':'#2d3f5e','--ttotal':'#0f1f38','--tytd':'#1a4d3a'} },
  silver: { label: '◉ Silver', vars: {'--th1':'#64748B','--th2':'#94A3B8','--th-text':'#ffffff','--tpast':'#CBD5E1','--ttotal':'#475569','--tytd':'#1a4d3a'} },
  pearl:  { label: '○ Pearl',  vars: {'--th1':'#CBD5E1','--th2':'#E2E8F0','--th-text':'#334155','--tpast':'#F1F5F9','--ttotal':'#94A3B8','--tytd':'#dcfce7'} },
};
