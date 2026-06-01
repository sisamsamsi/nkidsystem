# Audit Pasif NKids Production Management System

Tanggal audit: 2026-06-01  
Mode audit: read-only / pasif, kecuali pembuatan file laporan ini  
Auditor: senior web developer review  
Scope: frontend, backend, security, konsistensi program, testing, dan rekomendasi peningkatan

## Ringkasan Eksekutif

Sistem berbasis Laravel 12 + Sanctum untuk API/backend dan React 19 + Vite 7 untuk frontend SPA. Arsitektur utama sudah cukup jelas: admin mengelola master/transaction data, station mode memakai PIN, customer dapat melakukan tracking PO publik.

Status umum: aplikasi dapat dibuild dari sisi frontend, tetapi test backend saat ini tidak bisa berjalan karena konflik konfigurasi Pest. Risiko tertinggi ada di authorization backend yang belum konsisten, supply-chain vulnerabilities pada dependency PHP/JS, penyimpanan bearer token di localStorage, dan beberapa inkonsistensi proses produksi/sub-process yang berpotensi membuat data task tidak sinkron.

Prioritas perbaikan:

1. Critical / High: rapikan authorization endpoint master data dan station detail/logging, update dependency security advisories, betulkan konfigurasi test agar regression test bisa berjalan.
2. Medium: konsolidasikan log work ke satu action, samakan generator production task agar sub-process selalu konsisten, batasi logging payload/trace.
3. Low / Improvement: code-splitting frontend, sanitasi konfigurasi build/deploy, perkuat UX error state dan audit trail.

## Batasan Audit

Audit ini tidak mengubah struktur codebase, tidak memperbaiki file sumber, dan tidak melakukan destructive command. Worktree sudah memiliki banyak perubahan sebelum audit dimulai; semua dianggap milik user.

File yang dibuat oleh audit ini:

- `AUDIT_REPORT.md`

Command yang dijalankan:

- `git status --short`
- `rg --files`
- `php artisan route:list`
- `composer test`
- `php artisan test --filter=ExampleTest`
- `php artisan test --filter='cutting station sees only cutting tasks'`
- `npm --prefix frontend run check:lucide`
- `npx vite build --outDir %TEMP%/nkidsystem-vite-audit --emptyOutDir true`
- `composer audit`
- `npm audit --audit-level=moderate`
- `npm --prefix frontend audit --audit-level=moderate`

## Hasil Testing dan Build

### Backend Test

Status: gagal sebelum test berjalan.

Error:

```text
Test case [Tests\TestCase] can not be used. The folder [tests/Feature/StationTasksTest.php] already uses the test case [Tests\TestCase].
```

Penyebab:

- `tests/Pest.php:14-16` sudah melakukan `pest()->extend(Tests\TestCase::class)->in('Feature');`.
- `tests/Feature/StationTasksTest.php:19` kembali memanggil `uses(RefreshDatabase::class, TestCase::class);`.

Dampak:

- Semua test suite Feature gagal load, termasuk filter test yang tidak berkaitan langsung.
- CI/CD tidak dapat menjadi guard regression.

Rekomendasi kecil:

- Di `StationTasksTest.php`, cukup gunakan `uses(RefreshDatabase::class);` atau pindahkan `RefreshDatabase` ke `tests/Pest.php`.
- Setelah itu jalankan ulang `composer test`.

### Frontend Build

Status: berhasil.

Output penting:

- Bundle JS utama: sekitar 595.10 kB minified, gzip 163.57 kB.
- CSS: sekitar 96.80 kB minified, gzip 15.10 kB.
- Warning: chunk lebih besar dari 500 kB.
- Warning: Browserslist/caniuse-lite sudah sekitar 6 bulan usang.

Rekomendasi:

- Tambahkan route-level lazy loading untuk halaman admin/station/customer.
- Jalankan update Browserslist secara berkala.
- Pertimbangkan manualChunks untuk vendor besar seperti React Query, lucide, dan router.

### Frontend Icon Check

Status: lulus.

```text
All lucide-react imports map to existing icons.
```

## Temuan Security

### S1 - Authorization backend belum konsisten pada endpoint master data

Lokasi:

- `routes/api.php`
- `app/Http/Controllers/Api/ProductVariantController.php:9-143`
- `app/Http/Controllers/Api/SubProcessController.php:10-104`
- `app/Http/Controllers/Api/ProductionTaskController.php:13-186`
- `app/Http/Controllers/Api/QcReportController.php:10-60`

Observasi:

- Route group utama hanya memakai `auth:sanctum`.
- Beberapa controller sudah memakai gate `admin-only`, misalnya Customer, Product, Order, Report, User.
- Namun `ProductVariantController` tidak memiliki gate role, sehingga user authenticated non-admin dapat create/update/delete variant dan sync sub-process.
- `SubProcessController` juga tidak memiliki gate role, sehingga authenticated non-admin dapat create/update/delete sub-process.
- `ProductionTaskController` tidak memiliki gate role, sehingga authenticated station/operator token dapat mengakses index/show/update/log-work admin board style jika token diarahkan ke endpoint tersebut.
- `QcReportController` tidak memverifikasi role `qc-or-admin`; semua authenticated user dapat membuat QC report.

Dampak:

- Privilege escalation. Token station/operator bisa memodifikasi master data atau task jika endpoint diketahui.
- UI route guard tidak cukup karena backend tetap menerima request langsung.

Rekomendasi kecil:

- Tambahkan middleware/gate di controller yang belum terlindungi.
- Minimal:
  - `ProductVariantController`: admin-only untuk semua mutation dan mungkin read.
  - `SubProcessController`: admin-only.
  - `ProductionTaskController`: admin-only untuk board endpoint; station flow tetap lewat `StationController`.
  - `QcReportController`: `qc-or-admin` atau gate station QC khusus.

Rekomendasi menengah:

- Buat policy per model: ProductVariantPolicy, SubProcessPolicy, ProductionTaskPolicy, QcReportPolicy.
- Pisahkan route group `/admin/*`, `/station/*`, `/customer/*` agar role boundary eksplisit.

### S2 - Station detail dan log work tidak membatasi akses berdasarkan divisi task

Lokasi:

- `app/Http/Controllers/Api/StationController.php:81-123`
- `app/Http/Controllers/Api/StationController.php:128-143`
- `app/Http/Controllers/Api/StationController.php:148-235`

Observasi:

- `tasks()` memfilter task berdasarkan division user (`CUTTING`, `SEWING`, dll).
- `showTask($id)` langsung `findOrFail($id)` tanpa cek apakah task tersebut sesuai divisi station.
- `logWork($id)` juga langsung lock dan update task berdasarkan ID, tanpa cek station yang sedang login boleh mengerjakan process tersebut.
- `logWork()` hanya memverifikasi operator PIN, bukan hak station terhadap task.

Dampak:

- Station user yang tahu ID task lain dapat melihat atau log pekerjaan task divisi lain.
- Data progress lintas station dapat tercemar.

Rekomendasi kecil:

- Ekstrak helper query `allowedStationTasks($user)` dan gunakan untuk `tasks`, `showTask`, dan `logWork`.
- Di `logWork`, validasi task process sama dengan division station, kecuali division admin.

Rekomendasi menengah:

- Tambahkan test untuk:
  - cutting station tidak bisa `GET /api/station/tasks/{sewingTaskId}`.
  - cutting station tidak bisa `POST /api/station/tasks/{sewingTaskId}/log`.

### S3 - Token bearer disimpan di localStorage

Lokasi:

- `frontend/src/services/authService.js:7-10`
- `frontend/src/services/stationService.js:16-19`
- `frontend/src/lib/axios.js:22-31`

Observasi:

- Admin token dan station token disimpan di `localStorage`.
- Axios mengirim bearer token dari storage pada setiap request.
- `withCredentials` dan `withXSRFToken` aktif, tetapi flow utama tetap bearer token, bukan cookie-only Sanctum SPA auth.

Dampak:

- Jika terjadi XSS di frontend, token dapat dicuri dan digunakan sampai revoked.
- Token Sanctum expiration saat ini `null` di `config/sanctum.php:50`, sehingga token long-lived.

Rekomendasi kecil:

- Set expiration Sanctum token untuk station/admin.
- Revoke token lama saat login ulang station/admin jika sesuai kebutuhan operasional.
- Jangan simpan data user/station berlebih di localStorage.

Rekomendasi menengah:

- Migrasi admin SPA ke Sanctum cookie session dengan CSRF, httpOnly cookie, dan stateful domains yang benar.
- Untuk kiosk station, gunakan token pendek dan rotasi saat logout/idle.

### S4 - Dependency audit menemukan vulnerability high/medium

Command:

- `composer audit`
- `npm audit --audit-level=moderate`
- `npm --prefix frontend audit --audit-level=moderate`

PHP advisories:

- 16 advisories memengaruhi 11 package.
- High: `phpunit/phpunit`, `symfony/mime`.
- Medium: `league/commonmark`, `psy/psysh`, `symfony/http-kernel`, `symfony/mailer`, `symfony/process`, `symfony/routing`.
- Low/unspecified: beberapa package Symfony lain.

Root npm advisories:

- 6 vulnerabilities: 2 moderate, 4 high.
- Affected: `axios`, `follow-redirects`, `picomatch`, `postcss`, `rollup`, `vite`.

Frontend npm advisories:

- 8 vulnerabilities: 3 moderate, 5 high.
- Affected: `axios`, `follow-redirects`, `picomatch`, `postcss`, `react-router`, `react-router-dom`, `rollup`, `vite`.

Dampak:

- Risiko supply chain, terutama dev server Vite/Rollup dan axios.
- React Router advisories perlu dievaluasi walau aplikasi ini tampaknya murni SPA client side.

Rekomendasi kecil:

- Jalankan update dependency terkontrol:
  - `composer update`
  - `npm audit fix`
  - `npm --prefix frontend audit fix`
- Setelah update, wajib build dan test ulang.

Rekomendasi menengah:

- Tambahkan audit dependency ke CI.
- Pisahkan root npm dependency Laravel Vite lama dan frontend dependency jika root package tidak lagi dipakai.

### S5 - File debug dan data snapshot masuk Git tracking

Lokasi:

- `dump_data.php`
- `debug_data.json`
- `toArray())`

Observasi:

- `git ls-files` menunjukkan `debug_data.json` dan `dump_data.php` tracked.
- `dump_data.php:1-15` bootstrap aplikasi dan menulis snapshot user/station/template ke `debug_data.json`.
- `debug_data.json` berisi daftar user, role, division, dan station.
- File `toArray())` adalah sisa output error tinker.

Dampak:

- Informasi internal user/station/role dapat bocor.
- Debug script di root mempermudah eksekusi data dump jika server salah menghidangkan file PHP di luar public root.
- Noise operasional dan risiko commit data environment.

Rekomendasi kecil:

- Hapus file debug dari Git setelah tidak diperlukan.
- Tambahkan pola debug dump ke `.gitignore`.
- Pastikan document root hanya `public/`.

### S6 - Logging payload dan trace terlalu detail

Lokasi:

- `app/Http/Controllers/Api/CustomerController.php:67-81`
- `app/Http/Controllers/Api/CustomerController.php:114-127`
- `app/Http/Middleware/LogApiResponses.php:16-39`

Observasi:

- Customer create/update mencatat payload validasi termasuk email, phone, address.
- Error log mencatat full stack trace dan payload.
- Middleware mencatat IP, user-agent, query, dan indikator authorization.

Dampak:

- PII masuk log aplikasi.
- Trace panjang memperbesar noise dan dapat membocorkan detail internal.

Rekomendasi kecil:

- Turunkan log payload PII menjadi ID/event metadata.
- Trace hanya aktif di local/debug, bukan production.
- Gunakan log context yang terstruktur dan minim: action, actor_id, resource_id, status.

## Temuan Backend dan Konsistensi Data

### B1 - Generator production task tidak konsisten untuk sub-process

Lokasi:

- Create order: `app/Http/Controllers/Api/OrderController.php:136-172`
- Update order new item: `app/Http/Controllers/Api/OrderController.php:254-265`
- Regenerate tasks: `app/Http/Controllers/Api/OrderController.php:502-525`

Observasi:

- Saat create order, task dibuat per sub-process jika variant memiliki sub-process.
- Saat update order dan menambah item baru, variant hanya load `processes`, tidak load `subProcesses`; task dibuat hanya per process.
- Saat regenerate tasks, logic juga hanya per process dan cek existence hanya berdasarkan `order_item_id + process_template_id`, sehingga tidak bisa membuat task per sub-process jika satu process punya banyak sub-process.

Dampak:

- Order yang dibuat lewat flow create dan order yang diedit/regenerate dapat memiliki struktur production task berbeda.
- Progress dan tracking sub-process bisa tidak akurat.

Rekomendasi kecil:

- Ekstrak logic create production tasks ke satu service/action dan gunakan di create, update-new-item, regenerate.
- Key existence untuk sub-process harus mempertimbangkan `sub_process_id`.

Rekomendasi menengah:

- Jadikan `CreateOrderAction` sebagai sumber tunggal, atau buat `ProductionTaskFactoryService`.

### B2 - Ada duplicate implementation untuk log work

Lokasi:

- `app/Actions/LogWorkAction.php:22-81`
- `app/Http/Controllers/Api/StationController.php:148-235`
- `app/Http/Controllers/Api/ProductionTaskController.php:164-186`

Observasi:

- Admin endpoint memakai `LogWorkAction`.
- Station endpoint mengimplementasikan transaksi log work sendiri.
- `LogWorkAction` dispatch `TaskProgressUpdated`; station endpoint tidak dispatch event tersebut.

Dampak:

- Progress order dapat berbeda tergantung endpoint yang dipakai.
- Fix concurrency atau validasi harus dilakukan di dua tempat.

Rekomendasi kecil:

- StationController harus memanggil `LogWorkAction` setelah validasi PIN dan authorization station.
- Pastikan event progress dispatch sama untuk semua flow log work.

### B3 - Role UI dan role backend tidak sinkron

Lokasi:

- `frontend/src/App.jsx:23-31`
- Backend gates di `app/Providers/AppServiceProvider.php:32-38`

Observasi:

- Frontend `PrivateRoute` default mengizinkan `admin` dan `qc` masuk seluruh area admin.
- Backend admin controllers memakai gate `admin-only`, sehingga role `qc` dapat melihat route UI tetapi akan mendapat 403 di banyak API.

Dampak:

- UX untuk QC membingungkan.
- Risiko developer keliru menganggap QC memang boleh masuk semua halaman admin.

Rekomendasi kecil:

- Set route admin default hanya `admin`.
- Buat route khusus QC jika memang QC perlu dashboard/report tertentu.

### B4 - Endpoint import order masih diekspos sebagai placeholder 501

Lokasi:

- `routes/api.php`
- `app/Http/Controllers/Api/OrderController.php:471-479`

Observasi:

- `POST /api/orders/import` tersedia untuk admin, tetapi selalu 501.

Dampak:

- Frontend atau integrasi dapat menganggap fitur tersedia.
- Membuka permukaan API yang belum selesai.

Rekomendasi kecil:

- Sembunyikan route sampai fitur siap, atau dokumentasikan sebagai disabled.

### B5 - Database constraints dan model behavior perlu dirapikan

Observasi:

- `product_variants` delete di `ProductVariantController.php:87-89` langsung delete tanpa cek order item aktif.
- `SubProcessController.php:95-97` delete langsung tanpa cek pivot/variant usage.
- Migration awal branch_id wajib, lalu migration lain membuat nullable; ini valid, tetapi perlu dipastikan deployment fresh dan migration order selalu benar.

Dampak:

- Delete master data bisa gagal karena FK atau meninggalkan efek bisnis yang tidak jelas.
- Error DB dapat muncul sebagai 500 jika tidak ditangani.

Rekomendasi:

- Tambahkan guard bisnis sebelum delete.
- Return 422 dengan pesan jelas jika resource dipakai.
- Tambahkan database unique/index sesuai query dominan: `orders.po_number`, `production_tasks.order_item_id`, `production_tasks.process_template_id`, `production_tasks.sub_process_id`, `work_logs.created_at`.

## Temuan Frontend

### F1 - Bundle utama terlalu besar untuk satu entry

Lokasi:

- `frontend/src/App.jsx`
- `frontend/vite.config.js`

Observasi:

- Semua halaman diimport statis di `App.jsx`.
- Build menghasilkan chunk JS utama 595 kB minified.

Dampak:

- First load berat, terutama untuk station/customer yang tidak membutuhkan seluruh modul admin.

Rekomendasi kecil:

- Gunakan `React.lazy` + `Suspense` untuk route-level code splitting.
- Pisahkan admin, station, tracking, dan print page.

### F2 - Auth route guard bergantung pada localStorage tanpa verifikasi server

Lokasi:

- `frontend/src/App.jsx:23-38`
- `frontend/src/services/authService.js:34-52`
- `frontend/src/services/stationService.js:66-76`

Observasi:

- Route dianggap authenticated jika token ada di localStorage.
- User role juga dibaca dari localStorage.

Dampak:

- UI dapat menampilkan halaman sampai API 401/403.
- Role di localStorage bisa dimodifikasi user, walaupun backend tetap final authority.

Rekomendasi kecil:

- Saat app start, validasi `/auth/user` untuk admin token.
- Untuk station, validasi lightweight endpoint atau handle token invalid sebelum render dashboard.

### F3 - Base URL frontend fallback hard-coded ke local domain

Lokasi:

- `frontend/src/lib/axios.js:4`

Observasi:

- Fallback API URL adalah `http://nkidsystem.test/api`.

Dampak:

- Build production tanpa `VITE_API_URL` akan mengarah ke local Herd domain.

Rekomendasi kecil:

- Gagal build jika `VITE_API_URL` kosong untuk production.
- Atau gunakan relative `/api` jika frontend selalu diserve dari Laravel domain yang sama.

### F4 - QC station detection berbasis nama station

Lokasi:

- `frontend/src/pages/station/StationDashboard.jsx`

Observasi:

- UI menentukan QC dari `station.name` berisi `qc` atau `quality`.
- Data station memiliki role/division, tetapi UI tidak memakainya sebagai sumber utama.

Dampak:

- Station QC bernama tidak standar bisa salah mode.
- Station non-QC dengan nama mengandung qc/quality bisa salah mode.

Rekomendasi kecil:

- Gunakan `station.role === 'qc'` atau `station.division === 'QC'`.
- Backend tetap harus enforce role QC pada endpoint QC.

### F5 - Error handling masih campur alert, console, dan inline state

Observasi:

- Ada beberapa `alert()` pada admin flow.
- `console.error` masih ada di beberapa catch.
- ErrorBoundary sudah ada dan cukup baik untuk crash global, tetapi form/listing error masih belum konsisten.

Rekomendasi kecil:

- Buat komponen toast atau inline error standar.
- Di production, batasi console error atau arahkan ke monitoring.

## Temuan Konfigurasi dan Deployment

### C1 - `.env` local menunjukkan APP_DEBUG=true

Lokasi:

- `.env`
- `.env.example`

Observasi:

- `.env` local: `APP_ENV=local`, `APP_DEBUG=true`.
- `.env.example` juga default `APP_DEBUG=true`.

Dampak:

- Aman untuk local, tetapi berbahaya jika contoh config dipakai mentah di server.

Rekomendasi kecil:

- Pastikan production deploy override `APP_ENV=production`, `APP_DEBUG=false`.
- Pertimbangkan `.env.example` menampilkan catatan eksplisit untuk production.

### C2 - CORS hanya mengizinkan localhost dan IP lokal

Lokasi:

- `config/cors.php:22-25`

Observasi:

- Allowed origins hard-coded: `localhost:5173` dan `192.168.128.141:5173`.

Dampak:

- Deploy di domain lain butuh edit config.
- Sulit menjaga parity antar environment.

Rekomendasi kecil:

- Ambil allowed origins dari env, misalnya `CORS_ALLOWED_ORIGINS`.

### C3 - Dua konfigurasi Vite dan dua package.json

Lokasi:

- `package.json`
- `vite.config.js`
- `frontend/package.json`
- `frontend/vite.config.js`

Observasi:

- Root Laravel Vite masih ada untuk `resources/*`.
- Frontend React sebenarnya ada di folder `frontend`.
- `frontend/vite.config.js` build ke `../public` dengan `emptyOutDir: false`.

Dampak:

- Developer bisa menjalankan build yang salah.
- Artefak public lama dapat tertinggal karena `emptyOutDir: false`.

Rekomendasi kecil:

- Dokumentasikan command build resmi.
- Jika SPA React adalah frontend utama, buat script root yang memanggil `npm --prefix frontend run build`.
- Pertimbangkan output ke folder staging lalu deploy atomik.

## Rekomendasi Peningkatan Berdasarkan Skala

### Skala Kecil (1-2 hari)

- Betulkan konfigurasi Pest agar `composer test` berjalan.
- Tambahkan gate admin-only untuk `ProductVariantController` dan `SubProcessController`.
- Tambahkan gate QC/admin untuk `QcReportController`.
- Batasi `StationController::showTask` dan `logWork` berdasarkan division station.
- Hapus file debug tracked: `dump_data.php`, `debug_data.json`, `toArray())`.
- Jalankan update dependency security patch dan audit ulang.
- Ubah frontend admin route default menjadi admin-only.
- Gunakan `station.role` atau `station.division` untuk mode QC UI.

### Skala Menengah (1-2 minggu)

- Ekstrak service tunggal untuk production task generation.
- Refactor station log work agar memakai `LogWorkAction`.
- Tambahkan policy/model authorization.
- Tambahkan regression test untuk authorization, station division, QC report, dan sub-process task creation.
- Tambahkan CI pipeline: composer test, npm build, npm audit, composer audit.
- Code splitting frontend per route.
- Standarisasi error/toast component dan form validation display.

### Skala Besar (1-2 bulan)

- Migrasi auth admin ke Sanctum cookie-based SPA dengan CSRF dan httpOnly cookie.
- Buat RBAC formal: admin, qc, operator, station, customer/public.
- Observability: audit log terstruktur, request ID, error monitoring, security events.
- Perkuat domain model produksi: process, sub-process, task dependency, partial completion, QC pass/reject impact ke progress.
- Tambahkan E2E test stabil dengan seeded API atau test database khusus.
- Deployment hardening: environment matrix, config validation, asset manifest strategy, backup/restore, migration rollback plan.

## Kesimpulan

Codebase sudah memiliki fondasi fitur yang jelas dan beberapa upaya hardening seperti transaction lock pada log work, throttle pada login/tracking, ErrorBoundary frontend, dan pembatasan pagination. Namun saat ini sistem belum siap dianggap aman atau stabil untuk production tanpa perbaikan authorization, dependency security, dan test suite.

Urutan kerja paling rasional:

1. Pulihkan test suite.
2. Tutup celah authorization backend.
3. Update dependency vulnerability.
4. Konsolidasikan production task/log work logic.
5. Baru lanjut ke optimasi frontend dan peningkatan UX.
