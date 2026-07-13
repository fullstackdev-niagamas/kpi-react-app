# KPI System Mockup

Aplikasi ini adalah hasil konversi *mockup HTML* menjadi arsitektur React (Vite) + Tailwind CSS, khusus untuk mensimulasikan antarmuka *Key Performance Indicator (KPI) System* bagi perusahaan NLG.

## 💻 Persiapan untuk Laptop Baru

Jika Anda ingin menjalankan aplikasi ini di laptop baru atau komputer lain, ikuti langkah-langkah mudah berikut:

### 1. Install Node.js
Pastikan laptop baru Anda sudah terinstal **Node.js**. 
- Download di situs resminya: [nodejs.org](https://nodejs.org/) (Pilih versi yang tertulis **LTS**).
- Proses instalasinya sama seperti menginstal aplikasi biasa (tinggal *Next* sampai selesai).

### 2. Pindahkan Folder Aplikasi
Pindahkan / *copy* seluruh folder `kpi-react-app` ini ke laptop baru Anda (bisa melalui Flashdisk, Google Drive, atau Git).
> **Penting**: Pastikan Anda memindahkan seluruh isinya **KECUALI** folder `node_modules`. Folder ini ukurannya besar dan sebaiknya diunduh ulang di komputer tujuan.

### 3. Install Dependensi (Library)
Buka terminal / *Command Prompt* (CMD) / *PowerShell* di dalam folder `kpi-react-app` ini, lalu ketik perintah berikut dan tekan Enter:
```bash
npm install
```
*(Proses ini membutuhkan koneksi internet, fungsinya untuk mengunduh semua "onderdil" yang dibutuhkan aplikasi seperti React, Tailwind, dan lain-lain).*

### 4. Jalankan Aplikasi
Setelah proses instalasi selesai, ketik perintah ini untuk menyalakan server lokal:
```bash
npm run dev
```

### 5. Buka di Browser
Aplikasi siap dijalankan! Silakan klik link yang muncul di terminal Anda (biasanya `http://localhost:5173` atau `http://localhost:5175`), atau ketik alamat tersebut secara manual di Google Chrome/Edge.

---

## 🛠️ Teknologi yang Digunakan
- **React.js** (Vite)
- **Tailwind CSS v3**
- **Chart.js** (via react-chartjs-2)
- State Management sederhana via *React Context API* & *LocalStorage*
