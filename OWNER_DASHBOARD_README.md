# Dashboard Owner - Kost BaLy

## Akses Dashboard

1. **URL Dashboard**: `owner-dashboard.html`
2. **Login Owner**: `owner-login.html`
3. **Register Owner**: `owner-register.html`

## Fitur-Fitur Dashboard

### 1. Overview (Statistik)
- Total Kamar
- Kamar Tersewa
- Kamar Tersedia
- Pendapatan Bulan Ini
- Grafik Statistik Penyewaan (6 bulan terakhir)
- Grafik Status Kamar (Doughnut Chart)

### 2. Daftar Penyewa
**Fitur:**
- Tabel lengkap dengan informasi penyewa
- Kolom: Nama Penyewa, No. Kamar, Tanggal Mulai, Tanggal Selesai, Status Pembayaran, Status Sewa
- Fitur Pencarian (real-time)
- Filter berdasarkan Status Pembayaran (paid, pending, expired)
- Filter berdasarkan Status Booking (active, completed, cancelled)
- Export ke CSV
- Aksi Cepat:
  - Perpanjang Sewa
  - Tandai Selesai

### 3. Kelola Kamar
**Fitur:**
- Tampilan Grid Card untuk setiap kamar
- Informasi: Nomor Kamar, Tipe, Harga, Fasilitas, Status (Tersedia/Tersewa)
- CRUD Operations:
  - **Create**: Tambah kamar baru
  - **Read**: Lihat detail kamar
  - **Update**: Edit informasi kamar
  - **Delete**: Hapus kamar (dengan konfirmasi)

**Form Kamar:**
- Nomor Kamar
- Tipe Kamar (Type 1, Type 2)
- Harga per Bulan
- Fasilitas (textarea)
- Status Ketersediaan (checkbox)

### 4. Pesanan
**Fitur:**
- Tabel daftar pesanan dari payment.html
- Kolom: No. Pesanan, Nama, Tipe Kamar, Durasi, Total, Status
- Fitur Pencarian
- Filter berdasarkan Status (pending, confirmed, cancelled)
- Export ke CSV
- Aksi Cepat:
  - Konfirmasi Pesanan
  - Batalkan Pesanan

### 5. Notifikasi
**Fitur:**
- Alert untuk sewa yang akan berakhir (30 hari ke depan)
- Badge counter di sidebar
- Klasifikasi urgent (7 hari atau kurang) dan warning
- Informasi: Nama Penyewa, No. Kamar, Sisa Hari

## Cara Menggunakan

### Setup Awal

1. **Buat Akun Owner**
   - Buka `owner-register.html`
   - Isi form dengan lengkap (Email, Password, Nama, Telepon)
   - Klik "Daftar Sebagai Owner"

2. **Login Owner**
   - Buka `owner-login.html`
   - Masukkan email dan password
   - Otomatis redirect ke dashboard

3. **Akses dari Index**
   - Di halaman index.html terdapat icon shield di navbar (kanan atas)
   - Klik icon tersebut untuk ke halaman login owner

### Mengelola Kamar

1. **Tambah Kamar Baru**
   - Klik menu "Kelola Kamar" di sidebar
   - Klik tombol "Tambah Kamar"
   - Isi form:
     - Nomor Kamar (contoh: 101, 201)
     - Tipe Kamar (pilih Type 1 atau Type 2)
     - Harga per bulan (angka)
     - Fasilitas (deskripsi lengkap)
     - Status tersedia (centang jika tersedia)
   - Klik "Simpan"

2. **Edit Kamar**
   - Klik tombol "Edit" pada card kamar
   - Ubah data yang diperlukan
   - Klik "Simpan"

3. **Hapus Kamar**
   - Klik tombol "Hapus" pada card kamar
   - Konfirmasi penghapusan
   - Kamar akan dihapus permanent

### Mengelola Penyewa

1. **Lihat Daftar Penyewa**
   - Klik menu "Daftar Penyewa" di sidebar
   - Tabel akan menampilkan semua penyewa aktif

2. **Cari Penyewa**
   - Gunakan search box untuk mencari berdasarkan nama, nomor kamar, dll
   - Hasil akan difilter secara real-time

3. **Filter Penyewa**
   - Filter Status Pembayaran: paid, pending, expired
   - Filter Status Sewa: active, completed, cancelled
   - Kombinasi filter dapat digunakan bersamaan

4. **Perpanjang Sewa**
   - Klik tombol "Perpanjang" pada baris penyewa
   - Input jumlah bulan perpanjangan
   - Sistem akan otomatis update tanggal selesai

5. **Selesaikan Sewa**
   - Klik tombol "Selesai" untuk menandai sewa selesai
   - Status akan berubah menjadi "completed"
   - Kamar akan kembali tersedia

6. **Export Data**
   - Klik tombol "Export CSV" di bagian atas
   - File CSV akan otomatis terdownload
   - Bisa dibuka dengan Excel/Google Sheets

### Mengelola Pesanan

1. **Lihat Pesanan**
   - Klik menu "Pesanan" di sidebar
   - Tabel akan menampilkan semua pesanan dari sistem booking

2. **Konfirmasi Pesanan**
   - Untuk pesanan berstatus "Pending"
   - Klik tombol "Konfirmasi"
   - Status akan berubah menjadi "Terkonfirmasi"

3. **Batalkan Pesanan**
   - Untuk pesanan berstatus "Pending"
   - Klik tombol "Batalkan"
   - Status akan berubah menjadi "Dibatalkan"

4. **Export Pesanan**
   - Klik tombol "Export CSV"
   - Data pesanan akan terdownload dalam format CSV

### Monitoring Notifikasi

1. **Cek Badge**
   - Badge merah di menu "Notifikasi" menunjukkan jumlah alert

2. **Lihat Detail**
   - Klik menu "Notifikasi"
   - List akan menampilkan:
     - Sewa yang akan berakhir dalam 30 hari
     - Warna merah: urgent (≤7 hari)
     - Warna kuning: warning (8-30 hari)

## Testing dengan Sample Data

Untuk testing, gunakan script seed data:

1. Login sebagai owner
2. Buka browser console (F12)
3. Load script:
   ```javascript
   const script = document.createElement('script');
   script.src = 'seed-dashboard-data.js';
   document.body.appendChild(script);
   ```
4. Jalankan seeder:
   ```javascript
   seedDashboardData();
   ```
5. Refresh halaman dashboard

Script akan membuat:
- 5 kamar sample (mix Type 1 dan Type 2)
- 3 penyewa sample
- 2 booking aktif
- 2 pesanan sample

## Database Schema

### Tables:
1. **profiles**: User profiles (owner & renter)
2. **properties**: Kos properties
3. **rooms**: Kamar-kamar kos
4. **bookings**: Penyewaan aktif
5. **orders**: Pesanan dari payment form
6. **reviews**: Ulasan dari penyewa

### Row Level Security (RLS):
- Owner hanya bisa akses data milik sendiri
- Renter hanya bisa akses booking sendiri
- Public bisa view data yang active

## Responsiveness

Dashboard responsif untuk:
- Desktop (optimal)
- Tablet (adjustable)
- Mobile (sidebar collapse, stack layout)

Breakpoints:
- 768px: Tablet layout
- 480px: Mobile layout (sidebar icons only)

## Export Format

File CSV yang di-export berisi:
- **Penyewa**: Nama, No. Kamar, Tanggal Mulai/Selesai, Status, Total Harga
- **Pesanan**: No. Pesanan, Nama, Tipe Kamar, Durasi, Total, Status, Kontak

## Tips Penggunaan

1. **Backup Data**: Export CSV secara berkala untuk backup
2. **Cek Notifikasi**: Periksa notifikasi setiap hari untuk sewa yang akan berakhir
3. **Update Status**: Selalu update status pembayaran dan sewa agar data akurat
4. **Validasi Pesanan**: Konfirmasi pesanan setelah verifikasi pembayaran

## Troubleshooting

### Dashboard tidak muncul data
- Pastikan sudah login sebagai owner
- Cek role user di tabel profiles harus 'owner'
- Pastikan ada property di database

### Tidak bisa tambah kamar
- Cek koneksi Supabase
- Pastikan user memiliki property
- Cek RLS policy di Supabase

### Export tidak jalan
- Pastikan browser mengizinkan download
- Cek ada data yang akan di-export
- Coba browser lain jika masalah persists

## Support

Untuk pertanyaan dan bantuan, hubungi developer atau cek dokumentasi Supabase.
