# Quick Start - Dashboard Owner

## Akses Cepat

1. **Portal Owner**: `owner-welcome.html` (Landing page dengan pilihan Register/Login)
2. **Dashboard**: `owner-dashboard.html` (Dashboard utama setelah login)

## Icon di Navbar
Klik icon **shield** (🛡️) di pojok kanan atas halaman index.html untuk akses portal owner.

## Registrasi Owner Baru

1. Buka `owner-register.html`
2. Isi data:
   - Nama Lengkap
   - Email (akan digunakan untuk login)
   - Nomor Telepon
   - Password (minimal 6 karakter)
   - Konfirmasi Password
3. Klik "Daftar Sebagai Owner"
4. Setelah berhasil, akan redirect ke halaman login

## Login Owner

1. Buka `owner-login.html`
2. Masukkan email dan password
3. Otomatis redirect ke dashboard

## Fitur Dashboard

### 📊 Overview
- Statistik real-time (Total Kamar, Tersewa, Tersedia, Pendapatan)
- Chart penyewaan 6 bulan terakhir
- Chart status kamar (Pie/Doughnut)

### 👥 Daftar Penyewa
- Tabel lengkap semua penyewa
- Search & Filter
- Export CSV
- Aksi: Perpanjang Sewa, Tandai Selesai

### 🏠 Kelola Kamar
- CRUD kamar (Create, Read, Update, Delete)
- Grid card design
- Info lengkap: Nomor, Tipe, Harga, Fasilitas, Status

### 📝 Pesanan
- List semua pesanan dari payment.html
- Konfirmasi/Batalkan pesanan
- Export CSV

### 🔔 Notifikasi
- Alert sewa yang akan berakhir (≤30 hari)
- Badge counter di sidebar

## Testing dengan Sample Data

Untuk populate data testing:

```javascript
// 1. Load script di browser console
const script = document.createElement('script');
script.src = 'seed-dashboard-data.js';
document.body.appendChild(script);

// 2. Jalankan seeder (tunggu script load)
setTimeout(() => {
  seedDashboardData();
}, 1000);

// 3. Refresh halaman
location.reload();
```

Sample data akan membuat:
- 5 kamar (Type 1 & 2)
- 3 penyewa
- 2 booking aktif
- 2 pesanan

## Database Tables

- ✅ profiles (User profiles - owner/renter)
- ✅ properties (Kos properties)
- ✅ rooms (Kamar-kamar kos)
- ✅ bookings (Penyewaan)
- ✅ orders (Pesanan)
- ✅ reviews (Ulasan)

Semua tabel sudah dilengkapi dengan Row Level Security (RLS).

## File Structure

```
owner-welcome.html       → Landing page portal owner
owner-register.html      → Form registrasi owner
owner-login.html         → Form login owner
owner-dashboard.html     → Dashboard utama
owner-dashboard.css      → Styling dashboard
owner-dashboard.js       → Logic & functionality
seed-dashboard-data.js   → Sample data seeder
OWNER_DASHBOARD_README.md → Dokumentasi lengkap
```

## Troubleshooting

**Dashboard kosong?**
- Pastikan login sebagai owner (bukan renter)
- Cek role di tabel profiles
- Jalankan seeder untuk sample data

**Tidak bisa tambah kamar?**
- Property otomatis dibuat saat login pertama
- Cek koneksi Supabase
- Cek browser console untuk error

**RLS Error?**
- Pastikan sudah login
- Cek policy di Supabase dashboard
- Owner hanya akses data sendiri

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Supabase (PostgreSQL)
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **Font**: Poppins (Google Fonts)

## Theme

Mengikuti tema konsisten dari aplikasi utama:
- Background: Dark (#1a1a1a, #2a2a2a)
- Accent: Yellow Gold (#FFD448)
- Text: Light Gray (#e0e0e0)
- Hover/Active: Yellow variants

## Support

Untuk dokumentasi lengkap, baca: `OWNER_DASHBOARD_README.md`
