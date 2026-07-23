// Feature flags — matikan/aktifkan modul tanpa menghapus kode atau data yang sudah ada.
//
// PICA_ENABLED: Problem Identification & Corrective Action (Project Brief Sec. 6.2/9.1). Dinonaktifkan
// (2026-07-17) atas keputusan user — KPI Merah untuk saat ini TIDAK wajib diisi PICA sebelum Submit,
// dan seluruh tampilan PICA (Input Realisasi, Approval Queue, Riwayat, Executive, Reports, modal detail
// KPI) disembunyikan. Data `k.pica[...]` yang sudah ada di userKPIs TIDAK dihapus — set kembali ke
// `true` untuk mengaktifkan lagi gate wajib-submit + semua tampilan tsb tanpa kehilangan data historis.
// QA_MODE_ENABLED: menampilkan panel "🧪 Testing Tools" di Input Realisasi (Actual) — reset semua KPI
// user aktif (Planning+Actual) & buka input Factor 1/2 utk bulan-bulan selain bulan aktif tanpa
// mengubah CURRENT_MONTH_IDX global (jadi tidak memengaruhi Executive/Monitoring/Reports/user lain).
// Murni utk kebutuhan uji formula/flow — set `false` sebelum dipakai sbg demo/produksi sungguhan.
export const FEATURES = {
  PICA_ENABLED: false,
  QA_MODE_ENABLED: true, // diaktifkan lagi 2026-07-20 — rencana dropdown "Bulan Simulasi" dibatalkan (risiko: merusak "satu jam bersama" yg jadi basis agregasi Company/Dept BSC, lihat Project Brief). Dipakai simulasi Jan-Jun utk 8 user (exclude Indri & Andrian) via Testing Tools, sama spt alur Indri.
};
