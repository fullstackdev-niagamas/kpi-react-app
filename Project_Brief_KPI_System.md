# Project Brief: KPI Management System – PT Niagamas Lestari Gemilang
**Versi**: 3.0 (Final – Post-UAT & Mockup Aligned)
**Owner**: Corporate Strategy & Business Development
**Design System**: Engineering Playbook NLG v1.7
**Status**: Living Document – diupdate setiap ada revisi mockup

---

## 1. Background

Proses pengukuran dan pelaporan KPI PT NLG saat ini dilakukan secara manual menggunakan **Google Sheets & BSC Excel**, di mana data Company Level diperoleh dengan mengagregasi data dari Department Level. Masalah utama:

- Keterlambatan update data (manual input per Dept)
- Risiko human error dalam agregasi & perhitungan
- Tidak ada audit trail & tracking historis
- Tidak ada single source of truth antara Dept, Corporate Strategy, dan CEO
- Proses approval/validasi tidak terdokumentasi

---

## 2. Objective

Membangun **KPI Management System** berbasis web yang:

1. Menstandarkan input, validasi, dan approval KPI dari level individu hingga Company
2. Mengotomasi kalkulasi BSC (Achievement, Score, Total Score) sesuai formula existing
3. Memberikan visibilitas performa real-time ke seluruh jenjang (User → Superior → CEO)
4. Memberikan kontrol penuh kepada Corporate Strategy sebagai system owner
5. Mendukung periode pengukuran fleksibel (bulanan/kuartalan/semesteran/tahunan) per KPI

---

## 3. User Roles & Permission Matrix

> **Penting**: Tidak ada login/role "Superior" terpisah. Setiap akun User yang tercatat sebagai atasan dari User lain di **Master Data User** akan **otomatis** mendapat kapabilitas Approval di dalam akun yang sama. Satu akun bisa berperan sebagai User sekaligus Approver tergantung apakah ia punya subordinate.

| Role | Deskripsi | Akses |
|---|---|---|
| **User (Dept/PIC)** | Penginput & pemilik KPI. Jika tercatat punya subordinate di Master Data User → otomatis mendapat fitur Approval Queue & Performa Tim | Input Planning & Actual KPI, Riwayat Submission, Approval Queue *(jika punya subordinate)*, Performa Tim *(jika punya subordinate)* |
| **Corporate Strategy (Super User)** | System owner & pemilik struktur KPI perusahaan | Semua fitur termasuk Master Data, KPI Builder, Monitoring, Mediation, Strategy Map |
| **CEO (Executive)** | Monitoring strategis | Dashboard read-only, Strategy Map, Laporan |

> **Mapping Superior/Atasan** mengikuti struktur organisasi HR. Corporate Strategy mengelola **Master Data User** (mapping User → Superior/Atasan) — inilah yang menentukan siapa mendapat menu Approval Queue & Performa Tim.

> **Fitur komentar/feedback CEO** ke KPI individual bersifat **toggle aktif/nonaktif**, dikelola oleh Corporate Strategy.

---

## 4. Struktur KPI (Cascading Model)

```
Company Level  →  Department Level  →  Individual/PIC Level
     ↓                   ↓                       ↓
 (CEO & CS)         (Dept Head)               (User)
```

**Atribut setiap KPI:**

| Atribut | Keterangan |
|---|---|
| Perspektif BSC | Financial / Customer / Internal Process / Learning & Growth |
| Strategic Objective | Dipilih dari **Master Strategic Objective** (dikelola CS) — **hanya untuk level Company & Dept**. Level Individual/PIC: field ini **tidak muncul sama sekali** (bukan disabled) di SEMUA fitur: Input Planning KPI, panel Master KPI di Input Actual, tabel detail Approval Queue, tabel detail Riwayat Submission, kolom Dashboard Table View. Helper `userShowSO()` berlaku global |
| Nama KPI | Free text |
| Deskripsi/Parameter | Free text |
| Pemilik (Owner) | Otomatis dari akun User |
| Tipe KPI | **Max** (semakin tinggi semakin baik) atau **Min** (semakin rendah semakin baik) |
| UoM/Satuan | Dropdown dari Master UOM (dikelola CS) |
| Target | Angka target tahunan; mendukung **2 mode distribusi**: *Flat* (1 nilai berlaku semua periode) atau *Custom* (berbeda per bulan/kuartal/semester) |
| Bobot (Weight) | Persentase terhadap total — wajib 100% per User sebelum submit Planning |
| Periode Pengukuran | Bulanan / Kuartalan / Semesteran / Tahunan (per KPI) |
| Kategori Formula MTD | **DIRECT** atau **RATIO** (dipilih saat Planning) |
| Kategori Formula YTD | **LAST**, **SUM**, atau **AVG** (dipilih saat Planning) |
| Status | Draft → Submitted → Approved/Rejected → Locked |

---

## 5. Formula & Metodologi Skoring

### 5.1 Input Data Actual

Saat User mengisi menu Input Realisasi (Actual), yang diinput adalah **2 komponen angka** per periode:

- **Factor 1**: Nilai Actual bulan berjalan (pembilang)
- **Factor 2**: Nilai pembanding/target bulan berjalan (penyebut) — **selalu wajib diisi**

### 5.2 Kategori Formula MTD

| Kategori | Formula |
|---|---|
| **DIRECT** | `%Actual (MTD) = Factor 1` |
| **RATIO** | `%Actual (MTD) = (Factor 1 ÷ Factor 2) × 100` |

### 5.3 Kategori Formula YTD

| Kategori | Formula | Cocok untuk |
|---|---|---|
| **LAST** | `%Actual (YTD) = Factor 2 bulan berjalan` | KPI snapshot/rasio tidak bisa dikumulatifkan |
| **SUM** | `SUM(Factor 1, Jan…bln) ÷ SUM(Factor 2, Jan…bln) × 100` | KPI akumulatif |
| **AVG** | `AVERAGE(%Actual MTD, Jan…bln berjalan)` | KPI berbasis rata-rata periode |

> 6 kombinasi MTD × YTD valid. Dipilih saat Planning, tidak bisa diubah setelah Approved.

### 5.4 Konversi %Actual → Score (Dual Threshold sesuai Type KPI)

**Max (Higher Better) – Opsi A:**

| %Actual (Ach) | Score | Grade | Warna |
|---|---|---|---|
| < 80% | 1 | K (Kurang) | 🔴 Merah |
| 80% – 94.99% | 2 | C (Cukup) | 🟡 Kuning |
| ≥ 95% | 3 | B (Baik) | 🟢 Hijau |

**Min (Lower Better) – Opsi B (strict):**

| %Actual (Ach) | Score | Grade | Warna |
|---|---|---|---|
| < 80% | 1 | K (Kurang) | 🔴 Merah |
| 80% – 99.99% | 2 | C (Cukup) | 🟡 Kuning |
| ≥ 100% | 3 | B (Baik) | 🟢 Hijau |

### 5.5 Total Score

`Total Score = SUM(Score × Weight, semua KPI)` — rata-rata tertimbang.

| Range Total Score | Grade | Warna |
|---|---|---|
| 0 – 1.5 | K (Kurang) | 🔴 Merah |
| 1.50001 – 2.5 | C (Cukup) | 🟡 Kuning |
| 2.50001 – 3.0 | B (Baik) | 🟢 Hijau |

### 5.6 Distribusi Target per Periode

- **Flat**: 1 nilai Target berlaku ke semua periode dalam tahun
- **Custom**: Target berbeda per bulan/kuartal/semester (untuk pola seasonal)

---

## 6. Workflow Status & Locking

### 6.1 Annual Planning (1x per tahun)

- Jendela waktu submission diatur Corporate Strategy (aktif/nonaktif, tanggal mulai–akhir)
- User input semua KPI → Simpan Draft per KPI → submit **sekaligus (batch)** setelah total bobot = **100%**
- Flow: **Draft** → Submit batch → **Submitted** → Superior Approve/Reject → **Approved**

### 6.2 Monitoring Periodik (Input Actual)

- Periode Input **dikunci otomatis** ke bulan/periode aktif — User tidak bisa input untuk bulan lain
- User isi Factor 1 & Factor 2 untuk semua KPI periode aktif
- **Jika ada KPI dengan %Actual MTD < 80% (Merah)**: tabel **PICA wajib diisi** sebelum tombol Submit aktif (lihat Section 9)
- Gate submit: semua KPI terisi Factor 1/2 **DAN** semua KPI Merah sudah ada PICA lengkap
- Submit batch → **Submitted** → Superior Approve/Reject → **Approved**

### 6.3 Locking Otomatis

- **KPI Bulanan**: otomatis **Locked** ketika masuk bulan berikutnya (Month+1)
- **KPI Kuartalan/Semesteran/Tahunan**: Locked ketika periode berikutnya dimulai
- Data Locked = read-only, menjadi sumber resmi agregasi Dept/Company & Strategy Map

### 6.4 Request Revision & Mediasi

- Superior: **Approve / Request Revision / Reject** per **batch** (bukan per-KPI)
- Request Revision maksimal **3x** per batch
- Setelah 3x tanpa kesepakatan → **"Pending Mediation"** → queue Corporate Strategy sebagai mediator final

### 6.5 Auto Alert & Reminder

- Auto Alert (email + pop-up in-app) untuk User yang belum input, Superior yang belum merespon, dan rekap CS
- **Threshold H-** hari dan **daftar penerima** dikonfigurasi oleh CS di menu Setting Jendela Waktu & Reminder
- Tidak ada auto-escalation — keputusan tetap di tangan Superior

---

## 7. Periode Pengukuran

**Bulanan / Kuartalan / Semesteran / Tahunan** — dipilih saat Planning per KPI. Locking Actual otomatis terjadi ketika periode berikutnya dimulai.

---

## 8. Fitur Utama per Role

### A. User (Dept/PIC)

**Selalu tersedia:**

- **Dashboard Saya**: BSC Table View (default) + Card View toggle; summary bar Total Score MTD & YTD per bulan Jan–Des yang bisa diklik untuk ganti bulan tampilan (`viewMonthIdx`); 3 tema warna header (Navy/Silver/Pearl). Menampilkan **semua KPI Planning termasuk Draft** (KPI Draft dengan style redup, kolom Actual = "–")
- **Input Planning KPI**: Form per KPI (SO hanya untuk Company/Dept level) → Simpan Draft → Submit Semua setelah bobot 100%
- **Input Realisasi (Actual)**: Layout side-by-side — panel kiri Master KPI read-only, panel kanan Monthly Tracking + input Factor 1/2 bulan aktif. Jika KPI Merah → **tabel PICA wajib muncul dan diisi** sebelum Submit Semua aktif
- **Riwayat Submission**: per batch (Planning Tahun 2027 / Actual Jan 2027 / dst.) → expandable, lihat detail KPI + PICA untuk KPI Merah

**Tambahan otomatis jika punya subordinate di Master Data User:**

- **Approval Queue**: review & approve/reject per batch per subordinate. Batch dengan KPI Merah ditandai badge **"🔴 X KPI Merah · PICA Submitted"**. Expand → 2 bagian: (a) Tabel Data Actual, (b) Tabel PICA per KPI Merah (PI | CA | Deadline | PIC). Field **Catatan Superior untuk PICA** tersedia untuk evaluasi kecukupan tindakan
- **Performa Tim**: dashboard KPI anggota tim yang sudah di-approve, dengan **2 tab**:
  - **Ringkasan Tim** (default): tabel 1 baris per anggota — Nama, Dept, Level, # KPI Approved, Total Score MTD (color-coded), Grade. Klik baris → masuk Detail
  - **Detail Anggota**: selector chip per anggota + format **identik Dashboard Saya** (summary bar MTD/YTD clickable dengan `teamViewMonthIdx` independen, Table/Card toggle, BSC table dengan kolom Target, Total Score row di akhir tabel, SO kondisional berdasarkan level **subordinate**). Hanya KPI **Approved/Locked** yang ditampilkan

### B. Corporate Strategy (Super User)

- **KPI Setup / Builder**: cascading Company → Dept → Individual
- **Master Strategic Objective**: Tambah/Edit/Hapus/Toggle Aktif per SO per Perspektif BSC
- **Master Data User**: mapping User → Superior + Level (Company/Dept/Individual)
- **Master UOM**: kelola satuan
- **Setting Jendela Waktu & Reminder**: jendela Planning + reminder Actual H- hari
- **Monitoring Dashboard**: status submission & performa seluruh Dept
- **Pending Mediation Queue**: batch 3x revisi → CS sebagai mediator final
- **Strategy Map (Kelola)**: atur layout & keterkaitan SO ↔ KPI; skor live
- **Laporan / Export**: export Excel/PDF

### C. CEO (Executive)

- **Executive Dashboard**: Total Score company-wide, breakdown Dept, highlight KPI Merah
- **Strategy Map** (read-only): skor live
- **Laporan**: akses laporan
- **Komentar/Feedback** ke KPI: toggle aktif/nonaktif oleh CS

---

## 9. PICA — Problem Identification & Corrective Action

### 9.1 Trigger & Aturan

- **Trigger**: %Actual MTD < 80% (Score = 1, Merah) setelah User isi Factor 1/2
- **Mandatory (wajib)**: tombol "Submit Semua Actual KPI" diblokir selama PICA belum lengkap
- **Berlaku untuk semua User** (semua level) yang memiliki KPI Merah
- Satu KPI boleh memiliki **lebih dari 1 baris PI/CA** (untuk masalah majemuk)
- Gate submit: semua Factor terisi + semua Red KPI ada ≥1 baris PICA lengkap (PI + CA + Deadline + PIC)

### 9.2 Struktur Tabel PICA (per KPI Merah)

| Kolom | Keterangan |
|---|---|
| **Situasi** | Auto-filled: nama KPI + %Actual MTD (read-only) |
| **Problem Identification (PI)** | Proses mengenali & mendefinisikan masalah + penyebabnya |
| **Corrective Action (CA)** | Langkah/tindakan spesifik agar masalah tidak terulang |
| **Deadline** | Tanggal target penyelesaian (date picker) |
| **PIC** | Nama penanggung jawab CA (free text) |

### 9.3 Visibilitas PICA per Fitur

| Fitur | Visibilitas PICA | Keterangan |
|---|---|---|
| **Input Realisasi Actual** | ✅ Full — tabel editable | Mandatory sebelum submit |
| **Approval Queue** | ✅ Full — read-only | Badge 🔴 di header batch; tabel PI/CA/Deadline/PIC; field Catatan Superior |
| **Riwayat Submission** | ✅ Partial — read-only | Tampil di expand batch Actual untuk KPI yang ditandai 🔴 |
| **Dashboard Saya** | ❌ Tidak tampil | Dashboard fokus pada monitoring angka, bukan PICA |
| **Performa Tim** | ❌ Tidak tampil di tabel | PICA tersedia di Approval Queue saat proses review |

> **Tidak ada approval terpisah untuk PICA** — PICA adalah bagian integral dari batch Actual, approval tetap 1x per batch.

---

## 10. Dashboard Saya — Desain Detail

### 10.1 Table View (default)

**Kolom kiri (sticky):** Perspective | Strategic Objective *(Company & Dept level saja)* | KPI | Type | UoM | Periode | Weight | Target *(dari Planning)*

**Kolom per bulan (scrollable, s.d. bulan aktif input):** Actual | Ach% | Score

**Kolom YTD (kanan):** Ach% YTD | Score YTD

**Baris Total Score** di bagian bawah tabel (konsisten dengan referensi NLG Dashboard Excel)

**Summary bar** di atas: KPI Score | Total Score MTD | Total Score YTD per bulan — clickable untuk ganti bulan tampilan

**Pembedaan state:**
- `viewMonthIdx`: bulan yang ditampilkan di dashboard (bisa diklik user)
- `CURRENT_MONTH_IDX` 🔒: bulan aktif untuk input Actual (dikunci sistem, tidak berubah)

### 10.2 Card View

Per KPI card menampilkan (hierarki font dari besar ke kecil):
- **Perspektif** (bold, teks kecil, atas-kiri)
- **Nama KPI** (font terbesar, bold)
- **Periode · Type** (font terkecil, kiri) | **Target** (kanan)
- `%Actual (MTD)` & `%Actual (YTD)` — background color-coded

### 10.3 Tema Warna Header Tabel

Toggle 3 pilihan (persistensi per sesi):
- 🔵 **Navy**: `#172B4D` / `#1e3561` — default, klasik korporat
- ⚪ **Silver**: light gray, teks gelap — clean & minimal
- 🤍 **Pearl**: warm gray, teks gelap — lebih lembut

Bulan aktif selalu `#1A73E8` (NLG Primary). Kolom YTD selalu hijau tua `#1a4d3a` / `#DCFCE7`.

---

## 11. Standar Desain & Teknis (Engineering Playbook NLG v1.7)

### 11.1 Design Tokens

| Elemen | Token | Hex |
|---|---|---|
| App Canvas | `bg-nlg-bg` | `#FFFFFF` |
| Local Sidebar | `bg-nlg-sidebar` | `#FAFAFA` |
| Rail | `bg-nlg-rail` | `#F1F3F4` |
| Border | `border-nlg-border` | `#DFE1E6` |
| Primary Accent | `--nlg-primary` | `#1A73E8` |
| Primary Tint | `--nlg-primary-tint` | `#E8F0FE` |
| Teks Utama | `text-nlg-text` | `#172B4D` |
| Teks Muted | `text-nlg-text-muted` | `#5E6C84` |

- Border radius: `12px` (input/button) · `16px` (card/panel/modal)

### 11.2 Navigasi App Shell

- **Tier 1** (Rail, 64px): antar-aplikasi — di luar scope KPI System
- **Tier 2** (Sidebar, 240px): menu internal KPI System
- Identitas user di top header App Shell — bukan di sidebar KPI System

### 11.3 RBAC

Permission berbasis `hasPermission('module', 'action')` — tidak hardcode per role, dapat diatur tanpa deployment.

---

## 12. Halaman/Screen Final

| No | Screen | Akses |
|---|---|---|
| 1 | Login | Semua |
| 2 | Dashboard Saya (Table View + Card View) | User |
| 3 | Input Planning KPI | User |
| 4 | Input Realisasi (Actual) KPI + PICA | User |
| 5 | Riwayat Submission | User |
| 6 | Approval Queue (Tim Saya) | User *jika punya subordinate* |
| 7 | Performa Tim (2 tab: Ringkasan + Detail) | User *jika punya subordinate* |
| 8 | KPI Setup / Builder | Corporate Strategy |
| 9 | Master Strategic Objective | Corporate Strategy |
| 10 | Master Data User | Corporate Strategy |
| 11 | Setting Jendela Waktu & Reminder | Corporate Strategy |
| 12 | Monitoring Dashboard | Corporate Strategy |
| 13 | Pending Mediation Queue | Corporate Strategy |
| 14 | Strategy Map (Kelola) | Corporate Strategy |
| 15 | Laporan / Export | Corporate Strategy |
| 16 | Executive Dashboard | CEO |
| 17 | Strategy Map (Read-only) | CEO |
| 18 | Laporan | CEO |

---

## 13. Master Data yang Dikelola Corporate Strategy

| Master Data | Fungsi | Dipakai Di |
|---|---|---|
| **Master Strategic Objective** | Daftar SO per Perspektif (CRUD + Toggle Aktif) | Dropdown Planning KPI level Company & Dept |
| **Master Data User** | Mapping User → Superior + Level tag | Menentukan Approver & tampilnya field SO |
| **Master UOM** | Daftar satuan KPI | Form Planning KPI |
| **Master Periode** | Bulanan/Kuartalan/Semesteran/Tahunan | Form Planning KPI |
| **Master Kategori Formula** | DIRECT/RATIO (MTD) & LAST/SUM/AVG (YTD) | Form Planning KPI |

---

## 14. Keputusan Desain yang Sudah Dikonfirmasi

- ✅ Tidak ada login "Superior" terpisah — berbasis Master Data User
- ✅ Submit batch (Planning & Actual) — bukan per-KPI
- ✅ Revisi maks 3x per batch, setelah itu Pending Mediation ke Corporate Strategy
- ✅ SO tidak muncul untuk level Individual di SEMUA fitur (helper `userShowSO()` global)
- ✅ Periode Input Actual dikunci ke bulan aktif (`CURRENT_MONTH_IDX`)
- ✅ `viewMonthIdx` (Dashboard Saya) dan `teamViewMonthIdx` (Performa Tim) independen — tidak saling mempengaruhi
- ✅ Dashboard menampilkan semua KPI Planning termasuk Draft (Draft = redup + "–" untuk Actual)
- ✅ Kolom Target di fixed columns Table View (bukan per-bulan) dan di Card View
- ✅ Total Score row di baris terakhir tabel BSC — tidak ada card Total Score terpisah
- ✅ Dual threshold scoring: Opsi A untuk Max (≥95% Hijau), Opsi B strict untuk Min (≥100% Hijau)
- ✅ Tema warna header: 3 pilihan toggle (Navy default / Silver / Pearl)
- ✅ Format Riwayat Submission: per batch bulanan (Jan–Des), bukan Q/Semester
- ✅ PICA: mandatory untuk KPI Merah (<80%) sebelum submit Actual; gate: semua Factor + semua PICA lengkap
- ✅ PICA tampil di: Input Actual (editable), Approval Queue (read-only + catatan Superior), Riwayat Submission (read-only)
- ✅ PICA **tidak tampil** di Dashboard Saya — dashboard fokus pada monitoring angka
- ✅ Approval Queue: badge 🔴 di header batch, tabel PICA dedicated, field catatan Superior untuk evaluasi PICA
- ✅ Performa Tim: 2 tab (Ringkasan Tim + Detail Anggota), format Detail identik Dashboard Saya, hanya KPI Approved/Locked
- ✅ Akses mobile/tablet: belum diperlukan (fokus desktop/web)
- ✅ Auto Alert H- hari sebelum locking, dikonfigurasi CS

---

## 15. Changelog

### v3.0 — Post-UAT Final (Konsolidasi Menyeluruh)
- Tulis ulang bersih dari v2.0 (Addendum berlapis) menjadi dokumen linear tunggal
- Semua keputusan UAT diintegrasikan ke section utama
- Tambah Section 9 PICA dengan tabel visibilitas per fitur
- Performa Tim didokumentasikan sebagai 2-tab (Ringkasan Tim + Detail Anggota)

### v3.1 — Enhancement & Bug Fixes
**Fitur baru:**
- **Upload Evidence PICA**: UI upload bukti pendukung (PDF/XLSX/JPG/PNG, maks 10MB) di form PICA Input Actual
- **PICA Historical di Performa Tim**: KPI Merah yang sudah Approved menampilkan PICA collapsible (▶) di Detail Anggota Table View menggunakan helper `renderPICAReadOnly()` — read-only untuk referensi monitoring tindak lanjut CA
- **CEO Executive Dashboard**: Diupgrade dari placeholder menjadi dashboard company-wide realistis — Total Score MTD/YTD, breakdown per Perspektif BSC (berbobot), tabel Dept dengan drill-down, widget KPI Berisiko (<80%), dan Status Submission
- **Ringkasan Tim summary bar**: Tab Ringkasan Tim di Performa Tim kini memiliki summary bar bulan Jan–Des yang bisa diklik (rata-rata score tim per bulan), konsisten dengan Tab Detail Anggota
- **Planning weight progress bar**: Indikator progress visual (bar + warna + pesan) saat User mengisi bobot KPI — hijau (100% ✓), biru (belum), merah (>100% ⚠)

**Bug fixes:**
- Restored `renderTeamPerformance` yang hilang saat cleanup PICA (menyebabkan blank screen)
- Restored `renderKpiBuilder` yang hilang (menyebabkan blank screen pada login Corporate Strategy)
- Hapus `<script>` embedded dalam template literal `renderKpiBuilder` yang memotong main script
- Hapus PICA IIFE dari `renderUserDashboard` yang menggunakan variabel `tv`/`showSOMember` scope lain

**Technical improvements:**
- `renderPICAReadOnly()` helper function: menggantikan inline PICA nested template literal yang menyebabkan V8 parse error (7 level nesting → helper function terpisah)
- Template literal depth dijaga maksimal 5 level di seluruh codebase

### Keputusan Desain Tambahan (v3.1)
- ✅ Upload Evidence PICA: UI mockup siap; implementasi aktual memerlukan backend file storage
- ✅ PICA di Performa Tim: collapsible read-only, diambil dari `k.pica[bulan]` per KPI, berbasis data TEAM_KPI_DATA
- ✅ CEO Dashboard: Total Score Company = weighted average dari 4 Perspektif BSC
- ✅ Ringkasan Tim: avg score tim = rata-rata (bukan total) score semua anggota per bulan

### v3.2 — CS Master Data Build + Disconnect Fix
**Disconnect fix:**
- `APPROVED_BATCHES` shared state baru: Approve/Reject/Revision di Approval Queue langsung sync ke status batch di Riwayat Submission — tidak perlu reload terpisah
- Tombol Approval Queue menggunakan `approveAction(batchId, label, user, action, catatan)` helper global
- Riwayat Submission membaca `APPROVED_BATCHES[b.id]?.status || b.status` — live state di atas demo data

**Corporate Strategy → Master Data (dibangun):**
- **Master Data User** — diupgrade menjadi full CRUD: Edit inline per baris (dropdown Superior/Level), Tambah user baru (row form di bawah tabel), Hapus (dengan guard: tidak bisa hapus jika masih ada subordinate yang mapping ke user ini), badge kapabilitas otomatis (+ Approval Queue, + SO Field)
- **Master UOM** — fitur baru: tabel satuan pengukuran + form CRUD (Tambah/Edit/Toggle Aktif-Nonaktif/Hapus). Satuan aktif = tersedia di dropdown Planning KPI. Satuan nonaktif = tersembunyi dari dropdown tapi data historis tetap valid
- Navigasi CS sidebar: Master UOM ditambahkan di antara Master Data User dan Setting Jendela Waktu

**Keputusan desain baru:**
- ✅ Hapus User: diblokir sistem jika masih ada subordinate yang mapping ke user tersebut (mencegah orphan mapping)
- ✅ Master UOM: satuan nonaktif tidak muncul di dropdown Planning baru, tapi KPI lama yang sudah pakai satuan tersebut tetap valid (tidak berubah)
- ✅ Approve action muncul hanya sekali (setelah klik Approve/Reject/Revision, tombol diganti status tag) — mencegah double-action pada batch yang sama di sesi yang sama

### v3.3 — Multi-Year Support
**Arsitektur tahun (baru):**
- `ACTIVE_PLAN_YEAR`: tahun yang SEDANG DIBUKA CS untuk Planning & Actual input (default 2027). Diset oleh CS di Setting Jendela Waktu. User tidak bisa mengubahnya.
- `viewYear`: tahun yang sedang dilihat user (bisa berbeda dari ACTIVE_PLAN_YEAR untuk melihat histori). Persists per sesi.
- `AVAILABLE_YEARS`: array tahun yang tersedia untuk filter historis (dikembangkan otomatis saat CS set tahun baru).

**Year selector (yearBar) — tampil di semua fitur User:**
Semua halaman User kini memiliki bar pemilih tahun di bagian atas:
- 🔓 = tahun aktif (dapat diinput/edit)
- Tahun lain = historis (read-only)
- Banner amber muncul otomatis saat melihat tahun tidak aktif, dengan tombol "Kembali ke [tahun aktif]"

**Behaviour per fitur saat tahun tidak aktif (inactive year = read-only):**

| Fitur | Tahun Aktif 🔓 | Tahun Tidak Aktif 🔒 |
|---|---|---|
| Dashboard Saya | Editable, bisa klik bulan, submit | Read-only, bisa klik bulan, tidak ada submit |
| Input Planning KPI | Form input lengkap, bisa tambah/edit KPI | Tabel read-only daftar KPI yang pernah diapprove |
| Input Realisasi Actual | Form Factor 1/2, PICA, submit | Tabel read-only data Actual per KPI per bulan + Score YTD |
| Riwayat Submission | List batch + filter tahun | List batch tahun tersebut (read-only, bisa expand) |
| Approval Queue | Normal (aksi Approve/Reject) | — (tidak terpengaruh, selalu live) |
| Performa Tim | Normal | Normal (data historis tim) |

**Setting Jendela Waktu (CS) — diupgrade:**
- Panel baru "Tahun Perencanaan Aktif": CS memilih tahun dari dropdown (2025–2029+), simpan → semua menu langsung update
- Warning sebelum ganti tahun: "Akan mempengaruhi seluruh menu untuk semua User"
- Jendela Planning: tanggal start/end otomatis mengacu tahun aktif

**Semua hardcode "2027" dihapus** — diganti variabel dinamis `ACTIVE_PLAN_YEAR`/`viewYear`/`ACTIVE_PLAN_YEAR.toString().slice(2)` di seluruh template. Satu-satunya "2027" tersisa: nilai default di `let ACTIVE_PLAN_YEAR = 2027` dan opsi dropdown tahun di Setting Jendela Waktu (by design).

**Keputusan desain:**
- ✅ User tidak bisa memilih tahun aktif sendiri — hanya CS yang set
- ✅ Data historis selalu bisa dilihat, tidak terhapus saat ganti tahun aktif
- ✅ Theme toggle (Navy/Silver/Pearl) dipindah ke dalam yearBar (compact, kanan atas) di Table View Dashboard

### v3.4 — KPI Summary Header + Master Data User (Template-Based)
**User Login → Dashboard Saya:**
- **KPI Summary Header** (baru): Banner header di atas Dashboard Saya persis seperti format dokumen KPI NLG, menampilkan:
  - Bar header navy gelap "KEY PERFORMANCE INDICATOR – SUMMARY" + badge "This KPI: [Grade]" di kanan
  - Grid 3 kolom: Name · Position · Department
  - Grid 3 kolom: NIK (monospace) · Branch · Supervisor
  - Grid 3 kolom: Email · Level KPI (badge) · KPI Periode (year selector inline — ganti tahun dari sini)
- Header ini menggantikan kebutuhan user untuk melihat identitas KPI-nya dan juga sekaligus menjadi year selector tanpa perlu yearBar terpisah di atas

**Corporate Strategy → Master Data User (diupgrade sesuai template Excel):**
Kolom baru mengikuti template `Template_master_user_KPI_System.xlsx`:

| Kolom | Keterangan |
|---|---|
| Employee Name | Nama lengkap karyawan |
| NIK | Employee ID (monospace) |
| Dept. | Dropdown dari `MASTER_DEPT` (18 pilihan dari template) |
| Job Position | Dropdown dari `MASTER_POSITION` (26 pilihan dari template) |
| Branch Name | Dropdown dari `MASTER_BRANCH` (13 cabang dari template) |
| Superior | Dropdown dari daftar User yang terdaftar |
| Email | Free text email |
| Level KPI | Individual / Dept / Company (menentukan kapabilitas otomatis) |

- Header tabel menggunakan warna navy gelap (#172B4D) — konsisten dengan KPI Summary Header User
- Badge ringkas di kolom Level KPI: +AQ (Approval Queue) · +SO (SO Field aktif)
- Import dari HR Template: tombol tersedia, di sistem live akan sync dari Excel template
- `MASTER_DEPT`, `MASTER_POSITION`, `MASTER_BRANCH` tersimpan sebagai const global, reusable di semua dropdown

**Data USER_MASTER diperkaya** dengan field baru: NIK, position, branch, email untuk semua sample user.

### v3.5 — Export Excel/PDF + Master User Upload + Dashboard UI Polish
**A. Conflict check:** Tidak ada conflict. Export functions bersifat additive. SheetJS CDN dipakai bersama oleh fitur export Dashboard dan import Master User.

**1. Dashboard Saya — UI Revisi (sesuai screenshot):**
- KPI Summary Header diperbaiki: 3-kolom grid dengan border separator bersih, font size lebih besar (15px), badge status "This KPI" lebih prominent
- **Duplikasi year selector dihapus**: year selector hanya ada di dalam kpiSummaryHeader (KPI Periode cell) — yearBar di Dashboard dihapus, tidak redundant
- Toggle baris atas: Theme (Navy/Silver/Pearl) + View (Table/Card) digabung dalam 1 baris
- **Export bar baru** di bawah toggle:
  - 📥 Excel (.xlsx): export seluruh data KPI table (info user, summary bar, detail KPI per bulan) sebagai file Excel terformat
  - 🖨️ Print / PDF: `window.print()` dengan print CSS A4 landscape — sidebar, tombol, dan elemen non-data disembunyikan saat print

**2. Dashboard Saya — Export ke Excel (SheetJS):**
- `exportDashboardExcel()`: menggunakan SheetJS (CDN cdnjs). Export data:
  - Header info: Name, NIK, Position, Dept, Branch, Supervisor, Email, Level KPI, Tahun KPI
  - Summary row Total Score per bulan
  - Detail KPI: Perspektif, KPI, Type, UoM, Periode, Weight, Target + kolom per bulan (Actual, Ach%, Score) + YTD
- Nama file dinamis: `KPI_Dashboard_[Nama]_[Tahun].xlsx`

**3. Dashboard Saya — Print/PDF:**
- Print CSS A4 landscape: sidebar, rail, tombol, export bar, yearBar (`no-print`) disembunyikan
- KPI Summary header dan table tetap tercetak dengan warna (print-color-adjust: exact)
- Trigger: `window.print()` — browser dialog Print/Save as PDF

**4. CS Master Data User — Upload Excel:**
- **Download Template**: `downloadMasterUserTemplate()` — menghasilkan Excel 2-sheet:
  - Sheet 1 "Master User": header, petunjuk pengisian, contoh row, 20 baris kosong siap isi
  - Sheet 2 "Referensi Dropdown": daftar lengkap nilai valid untuk Dept, Job Position, Branch, Level KPI
- **Upload Excel**: tombol "📤 Upload Excel" dengan `<input type="file">` → `importMasterUserExcel(input)`:
  - Deteksi header row otomatis (cari baris yang mengandung "Employee Name")
  - Import rows setelah header, skip baris yang sudah ada di USER_MASTER (by name)
  - Confirm dialog sebelum import (preview nama pertama 3 user)
  - Toast hasil: "X user ditambahkan, Y dilewati"
- Format template sesuai `Template_master_user_KPI_System.xlsx` yang disediakan user

**5. SheetJS CDN:** `cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js` ditambahkan di `<head>` — dipakai bersama oleh exportDashboardExcel, downloadMasterUserTemplate, dan importMasterUserExcel.

---

### v3.6 — SO Cascading Architecture + ORG Tree Fix + Sidebar Reorder

**A. Conflict check:** Tidak ada conflict. Perubahan ini saling memperkuat: SO level architecture → Planning form filter → Strategy Map filter semua aligned.

**B. Perubahan menyeluruh:**

**1. SO Cascading Architecture (3-point konsep):**
- SO_LIST memiliki field baru: `level` ('Company'|'Dept'), `parentId` (null|id Company SO), `dept` (null|nama dept)
- **Company Level SO**: hanya tampil di Strategy Map (Kelola). TIDAK muncul di Planning form User
- **Dept Level SO**: dibuat CS per-dept sebagai cascade dari Company SO. Muncul di Planning form User sesuai dept
- Relasi: 1 Company SO → N Dept SO dari berbagai dept (parent-child, nama bisa sama/beda)

**2. Master Strategic Objective — UI Dua Layer:**
- Section "🏢 SO Company Level": tombol "+ Tambah SO Company", tabel with kolom "Dept. Cascade (SO Turunan)"
- Section "🏬 SO Dept Level": tombol "+ Tambah SO Dept.", grouped per dept, kolom "SO Parent (Company)"
- Form baru: dropdown Level SO (Company/Dept) → jika Dept: muncul SO Parent dropdown + Dept dropdown
- `toggleSOFormLevel()` untuk show/hide field Dept & Parent berdasarkan Level yang dipilih

**3. MASTER_DEPT diperbarui** dengan 16 dept NLG resmi: Company, Corporate Strategy, Customer Service, E-Commerce, Finance Accounting & Tax, HRGA, Internal Audit, IT, Marketing Offline, Marketing Online, Product Power Tools, Product Welding Compressor & GR Tools, Sales Modern Market, Sales Traditional Market, Supply Chain, Teknisi

**4. Strategy Map (Kelola):** Filter `s.level==='Company'` — hanya Company SO yang tampil

**5. Planning Form (Level Dept):** Filter `s.level==='Dept' && s.dept===userMeta.dept` — hanya Dept SO yang diregister CS untuk dept user. Prefix [Financial] dihapus (redundant).

**6. ORG Tree Bug Fix — Root Cause:**
- Bug: `onclick="window.csSelectNode(\'dept:Finance, Accounting & Tax\')"` — backslash-escaping single quotes dalam double-quoted HTML attribute menghasilkan literal `\` di JS, menyebabkan syntax error sehingga klik tidak bereaksi
- Fix: Gunakan `window._treeKeys[]` array sebagai key registry. `treeNode()` meregister setiap key dengan `window._treeKeys.push(n.key)` dan onclick hanya berisi index integer: `onclick="window.csSelectNode(window._treeKeys[0])"` — zero escaping issues
- `JSON.stringify(treeId)` untuk toggle button ID (aman untuk semua karakter)
- `window.toggleTree` dan `window.csSelectNode` dikembalikan (hilang di session sebelumnya)

**7. Sidebar CS reorder:**
- Master Strategic Objective (1)
- KPI Setup / Builder (2)
- **Strategy Map (Kelola) (3) — dipindah tepat di bawah KPI Builder**
- Master Data User, Master UOM, Setting Jendela Waktu, Monitoring, Mediation, Reports

---

### v3.7 — ORG Tree Fix + KPI Builder Form Reorder + Monitoring Dashboard Upgrade

**A. Conflict check:**
- SO field dihapus dari KPI Builder form — tidak conflict karena SO sudah dikelola di Master SO terpisah. CS yang ingin link KPI ke SO bisa lakukan via Master SO atau CS_KPI_LIBRARY directly.
- `saveCSKpi()` tidak lagi menerima parameter string (yang menyebabkan escaping issues) — diganti dengan `window._saveNodeKey` yang diset saat form dibuka.
- Monitoring Dashboard upgrade tidak conflict dengan Monitoring data flow yang sudah ada.

**B. Perubahan menyeluruh:**

**1. ORG Tree (KPI Builder) — Fixed & Enhanced:**
- **Root Cause Fix**: onclick parameter escaping menyebabkan click silent-fail untuk dept names dengan karakter spesial. Sudah fixed dengan `window._treeKeys[]` registry di sesi sebelumnya.
- **Enhancement**: Tree sekarang menampilkan **semua MASTER_DEPT** (16 dept NLG resmi) bahkan yang belum punya user — agar CS bisa pre-assign KPI sebelum Master User diupload. Dept kosong ditampilkan dengan opacity 50% dan label "∅".
- **Tree info bar**: menampilkan jumlah dept aktif, total user, dan hint "Dept tanpa user: bisa pre-assign KPI"
- **Auto-expand**: semua dept dari USER_MASTER + MASTER_DEPT digabungkan dan di-sort alphabetically
- **Jawaban pertanyaan user**: ORG Tree otomatis ter-update saat CS upload Master Data User via Excel — tidak perlu input manual

**2. KPI Builder Form — Reorder & SO Removal:**
- Strategic Objective **dihapus** dari form (dikelola via Master SO)
- Urutan field baru (1-9): Perspektif BSC → Nama KPI → UoM → Type → Periode → Bobot → Target → Formula MTD → Formula YTD
- Setiap field diberi label nomor urut (1. Perspektif BSC, 2. Nama KPI, dst.)
- Helper text di bawah Formula MTD: "DIRECT=F1 langsung · RATIO=F1÷F2×100"
- Helper text di bawah Formula YTD: "LAST=bulan terakhir · SUM=kumulatif · AVG=rata-rata"
- Total bobot aktif ditampilkan di bawah field Bobot (%)
- **Align dengan Planning form User**: field yang sama dan terminologi yang sama

**3. Monitoring Dashboard — Insightful Upgrade (dari 22 → 180 lines):**

Section 1: **Header KPI Cards (5 metric)**
- Total Score Company + Grade (navy card)
- Submit Rate % (approved/total user)
- Pending Approval (count + warning color if >0)
- 🔴 KPI Merah (count + warning color if >0)
- Dept Aktif / Total Dept

Section 2: **Performance Heatmap per Dept**
- Avg Score per dept + Grade badge
- Visual stacked bar: hijau (B) / kuning (C) / merah (K) dari total KPI
- Submission progress bar per dept
- Risk Flag: ⚠️ N merah + N pending

Section 3: **KPI At Risk — butuh perhatian segera**
- List KPI dengan score 1 (Merah) + %Actual MTD
- Status PICA: ✅ Ada / ⚠️ Belum
- Jika semua OK: tampil pesan hijau "Tidak ada KPI merah"

Section 4: **Detail Per User**
- Score MTD per user + Grade
- Jumlah KPI merah per user
- Status approval (Approved/Pending)

---

### v3.8 — KPI Builder Form Reorder Final + SO Dikembalikan + Panduan Simulasi

**A. Conflict check:**
- SO dikembalikan ke form Builder (tidak dihapus) — tidak ada conflict. Label "(opsional)" dihapus karena SO seharusnya diisi (bukan optional) untuk linking ke Strategy Map. SO dropdown diisi dari SO_LIST Dept Level yang sesuai node yang dipilih.
- saveCSKpi() sudah membaca `cskSO` kembali (sebelumnya di-null karena error di sesi sebelumnya).
- Panduan Simulasi tidak conflict — hanya modal informatif.

**B. Perubahan:**

**1. KPI Builder Form — Urutan Final (sesuai screenshot user):**
| No | Field | Posisi |
|---|---|---|
| 1 | Perspektif BSC * | Kiri |
| 2 | Strategic Objective | Kanan (label tanpa "(opsional)") |
| 3 | Nama KPI * | Full width |
| 4 | UoM | Kiri |
| 5 | Type | Kanan |
| 6 | Periode Ukur | Kiri |
| 7 | Bobot (%) | Kanan |
| 8 | Target | Kiri |
| 9 | Formula MTD | Kanan |
| 10 | Formula YTD | Full width |

**2. Panduan Simulasi — Modal Interaktif:**
Tombol "🧭 Panduan Simulasi" di topbar mockup (kuning) membuka modal berisi:
- **Tabel Akun Simulasi**: 5 akun tersedia (Budi=CS, Hendra=CEO, Dewi/Rian/Siti=User)
- **Alur 5 Fase** (Top-Down):
  - Fase 1: CS Setup (Master SO → KPI Builder → Setting Jendela Waktu → Aktifkan KPI)
  - Fase 2: User Input Planning (Dewi → Planning KPI → Submit)
  - Fase 3: Approval (Budi sebagai Superior → Approval Queue → Approve/Revision)
  - Fase 4: Actual Input + PICA (Dewi → Input Realisasi → PICA jika KPI Merah → Submit)
  - Fase 5: Monitoring & Strategi (CS → Monitoring + Strategy Map, CEO → Executive Dashboard)
- Catatan: data reset saat halaman di-refresh (mockup behavior)

---

### v3.9 — KPI Builder Deskripsi + Table Alignment + CEO Executive Dashboard Major Upgrade

**A. Conflict check:**
- Deskripsi field ditambahkan ke CS_KPI_LIBRARY (data model), form (UI), saveCSKpi (write), dan table rows (read) secara sinkron.
- Table onclick actions menggunakan `window._kpiIds[]` registry (sama dengan tree pattern) — menghindari escaping issue dengan k.id.
- CEO renderExecutiveDashboard di-rebuild total tanpa mengubah CS/User flows.

**B. Perubahan menyeluruh:**

**1. KPI Builder — Field 11: Deskripsi/Parameter:**
- Form: textarea `cskDesc` di bawah Formula YTD, full-width, placeholder operasional definisi + sumber data
- saveCSKpi: membaca dan menyimpan `desc` ke CS_KPI_LIBRARY entry
- CS_KPI_LIBRARY: semua 9 entry existing ditambahkan `desc` field yang deskriptif
- Table: kolom "11. Deskripsi" di kanan dengan truncate 80 char + title tooltip (hover = full text)

**2. KPI Builder Table Header — Alignment dengan Form:**
| Kolom | Header | Selaras dengan Form |
|---|---|---|
| 1 | 1. Perspektif | ↔ Field #1 |
| 2 | 2. Strategic Obj. | ↔ Field #2 |
| 3 | 3. Nama KPI | ↔ Field #3 |
| 4 | 4. UoM | ↔ Field #4 |
| 5 | 5. Type | ↔ Field #5 |
| 6 | 6. Periode | ↔ Field #6 |
| 7 | 7. Bobot | ↔ Field #7 |
| 8 | 8. Target | ↔ Field #8 |
| 9 | 9. MTD | ↔ Field #9 |
| 10 | 10. YTD | ↔ Field #10 |
| 11 | 11. Deskripsi | ↔ Field #11 (baru) |
| + | Status | Aksi CRUD |
| + | Aksi | Aksi CRUD |

**3. CEO Executive Dashboard — Major Rebuild (140 → 190 lines):**
Sebagai CS professional, CEO perlu **Strategic Intelligence**, bukan data operasional.

Section 1: **Company Scorecard + 4 Perspectives**
- Corporate Performance Index: score besar + grade + progress bar
- Trend 6 bulan terakhir: mini bar chart
- 4 Perspective cards: score + progress bar + jumlah KPI + alert merah

Section 2: **Strategic Alerts (Auto-generated)**
- Critical: Company score < 1.5
- Warning: Ada KPI merah (list nama)
- Info: Submission belum complete
- Success: Semua kondisi baik (jika tidak ada alert)

Section 3: **Cascading Performance — Dept vs Company**
- Bar chart horizontal per dept
- Score + Grade badge
- vs Company delta (+ hijau / - merah)
- Flag KPI merah per dept

Section 4: **Strategic Risk Radar**
- KPI At Risk (score 1) dalam card grid
- Per KPI: perspektif, nama, %Actual MTD, status PICA
- Jika tidak ada risk: pesan "🎯 Semua inisiatif strategis berjalan sesuai target"

Section 5: **Ringkasan Strategis per Perspektif BSC**
- Table: Perspektif → SO Aktif → Total KPI → Score → KPI Merah

---

### v4.0 — Year Toggle + Dept Drill-Down + CS Mirror CEO + Form Deskripsi Reorder

**A. Conflict check:**
- `execViewYear` & `selectedExecDept` — state baru, tidak conflict dengan `viewYear` (User context).
- CS Executive View — reuse `renderExecutiveDashboard` yang sama dengan CEO. Zero duplication.
- Monitoring dept onclick — arahkan ke Executive View (bukan URL baru), sinkron via `currentPage='executive'`.
- Form renumbering: 4-Deskripsi (setelah Nama KPI), lalu 5-UoM dst. Table header renumbered 5-UoM s/d 12-Deskripsi.

**B. Perubahan menyeluruh:**

**1. Form KPI Builder — Deskripsi dipindah ke posisi 4 (setelah Nama KPI):**
- Urutan final: 1-Perspektif BSC → 2-Strategic Objective → 3-Nama KPI → **4-Deskripsi/Parameter** → 5-UoM → 6-Type → 7-Periode → 8-Bobot → 9-Target → 10-MTD → 11-YTD
- Table header: 1-Perspektif → 2-SO → 3-Nama KPI → 4-UoM → 5-Type → 6-Periode → 7-Bobot → 8-Target → 9-MTD → 10-YTD → **11-Deskripsi** → Status → Aksi

**2. Year Toggle (execViewYear) — CS & CEO:**
- State baru: `let execViewYear = ACTIVE_PLAN_YEAR`
- Toggle tampil di: Executive Dashboard (CS & CEO) + Monitoring Dashboard (CS)
- Legend: 🔓 tahun aktif · ⏮ historis (read-only) · ⏭ belum berjalan (planning)
- Saat user pilih tahun lain, `selectedExecDept` di-reset ke null (kembali ke summary)

**3. Executive Dashboard — Interactive Dept Drill-Down:**
- Default view: Company Scorecard + Cascading Dept Table (clickable)
- Click dept row → Dept Drill-Down View:
  - Header: dept score + grade + vs Company delta + KPI merah count
  - User Cards grid: score per user dalam dept (jika > 1 user)
  - KPI Table per perspektif: Actual MTD, %Achv, Score
- Tombol "← Kembali ke Summary" di year toggle bar
- `_deptKeys[]` registry untuk onclick (no escaping issues)

**4. CS Executive View (menu baru):**
- Ditambahkan ke CS NAV di posisi 4 (setelah Strategy Map)
- Reuse `renderExecutiveDashboard` — identik dengan CEO view
- CS dapat lihat full executive intelligence: CPI, perspectives, cascading, risk radar
- CS dapat drill-down ke dept detail KPI sama seperti CEO

**5. Monitoring Dashboard — Dept Click Link:**
- Dept name cell sekarang clickable (cursor-pointer + →)
- Click → set `selectedExecDept` + navigate ke Executive View
- Integrasi: Monitoring sebagai "trigger point" untuk drill-down di Executive View

**6. CS NAV final:**
Master SO → KPI Builder → Strategy Map → **Executive View (baru)** → Monitoring Dashboard → Master Data User → Master UOM → Setting Jendela Waktu → Pending Mediation → Laporan

---

### v4.1 — Header Cleanup + SUPERIOR + Soft Themes + Dept Dashboard Saya Style

**A. Conflict check:**
- Header renumbering: only UI labels, no logic change.
- SUPERVISOR→SUPERIOR: terminology fix across all login views.
- Silver/Pearl: CSS vars only, no layout impact.
- Dept drill-down rebuild: extends existing `renderExecutiveDashboard` without touching CS/User flows.

**B. Perubahan:**

**1. KPI Builder — Table Headers (hapus nomor urut):**
Header now shows: Perspektif | Strategic Obj. | Nama KPI | UoM | Type | Periode | Bobot | Target | Formula MTD | Formula YTD | Deskripsi/Parameter | Status | Aksi
(Angka urut hanya ada di form input, tidak di table header)

**2. Dashboard Saya — SUPERVISOR → SUPERIOR:**
Label field di KPI Summary Header diubah dari "Supervisor" menjadi "Superior" (terminologi yang benar dalam konteks organizational hierarchy BSC).

**3. Themes Silver & Pearl — Dikembalikan ke Soft/Light:**
- Silver: `--th1: #64748B` (slate-500) · `--th2: #94A3B8` (slate-400) — lighter dari sebelumnya
- Pearl: `--th1: #CBD5E1` (slate-300) · `--th2: #E2E8F0` (slate-200) · `--th-text: #334155` (dark text for contrast)
- Navy: tidak berubah

**4. CEO/CS Executive View — Dept Drill-Down sekarang mirip "Dashboard Saya" User:**
Saat klik dept di cascading table → tampil halaman dept yang identik strukturnya dengan Dashboard Saya User:
- **Dept Info Header**: Department · Total User · Total KPI · vs Company Score · KPI Merah · Periode (mirip kpiSummaryHeader)
- **Summary Bar**: row bulan Jan–Des dengan total score MTD per bulan, color-coded
- **KPI Table**: kolom bulan (s/d bulan aktif), Actual MTD + Ach% + Score per KPI per bulan, Total Score row di bawah
- Sticky columns: Perspektif + Nama KPI
- Perspektif dikelompokkan (Financial/Customer/IP/L&G)
- YTD Ach% + Score di kolom terakhir

---

### v4.2 — Table Column Reorder + Clickable Months + Year Toggle All Features + CS Mirror CEO

**A. Conflict check:** All changes isolated. `deptViewMonthIdx` terpisah dari `viewMonthIdx`. CS CEO-mirror reuses same render functions.

**B. Perubahan:**

**1. KPI Builder Table — Deskripsi/Parameter dipindah antara Nama KPI dan UoM:**
`Perspektif | Strategic Obj. | Nama KPI | Deskripsi/Parameter | UoM | Type | Periode | Bobot | Target | Formula MTD | Formula YTD | Status | Aksi`

**2. CEO Dept Drill-Down — Clickable Months (Dashboard Saya style):**
- State baru: `let deptViewMonthIdx = CURRENT_MONTH_IDX`
- Summary bar month tabs: klik bulan → `deptViewMonthIdx` update → seluruh tabel KPI + score header update untuk bulan tersebut
- Month header di KPI table juga clickable + highlight bulan aktif dengan ●
- Tidak ada "vs Company Score" di dept header
- Dept header: Department · Total User · Periode Aktif · Total KPI · KPI Merah · KPI Kuning

**3. Strategy Map & Laporan Strategis — Year Toggle:**
- Strategy Map: toggle `execViewYear` dengan 🔓⏮⏭ legend, tampil di atas company banner
- Laporan Strategis: toggle tahun + Periode dropdown otomatis tampilkan bulan untuk tahun terpilih + Scope dropdown dari USER_MASTER depts + checklist konten laporan

**4. CS Mirror CEO — Section "CEO View" di Bottom CS Nav:**
- Divider: `──── CEO View ────` (rendered sebagai section header non-clickable)
- Executive Dashboard (sama persis dengan CEO)
- Strategy Map (View) = read-only, sama dengan CEO
- Laporan Strategis = sama dengan CEO
- Divider rendering: `item.id === 'divider'` → `<div>` bukan `<button>`

**5. Year Toggle ditambahkan di semua fitur relevan:**
- ✅ Executive Dashboard (execViewYear)
- ✅ Monitoring Dashboard (execViewYear)
- ✅ Strategy Map (execViewYear via smYearToggle)
- ✅ Laporan Strategis (execViewYear via repYearToggle)
- ✅ Dept Drill-Down (execViewYear via yearToggle, deptViewMonthIdx untuk bulan)

---

### v5.0 — Audit vs Implementasi React Aktual (2026-07-10)

> **Catatan arsitektur penting**: Changelog v3.0–v4.4 di atas ditulis untuk sebuah mockup HTML/JS monolitik (satu file, template literal, fungsi global seperti `renderExecutiveDashboard()`, `window.csSelectNode()`, `window._treeKeys[]`, state global `let ACTIVE_PLAN_YEAR`). Repo yang sedang berjalan sekarang (`kpi-react-app`) adalah **aplikasi React modular** (Vite, komponen per halaman, `KPIContext`) — arsitektur berbeda total dari yang dideskripsikan di changelog historis. Changelog v3.0–v4.4 tetap disimpan sebagai **riwayat keputusan produk** (scope fitur, formula, urutan field, dsb. — ini semua masih valid), tapi detail teknis (nama fungsi, `window.*`, template literal) **tidak lagi relevan** dan tidak boleh dijadikan acuan implementasi. Mulai v5.0, status "Implemented/Partial/Missing" mengacu ke kode React aktual di `src/`.

**Status per Section (audit 2026-07-10):**

| Section | Status | Catatan |
|---|---|---|
| 3 — Role model (auto-approval by subordinate) | ✅ Implemented | `Sidebar.jsx`, `Approval.jsx`, `Team.jsx`. CEO comment-toggle (Sec 3) belum ada. |
| 4 — Atribut KPI | ⚠️ Partial | Semua atribut ada termasuk `userShowSO()` **kecuali** Target Flat/Custom — skema data hanya punya 1 field `target` scalar, belum ada mode distribusi per-periode. |
| 5 — Formula & Skoring | ✅ Implemented | `helpers.js` — dual threshold, DIRECT/RATIO, LAST/SUM/AVG, Total Score bands — semua match spec persis. |
| 6 — Workflow & Locking | 🔴 Partial/Divergent | Weight-100% gate ✅. Month-lock ✅. **PICA mandatory-gate SEBELUM submit Actual TIDAK di-enforce** (tombol submit tidak pernah disabled walau PICA kosong) — pelanggaran Sec 6.2/9.1. Revisi maks-3x → Pending Mediation **belum terhubung** ke data nyata (Mediation.jsx pakai mock array terpisah, tidak terhubung ke Approval.jsx). |
| 8/12 — 18 Screens | ⚠️ Partial | 17/18 ada. **Login page tidak ada** — ganti role saat ini via dropdown demo di Topbar, bukan flow login sungguhan. |
| 9 — PICA | 🔴 Divergent | Struktur tabel & visibility matrix sudah sesuai, kolom "Situasi" auto-fill ditampilkan sebagai badge bukan kolom tabel (minor). **Gap utama**: gate mandatory di #6 belum jalan. |
| 10 — Dashboard Design | ✅ Implemented | Table/Card toggle, sticky columns, Total Score row, viewMonthIdx vs CURRENT_MONTH_IDX, 3 tema — semua ada. |
| 11 — Design Tokens & RBAC | 🔴 Partial/Divergent | Design tokens (`tailwind.config.js`) match persis. **RBAC hardcoded** (`currentRole === 'user'` dsb.) — bukan `hasPermission('module','action')` seperti disyaratkan Sec 11.3. |
| v4.4 — 3-Source Cascade | ✅ Fixed 2026-07-10 | `Planning.jsx` kini membaca `kpis`/`sos`/`users` langsung dari `KPIContext` (bukan `CS_KPI_LIBRARY`/`SO_LIST`/`USER_MASTER` static). `getCascadedKPIs()` mengimplementasikan ketiga sumber cascade: Company→`cascade_depts`, Dept→`owner_name`, Individual→`owner_name`. Badge mandatory dinamis per sumber (`cascadeLabel()`). Diverifikasi end-to-end via Playwright: KPI baru dibuat di KPI Builder (CS) langsung muncul di Planning form User tanpa reload. |
| Multi-Year Support | ✅ Implemented | `ACTIVE_PLAN_YEAR`/`viewYear`/read-only historical banner — sesuai spec v3.3. |

**Backlog prioritas (diurutkan berdasarkan risiko bisnis):**
1. ✅ **Selesai 2026-07-10** — ~~Sambungkan `Planning.jsx` ke `KPIContext`~~ — lihat baris "3-Source Cascade" di atas.
2. ✅ **Selesai 2026-07-10** — Enforce PICA mandatory-gate sebelum submit Actual (Sec 6.2/9.1). `ActualInput.jsx` kini menghitung `unfilledKpis` & `redKpisMissingPica` (memperhitungkan draft yang belum di-"Simpan" juga) dan men-disable tombol "Submit Semua Actual KPI ke Superior" + menampilkan banner merah berisi nama KPI yang menghalangi, sampai kondisi terpenuhi. Diverifikasi via Playwright: tombol disabled → diisi PICA lengkap (PI+CA+Deadline+PIC) → tombol enabled.
3. ✅ **Selesai 2026-07-10** — Hubungkan Request Revision counter (maks 3x) ke Pending Mediation queue secara live. `KPIContext` kini punya state `batches` (seed dari `APPROVAL_BATCH_DATA` di `mockData.js`) + fungsi `actOnBatch(id, action, note, actor)`. `Approval.jsx`: setiap klik "Request Revision" increment `revisi`; begitu mencapai 3x, `status` otomatis `'Pending Mediation'`, batch terkunci dari aksi Superior dan tombol Approve/Reject/Request Revision hilang diganti banner. `Mediation.jsx`: queue CS membaca batch dengan `status==='Pending Mediation'` langsung dari context yang sama (bukan `MEDIATION_DATA` terpisah lagi) — Approve/Reject (Final) dari sana memanggil `actOnBatch` yang sama, dan hasilnya langsung sinkron kembali terlihat di Approval Queue. Diverifikasi end-to-end via Playwright (7/7): batch di-trip ke mediasi via 3x klik, muncul live di CS Mediation Queue, diresolve, dan status "Approved" konsisten terlihat kembali di Approval Queue.
4. 🟢 **Menengah** — Tambah mode Target Flat/Custom ke skema KPI + form Planning/KPI Builder.
5. 🟢 **Menengah** — Migrasi RBAC dari hardcoded role-check ke `hasPermission('module','action')`.
6. ⚪ **Rendah** — Tambah halaman Login sungguhan (saat ini demo role-switcher masih dianggap acceptable untuk tahap simulasi).
7. 🔴 **Kritis (baru ditemukan saat implementasi #1)** — Disconnect data yang sama ternyata lebih luas dari dugaan awal: **hampir semua halaman User/CEO** (`Approval.jsx`, `ActualInput.jsx`, `History.jsx`, `Team.jsx`, `Dashboard.jsx`, `Sidebar.jsx`, `Executive.jsx`, `Monitoring.jsx`, `Reports.jsx`, `Mediation.jsx`, `WindowSetting.jsx`) masih import `USER_MASTER`/`KPI_DATA`/`TEAM_KPI_DATA`/`DEPT_KPI_DATA` **statis** dari `mockData.js`, bukan dari `KPIContext`. Hanya modul Master Data (KPIBuilder, MasterSO, MasterUOM, MasterUser, StrategyMap) yang sudah live via context. Dampak: jika CS menambah user baru di Master Data User, user itu **tidak akan muncul** di daftar subordinate Approval Queue/Performa Tim manapun — gap yang sama persis dengan #1, hanya untuk entity User bukan KPI. Belum dikerjakan — perlu keputusan scope sebelum eksekusi (lihat catatan di bawah).

---

### v4.4 — KPI Cascade 3-Source Architecture (Company→Dept→Individual)

**A. Conflict check:** `getCascadedKPIs` diperluas — backward compatible, Planning form tetap membaca dari source yang sama. KPI Builder form panels diupdate per node type tanpa conflict ke CS_KPI_LIBRARY CRUD.

**B. Arsitektur Cascade 3 Source (Final):**

| Source | Siapa yang define | Trigger | Muncul di Planning |
|---|---|---|---|
| **Company → Cascade** | CS, di node Company | Centang checkbox dept di form | User di dept yang dicentang |
| **Dept Level** | CS, di node Dept | Otomatis (no config needed) | Semua user di dept tersebut |
| **Individual** | CS, di node User | Otomatis (no config needed) | Hanya user spesifik tsb |

**getCascadedKPIs(dept, userName)** — 3 filter:
1. `owner_type==='company' && cascade_depts.includes(dept)` → Company cascade
2. `owner_type==='dept' && owner_name===dept` → Dept mandatory
3. `owner_type==='user' && owner_name===userName` → Individual mandatory

**KPI Builder form — info panel per node level:**
- 🏢 Company node: checkbox multi-select 15 dept (explicit selection)
- 🏬 Dept node: `✓ Auto-Mandatory — Dept Level` (hijau) + list user terdampak
- 👤 Individual node: `👤 Auto-Mandatory — Individual` (amber) + nama user

**KPI Builder node header bar:**
- Company: "KPI Company: pilih dept target cascade → Mandatory di Planning form user dept"
- Dept: "KPI Dept Level: otomatis Mandatory untuk N user (nama-nama)"
- Individual: "KPI Individual: otomatis Mandatory untuk [nama user] saja"

**KPI Builder table badges:**
- `🔗 Cascade — N dept` (biru) — Company KPI dengan cascade
- `✓ Mandatory semua user dept` (hijau) — Dept level KPI
- `👤 Mandatory individual` (amber) — Individual level KPI

**Planning form badge:**
- Badge dinamis: `🔗 [getCascadeSourceLabel(k, dept)]`
- Company→Cascade: "Company → Cascade ke Dept"
- Dept: "Mandatory Dept Level (nama dept)"
- Individual: "Mandatory Individual"

---

### v5.1 — Master Data User Fix (Dept/Job Position/Branch) + Excel Upload Fix + SO Multi-Dept Cascade (2026-07-10)

**A. Conflict check:**
- `MASTER_DEPT` sebelumnya berisi `'Company'` sebagai salah satu Dept — ini keliru: `'Company'` adalah root node di KPI Builder org tree (bukan Dept sungguhan tempat karyawan ditempatkan), sementara data HR resmi user (`Template_master_user_KPI_System.xlsx`) memakai `'BOD'` untuk unit Direksi. Akibatnya dropdown Dept di Master Data User tidak pernah bisa menampilkan/memilih `'BOD'` — persis keluhan user. Diperbaiki dengan mengganti `'Company'` → `'BOD'` di `MASTER_DEPT`. Semua pemakaian `MASTER_DEPT.filter(d => d !== 'Company')` di `KPIBuilder.jsx`/`StrategyMap.jsx`/`MasterSO.jsx` otomatis jadi no-op yang aman (tidak breaking).
- `MASTER_POSITION` sebelumnya flat list 26 posisi tanpa keterkaitan ke Dept — tidak cascading, dan tidak mencakup ~90 posisi resmi di template HR. Diganti dengan `MASTER_POSITION_BY_DEPT` (map Dept → array posisi, sesuai template HR by user), `MASTER_DEPT` sekarang diturunkan dari `Object.keys(MASTER_POSITION_BY_DEPT)` agar selalu sinkron (single source of truth).
- Fix ini murni data-model correction, tidak conflict dengan cascade KPI/SO existing.

**B. Perubahan menyeluruh:**

**1. Master Data User — Dept → Job Position cascading:**
- `MasterUser.jsx`: dropdown Job Position sekarang hanya menampilkan posisi yang valid untuk Dept terpilih (`positionsFor(dept)`), baik di baris Edit maupun baris Tambah. Saat Dept diganti dan posisi lama tidak valid untuk Dept baru, otomatis reset ke posisi pertama yang valid (`onDeptChange` helper).
- Level KPI dropdown sekarang pakai label deskriptif sesuai template HR (`MASTER_LEVEL_KPI`): "Individual (Kapabilitas Otomatis: User biasa)", "Dept. (Kapabilitas: +Approval Queue +SO Field)", "Company (Kapabilitas: +Approval Queue +SO Field)" — value tersimpan tetap `Individual`/`Dept`/`Company`.

**2. Upload Excel Master Data User — root cause & fix:**
- **Root cause**: `importMasterUserExcel` hanya mengenali header lowercase sederhana (`name`,`nik`,`dept`,...) dari template internal aplikasi sendiri. Saat user upload **template resmi HR** (`Employee Name`, `Employee ID`, `Dept.`, `Job Position`, `Branch Name`, `Level KPI`, dst — lihat screenshot user), header itu tidak dikenali sama sekali → `r.name` selalu undefined → semua baris ter-skip → toast "Tidak ada user baru untuk diimport". Ditambah, template resmi punya baris judul di atas baris header (bukan langsung header di baris 1), yang tidak di-handle.
- **Fix**: `excel.js` sekarang punya `HEADER_ALIASES` (mapping banyak variasi nama kolom → field internal) + `findHeaderRowIndex()` yang men-scan beberapa baris pertama untuk menemukan baris header sungguhan (bukan asumsi selalu baris 1). Cell "Level KPI" dengan label deskriptif (mis. "Individual (Kapabilitas Otomatis: User biasa)") di-parse otomatis ambil token sebelum "(" saja. Baris placeholder "dropdown" (hint Excel data-validation) otomatis di-skip.
- Diverifikasi via Playwright: upload file bertajuk header resmi HR (title row + header row + dropdown-hint row + 2 data row) → 2 user berhasil ter-import dengan Dept/Level terparse benar.

**3. Master Strategic Objective — Cascade SO Company ke banyak Dept sekaligus:**
- `MasterSO.jsx`: saat Level SO = Company, muncul checkbox multi-select Dept ("🔗 Cascade sekaligus ke Dept — opsional"). Simpan SO Company **sekaligus** membuat SO Dept Level turunan untuk tiap Dept yang dicentang (nama & perspektif sama, `parentId` otomatis ter-link) — tidak perlu lagi input manual satu-satu per Dept.
- Saat edit SO Company yang sudah ada, checkbox Dept yang sudah punya turunan otomatis tercentang; centang Dept baru → tambah turunan baru (uncheck tidak menghapus otomatis, untuk mencegah kehilangan data tidak sengaja — hapus turunan tetap manual lewat tombol Hapus per baris).

**4. KPIContext — hardening CRUD (prasyarat #3):**
- Semua `addX`/`updateX`/`deleteX` (`users`,`sos`,`uoms`,`kpis`) diubah ke functional state updater (`setX(prev => ...)`) — sebelumnya pakai closure `[...state, ...]` yang bisa saling menimpa kalau dipanggil berkali-kali secara sinkron dalam satu handler (persis kasus cascade SO ke N Dept sekaligus). Id generator (`genId`) juga ditambah komponen random agar tidak collide saat beberapa `addX()` terjadi dalam milidetik yang sama.

**Diverifikasi end-to-end via Playwright (8/8):** Dept dropdown berisi BOD bukan Company; Job Position ter-cascade benar untuk Dept IT & HRGA; Level KPI tampil label deskriptif; upload template resmi HR berhasil import 2 user dengan data terparse benar; SO Company dengan 2 Dept dicentang otomatis membuat 2 SO Dept Level ter-link.

**Belum dikerjakan — pertanyaan terbuka (lihat Section 17):** Item #4 dari user — "di mana mengelola KPI Company Level dari Planning s.d. Actual" — adalah pertanyaan desain, bukan bug. Lihat Section 17 untuk analisis & rekomendasi.

---

## 17. Open Design Question — KPI Company Level: Planning s.d. Actual (2026-07-10)

**Pertanyaan user**: "Dimana saya bisa mengelola KPI Company Level dari mulai planning s.d dinput realisasi (Actual)?"

**Temuan**: Saat ini **tidak ada** jalur di aplikasi untuk input Planning/Actual KPI Company Level secara langsung:
- KPI dengan `owner_type: 'company'` di KPI Builder (mis. "Revenue Growth" Company level, target 100%, weight 35%) hanya berfungsi sebagai **sumber cascade** ke Dept yang dicentang — bukan entitas yang punya Planning/Actual instance-nya sendiri.
- User dengan `level: 'Company'` (saat ini: Hendra Wijaya, Direktur Utama, dept BOD) tidak mendapat akses ke halaman Input Planning KPI / Input Realisasi (Actual) — menu tersebut hanya ada untuk role `user`, dan role `ceo` (yang biasanya dipakai Hendra) hanya punya Executive Dashboard, Strategy Map, Laporan.
- Dept 'BOD' juga tidak pernah muncul di `cascade_depts` KPI manapun (wajar — BOD bukan target operasional cascade).

**Rekomendasi (best practice BSC/Corporate Performance Management)**: KPI Company Level **seharusnya bersifat agregat/roll-up otomatis** dari KPI Dept yang sudah Approved/Locked — bukan input manual terpisah. Ini konsisten dengan Section 6.3 brief ("Data Locked = read-only, menjadi sumber resmi agregasi Dept/Company") dan menghindari double-entry serta risiko data Company-level tidak sinkron dengan angka Dept di bawahnya. Executive Dashboard & Monitoring Dashboard CS **secara desain** adalah tempat CS/CEO melihat skor Company — bukan tempat input manual.

**Gap implementasi saat ini**: Agregasi ini **belum computed secara live** — Executive Dashboard masih baca `DEPT_MONITORING`/`DEPT_KPI_DATA` statis (bagian dari disconnect data yang lebih luas, lihat item #7 di Section 16), bukan dihitung dari data Actual Dept yang sungguh di-submit/di-approve.

**Keputusan user (2026-07-10)**: Company-level KPI = **agregasi otomatis dari Dept** (bukan form input terpisah). Sudah dikerjakan sebagian — lihat v5.2 di bawah.

### v5.2 — Company/Dept Score: dari Angka Statis Terpisah → Agregasi Live dari KPI Data (2026-07-10)

**A. Conflict check:** Saat investigasi, ditemukan bug nyata yang jadi bukti kenapa fix ini penting: `Executive.jsx` & `Monitoring.jsx` sama-sama sudah punya 2 sumber data per Dept — `DEPT_MONITORING` (angka `totalScore` statis) dan `DEPT_KPI_DATA` (data KPI mentah per Dept, factor1/factor2 per bulan). Selama ini **kedua sumber itu tidak sinkron**: tabel ringkasan menampilkan `d.totalScore` (statis), sementara tabel drill-down BSC menghitung skor live dari `d.kpis` — sehingga skor Dept yang sama bisa tampil **berbeda** di ringkasan vs drill-down. Month-selector di Monitoring Dashboard juga ternyata **tidak berfungsi** (state berubah tapi tidak ada perhitungan yang membacanya).

**B. Perubahan menyeluruh:**
- `helpers.js`: fungsi `deptScoreAt(kpis, mi)` (Total Score weighted untuk sekumpulan KPI di bulan tertentu) dipindah jadi shared export — sebelumnya duplikat lokal di `Executive.jsx` saja.
- `Executive.jsx`: `companyScore` & skor per-Dept di tabel Cascading Achievement sekarang **selalu dihitung live** via `deptScoreAt(d.kpis, m)` — tidak lagi baca `d.totalScore` statis. CPI (Corporate Performance Index) otomatis jadi rata-rata skor Dept yang genuinely computed, bukan angka terpisah.
- `Monitoring.jsx`: sama — `d.score` dihitung live, dan **month-selector sekarang benar-benar berfungsi** (`viewMonth` disalurkan ke `deptScoreAt`, `redCount`, `gradeDistribution`, dan drill-down KPI table — sebelumnya semua pakai konstanta `CURRENT_MONTH_IDX` yang diam).

**Diverifikasi via Playwright (3/3):** skor Finance di tabel ringkasan Monitoring = persis sama dengan skor di drill-down (3.00 = 3.00, sebelumnya berpotensi beda); ganti bulan Jan↔Feb di Monitoring mengubah Company Score (2.09 vs 2.46, sebelumnya statis tidak berubah); CPI Executive Dashboard (2.46) = rata-rata persis dari 4 skor Dept yang ditampilkan di tabel Cascading Achievement (Finance 3.00, Sales & Marketing 2.65, Operations 2.20, Human Capital 2.00).

**Catatan scope**: `DEPT_KPI_DATA`/`DEPT_MONITORING` (submitted/approved/pending count) itu sendiri **masih data statis/demo** — agregasi yang dihitung sudah benar secara formula, tapi belum tersambung ke Actual sungguhan yang di-submit User (itu bagian dari item #7 di Section 16, belum dikerjakan). Fix v5.2 ini murni memastikan **konsistensi & kebenaran formula agregasi** dari data yang sudah ada di tiap halaman.

---

### v6.0 — Fondasi Data Live: User → Dept → Company (2026-07-10)

**Konteks**: User bertanya "apakah data actual ditarik dari Dept level?" — jawabannya saat itu TIDAK, secara end-to-end. Dept→Company sudah live (v5.2), tapi User→Dept sama sekali belum tersambung: `ActualInput.jsx` menulis ke dataset generik `KPI_DATA` yang sama untuk siapa pun yang login dan **tidak pernah tersimpan** (hilang saat refresh). Item #7 (disconnect data yang lebih luas) dieksekusi penuh untuk jalur Planning→Actual→Dept→Company.

**A. Conflict check:** Perubahan ini menyentuh hampir semua halaman User (Planning/ActualInput/Dashboard/History/Team) sekaligus CS (Monitoring/Executive/Reports) — scope besar tapi tidak conflict, karena semuanya konvergen ke satu data model baru yang sudah disiapkan fondasinya di v5.1/v5.2 (`KPIContext`, `buildDeptAggregates`).

**B. Perubahan menyeluruh — arsitektur data baru:**

1. **`KPIContext.userKPIs`** (baru): sumber tunggal KPI (Planning + Actual dalam satu entity) per User, menggantikan trio lama yang saling asing (`KPI_DATA` generik, `TEAM_KPI_DATA` per-nama, `DEPT_KPI_DATA` per-Dept — ketiganya sudah **dihapus**, tidak dipakai lagi). CRUD: `addUserKPI`, `updateUserKPI`, `deleteUserKPI`, `submitUserKPIStatus`.
2. **`Planning.jsx`**: "Simpan Draft"/"Submit Semua" menulis langsung ke `userKPIs[currentUserName]` via context (bukan state lokal yang hilang saat pindah halaman).
3. **`ActualInput.jsx`**: tombol "Simpan" per-KPI dan "Submit Semua Actual KPI" sekarang **benar-benar menulis** Factor1/Factor2 (dan PICA, sebagai `k.pica[bulan]`) ke context — tidak hilang saat refresh. Gate PICA (v5.0) tetap berlaku, sekarang berbasis data live.
4. **`Dashboard.jsx`**: baca `userKPIs[currentUserName]` langsung — Planning & Actual otomatis satu entity (tidak perlu merge 2 dataset terpisah lagi seperti sebelumnya).
5. **`History.jsx`**: baca `batches` dari context (sumber sama dengan Approval Queue/Mediation) — status riwayat otomatis sinkron begitu Superior/CS bertindak, bukan data statis terpisah yang sama untuk semua user.
6. **`Team.jsx`**: baca `userKPIs[namaSubordinate]` — Performa Tim menampilkan data Actual sungguhan milik anggota tim.
7. **`buildDeptAggregates(users, userKPIs, batches, bulan)`** (helper baru, `helpers.js`): menghitung Dept dari **Dept sungguhan** (`users.map(u => u.dept)`, bukan lagi nama Dept fiktif seperti "Sales & Marketing"/"Operations" yang tidak match struktur org NLG), mengagregasi KPI Approved/Locked milik semua user di Dept itu, dan menghitung submitted/approved/pending dari `batches` sungguhan. Dept tanpa KPI (BOD) otomatis tidak tampil — bukan dipaksa skor 0.
8. **`Monitoring.jsx`, `Executive.jsx`, `Reports.jsx`**: semua pakai `buildDeptAggregates` — Company Score sekarang **genuinely** agregat dari Actual yang di-submit User, bukan data demo terpisah.
9. **`Approval.jsx`**: Approval Queue sekarang difilter ke subordinate milik Superior yang login saja (`users.filter(u => u.superior === currentUserName)`) — sebelumnya semua Superior melihat semua batch, terlepas apakah itu timnya atau bukan.
10. **`Sidebar.jsx`**: badge "Approver" & unlock menu Approval Queue/Performa Tim sekarang baca `users` dari context — CS tambah subordinate baru via Master Data User langsung ter-refleksi tanpa perlu ubah kode.

**Keputusan desain — Hendra Wijaya (BOD):** `userKPIs['Hendra Wijaya'] = []` — konsisten dengan keputusan "KPI BOD = Company" (dikonfirmasi user di chat). `ActualInput.jsx`/`Planning.jsx` menampilkan empty-state yang jelas ("Belum ada KPI Approved/Locked...") bukan crash, untuk user manapun yang belum/tidak punya KPI personal.

**Diverifikasi end-to-end via Playwright (8/8)** — skenario inti yang membuktikan rantai data nyata:
1. Baseline: Finance dept score = 3.00, Company score = 2.36 (real depts: Sales Traditional Market, Finance Accounting & Tax, Supply Chain, Corporate Strategy — BOD tidak tampil karena tanpa KPI).
2. Rian Pratama (Finance) login sebagai User, edit Factor 1 "Budget Variance" bulan Feb dari 100 → 50, klik Simpan.
3. Nilai **persisten** ke `KPIContext.userKPIs` (dikonfirmasi baca langsung dari localStorage).
4. CS buka Monitoring Dashboard: skor Finance **turun** 3.00 → 2.30 (persis sesuai perhitungan manual — score KPI itu jatuh dari 3/Baik ke 1/Kurang karena achievement di bawah 80%), Company Score ikut turun 2.36 → 2.19.
5. Executive Dashboard (CEO view) menunjukkan CPI **identik** dengan Monitoring (2.19) — satu sumber data, bukan dua angka yang bisa berbeda seperti sebelum v5.2.
6. Team Performa Tim (login sebagai Budi Santoso, superior Rian) menampilkan nilai Actual terbaru Rian (50.0%) — bukan data statis TEAM_KPI_DATA yang beku.
7. Riwayat Submission (login sebagai Rian) menampilkan batch live dari `KPIContext.batches` — sumber sama dengan Approval Queue.

**Backlog tersisa (Section 16, diperbarui):**
- Item #7 (disconnect data luas) — **selesai untuk jalur inti** (Planning/Actual/Dashboard/History/Team/Monitoring/Executive/Reports/Approval/Sidebar). Sisa: `KPIBuilder.jsx` cascade KPI (`kpis` context) masih terpisah dari `userKPIs` — artinya KPI yang di-cascade dari KPI Builder ke Planning User (v5.1) belum otomatis membuat instance di `userKPIs` saat User mem-Planning-kan-nya; User tetap harus input manual di form Planning meski KPI-nya "Mandatory". Ini penyederhanaan yang disengaja untuk sesi ini — instance KPI baru tetap dibuat lewat form Planning biasa, cascade hanya menentukan KPI mana yang WAJIB muncul.
- Section 6.1 "Read-only historical year" (Planning/ActualInput saat `viewYear !== ACTIVE_PLAN_YEAR`) masih menampilkan data tahun aktif sebagai representasi (belum ada snapshot per-tahun sungguhan) — scoping deliberate, bukan bug baru.
- ~~3 guardrail BOD~~ — **selesai** (lihat v6.1 di bawah).

---

### v6.1 — Guardrail BOD = Company Aggregate (2026-07-10)

Melengkapi keputusan "KPI BOD = Company" (Section 17) dengan guardrail UI supaya kebijakan ini konsisten tercermin di seluruh aplikasi, bukan cuma di data seed:

1. **KPI Builder** — saat node Dept "BOD" atau node User dengan `level: 'Company'` dipilih, tombol "+ Tambah KPI" disembunyikan dan diganti banner "🏢 KPI BOD = Agregasi Company" — mencegah CS membuat KPI individual/Dept redundan untuk BOD.
2. **Dashboard Saya** — user dengan `level: 'Company'` dan tanpa KPI personal (Hendra Wijaya) melihat pesan panduan "KPI Anda = Agregasi Company" yang mengarahkan ke Executive Dashboard, bukan tabel BSC kosong yang membingungkan.
3. **Master Data User** — baris user dengan `level: 'Company'` mendapat badge "🏢 KPI = Company Aggregate" sebagai penjelasan kenapa user ini tidak akan pernah punya KPI di KPI Builder.

**Diverifikasi via Playwright (6/6)**: badge Master Data User tampil untuk Hendra Wijaya; banner KPI Builder tampil konsisten baik di node Dept "BOD" maupun node User "Hendra Wijaya"; tombol "+ Tambah KPI" benar-benar hilang untuk node BOD; Dashboard Saya Hendra menampilkan pesan panduan; dan sebagai sanity check, Dashboard Dewi Anggraini (level Individual) tetap normal menampilkan KPI-nya sendiri (Total Score MTD Feb = 2.80, cocok dengan hasil perhitungan manual di v6.0).

---

### v6.2 — SO Dropdown Scoping Fix + ORG Tree BOD Simplification (2026-07-12)

Revisi dari screenshot simulasi user atas 2 temuan di layar KPI Setup/Builder → form "Tambah KPI Baru".

**A. Conflict check:**
- Node "BOD" **tidak dihapus** dari Org Tree meski diusulkan user — akan konflik dengan: (1) Master Data User yang butuh nilai Dept "BOD" sebagai data HR asli Hendra Wijaya (fix v5.1), (2) guardrail "KPI BOD = Agregasi Company" (v6.1, sudah terverifikasi 6/6) yang butuh node ini sebagai entry point klik. Solusi: node dipertahankan tapi disederhanakan (lihat B.1).
- Perubahan scoping `activeSOs` murni lokal ke `KPIBuilder.jsx` (variabel tidak dipakai file lain) — tidak conflict dengan Planning form (`s.level==='Dept' && s.dept===userMeta.dept`, sudah benar sejak v3.6) atau Strategy Map (`s.level==='Company'`, sudah benar). Hanya KPI Builder yang belum ikut pola ini sebelum fix ini.

**B. Perubahan menyeluruh:**

**1. ORG Tree — BOD disederhanakan (bukan dihapus):**
- Label awal direlabel jadi "BOD / CEO (Company Level)", lalu diusulkan diringkas jadi "Company Level (BOD/CEO)" — namun user mengoreksi (2026-07-12, revisi ke-2): di sidebar tree yang sempit (`w-56`, truncated), label "Company Level ..." tepat di bawah root "PT Niagamas Lestari Ge..." terbaca seperti **2 level company yang bersaing/duplikat** — concern UX konkret yang lebih valid daripada argumen konsistensi penamaan sebelumnya. **Keputusan final: label tree = "CEO"** (singkat, tidak ambigu dengan root). Konteks "Dept: BOD" & "KPI = Agregasi Company Level" dipindah ke **tooltip badge 🏢** (`title="Dept: BOD (Direktur Utama) — KPI = Agregasi Company Level, bukan Dept tersendiri"`) dan tetap dijelaskan lengkap di banner guardrail saat node ini dipilih — jadi penjelasan tidak hilang, hanya tidak lagi memenuhi label utama.
- Child individual "Hendra Wijaya (Direktur Utama)" di bawah node BOD **disembunyikan dari tree** (bukan dihapus dari data `USER_MASTER`) — karena node Dept BOD dan node User Hendra menampilkan banner guardrail yang identik (v6.1), mengklik salah satu dari 2 titik itu 100% redundan. Sekarang cukup 1 titik akses.
- Badge 🏢 ditambahkan di baris BOD (menggantikan tampilan "—"/opacity abu-abu yang tadinya dipakai utk "dept kosong tanpa user" — salah makna untuk BOD karena BOD sebenarnya PUNYA user, cuma sengaja tidak diekspansi).

**2. KPI Builder Form — SO Dropdown discope per node (root cause fix duplikat):**
- **Bug ditemukan**: `activeSOs = sos.filter(s => s.active)` mengambil SEMUA SO aktif tanpa filter level/dept — sehingga SO Company & seluruh SO Dept hasil cascade (nama sama, `id` beda per dept — lihat `MasterSO.jsx` `addMissingCascades`) tampil bersamaan & terlihat dobel di dropdown "2. Strategic Objective". Ini regresi terhadap desain v3.6/v3.8 yang sudah menetapkan SO Company hanya utk Strategy Map dan SO Dept discope per dept.
- **Fix**: `activeSOs` sekarang difilter sesuai node yang dipilih — node Company → hanya SO `level==='Company'`; node Dept → hanya SO `level==='Dept'` milik dept tsb (`s.dept === selectedNode`). Selain menghilangkan duplikat, ini juga menutup celah salah-assign (CS sebelumnya bisa memilih SO milik dept lain untuk KPI dept yang sedang dikerjakan).

**3. KPI Builder Form — Checkbox "Cascade ke Dept" exclude BOD (temuan tambahan saat audit holistik):**
- Ditemukan checkbox cascade Company KPI (`MASTER_DEPT.filter(d => d !== 'Company')`) masih menyertakan **BOD** sebagai opsi dept target — inkonsisten dengan pernyataan Section 17 ("Dept 'BOD' tidak pernah muncul di cascade_depts KPI manapun — BOD bukan target operasional cascade") dan berpotensi menghasilkan cascade mandatory ke BOD yang tidak akan pernah bisa dipenuhi (node BOD di-guard, tidak bisa punya KPI dept sendiri). Fix: `MASTER_DEPT.filter(d => d !== 'Company' && d !== 'BOD')`.

**Catatan**: Data SO yang sudah kadung tersimpan di `localStorage` (`kpi_sos`) tidak diubah — fix ini hanya mengoreksi *filter tampilan* di dropdown, bukan menghapus/menggabungkan record SO manapun.

---

### v6.3 — Akun Simulasi dari 10 User Ter-upload + Fix Crash Planning (2026-07-12)

User telah meng-upload 10 user riil via Master Data User (Excel), menggantikan 5 akun mock lama (Dewi Anggraini, Rian Pratama, Siti Lestari, Budi Santoso, Hendra Wijaya). Data disimpan di `localStorage` (`kpi_users`) — bukan perubahan pada seed `mockData.js`. 10 user: Indri Wahyuningrum (Corporate Strategy Officer), Abu Tholib (Head of HRGA), Eko Kurniawan (Recruitment), Gracecilia Tasya Chintiago (Jr. Recruitment Specialist), Mathilda Paulin Jokohael (Comben), Morren Andriyanto (Head of Sales Area 1), Rizaldi Faisal (Account Executive), I Gede Ari Raditya & Aditya Pratama (Sales Account Executive), Andrian Hartono (Direktur Utama/CEO, dept BOD).

**A. Conflict check:**
- Tidak ada field `role` (user/cs/ceo) di data model User — role login simulasi diturunkan dari field yang sudah ada (`level`, `dept`), bukan field baru. Tidak conflict dengan `level` (Individual/Dept/Company) yang tetap dipakai murni untuk keperluan KPI Builder/SO field, terpisah dari role login.
- Ditemukan **bug pre-existing tak terkait revisi ini**: `Planning.jsx` crash (`ReferenceError: cascadedKPIs is not defined`) saat halaman Input Planning dirender — variabel dipakai di JSX (baris 118, 122, 126, 194) tapi tidak pernah didefinisikan. Ini akan memblokir simulasi role User untuk ke-8 akun karyawan, jadi diperbaiki sekalian sebelum serah terima ke user untuk simulasi.

**B. Perubahan menyeluruh:**

**1. Topbar — "Login sebagai" jadi 1 dropdown akun nyata (`Topbar.jsx`):**
- Sebelumnya: 2 kontrol terpisah (dropdown Role generik user/cs/ceo + input teks nama bebas) — rawan salah ketik nama & salah pilih role.
- Sekarang: 1 dropdown berisi 10 akun asli dari `KPIContext.users`, dikelompokkan per role hasil derivasi otomatis: `level==='Company'` → **CEO** (Andrian Hartono), `dept==='Corporate Strategy'` → **Corporate Strategy/Super User** (Indri Wahyuningrum), sisanya → **User** (8 karyawan lain). Memilih 1 opsi otomatis set role & nama sekaligus — memastikan hierarki approval (+AQ berdasarkan field `superior`) bekerja benar utk siapa pun yang dipilih.
- Derivasi role berbasis data (bukan hardcode nama) — kalau nanti ada staf Corporate Strategy baru, otomatis masuk grup CS tanpa perlu ubah kode.

**2. Fix crash `Planning.jsx` — `cascadedKPIs` didefinisikan:**
- Ditambahkan sesuai 3 sumber cascade yang sudah didokumentasikan `cascadeLabel()` (baris 6-12) & Sec. 4.4: `kpis.filter(k => k.status==='Active' && ((k.owner_type==='company' && (k.cascade_depts||[]).includes(userMeta.dept)) || (k.owner_type==='dept' && k.owner_name===userMeta.dept) || (k.owner_type==='user' && k.owner_name===userMeta.name)))`.

**Diverifikasi**: dev server HMR reload bersih tanpa error setelah kedua fix (sebelumnya `Planning.jsx` melempar Unhandled Error setiap kali halaman ini dirender).

---

### v6.4 — Semua Field Form KPI Wajib Diisi (2026-07-12)

Permintaan user: form "Tambah KPI Baru" (KPI Builder, diisi CS) dan form Planning KPI (diisi User) — semua field wajib diisi; kalau ada yang terlewat, Simpan otomatis diblokir.

**A. Conflict check:**
- Field yang **hidden secara kondisional** tetap dikecualikan dari validasi wajib, bukan malah dipaksa: Strategic Objective di KPI Builder (`showSOField`, hanya utk node Company/Dept) dan di Planning (`stratObjActive`, hanya utk `level` Company/Dept) — konsisten dengan Sec. 4 Project Brief ("Level Individual/PIC: field ini tidak muncul sama sekali"). Field yang tidak pernah dirender tidak mungkin "terlewat" dan tidak divalidasi.
- Tidak conflict dengan validasi lama (Nama KPI, Perspektif, Bobot, Target yang sudah `required` sebelumnya) — validasi baru superset dari yang sudah ada, bukan menggantikan.

**B. Perubahan menyeluruh (2 form, 1 pola konsisten):**

**1. `KPIBuilder.jsx` (CS admin):**
- `validateForm()` baru — cek 11 field: Perspektif BSC, Strategic Objective (kondisional), Nama KPI, Deskripsi/Parameter, UoM, Type, Periode, Bobot (>0), Target, Formula MTD, Formula YTD. Kalau ada yang kosong, `handleSave` di-block dan toast menyebutkan field mana saja yang belum lengkap — **tidak ada save parsial**.
- Semua label field ditandai `*` dan elemen form diberi atribut `required` (native browser validation sbg lapis pertama, JS `validateForm()` sbg lapis utama dgn pesan toast yang jelas).
- `showSOField` dipindah ke atas (didefinisikan sekali, dipakai baik oleh render maupun `validateForm()`) — sebelumnya dideklarasi 2x di file yang sama (bug duplicate-declaration sempat muncul saat refactor, sudah diperbaiki).

**2. `Planning.jsx` (User):**
- Pola identik: `validateForm()` baru (11 field setara: Perspektif, SO kondisional, Nama KPI, Deskripsi, Tipe, Formula MTD/YTD, Periode, Target, UOM, Bobot >0), dipanggil di `saveDraft()` sebelum `addUserKPI`/`updateUserKPI`. `useToast` ditambahkan ke import (sebelumnya belum dipakai di file ini).
- Sebelumnya hanya Nama KPI yang dicek (`if (!form.name.trim()) return;`, tanpa feedback ke user) — user bisa menyimpan Draft KPI dengan Deskripsi kosong, SO belum dipilih, Target/Bobot kosong. Sekarang semua field tsb wajib.

**Diverifikasi**: dev server HMR reload bersih tanpa error pada kedua file setelah perubahan.

**Koreksi (2026-07-12, sesi sama)**: field Bobot (%) sempat pakai `min="0.01"` tanpa `step` eksplisit — default `step="1"` browser membuat daftar nilai valid jadi 0.01, 1.01, 2.01, ... sehingga input bulat wajar seperti "30" ditolak native validation ("nilai valid terdekat: 29.01 dan 30.01"). Diperbaiki jadi `min="1" max="99" step="1"` di kedua form (`KPIBuilder.jsx` & `Planning.jsx`) — Bobot sekarang free number bulat 1-99, validasi JS (`validateForm`) disesuaikan mengikuti rentang yang sama.

---

### v6.5 — Info Bobot Termasuk Draft (2026-07-13)

User bertanya: di KPI Setup/Builder & Input Planning KPI, apakah bobot KPI yang sudah terinput (status Draft) bisa ditampilkan sbg info saat sedang input? Ditemukan penyebab kebingungan: `KPIBuilder.jsx` sengaja mengecualikan status Draft dari `totalWeight` (`k.status !== 'Draft'`) — kalau CS baru menginput beberapa KPI dan semuanya masih Draft, "Total bobot aktif" selalu 0% tanpa info progres.

**A. Conflict check**: Penghitungan `totalWeight` (Active+Locked saja) **tidak diubah** — itu tetap jadi acuan resmi utk validasi "100% sebelum Active"/publish ke Planning. Yang ditambahkan murni info tambahan di sampingnya, tidak menggantikan logika gating manapun.

**B. Perubahan menyeluruh (2 menu, pola sama):**
- **`KPIBuilder.jsx`**: `draftWeight` & `totalWeightWithDraft` (= totalWeight + draftWeight) ditambahkan. Ditampilkan sbg info tambahan (hanya muncul kalau `draftCnt > 0`, tidak menambah noise saat tidak ada draft) di 2 tempat: baris "Total aktif" dalam form (" · Termasuk Draft: X%") dan footer bar tabel KPI (" · Termasuk N Draft (Y%): Z%").
- **`Planning.jsx`**: `totalWeight` User **sudah** menghitung Draft sejak awal (tidak difilter status) — jadi total di sana sebenarnya sudah termasuk Draft. Ditambahkan `draftWeight` sbg breakdown eksplisit di baris "Total Bobot" (" (termasuk N KPI Draft: Y%)") supaya jelas kelihatan, bukan cuma implisit.

**Diverifikasi**: dev server HMR reload bersih tanpa error pada kedua file.

---

### v6.6 — Fix: KPI Cascade Company Tidak Terlihat Saat Drilldown Dept di KPI Builder (2026-07-13)

User melapor: sudah input KPI Company & cascade ke Dept (checklist "Mandatory" tercentang, badge "🔗 N dept" muncul benar di tabel node Company), tapi saat klik/drilldown ke Dept tsb di Org Tree, KPI yang di-cascade tidak muncul di list Dept — tree malah menampilkan "—" (kesan dept kosong).

**Root cause**: `kpiCountFor()` dan `nodeKPIs` di `KPIBuilder.jsx` hanya mem-filter KPI dengan `owner_type === 'dept'` (KPI yang dibuat LANGSUNG di level Dept) — KPI Company yang di-cascade (`owner_type: 'company'`, terdaftar di `cascade_depts` milik dept tsb) tidak pernah ikut ter-filter ke tampilan Dept manapun. Ini gap yang sama persis dengan yang sempat menyebabkan bug `cascadedKPIs` di `Planning.jsx` (v6.3) — namun di sana sudah benar sejak fix itu; KPI Builder (sisi CS) belum pernah mendapat perlakuan setara.

**A. Conflict check**: KPI cascade **tidak digabung** ke dalam `nodeKPIs` (tabel CRUD dept yang bisa Edit/Hapus) — karena record itu tetap dimiliki & diedit di node Company (owner_type='company'); menggabungnya ke tabel dept berisiko CS mengedit/menghapus KPI Company dari konteks yang salah, dan bobotnya juga tidak ikut dihitung ke `totalWeight` 100% milik Dept (bobot itu sudah bagian dari kuota 100% Company, jangan dobel-hitung).

**B. Perubahan menyeluruh:**
1. `kpiCountFor()` — badge angka di Org Tree sekarang ikut menghitung KPI Company yang di-cascade ke dept tsb, supaya tree tidak lagi tampil "—" utk dept yang sebenarnya sudah menerima cascade.
2. `cascadedToDept` (variabel baru) — saat drilldown ke node Dept, ditampilkan panel read-only baru "🔗 KPI Cascade dari Company (N)" berisi Nama KPI, Perspektif, Target, Bobot, Status, dengan link cepat "PT NLG" utk lompat edit ke node Company (mirror pola yang sama dgn section "KPI Mandatory" di Planning.jsx User).
3. Pesan kosong "Belum ada KPI untuk {dept}" tidak lagi tampil kalau dept sebenarnya sudah punya cascade dari Company (`cascadedToDept.length > 0`) — sebelumnya pesan ini salah tampil meski cascade sudah ada.

**Diverifikasi**: dev server HMR reload bersih tanpa error.

---

### v6.7 — Login CS Hybrid + Strategy Map KPI Count Fix (2026-07-13)

User melaporkan 3 hal dari simulasi akun nyata:

**1. Login sbg Indri Wahyuningrum (Corporate Strategy Officer, role `cs`) tidak dapat menu User (Dashboard Saya, Input Planning, dst.).**
- **Root cause**: `Sidebar.jsx` mendesain role `cs` sebagai murni menu admin (Master SO, KPI Builder, dst.) — padahal CS Officer tetap karyawan yang levelnya "Dept" di Master Data User (bukan "Company" spt CEO), jadi tetap perlu Planning/Actual/Dashboard pribadi. Beda dgn CEO (Andrian Hartono, level "Company") yg memang sengaja TIDAK dapat menu personal (keputusan v6.1 "KPI BOD/CEO = Agregasi Company" — itu tetap berlaku, tidak diubah).
- **Fix**: role `cs` sekarang dapat `NAV_USER_BASE + NAV_USER_APPROVER_EXTRA` (kalau ada subordinate) **ditambah** menu admin CS (bukan menggantikan). `isApprover`, `disabled` (lock icon Approval Queue/Performa Tim), dan footer disclaimer "Tidak ada login Superior terpisah" ikut berlaku utk role `cs` (sebelumnya cuma `user`). `displayName` di sidebar sekarang menampilkan nama asli (bukan cuma label generik "Corporate Strategy") utk role `user`/`cs`, role `ceo` tetap label generik.

**2. Master SO — SO utk Dept "Corporate Strategy" belum terdaftar.**
- **Bukan bug** — Dept "Corporate Strategy" SUDAH selalu jadi opsi valid di dropdown "Berlaku untuk Dept." maupun checkbox cascade (`MASTER_DEPT` sudah termasuk itu). CS (skrg Indri, lewat fix #1 di atas) perlu **mendaftarkan sendiri** minimal 1 SO Dept Level utk "Corporate Strategy" via "+ Tambah SO Dept." — kalau tidak, dropdown Strategic Objective di form Planning pribadinya akan kosong (SO sekarang mandatory sejak v6.4) dan dia tidak akan bisa Simpan Draft KPI.
- **Perbaikan konsistensi sekalian**: dropdown Dept & checkbox cascade di `MasterSO.jsx` dan form SO di `StrategyMap.jsx` sekarang exclude **BOD** (sebelumnya cuma di-exclude di KPI Builder v6.2) — BOD tidak pernah Planning personal, jadi SO Dept Level utk BOD tidak akan pernah terpakai.

**3. Strategy Map — semua kartu SO tampil "0 KPI" walau Master SO sudah benar hitung KPI Terhubung.**
- **Root cause**: `StrategyMap.jsx` punya stub `const kpiCountForSO = () => 0;` — fungsi ini SELALU return 0 apa pun input-nya, tidak pernah disambungkan ke data KPI asli (beda dgn `MasterSO.jsx` yg sudah benar: `kpis.filter(k => k.so === soName).length`).
- **Fix**: disamakan dgn logika Master SO — `kpiCountForSO = (soName) => kpis.filter(k => k.so === soName).length`.
- **⚠️ Temuan terkait, BELUM diperbaiki (perlu keputusan user)**: Score per kartu SO (`soDemoScore`) & Company Score banner (`companyScore = 2.45`) di `StrategyMap.jsx` **hardcoded/pseudo-random** (dihitung dari hash string id SO, BUKAN dari data KPI Actual/Target asli) — jadi walau KPI count sekarang benar, angka skornya masih demo/palsu. Menyambungkannya ke skor real (agregasi dari Actual KPI yg sudah di-input & di-approve) adalah pekerjaan terpisah yg lebih besar (perlu keputusan formula agregasi per-SO) — direkomendasikan dibahas & dikerjakan sbg item lanjutan, bukan digabung diam-diam ke fix ini.

**Diverifikasi**: dev server HMR reload bersih tanpa error di semua file (`Sidebar.jsx`, `MasterSO.jsx`, `StrategyMap.jsx`).

---

### v6.8 — Revert Login CS Hybrid + Strategy Map Cascade Diagram (2026-07-13)

**1. Revert "Login CS Hybrid" (v6.7 poin 1) — akun personal HARUS tetap murni personal.**
- **Koreksi user**: v6.7 membuat role `cs` jadi hybrid (Indri Wahyuningrum dapat menu User + menu Admin CS sekaligus). User mengoreksi: akun personal (Indri) harus tetap murni akun karyawan biasa spt user lain (Dashboard Saya, Input Planning, dst. — TANPA menu admin) karena itu representasi kinerja pribadinya; kapasitas Super User CS harus terpisah, tidak boleh tercampur ke identitas personalnya.
- **Fix**: `roleForUser()` di `Topbar.jsx` disederhanakan — HANYA `level==='Company'` → `ceo`, sisanya (termasuk Indri) → `user` biasa. Akun "Corporate Strategy (Super User)" sekarang jadi **akun generik/administratif terpisah** (`CS_SUPERUSER_ACCOUNT`, bukan berasal dari `users` array, tidak terikat nama siapa pun) yang tetap muncul di grup dropdown "Login sebagai". `Sidebar.jsx` di-revert — role `cs` kembali murni menu admin (NAV.cs saja, tanpa NAV_USER_BASE), `isApprover`/`disabled`/footer disclaimer kembali cuma berlaku utk `currentRole === 'user'`.
- **Hasil**: 11 opsi akun simulasi sekarang (bukan 10) — 1 CEO (Andrian Hartono), 1 CS Super User generik, 9 User personal (termasuk Indri Wahyuningrum sbg user biasa).

**2. Strategy Map — redesain jadi diagram cascade BSC (referensi user, gambar "STRATEGIC SCORE").**
- Layout lama (grid 4 kolom flat, kartu SO cuma menampilkan jumlah KPI) diganti struktur cascade top-down: Financial (atas) → Customer → Internal Process → Learning & Growth (bawah), dgn panah "▲" antar band merepresentasikan alur cause-effect BSC (perspektif bawah mendorong perspektif atas).
- SO Financial yang **tidak punya cascade Dept** (mis. "Increase Profitability" — outcome/EBT utama) otomatis dideteksi & ditonjolkan sbg kotak "root" di paling atas, menerima panah dari SO Financial lainnya (Cost Effectiveness, Maintain Liquidity, dst.) — dideteksi otomatis dari data (`deptChildCount(so.id) === 0`), bukan hardcode nama SO.
- Tiap kartu SO sekarang menampilkan **daftar KPI yang terhubung beserta Achievement demo per-KPI** (bukan cuma jumlah/count) — fungsi baru `kpiDemoScore()` (pola sama dgn `soDemoScore()`, deterministik dari id KPI, murni demo krn Actual belum diinput user, sesuai instruksi eksplisit "silahkan pakai angka demo").
- `companyScore` (banner atas) diubah dari hardcoded `2.45` jadi rata-rata dinamis `soDemoScore` seluruh SO Company aktif — tetap demo/bukan real (isu real-score tetap terbuka, lihat v6.7 poin 3), tapi minimal tidak lagi angka statis yang sama sekali tidak berubah dgn data.
- Edit Mode (klik kartu utk edit, "+ Tambah SO" per band) **tidak diubah** — tetap berfungsi sama seperti sebelumnya, hanya visualnya yang berubah.

**Diverifikasi**: dev server HMR reload bersih tanpa error (`Topbar.jsx`, `Sidebar.jsx`, `StrategyMap.jsx`).

---

### v6.9 — Korelasi Antar-SO, Fix Warna Score, Reposisi Periode, Toggle MTD/YTD (2026-07-13)

4 permintaan lanjutan dari referensi gambar "STRATEGIC SCORE":

**1. Korelasi/hubungan antar-SO (panah antar kartu, bukan cuma antar-band).**
- Field baru `linkedTo: string[]` pada SO Company Level (array id SO tujuan yang "didorong"/feeds ke). Dikelola via form Edit — section baru "🔗 Mendorong (feeds ke) SO Berikut" (checklist SO Company lain yang aktif, exclude diri sendiri).
- Rendering: `containerRef` + `cardRefs` (per SO id) + `useLayoutEffect` menghitung koordinat riil tiap kartu (`getBoundingClientRect`), lalu SVG overlay (`position:absolute`, `pointer-events-none`) menggambar garis putus-putus + arrowhead dari kartu sumber ke kartu tujuan. Recompute otomatis saat window resize, ganti Edit Mode/periode, atau data SO/KPI berubah.
- Data `linkedTo` kosong secara default utk SO yang sudah ada (fitur baru) — CS perlu mengisi sendiri via Edit Mode; SO yang dihapus tapi masih direferensikan `linkedTo` SO lain otomatis tidak tergambar (aman, tidak ada dangling reference yang crash).

**2. Warna score KPI & SO tidak sesuai legend/ketentuan.**
- **Root cause**: kartu SO & KPI pakai `gradeFromScore()` (ambang diskret utk Skor 1/2/3: ≤1 merah, <3 kuning, ≥3 hijau) — BUKAN `gradeFromTotal()` (ambang kontinu Section 5.5 Project Brief: ≤1.5 merah, ≤2.5 kuning, >2.5 hijau) yang justru sudah dipakai benar utk Company Score banner & ditampilkan di legend footer. Karena rentang demo score (1.0–3.0 kontinu) nyaris selalu jatuh di "<3" → hampir semua kartu tampil kuning, warna tidak bervariasi sesuai nilainya.
- **Fix**: semua pemanggilan `gradeFromScore` di `StrategyMap.jsx` (kartu SO, kartu KPI, band perspektif) diganti `gradeFromTotal` — konsisten dgn legend & Section 5.5. Import `gradeFromScore` yang tidak dipakai lagi dihapus.

**3. Info periode dipindah ke atas.**
- Baris "Periode: 2025/2026/2027" (dulu row terpisah di bawah judul) & "Total Score" (dulu di dalam banner gelap) dipindah jadi 1 blok di kanan judul halaman (`flex justify-between` pada header) — langsung terlihat tanpa scroll, mengikuti posisi "Jun-2026" + "Total Score 1.74" di kanan-atas pada referensi user. Banner gelap di bawahnya disederhanakan (cuma nama company + label BSC + tombol Edit Mode), skor besar yg dulu di banner tidak diduplikasi lagi.

**4. Toggle Bulan Berjalan (MTD) vs YTD — rekomendasi & implementasi.**
- **Rekomendasi diberikan & diikuti**: cukup **1 Strategy Map dengan toggle**, bukan 2 halaman terpisah — karena struktur SO/KPI & tata letak cascade-nya identik, hanya angka score yang beda per-periode. Duplikasi jadi 2 halaman akan menggandakan maintenance (Edit Mode, korelasi, dsb.) tanpa manfaat tambahan.
- **Implementasi**: state `periodMode` ('mtd'|'ytd') + toggle button di header (sebelah info periode). Semua fungsi demo score (`demoScoreFor`, dipakai `soDemoScore`/`kpiDemoScore`) menerima parameter `mode` — seed hash disisipi `::mtd`/`::ytd` supaya angka MTD & YTD beda tapi tetap deterministik per SO/KPI (bukan random ulang tiap render). Total Score header & label "Data: ... · MTD/YTD" ikut menyesuaikan.
- **Catatan**: ini tetap angka demo (belum ada Actual sungguhan) — begitu data Actual riil tersedia, formula agregasi MTD vs YTD sesungguhnya (Section 5.3: LAST/SUM/AVG per kategori YTD KPI) perlu diterapkan menggantikan `demoScoreFor`, konsisten dgn temuan terbuka di v6.7 poin 3.

**Diverifikasi**: dev server HMR reload bersih tanpa error setelah full-rewrite `StrategyMap.jsx`.

---

### v6.10 — Klarifikasi: KPI Cascade Draft Memang Sengaja Tidak Tampil di Planning (2026-07-13)

User melapor: KPI cascade Company → Dept "Corporate Strategy" (4 KPI) sudah terdaftar & terlihat di KPI Builder, tapi tidak muncul di Input Planning KPI milik Indri Wahyuningrum (atau user dept lain manapun yang KPI-nya sudah dicascade CS).

**Bukan bug** — root cause: ke-4 KPI tsb berstatus **Draft** di KPI Builder. Aturan yang sudah ada sejak awal (tertulis di legend KPI Builder sendiri): "Draft = belum tampil di User Planning form; Active = tampil di Planning form User". `cascadedKPIs` di `Planning.jsx` (v6.3) memang sengaja hanya mengambil KPI berstatus Active — berlaku general utk semua user, bukan spesifik Indri, persis sesuai dugaan user.

**Solusi (operasional, bukan kode)**: CS perlu klik node "PT NLG" (Company) → klik pill status "Draft" pada tiap KPI → siklus ke "Active" (`cycleStatus`). Begitu Active, otomatis muncul di Planning semua user dept terkait.

**Perbaikan UX kecil (protokol B)**: panel "🔗 KPI Cascade dari Company" di `KPIBuilder.jsx` sekarang menampilkan peringatan otomatis kalau ada KPI cascade yang masih Draft ("⚠️ N KPI masih Draft — belum tampil di Input Planning KPI user manapun di dept ini sampai statusnya diubah ke Active") — supaya CS langsung sadar tanpa perlu bertanya lagi kenapa KPI belum muncul di Planning User.

**Diverifikasi**: dev server HMR reload bersih tanpa error.

---

### v6.11 — Panduan Aktivasi KPI Cascade + Warna Score Perspective & Total Score (2026-07-13)

**1. Panduan (bukan perubahan kode)**: dijelaskan ke user langkah menjadikan KPI cascade Dept "final"/Active — login CS → klik node Company "PT NLG" (bukan node Dept, krn cascade dimiliki & diedit di sana) → klik pill status "Draft" pada KPI ybs → otomatis siklus ke "Active" → langsung muncul sbg KPI Mandatory di Planning semua user terkait. KPI yang dibuat langsung di level Dept (bukan cascade) sama caranya, tinggal klik node Dept-nya langsung.

**2. Warna score Perspective & Total Score belum sesuai ketentuan (referensi user).**
- Kotak label Perspective (Financial/Customer/Internal Process/Learning & Growth) di `StrategyMap.jsx` sebelumnya hanya pakai warna brand tetap per perspektif (ungu/biru/oranye/teal) — skor di dalamnya tidak merefleksikan grade (merah/kuning/hijau) sama sekali, padahal SO & KPI di kartu sebelahnya sudah benar.
- **Fix**: badge grade (`gradeFromTotal`) ditambahkan di bawah angka skor tiap kotak Perspective — pill kecil warna sesuai grade (mis. hijau utk Learning & Growth 2.70 "B · Baik", kuning utk Financial 1.57 "C · Cukup"), latar box tetap warna brand perspektif (agar identitas F/C/IP/LG tetap mudah dibedakan), tapi skornya sekarang jelas ketahuan grade-nya.
- Angka besar **Total Score** di header (dulu selalu warna teks gelap netral) sekarang ikut berwarna sesuai grade (`textColorByGrade`: merah/kuning/hijau) — konsisten dgn pill "C · Cukup" di sampingnya yang sudah benar sejak awal.

**Diverifikasi**: dev server HMR reload bersih tanpa error.

---

### v6.13 — Fix Kritis: KPI Mandatory Tidak Pernah Tersimpan + Bug Field SO (2026-07-13)

User melaporkan 3 gejala terkait User (berlaku general, bukan cuma Indri) — investigasi menemukan 2 root cause berbeda.

**1 & 2. KPI Mandatory: edit Target/Bobot tidak tersimpan, & tidak muncul di Dashboard Saya.**
- **Root cause (gap desain lama, sudah ditandai sbg simplifikasi MVP di v5.2/v6.7)**: section "🔗 KPI Mandatory" di `Planning.jsx` HANYA preview read-only dari `kpis` (KPI Builder) dgn override Target/Bobot yang disimpan di **state lokal React** (`cascadeOverrides`) — TIDAK PERNAH dipanggil `addUserKPI`/`updateUserKPI`. Tidak ada tombol Simpan sama sekali. Karena tidak pernah masuk ke `userKPIs` (satu-satunya sumber data yang dibaca Dashboard/ActualInput/History/Team), editan User hilang & KPI Mandatory tidak pernah muncul di halaman manapun selain Planning.
- **Fix**: tiap kartu KPI Mandatory sekarang punya tombol **"💾 Simpan ke Planning"** (jadi "Update" kalau sudah pernah disimpan). Klik → `addUserKPI`/`updateUserKPI` membuat/memperbarui instance sungguhan di `userKPIs` (field `sourceKpiId` menandai asalnya, `mandatory: true` utk badge & guard UI), status awal `Draft` — otomatis ikut ke Dashboard/ActualInput/History/Team/Monitoring spt KPI lain, ikut `totalWeight` 100% & alur Submit batch yang sama.
- Input Target/Bobot pada kartu Mandatory jadi read-only (`disabled`) begitu instance-nya sudah Submitted/Approved/Locked — konsisten dgn kebijakan lock KPI biasa.
- List "KPI yang Sudah Diinput" di bawah form: item hasil Mandatory diberi badge "🔗 Mandatory" & link "Edit" generik disembunyikan (diganti teks "edit di kartu Mandatory di atas") — mencegah User mengedit field terkunci (Nama/Persp/dll) lewat form bebas.
- Header section menampilkan indikator progres "⚠️ N/M tersimpan ke Planning" atau "✅ Semua tersimpan" supaya User langsung tahu kalau ada KPI Mandatory yang belum di-Simpan.

**3. SO Dept Level yang sudah diregister tidak muncul di Dashboard Saya.**
- **Root cause — bug field name mismatch**: `Planning.jsx` menyimpan Strategic Objective KPI di field **`so`**, tapi `Dashboard.jsx`, `Team.jsx`, `ActualInput.jsx`, dan helper `kpiHasSO()` di `helpers.js` semuanya membaca field **`strategicObj`** (nama field lama, peninggalan seed `INITIAL_USER_KPIS` di `mockData.js` yang memang masih pakai nama itu). Field `strategicObj` tidak pernah ada di record `userKPIs` sungguhan (yang dibuat via Planning.jsx sejak awal) — makanya kolom SO SELALU tampil "—" apa pun yang dipilih User, sepenuhnya independen dari SO sudah diregister atau belum.
- **Fix**: semua pembacaan `k.strategicObj`/`selectedKpi.strategicObj` diganti `k.so`/`selectedKpi.so` (`Dashboard.jsx`, `Team.jsx`, `ActualInput.jsx` ×2, `helpers.js` `kpiHasSO()`). Field `strategicObj: ...` di seed `INITIAL_USER_KPIS` (`mockData.js`, data lama milik user mock yang sudah tidak ada di roster — Dewi Anggraini dkk.) ikut diganti jadi `so:` utk konsistensi penuh.

**Diverifikasi**: dev server HMR reload bersih di semua file terkait (beberapa memicu full page reload krn `mockData.js`/`KPIContext.jsx` bukan React component — perilaku normal Vite Fast Refresh, bukan error).

---

### v6.14 — Audit Menyeluruh: Total Bobot Tidak Sinkron (Floating-Point + Inkonsistensi === 100) (2026-07-13)

User melaporkan preview "120% Melebihi 100%" terasa tidak sinkron dgn "Total Bobot: 100% ✅ Lengkap" di bawahnya, minta diperiksa menyeluruh ke semua menu terkait termasuk Dashboard Saya.

**Temuan A (bukan bug, breakdown diperjelas)**: preview "120%" scr matematis BENAR — itu total 10 KPI yg sudah tersimpan (100%) + baris baru yg SEDANG diketik (20%) = 120%, memperingatkan SEBELUM disimpan. Pesannya diperjelas jadi breakdown eksplisit: "Bobot KPI lain yang sudah tersimpan: 100% + baris baru ini: 20% = 120% ⚠️ Melebihi 100%!".

**Temuan B (bug nyata, akar masalah "tidak sinkron") — audit menyeluruh menemukan 3 titik**: `weight` KPI disimpan sbg fraksi (0-1) di `userKPIs`; menjumlahkan banyak fraksi desimal (mis. 0.05+0.1+0.15+0.2) rawan floating-point noise JS (mis. hasil 99.99999999999999 bukan tepat 100) — dan beberapa halaman memakai perbandingan **strict** `totalWeight === 100`/`!== 100` utk keputusan penting (tombol Submit aktif/nonaktif, badge Lengkap/Belum), padahal `KPIBuilder.jsx` sendiri SUDAH lebih dulu benar pakai toleransi (`weightOK = Math.abs(total-100)<0.1`). Inkonsistensi pendekatan antar-halaman inilah yg menyebabkan gejala "tidak sinkron" yg dirasakan user.
- **`Planning.jsx`** (halaman utama yg dilaporkan): `totalWeight`/`draftWeight` sekarang dibulatkan 2 desimal; ditambah `isWeightComplete = Math.abs(totalWeight-100)<0.1` menggantikan SEMUA pemakaian `=== 100`/`!== 100` (gating `submitAll()`, disabled tombol Submit, kelas warna & badge "Lengkap").
- **`History.jsx`** ("Total Bobot Planning KPI Anda"): bug identik ditemukan (`myTotalWeight === 100`) — diperbaiki jadi `myWeightComplete` dgn pola sama.
- **`KPIBuilder.jsx`**: 1 baris ("Total aktif" di dalam form) masih pakai `totalWeight === 100` walau baris lain di file yg sama (`weightOK`, footer tabel) sudah benar — disamakan pakai `weightOK`.
- **`Dashboard.jsx` & `Team.jsx`** (diperiksa sesuai permintaan user): tidak ada gating `=== 100` (murni display), tapi `totalWeight` tetap dibulatkan 2 desimal utk konsistensi & mencegah noise tampil di angka mentah kalau suatu saat dipakai utk perbandingan.
- **Catatan desain (bukan bug)**: `Team.jsx` sengaja hanya menghitung KPI berstatus Approved/Locked (sudut pandang Superior mengevaluasi performa yg sudah final) — beda dgn Planning/Dashboard/History yg menghitung SEMUA status termasuk Draft (sudut pandang pemilik KPI yg masih menyusun). Total Bobot di Team BISA < 100% walau Planning milik user itu sudah 100%, sampai semua KPI-nya disetujui — ini disengaja, bukan bug "tidak sinkron".

**Diverifikasi**: dev server HMR reload bersih tanpa error di semua file (`Planning.jsx`, `History.jsx`, `KPIBuilder.jsx`, `Dashboard.jsx`, `Team.jsx`).

---

### v6.15 — Fix Lanjutan: Preview Bobot Masih Terasa "Bug" Meski Angka Sudah Benar (2026-07-13)

User tetap melapor "masih ada bug" walau v6.14 sudah benar secara matematis — root cause sebenarnya adalah UX, bukan hitungan.

**Root cause #1**: `emptyForm` (form "KPI Tambahan — Opsional") punya default **Bobot = 20** (bukan kosong) yang otomatis terisi walau User belum menyentuh form sama sekali. Begitu Total Bobot User sudah 100%, preview otomatis tampil merah "⚠️ Melebihi 100%!" — padahal User belum mengetik Nama KPI apa pun / belum ada niat menambah. Ini yang terlihat "tidak sinkron" dgn badge hijau "✅ Lengkap" di bawahnya utk total yg sama, meski User tidak melakukan apa-apa.
- **Fix**: preview kini hanya menghitung & tampil kalau ada **niat nyata** — `form.name.trim() !== ''` (User mulai isi Nama KPI) atau sedang mode Edit baris existing. Kalau form masih polos & total sudah 100%, tampil pesan netral hijau "✅ Total Bobot Anda sudah 100%. Form ini opsional..." — bukan alarm merah tanpa aksi apa pun.

**Root cause #2 (bug tambahan ditemukan saat audit)**: saat User klik "Edit" pada KPI yang sudah tersimpan, `totalWeight` yang dipakai preview SUDAH termasuk bobot LAMA baris itu sendiri — kalau ditambah `form.weight` (bobot BARU baris yg sama) secara mentah, bobotnya kehitung dobel (mis. edit KPI berbobot 10% tanpa ubah apa pun bisa salah tampil "110%, melebihi 100%!" padahal tidak ada perubahan riil).
- **Fix**: dihitung `otherItemsWeight` = totalWeight dikurangi bobot LAMA baris yang sedang diedit, baru ditambah bobot BARU dari form — preview sekarang akurat baik utk tambah KPI baru maupun edit KPI existing.

**Diverifikasi**: dev server HMR reload bersih tanpa error.

---

### v6.12 — Perlebar Canvas App + Padatkan Tabel KPI Builder (Kurangi Scroll Horizontal) (2026-07-13)

User minta tabel KPI Builder (12-13 kolom) tidak perlu digeser kiri-kanan, "berlaku juga utk semua user" — ditangani di 2 level: perbaikan global (semua halaman) + spesifik tabel ybs.

**1. Global — `AppShell.jsx`**: cap lebar canvas utama dinaikkan dari `max-w-[1320px]` → `max-w-[1760px]`. Ini komponen shared dipakai SEMUA halaman (Planning, Approval, History, Monitoring, dst.) — jadi otomatis memberi lebih banyak ruang ke tabel lebar mana pun di seluruh app, bukan cuma KPI Builder, tanpa perlu ubah tiap halaman satu-satu.

**2. Spesifik — tabel KPI Builder (`KPIBuilder.jsx`) dipadatkan:**
- Padding tiap sel diperkecil (`px-3 py-2.5` → `px-2 py-2`).
- Kolom **Formula MTD** & **Formula YTD** digabung jadi 1 kolom **"Formula"** (2 baris stacked: MTD di atas, YTD di bawah) — menghemat 1 kolom penuh.
- `min-width` kolom Strategic Obj./Nama KPI/Deskripsi diperkecil (140→100-120, 150→110, 160→130) + `truncate`/`line-clamp` + `title` tooltip supaya teks panjang tetap terbaca lengkap via hover tanpa memaksa kolom melebar.
- Header disingkat ("Deskripsi / Parameter" → "Deskripsi").

**Catatan**: perubahan #1 (AppShell) otomatis berlaku ke semua tabel lebar di app lain (Planning, Approval, History, dst.) — kalau ada tabel spesifik lain yang MASIH perlu di-scroll horizontal setelah ini, perlu dilaporkan terpisah utk dipadatkan dgn pola yang sama seperti #2.

**Diverifikasi**: dev server HMR reload bersih tanpa error (`AppShell.jsx`, `KPIBuilder.jsx`).

---

### v6.16 — Fix: Login CEO Tidak Punya Menu Approval Queue Sama Sekali (2026-07-13)

User bertanya: KPI-nya (Indri) butuh approval dari Superior-nya, Andrian Hartono (CEO/Direktur Utama) — tapi tidak tahu harus login sbg CEO di mana untuk menjalankan approval, karena menunya memang tidak ada.

**Root cause**: role `ceo` di `Sidebar.jsx` (`NAV.ceo`) hanya berisi Executive Dashboard, Strategy Map, Laporan Strategis — TIDAK PERNAH diberi menu Approval Queue/Performa Tim sama sekali, karena desain sebelumnya (v6.1) hanya fokus ke "CEO tidak butuh KPI Planning pribadi" (KPI BOD = Agregasi Company). Tapi 2 hal ini independen: Andrian Hartono memang tidak butuh Planning pribadi, TAPI dia tetap Superior ASLI dari beberapa Dept Head (Indri Wahyuningrum, Abu Tholib, Morren Andriyanto) di Master Data User — jadi tetap wajib bisa approve submission mereka. Gap ini membuat role CEO sama sekali tidak punya jalur approval.

**Fix**: `isApprover` di `Sidebar.jsx` sekarang berlaku utk role `user` MAUPUN `ceo` (cek yang sama: apakah `currentUserName` tercatat sbg `superior` User lain). Kalau ya, role `ceo` mendapat tambahan menu "Approval Queue (Tim Saya)" & "Performa Tim" di bawah menu CEO biasa — TANPA menu personal (Dashboard/Planning/Actual/History) yang memang tidak relevan utk BOD. `displayName` di header Sidebar disesuaikan: `user` & `ceo` (org nyata) tampilkan nama asli; `cs` (akun Super User sintetis) tetap label generik "Corporate Strategy". `Approval.jsx` sendiri sudah tidak bergantung pada role (murni cocokkan `currentUserName` sbg superior), jadi begitu menu muncul langsung berfungsi tanpa perubahan lain.

**Cara pakai**: pilih akun "Andrian Hartono — Direktur Utama" (grup CEO) di dropdown "Login sebagai" → menu "Approval Queue (Tim Saya)" sekarang muncul di sidebar.

**Diverifikasi**: dev server HMR reload bersih tanpa error.

---

### v6.17 — Fix Kritis: Submit Planning Tidak Pernah Membuat Batch di Approval Queue (2026-07-13)

User (login sbg CEO Andrian Hartono) melapor: Approval Queue kosong total & Performa Tim (Detail Anggota → Indri) tidak menampilkan KPI sama sekali, padahal Indri sudah submit 10 KPI ("0 Draft · 10 Submitted/Locked" di Riwayat Submission). Minta UI KPI lengkap agar CEO bisa lihat detail & lakukan approval.

**Root cause — gap arsitektur besar**: `submitAll()` di `Planning.jsx` HANYA memanggil `submitUserKPIStatus(..., 'Submitted')` (mengubah status di `userKPIs` milik User sendiri) — TIDAK PERNAH membuat entry di `batches` (struktur data terpisah yang dibaca `Approval.jsx`, `History.jsx`, dan `buildDeptAggregates` di `helpers.js` utk Monitoring/Executive). Akibatnya: Approval Queue Superior tidak pernah melihat apa pun utk di-approve; `actOnBatch` (approve/reject/revision) juga TIDAK PERNAH mem-propagate balik ke status `userKPIs` (jadi walau ada batch lama, approve tidak benar2 mengubah status KPI User jadi 'Approved'); dan `Team.jsx`/`buildDeptAggregates` yang mem-filter KPI `status==='Approved'||'Locked'` jadi SELALU kosong utk user manapun yang lewat jalur submit baru ini — root cause yg sama menjelaskan baik Approval Queue kosong (gambar 1) maupun Performa Tim kosong (gambar 2).

**Fix — pipeline Submit → Approve disambungkan penuh:**
1. **`KPIContext.jsx`**: `addBatch()` baru. `actOnBatch()` sekarang, selain mengubah status batch, juga mem-propagate status ke `userKPIs` terkait via `kpiIds` yang disimpan di batch: `approve` → status KPI jadi `'Approved'`; `reject`/`revision` → balik ke `'Draft'` (User bisa edit & submit ulang via Planning.jsx spt biasa).
2. **`Planning.jsx`**: `submitAll()` sekarang memanggil `addBatch()` dgn `kpiIds` (utk propagasi balik) + `kpis` array lengkap (persp, so, nama, desc, type, uom, periode, mtdCat, ytdCat, target, bobot) — bukan cuma subset minim spt data mock lama.
3. **`Approval.jsx`** — tabel detail Planning diperkaya (ini "UI KPI lengkap" yang diminta): tambah kolom Perspektif (badge warna), Type, UoM, Periode; Deskripsi ditampilkan sbg sub-baris di bawah Nama KPI. `colSpan` baris PICA disesuaikan. Fallback hardcode `'Budi Santoso'` (peninggalan mock lama) di `approveAction` dihapus.
4. **Migrasi self-heal (`KPIContext.jsx`, `useEffect` sekali jalan)**: KPI berstatus `'Submitted'` yg SUDAH terlanjur ada dari SEBELUM fix ini (spt 10 KPI Indri) tidak akan pernah tercakup batch manapun secara alami (tombol Submit sudah nonaktif krn tidak ada Draft tersisa) — dideteksi otomatis (`Submitted` + tidak ada di `kpiIds` batch manapun) & dibuatkan 1 batch retroaktif per user yg terdampak, idempotent (aman jalan berkali-kali, tidak duplikat krn hasil migrasi ikut tersimpan).

**Belum dikerjakan (scope terpisah, direkomendasikan sbg lanjutan)**: `ActualInput.jsx` py gap yang SAMA PERSIS utk submission Actual — tombol Submit di sana hanya mengubah state lokal ephemeral (`submittedIds`, hilang saat refresh), tidak menyentuh `userKPIs` maupun `batches` sama sekali. Belum disentuh di fix ini krn scope laporan user murni soal Planning approval; perlu pass terpisah dgn pola perbaikan yang sama.

**Diverifikasi**: dev server HMR reload bersih tanpa error di semua file (`KPIContext.jsx`, `Planning.jsx`, `Approval.jsx`).

---

### v6.17b — Fix: Migrasi Self-Heal Membuat Batch Duplikat (2026-07-13)

User melapor 2 baris batch "Planning (Migrasi Otomatis)" identik utk Indri Wahyuningrum muncul di Approval Queue Andrian Hartono — sama persis (10 KPI yg sama).

**Root cause**: `main.jsx` membungkus app dgn `<React.StrictMode>`, yang di mode dev **sengaja** me-mount→cleanup→mount ulang komponen sekali utk setiap `useEffect` (mendeteksi efek yg tidak idempotent). Effect migrasi v6.17 (`useEffect(() => {...}, [])`) tidak punya guard, jadi terpanggil 2x saat mount pertama — kedua panggilan membaca `batches` yang SAMA (closure belum ter-update dari panggilan pertama saat panggilan kedua jalan), jadi keduanya menyimpulkan KPI Indri "belum ter-batch" dan sama-sama membuat batch baru → 2 batch duplikat.

**Fix**:
1. `migrationRanRef` (`useRef(false)`) ditambahkan sbg guard — migrasi cuma benar2 dieksekusi sekali per instance komponen, kebal thd double-invoke StrictMode (ref bertahan lintas mount-cleanup-mount krn komponen tidak benar2 di-unmount).
2. Sekaligus dibersihkan: `setBatches` sekarang juga meng-collapse batch "Migrasi Otomatis" berstatus `Pending` yg kpiIds-nya identik (masih sama user, masih sama set KPI) — jadi duplikat yg SUDAH terlanjur tercipta (kasus Indri) otomatis hilang saat halaman dimuat ulang, tidak perlu apa pun secara manual.

**Diverifikasi**: dev server HMR reload bersih tanpa error.

---

### v6.19 — Rapikan Card View Performa Tim spt Strategy Map (2026-07-13)

User minta Card View "Performa Tim" (`Team.jsx`) dirapikan senada dgn Strategy Map Super User.

**Root cause tambahan ditemukan**: SEMUA kartu tampil merah solid "0.0%" — bukan krn performa buruk, tapi krn KPI yg BARU disetujui (Approved) belum diisi Actual sama sekali (`factor1`/`factor2` masih null). Kode lama default `score = 0` saat tidak ada data (`st ? st.score : 0`), dan `scoreBg(0)` menghasilkan merah — jadi "belum ada data" & "skor 0/Kurang sungguhan" tidak dibedakan sama sekali secara visual.

**Fix (menyamakan bahasa visual dgn Strategy Map v6.9-v6.11):**
1. Kartu KPI sekarang dikelompokkan per **band Perspektif berwarna** (ungu/biru/oranye/teal, palet sama dgn `PERSP_META` di `StrategyMap.jsx`) — bukan grid flat spt sebelumnya.
2. **State "Belum ada Actual"** ditambahkan — kalau `factor1`/`factor2` bulan berjalan masih kosong, kartu tampil abu-abu netral + label "Belum ada Actual", BUKAN lagi merah solid "0.0%" yang menyesatkan (dicek terpisah utk MTD & YTD, krn keduanya bisa beda kondisi).
3. Legend footer ditambahkan (🟢≥2.5 Baik · 🟡1.5–2.4 Cukup · 🔴≤1.5 Kurang · ⬜ Belum ada data) — konsisten dgn legend yg sudah ada di Strategy Map.
4. Import `badgeColorByPersp` yg sudah tidak dipakai dihapus, diganti `PERSP_BAND` lokal.

**Diverifikasi**: dev server HMR reload bersih tanpa error.

---

### v6.20 — Fix Kritis: Input Realisasi (Actual) Blank Putih Total (2026-07-13)

User (login Indri) melapor halaman Input Realisasi (Actual) blank putih total — tidak ada error di layar, cuma putih kosong (krn app tidak punya error boundary, React unmount seluruh tree begitu ada exception yg tidak ditangkap saat render).

**Root cause**: `calcMTD(item, m)` & `calcYTD(item, m)` (`helpers.js`) — beda dgn `kpiMonthStats()` yg SUDAH menjaga null (`return null` kalau factor1/factor2 bulan itu kosong) — utk kategori `DIRECT`/`LAST` langsung me-return `factor1[m]`/`factor2[m]` MENTAH tanpa guard apa pun. Panel preview "%Actual (MTD)/(YTD)" di `ActualInput.jsx` (baris 250 & 254) memanggil kedua fungsi ini LANGSUNG (bukan lewat `kpiMonthStats`) lalu `.toFixed(1)` hasilnya — begitu KPI yang baru saja di-Approve (blm pernah diisi Actual sama sekali, `factor1`/`factor2` masih `null` bawaan `Array(12).fill(null)`) menjadi `selectedKpi` default (KPI pertama di list), `calcMTD` return `null` → `null.toFixed(1)` → crash → seluruh halaman blank.

**Kenapa baru muncul sekarang**: sebelum pipeline Approval disambungkan (v6.17), tidak ada jalur nyata bagi KPI User baru utk mencapai status Approved dgn Actual masih kosong — data lama (mock) semua Approved SEKALIGUS sudah py Actual terisi. Begitu Andrian Hartono approve batch Indri, utk PERTAMA KALINYA ada KPI Approved+Actual kosong yg mencapai halaman ini, menyingkap bug laten yg sudah ada sejak lama.

**Fix**: preview MTD/YTD sekarang cek dulu apakah Factor 1 & 2 bulan berjalan sudah terisi (`hasF1 && hasF2`) SEBELUM memanggil `calcMTD`/`calcYTD` — kalau belum, tampilkan `—` (bukan crash). Sudah di-grep ke seluruh `src/` utk pola serupa (`calcMTD/calcYTD(...).toFixed` langsung) — tidak ada titik lain yg py risiko sama.

**Diverifikasi**: dev server HMR reload bersih tanpa error.

---

### v6.21 — Fix: Tidak Ada Cara Langsung Membuka Form PICA dari List Status (2026-07-13)

User bertanya "dimana saya bisa input PICA?" — KPI "Automation & Digitalization Completion" tampil 🔴 dgn badge "PICA belum lengkap" di list "Status Pengisian Actual" (bawah halaman), tapi form PICA (di atas) cuma muncul utk KPI yg sedang aktif di dropdown "Pilih KPI", dan baris di list itu murni informasi (tidak bisa diklik) — User tidak py cara langsung menuju ke sana selain scroll ke atas & buka dropdown manual, mencari nama KPI yg sama persis.

**Fix**: tiap baris "Status Pengisian Actual" sekarang berupa tombol yg bisa diklik — klik langsung menjadikan KPI itu terpilih (`setSelectedKpiId`) sehingga form Input Realisasi + section PICA di panel atas otomatis berpindah ke KPI tsb, dibarengi auto-scroll ke atas halaman (`window.scrollTo`) supaya langsung terlihat tanpa perlu scroll manual. Badge "PICA belum lengkap" diperjelas jadi "⚠️ Isi PICA →" (mengarahkan aksi, bukan cuma status). Baris yg sedang aktif diberi ring highlight (`ring-2 ring-nlg-primary`) agar User tahu KPI mana yg sedang ditampilkan di panel atas.

**Diverifikasi**: dev server HMR reload bersih tanpa error.

---

### v6.22 — Fix Kritis: KPI Non-Bulanan Diwajibkan Diisi Tiap Bulan, Blokir Submit (2026-07-13)

User (login Indri) melapor: KPI berperiode Kuartalan ("% KPI Achievement Improvement") tidak bisa disubmit krn sistem meminta Factor 1/2 diisi bulan Feb — padahal Feb bukan bulan akhir kuartal.

**Root cause**: Section 6.2 Project Brief SUDAH mendokumentasikan "User isi Factor 1 & 2 utk SEMUA KPI **PERIODE AKTIF**" — tapi implementasi `ActualInput.jsx` SEBELUMNYA memperlakukan SEMUA KPI (apa pun `period`-nya: Bulanan/Kuartalan/Semesteran/Tahunan) seolah wajib diisi Factor 1/2 di bulan berjalan yang sama, tanpa pernah membedakan berdasarkan Periode Pengukuran. Akibatnya KPI Kuartalan/Semesteran/Tahunan ikut memblokir gate Submit (`unfilledKpis`) di bulan-bulan yang bukan akhir periodenya — gap yg sama ini juga bikin kolom "Feb" tetap terbuka utk input padahal seharusnya "bukan periode input".

**Fix — helper baru + terapkan menyeluruh di `ActualInput.jsx`:**
1. **`helpers.js`** — `PERIOD_DUE_MONTHS` (Kuartalan: Mar/Jun/Sep/Des · Semesteran: Jun/Des · Tahunan: Des · Bulanan: semua bulan) + `isDueMonth(period, mi)` + `nextDueMonth(period, fromMi)`.
2. **Gate Submit**: `dueKpis` (KPI yg period-nya due bulan ini) menggantikan `myKPIs` di `unfilledKpis`/`redKpisMissingPica`/`canSubmitAll` — KPI non-due TIDAK LAGI memblokir submit. Kalau tidak ada KPI due sama sekali bulan ini, tampil info netral "📅 Tidak ada KPI yang wajib diisi Actual bulan ini" (bukan pesan error merah).
3. **Panel Input Realisasi**: kalau KPI terpilih tidak due bulan ini, tampil banner "📅 KPI ini berperiode X — tidak wajib diisi bulan Y. Periode berikutnya: Z" + baris bulan aktif di tabel 12-bulan TIDAK dibuka utk input (label "bukan periode input", bukan seolah "belum dibuka" spt bulan depan) + tombol Simpan diganti pesan info.
4. **List "Status Pengisian Actual"**: KPI non-due tampil badge netral "📅 Bukan periode input (Periode)" — bukan lagi "⬜ Belum diisi" yg menyiratkan telat/kurang padahal memang belum waktunya.

**Diverifikasi**: dev server HMR reload bersih tanpa error.

---

### v6.23 — Tombol Reset ke Draft Khusus Simulasi (utk Ubah Formula MTD/YTD) (2026-07-13)

User minta cara "buka lock" utk setting ulang & simulasi formula MTD/YTD KPI yang sudah Approved (field ini read-only sesuai Sec. 5.3: "Dipilih saat Planning, tidak bisa diubah setelah Approved"). Aturan lock itu sendiri TIDAK diubah (berlaku sah utk data sungguhan) — ditambahkan jalur simulasi terpisah.

**Fix**: tombol baru "🔧 Reset ke Draft (khusus simulasi)" di panel Master KPI read-only `ActualInput.jsx` — klik (dgn konfirmasi) meng-set status KPI itu balik ke `Draft` via `updateUserKPI`, TANPA menyentuh KPI lain dalam batch yang sama (beda dgn Reject/Request Revision di Approval Queue yg me-revert 1 batch penuh). Setelah direset, KPI otomatis hilang dari `ActualInput.jsx` (krn hanya menampilkan Approved/Locked) dan muncul lagi sbg Draft yg bisa diedit — termasuk Formula MTD/YTD — di Input Planning KPI, lalu bisa disubmit & diapprove ulang utk simulasi lanjutan.

**Diverifikasi**: dev server HMR reload bersih tanpa error.

---

### v6.24 — Fix: Tombol "Reset ke Draft" Tidak Terasa Berhasil (2026-07-13)

User coba tombol "Reset ke Draft" dari v6.23, laporan balik: KPI di Input Planning KPI "masih locked dan status approved" — indikasi reset tidak berhasil (atau tidak terlihat berhasil).

**2 kemungkinan root cause ditemukan sekaligus & keduanya diperbaiki:**
1. Konfirmasi sebelumnya pakai `window.confirm()` (dialog native browser) — tidak ada indikator visual di dalam app kalau aksi berhasil, dan dialog native ini bisa tidak konsisten perilakunya di berbagai environment/browser. **Fix**: diganti konfirmasi 2-klik berbasis state React (bukan dialog native) — tombol → "Yakin reset...?" + tombol Ya/Batal, semuanya di dalam UI, tidak bergantung pada dialog eksternal.
2. **Bug nyata ditemukan dari inspeksi ulang**: begitu status di-set ke Draft, KPI itu LANGSUNG hilang dari `myKPIs` (filter `Approved`/`Locked` saja) di render berikutnya — kalau pesan "berhasil" ditaruh di dalam panel Master KPI (yg terikat ke `selectedKpi`), panel itu SUDAH keburu berpindah ke KPI lain (fallback `myKPIs[0]`) di render yg SAMA, sebelum User sempat melihat konfirmasinya — pesan sukses jadi tidak pernah benar-benar tampil. **Fix**: pesan sukses dipindah jadi banner independen di bagian atas halaman (bukan di dalam panel per-KPI yg vanishing), disimpan sbg nama KPI (bukan id, krn id sudah tidak relevan setelah hilang dari list).

**Diverifikasi**: dev server HMR reload bersih tanpa error.

---

### v6.25 — Fix Bug Formula: Kategori YTD "LAST" Salah Hitung (2026-07-13)

User minta konfirmasi cara hitung Formula MTD/YTD (SUM/AVG/LAST) — curiga ada logic keliru.

**Audit hasil, 1 dari 3 kategori YTD memang bug:**
- **SUM** — `sum(Factor1)÷sum(Factor2)×100` — benar, sesuai Sec. 5.3.
- **AVG** — kode menghitung rata-rata MTD dulu baru dibagi Target sekali (bukan rata-rata %Achievement per bulan spt bunyi literal spec) — TAPI scr matematis KEDUANYA SETARA (pembagian dgn Target konstan bersifat linear, jadi avg(mtd)/target = avg(mtd/target)) — bukan bug, cuma urutan hitung beda.
- **LAST — BUG NYATA**: `calcYTD` me-return `item.factor2[m]` (Factor 2/pembanding MENTAH bulan berjalan) alih-alih nilai Actual yg sudah dihitung. "LAST" seharusnya = snapshot %Actual TERAKHIR (Sec. 5.3: "cocok utk KPI snapshot/rasio yg tidak bisa dikumulatifkan") — yaitu sama dgn `calcMTD(item, m)` bulan berjalan, BUKAN Factor 2 mentah. Bug ini tidak kelihatan kalau Factor 1 == Factor 2 saat diinput (mis. 100/100, kebetulan sama) — begitu beda (mis. F1=90, F2=100), YTD-LAST salah menampilkan 100% (nilai target/pembanding) padahal seharusnya 90% (sama dgn MTD, krn LAST = snapshot terakhir).

**Fix**: `calcYTD` kategori LAST diganti `return calcMTD(item, m)` — konsisten dgn definisi "snapshot terakhir" & otomatis benar utk kombinasi MTD apa pun (DIRECT/RATIO), krn `calcMTD` sendiri sudah menghitung nilai Actual yg benar per kategori.

**Dampak**: fix di `helpers.js` (satu sumber, dipakai semua halaman: Dashboard/Team/ActualInput/History/Monitoring/Executive) — otomatis benar di semua tempat tanpa perlu ubah per halaman.

**Diverifikasi**: dev server HMR reload bersih tanpa error.

---

### v6.26 — KPI Draft Ditampilkan di Input Realisasi (Actual) Khusus Simulasi (2026-07-13)

User minta KPI Draft (hasil "Reset ke Draft" v6.23-24) ikut muncul di Input Realisasi (Actual) supaya bisa uji Factor 1/2 & lihat hasil MTD/YTD tanpa perlu submit+approve ulang tiap kali ganti Formula.

**Fix**: `myKPIs` di `ActualInput.jsx` dipecah jadi 2 sumber — `approvedKPIs` (Approved/Locked, "resmi", tetap satu-satunya yg ikut gate "Submit Semua Actual KPI ke Superior" via `dueKpis`) + `draftKPIsForPreview` (status Draft, murni pratinjau). Keduanya digabung utk ditampilkan (dropdown "Pilih KPI", panel Master KPI, list "Status Pengisian Actual"), tapi KPI Draft ditandai jelas di semua tempat ("📝 Draft (Simulasi)"/"📝 Draft — Mode Simulasi") supaya tidak tertukar dgn alur submission resmi. KPI Draft juga membebaskan aturan "hanya wajib diisi bulan due" (v6.22) — supaya User bebas coba isi Factor kapan pun tanpa perlu menunggu bulan akhir periode kalau cuma utk tes formula.

**Diverifikasi**: dev server HMR reload bersih tanpa error.

---

### v6.27 — Tombol "Kembalikan ke Approved" + Korelasi KPI Company↔Dept dgn Performa Aktual (2026-07-13)

**1. Tombol kebalikan dari "Reset ke Draft" (`ActualInput.jsx`)**: setelah selesai simulasi formula, User butuh cara cepat kembalikan status KPI ke Approved tanpa proses submit+approve ulang lewat Planning/Approval Queue. Panel Master KPI sekarang otomatis menampilkan tombol "↩️ Kembalikan ke Approved (selesai simulasi)" (2-klik konfirmasi, pola sama dgn v6.24) begitu KPI berstatus Draft — kebalikan dari tombol "Reset ke Draft" yg tampil saat status Approved/Locked. Banner sukses di atas halaman ikut disesuaikan teksnya sesuai arah aksi (`justResetDirection`).

**2. Korelasi KPI Company → Dept dgn performa aktual (`KPIBuilder.jsx`)**: user tanya di mana bisa lihat korelasi KPI Company yg di-cascade (mis. "Annual Plan KPI cascading" → Dept Corporate Strategy/Indri) dgn performa aktualnya — ditemukan gap: badge "🔗 N dept" di tabel KPI Company selama ini cuma ANGKA STATIS (`cascade_depts.length`), tidak ada cara melihat SIAPA di dept itu yg sudah "Simpan ke Planning" & berapa Achievement/Score aktualnya (data ini sebenarnya SUDAH ada, terhubung via `sourceKpiId`, sejak v6.13 — cuma belum ada UI-nya).
- Badge "🔗 N dept" sekarang jadi tombol expand/collapse (▼/▲).
- Saat di-klik, muncul panel drill-down per Dept di `cascade_depts`-nya: kalau belum ada User yg "Simpan ke Planning" KPI mandatory ini → "Belum ada User... yg Simpan ke Planning"; kalau sudah ada → tampil nama User, status instance-nya, dan Achievement%/Score aktual (dihitung via `kpiMonthStats` bulan berjalan, warna sesuai grade) atau "Belum ada Actual" kalau instance-nya ada tapi Factor 1/2 belum diisi.
- `getCascadeInstances(k)` helper baru — cari instance per Dept via `users.filter(dept)` → `userKPIs[user.name].filter(sourceKpiId === k.id)`.

**Diverifikasi**: dev server HMR reload bersih tanpa error di kedua file.

---

### v6.28 — Fix Kritis: Strategy Map Masih Pakai Skor Demo/Acak, Bukan Data Actual Sungguhan (2026-07-13)

User bertanya di mana bisa melihat linkage Achievement/Score Dept → Company sesuai konsep KPI Management, dan menegaskan ini **harus muncul di BSC Company (Executive Dashboard) DAN Strategy Map**. Audit ke 2 halaman:

- **Executive Dashboard (`CEO/Executive.jsx`)**: sudah benar sejak awal — pakai `buildDeptAggregates(users, userKPIs, batches, m)`, fungsi agregasi real yang sama dipakai Monitoring Dashboard.
- **Strategy Map (`CS/StrategyMap.jsx`)**: ditemukan bug — Company Score, skor tiap kartu SO, dan skor tiap KPI di dalamnya semua dihitung dari `demoScoreFor()`, yaitu **hash angka pseudo-acak dari id/nama** (`seed % 21 / 10 + 1.0`), sama sekali tidak terhubung ke Actual/Target yang diinput User. Ini ditandai sbg isu terbuka sejak v6.7/v6.9 tapi belum sempat diperbaiki.

**Fix:**
1. Hapus total `demoScoreFor`/`soDemoScore`/`kpiDemoScore`. Ganti dengan agregasi real: `buildDeptAggregates` (fungsi yg sama persis dgn Executive Dashboard, agar Company Score di Strategy Map **selalu identik** dgn BSC Company — akar bug lama sblm v6.0 adalah tiap halaman hitung sendiri2 dan hasilnya beda2).
2. Kartu SO kini menampilkan **KPI Approved/Locked sungguhan** yang field `so`-nya cocok (lintas Dept/User manapun, via `kpisForSO()`), lengkap dengan Achievement% dan Score aktual per KPI (`kpiMonthStats` utk MTD, `calcYTD`+`computeAch`+`computeScore` utk YTD). KPI yang belum diisi Actual bulan ini tampil netral "Belum ada Actual", bukan angka palsu.
3. Skor SO/Perspective Band dihitung via `weightedAvgScore()` — rata-rata tertimbang (score × weight, dinormalisasi thd total weight KPI kontributor) supaya adil walau kontributornya berasal dari Dept/User dgn "kolam bobot 100%" yang berbeda-beda. Skor Company memakai definisi identik Executive Dashboard utk MTD; skor Company YTD (metrik baru, belum ada padanannya di Executive) dihitung analog via `deptYTDScoreAt()`.
4. **Koreksi grading**: skor individual KPI (selalu diskrit 1/2/3 dari `computeScore`) sekarang pakai `gradeFromScore` (ambang ≤1/<3/≥3) — bukan `gradeFromTotal` yang dipakai sebelumnya utk skor demo kontinu. Skor agregat (SO/Perspective/Company, kontinu 0–3) tetap pakai `gradeFromTotal` (ambang 1.5/2.5, sesuai Section 5.5).
5. Header menampilkan label "(= Executive Dashboard)" di sebelah Total Score utk menegaskan kedua halaman kini bersumber dari data yang sama.

**Diverifikasi**: seluruh export yang dipakai (`buildDeptAggregates`, `kpiMonthStats`, `calcYTD`, `computeAch`, `computeScore`, `gradeFromScore`, `gradeFromTotal`) dikonfirmasi ada di `helpers.js`; dev server tidak melaporkan error compile setelah rewrite.

---

### v6.29 — Rapikan Card View "Dashboard Saya" agar Konsisten dgn Strategy Map (2026-07-13)

User minta Card View di Dashboard Saya dirapikan spt Strategy Map (v6.28) — sebelumnya kartu KPI tampil sbg **grid datar tanpa pengelompokan** (semua Perspektif tercampur berurutan sesuai data, badge Perspektif kecil di tiap kartu), beda gaya visual dgn Strategy Map yg sudah rapi berbentuk band per-Perspektif berwarna.

**Fix (`Dashboard.jsx`):**
1. Kartu kini dikelompokkan per **Perspective band** (Financial → Customer → Internal Process → Learning & Growth, mengikuti `groups` yg sudah dihitung utk Table View) — strip warna kiri per Perspektif (`PERSP_META`) menampilkan skor rata-rata tertimbang band tsb + badge grade, sama persis pola `renderBand` di Strategy Map. Panah "▲" cause-effect antar-band ikut disertakan.
2. Desain kartu KPI individual diselaraskan dgn kartu SO Strategy Map: border & header berwarna mengikuti grade (`borderByGrade`/`bgByGrade`, berdasarkan `gradeFromScore` skor MTD — bukan lagi kotak solid 2-kolom flat), badge Perspektif di pojok kartu dihapus (sudah terwakili oleh band, mengurangi duplikasi info), pill %Ach MTD & YTD kini bulat kecil (rounded-full) senada Strategy Map, dan KPI yg belum py Actual bulan ini tampil netral **"Belum ada data"** (bukan blok merah/kosong tanpa keterangan).
3. **Ekstraksi shared constants** (`helpers.js`): `PERSP_META`, `PERSP_ORDER`, `borderByGrade`, `bgByGrade`, `textColorByGrade` — sebelumnya hanya didefinisikan lokal di `StrategyMap.jsx`; sekarang diekspor bersama supaya Dashboard Card View & Strategy Map benar-benar memakai satu sumber warna/threshold yang sama (mencegah drift visual di masa depan kalau salah satu diubah tapi yang lain lupa disesuaikan). `StrategyMap.jsx` diupdate mengimpor dari `helpers.js`, bukan lagi definisi lokal.

**Diverifikasi**: dev server HMR reload bersih tanpa error (sempat ada 1 error transisi sesaat akibat state HMR pertengahan-edit, hilang setelah reload final).

---

### v6.18 — Preview Laporan Strategis Sebelum Export/Print (2026-07-13)

User minta bisa preview konten Laporan Strategis sebelum export — sebelumnya tidak ada cara melihat isi laporan sama sekali kecuali langsung download Excel.

**Temuan tambahan**: tombol "🖨️ Print / PDF" ternyata cuma `window.print()` polos di halaman FORM pengaturan (checkbox, dropdown, tombol) — jadi kalau diklik, yang tercetak adalah panel pengaturan, BUKAN isi laporan (tidak ada rendering tabel laporan di layar sama sekali sebelum ini). Preview sekaligus memperbaiki tombol Print ini.

**Fix:**
1. Logika pembangun konten laporan (`buildSections()`) di-refactor jadi 1 fungsi yang dipakai bersama oleh Export Excel, Print, DAN Preview — supaya apa yang di-preview User dijamin identik dgn hasil export sungguhan (bukan 2 implementasi terpisah yg bisa divergen).
2. Tombol baru **"👁️ Preview Laporan"** — toggle panel di bawah form, menampilkan tiap section (Executive Summary, Cascading Dept Scorecard, KPI Detail per Dept, PICA Log) sbg tabel HTML sungguhan sesuai Periode/Scope/Konten yg dipilih saat itu.
3. Tombol "Print / PDF" diperbaiki (`handlePrint`) — sekarang otomatis membuka Preview dulu (kalau belum) sebelum trigger `window.print()`, supaya benar2 mencetak konten laporan. Form pengaturan (year toggle, card konfigurasi) ditandai `.no-print` (konvensi CSS print yg sudah ada di `index.css`) supaya tidak ikut tercetak — hasil print/PDF sekarang murni tabel laporan.

**Diverifikasi**: dev server HMR reload bersih tanpa error.
