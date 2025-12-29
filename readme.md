
# Panduan Implementasi Portal SPMI UNUGHA Cilacap

Aplikasi ini adalah dashboard Sistem Penjaminan Mutu Internal (SPMI) untuk Universitas Nahdlatul Ulama Al Ghazali (UNUGHA) Cilacap.

## 🔑 Akses Default (Development/Initial)
Gunakan kredensial berikut untuk masuk pertama kali sebagai Admin:
- **Username:** `admin`
- **Password:** `admin123`

*Catatan: Admin dapat membuatkan akun untuk Auditee (17 Prodi) dan Auditor melalui menu "Manajemen Akun".*

## 🛠️ Persiapan Database (Google Sheets)
Aplikasi ini menggunakan `localStorage` untuk demo, namun siap dihubungkan ke Google Sheets:
1. Buat Google Sheet dengan tab:
   - `Users`: Kolom `id, username, password, role, prodi`.
   - `AuditData`: Kolom `prodi, indicatorId, achievementValue, docLink, status, notes, lastUpdated`.

## 🚀 Deployment ke Produksi (Google Apps Script)
1. Buka **Extensions > Apps Script** di Google Sheets Anda.
2. Gunakan fungsi `doGet` untuk merender UI React yang sudah di-build.
3. Pastikan untuk mengatur **Deploy > Web App** dengan akses "Anyone".

## 🛡️ Role & Hak Akses
1. **Admin:** Full kontrol. Menambah indikator (via code constants), membuat akun Auditor dan Auditee (Prodi), melihat semua laporan.
2. **Auditee (Prodi):** Mengisi nilai ketercapaian dan melampirkan link Google Drive sebagai bukti fisik.
3. **Auditor:** Melakukan verifikasi/validasi terhadap data yang diisi Auditee. Memberikan status "Tercapai" atau "Tolak" beserta catatan.

## 💡 Solusi "aistudio.google.com refused to connect"
Error ini terjadi jika Anda mencoba memuat dashboard AI eksternal dalam `iframe`. Aplikasi ini menggunakan **Google GenAI SDK** secara native, sehingga komunikasi AI dilakukan di latar belakang (API level) dan tidak akan memicu error koneksi/refusal tersebut di UI.

---
*SPMI UNUGHA Cilacap - Budaya Mutu, Tanggung Jawab Bersama.*
