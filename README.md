# 🏭 NKids Production Management System

[![Laravel](https://img.shields.io/badge/Backend-Laravel%2012-red.svg?logo=laravel&style=flat-square)](https://laravel.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20(Vite)-blue.svg?logo=react&style=flat-square)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20v4-38bdf8.svg?logo=tailwind-css&style=flat-square)](https://tailwindcss.com)
[![Cypress](https://img.shields.io/badge/Testing-Cypress%20E2E-45b8ac.svg?logo=cypress&style=flat-square)](https://cypress.io)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> **React Frontend + Laravel API Backend (v3.1 - Employee Management & Division-Based Task Filtering)**
> Sebuah aplikasi manajemen produksi garmen khusus pakaian bayi & anak-anak dengan pendekatan **quantity-based production logging** dan **weighted progress calculation**. Didukung dengan antarmuka tablet ramah sentuhan (*kiosk-mode*) untuk operator di lantai produksi dan dashboard analitik lengkap untuk manajemen.

---

## 📋 Daftar Isi

1. [🎯 Gambaran Umum Proyek](#-gambaran-umum-proyek)
2. [⚡ Filosofi Utama (Bottleneck Prevention)](#-filosofi-utama-bottleneck-prevention)
3. [🛠️ Teknologi & Modul Utama](#️-teknologi--modul-utama)
4. [🎨 Sistem Desain (Design System)](#-sistem-desain-design-system)
5. [🖥️ Fitur & Modul Aplikasi](#️-fitur--modul-aplikasi)
6. [🗄️ Skema Database & Relasi](#️-skema-database--relasi)
7. [🚀 Petunjuk Instalasi & Menjalankan Aplikasi](#-petunjuk-instalasi--menjalankan-aplikasi)
8. [🧪 Menjalankan Pengujian (Testing)](#-menjalankan-pengujian-testing)
9. [📝 Aturan Kritis Pengembang (Developer Rules)](#-aturan-kritis-pengembang-developer-rules)

---

## 🎯 Gambaran Umum Proyek

**NKids Production Management System** dikembangkan untuk merampingkan dan melacak setiap tahap produksi di lantai garmen, mulai dari pemotongan kain (*cutting*), sablon, penjahitan (*sewing*), kontrol kualitas (*QC*), hingga pengemasan dan pengiriman (*finishing*).

### Konteks Bisnis

*   **Industri**: Garmen & Tekstil Manufaktur (Pakaian Bayi & Anak-anak).
*   **Target Perangkat**: Floor lantai produksi (Tablet / Layar Sentuh Kiosk) & Desktop (Admin & Manager).
*   **Skala Operasional**: Multi-cabang (*multi-branch*), multi-operator, penginputan serentak (*high-concurrency*).
*   **Pengguna Utama**: Super Admin, Branch Manager, QC Inspector, dan Operator Produksi.

---

## ⚡ Filosofi Utama (Bottleneck Prevention)

Sistem ini dirancang dengan prinsip: **"Write fast, read fast, recalc async."**  
Untuk menghindari penumpukan antrean query (*bottleneck*) ketika banyak operator menginput data secara bersamaan di lantai produksi, sistem menerapkan teknik:

1.  **Snapshot Columns (Cached Progress)**: Menghindari fungsi agregat berat `SUM()` setiap kali membaca data. Progress disimpan secara denormalisasi pada kolom tabel `production_tasks`, `order_items`, dan `orders`.
2.  **Event-Driven Updates**: Menggunakan Laravel Events + Listeners untuk pemicuan kalkulasi ulang progres secara asinkron atau terpisah, bukan menggunakan Laravel Observers yang berat.
3.  **Atomic Transactions**: Menggunakan transaksi basis data yang aman melalui `DB::transaction()` disertai dengan penguncian baris data `lockForUpdate()` untuk mencegah kondisi balapan (*race conditions*).

---

## 🛠️ Teknologi & Modul Utama

### Backend (API-First)
*   **Framework**: Laravel 12 (API-first architecture)
*   **Runtime / PHP**: PHP 8.2+
*   **Database**: MySQL 8.0+ / SQLite (mendukung Herd)
*   **Queue Engine**: Database / Redis
*   **Autentikasi**: Laravel Sanctum (Token-Based Auth)

### Frontend (SPA)
*   **Framework**: React 18 dengan bundler Vite
*   **State Management**: TanStack Query / React Query (Data caching tingkat lanjut)
*   **CSS Framework**: Tailwind CSS v4 (Sangat cepat dan modern)
*   **Set Ikon**: Lucide React
*   **Pengujian E2E**: Cypress

---

## 🎨 Sistem Desain (Design System)

Aplikasi NKids dirancang dengan estetika premium yang dioptimalkan untuk visibilitas tinggi di lantai pabrik yang dinamis.

### Palet Warna Utama

| Peran Warna | Hex Code | Visual Swatch | Penggunaan |
| :--- | :--- | :--- | :--- |
| **Primary** | `#FFFFFF` | ⚪ White | Warna latar utama dashboard & kartu |
| **Secondary BG** | `#F8FAFC` | 🥈 Light Gray | Latar belakang halaman aplikasi |
| **Border Color** | `#E2E8F0` | ◽ Border Gray | Pembatas komponen dan tabel |
| **Text Primary** | `#1E293B` | ⚫ Dark Slate | Teks judul, label penting, dan angka |
| **Text Secondary**| `#64748B` | 🔲 Medium Gray | Deskripsi sub-judul dan informasi sekunder |

### Warna Aksen & Indikator Status

*   🔴 **Urgent / Error** (`#EF4444`): Tugas terlambat (*overdue*), kesalahan sistem, defect tinggi.
*   🔵 **Primary Action / Info** (`#3B82F6`): Tombol aksi utama, tautan aktif, proses penugasan.
*   🟢 **Success / Completed** (`#22C55E`): Tugas selesai, kualitas lolos QC, pesanan terkirim.
*   🟡 **Warning / In Progress** (`#EAB308`): Sedang dikerjakan, peringatan kapasitas, peninjauan QC.

---

## 🖥️ Fitur & Modul Aplikasi

### 1. Bento-Style Portal Selector (Halaman Utama `/`)
Halaman pendaratan (*landing page*) interaktif bergaya Bento dengan efek kaca (*glassmorphism*) untuk mengarahkan pengguna ke portal yang tepat secara cepat:
*   **Portal Manajemen & Analitik** (Admin/Manager Dashboard)
*   **Portal Stasiun Produksi** (Tablet Kiosk untuk Operator)
*   **Pelacakan Pesanan Pelanggan** (Customer Portal bebas hambatan)

### 2. Admin / Manager Mode
*   **KPI & Pipeline Tracker**: Menampilkan visualisasi performa produksi terkini secara real-time.
*   **Order Wizard & Splitting**: Memungkinkan pembuatan pesanan berskala besar, yang otomatis memilah produk berdasarkan kombinasi Warna dan Ukuran menjadi `order_items` terpisah untuk mempermudah pengerjaan divisi pemotongan (*cutting*).
*   **Production Board (Kanban)**: Memantau jalannya alur produksi dari tahap ke tahap secara visual.
*   **Product Builder**: Mengelola variasi produk (warna, ukuran, dan jalur pengerjaan/bobot).
*   **Laporan Performa Karyawan**: Analisis produktivitas operator berdasarkan total log kerja yang valid.

### 3. Station Mode (Kiosk Tablet)
*   **PIN-based Auth**: Operator masuk ke stasiun tertentu menggunakan 6-digit PIN unik.
*   **Division-Based Task Filtering**: Secara otomatis menyaring daftar pekerjaan (*production tasks*) di backend berdasarkan divisi stasiun tersebut (contoh: stasiun divisi "Cutting" hanya melihat tugas memotong). Akun dengan divisi "Admin" akan melihat seluruh tugas.
*   **Work Logging Modal**: Input jumlah pengerjaan harian yang cepat dengan keypad numerik layar sentuh yang besar dan ramah sentuhan.
*   **QC & Defect Logging**: Pencatatan cacat produk beserta kategorinya secara mendalam untuk evaluasi kualitas berkelanjutan.

### 4. Portal Pelanggan (Customer Tracking)
*   **Public Tracking**: Akses tanpa login dengan hanya memasukkan Nomor PO (*PO Number*).
*   **Visual Status Timeline**: Menampilkan kemajuan produksi dalam bentuk timeline grafis yang menawan.

---

## 🗄️ Skema Database & Relasi

Aplikasi ini menggunakan 15 tabel basis data yang saling terintegrasi secara harmonis:

```
Customer (Pelanggan)
  └── hasMany Products (Daftar Produk)
  └── hasMany Orders (Daftar Pesanan)

Product (Produk)
  └── hasMany ProductVariants (Variasi Warna/Ukuran)
      └── hasMany VariantProcesses (Jalur Proses & Bobot Produksi)
          └── belongsTo ProcessTemplate (Template Master Proses)

Order (Pesanan Pembelian)
  └── belongsTo Customer, Branch (Cabang Produksi)
  └── hasMany OrderItems (Pecahan Item Pesanan)
      └── hasMany ProductionTasks (Tugas Produksi Per Divisi)
          └── hasMany WorkLogs (Log Kerja Operator)
          └── belongsTo ProcessTemplate (Proses yang Dijalankan)
```

---

## 🚀 Petunjuk Instalasi & Menjalankan Aplikasi

Ikuti petunjuk di bawah ini untuk menyiapkan lingkungan pengembangan lokal Anda:

### Prasyarat System
*   PHP 8.2 atau versi di atasnya
*   Composer (Dependency manager PHP)
*   Node.js v18 atau versi di atasnya (beserta npm)
*   Database Engine: MySQL 8.0+ atau SQLite

### Langkah 1: Pengaturan Backend (Laravel)

1.  Buka terminal Anda di direktori utama proyek:
    ```bash
    cd nkidsystem
    ```
2.  Pasang paket dependensi PHP:
    ```bash
    composer install
    ```
3.  Salin berkas konfigurasi env:
    ```bash
    cp .env.example .env
    ```
4.  Konfigurasikan database Anda di dalam file `.env` (misalnya menggunakan SQLite atau MySQL):
    ```env
    DB_CONNECTION=sqlite
    # atau jika menggunakan MySQL:
    # DB_CONNECTION=mysql
    # DB_HOST=127.0.0.1
    # DB_PORT=3306
    # DB_DATABASE=nkidsystem
    # DB_USERNAME=root
    # DB_PASSWORD=
    ```
5.  Generate kunci aplikasi:
    ```bash
    php artisan key:generate
    ```
6.  Jalankan migrasi database dan database seeder utama:
    ```bash
    php artisan migrate --seed
    ```
7.  Jalankan server pengembangan Laravel:
    ```bash
    php artisan serve
    ```

### Langkah 2: Pengaturan Frontend (React + Vite)

1.  Pindah ke folder frontend:
    ```bash
    cd frontend
    ```
2.  Pasang semua dependensi NPM:
    ```bash
    npm install
    ```
3.  Buat berkas `.env` lokal untuk frontend Anda:
    ```env
    VITE_API_URL=http://localhost:8000/api
    # atau http://nkidsystem.test/api jika menggunakan Laravel Herd
    ```
4.  Lakukan pemeriksaan awal terhadap ikon Lucide untuk memastikan tidak ada kesalahan import modul:
    ```bash
    npm run check:lucide
    ```
5.  Nyalakan server pengembangan Vite:
    ```bash
    npm run dev
    ```

---

## 🧪 Menjalankan Pengujian (Testing)

Proyek ini dilengkapi dengan pengujian unit di backend dan pengujian E2E (End-to-End) di frontend untuk memastikan stabilitas kode.

### 1. Pengujian Backend (Pest PHP / PHPUnit)
Untuk menjalankan pengujian fitur (seperti penyaringan tugas stasiun berbasis divisi):
```bash
# Dari root proyek
php artisan test
```

### 2. Pengujian Frontend E2E (Cypress)
Untuk menjalankan suite pengujian interaksi pengguna di frontend:
```bash
# Masuk ke folder frontend
cd frontend

# Menjalankan tes secara headless (di terminal)
npx cypress run

# Membuka Cypress Test Runner UI interaktif
npx cypress open
```

---

## 📝 Aturan Kritis Pengembang (Developer Rules)

Bagi pengembang yang ingin memodifikasi repositori ini, harap patuhi 5 pilar arsitektur berikut:

1.  **Anti Observers**: Jangan pernah menggunakan Laravel Observers untuk kalkulasi progres. Gunakan skema **Events + Listeners** agar lebih mudah dilacak secara asinkron.
2.  **Anti On-Read Aggregations**: Jangan gunakan fungsi SQL `SUM()` atau `COUNT()` saat user melakukan aksi pembacaan (*read*). Selalu manfaatkan kolom snapshot (`progress_percent`, `completed_quantity`) yang nilainya sudah ter-cache.
3.  **Atomic Writes**: Semua penulisan data log kerja atau QC wajib berada di dalam blok `DB::transaction()` dan memanfaatkan `lockForUpdate()` demi integritas data konkuren yang tinggi.
4.  **Stateless Frontend**: Frontend React bersifat stateless terhadap kebenaran data bisnis. Sumber kebenaran mutlak (*source of truth*) sepenuhnya berada di tangan Backend & Database.
5.  **API Contract Match**: Jika terjadi ketidakcocokan field data, frontend yang wajib menyesuaikan format backend dan skema database, bukan sebaliknya.
