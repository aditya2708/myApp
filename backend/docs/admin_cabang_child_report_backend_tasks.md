# Backend Task Breakdown: Admin Cabang Child Attendance Report

## Goal
Menyiapkan endpoint laporan kehadiran anak khusus admin cabang yang menyajikan ringkasan lintas shelter beserta detail per anak, mengikuti skema data yang telah disepakati.

## Prasyarat
- Pastikan struktur relasi admin cabang → shelter → anak telah dipahami dari implementasi laporan yang ada.
- Tinjau kembali kebutuhan agregasi laporan anak binaan berdasarkan spesifikasi bisnis terbaru (endpoint laporan admin shelter lama sudah dipensiunkan).

## Daftar Tugas
1. **Mendefinisikan Service Baru**
   - Buat namespace `App\Services\AdminCabang\Reports` bila belum ada.
   - Implementasikan `ChildAttendanceReportService` dengan dependensi repository/ORM yang diperlukan.
   - Siapkan method utama `getSummaryAndList(AdminCabang $adminCabang, array $filters)` yang mengembalikan ringkasan cabang, breakdown shelter, data anak, serta metadata filter.
   - Tambahkan method `getChildDetail(AdminCabang $adminCabang, Anak $child, array $filters)` untuk menyiapkan data detail.

2. **Menyusun Query Agregasi**
   - Turunkan daftar shelter yang dapat diakses admin cabang menggunakan pola akses terbaru yang berlaku.
   - Seleksi anak aktif (`Anak::STATUS_AKTIF`) pada shelter tersebut.
   - Gabungkan data kehadiran melalui relasi `absens`, `absenUsers`, dan `aktivitas` untuk menghitung hadir, terlambat, tidak hadir, dan total sesi dalam rentang tanggal.
   - Rakitan agregasi shelter dan banding persentase (high/medium/low) sesuai batasan terbaru (≥80, 60–79, <60).

3. **Mempersiapkan DTO/Resource**
   - Buat resource koleksi (mis. `AdminCabang\ChildReport\ChildResource`, `ShelterSummaryResource`) agar format JSON konsisten.
   - Pastikan resource menangani format tanggal, persentase (string dengan dua desimal), dan nested relasi (shelter, group).

4. **Controller & Routing**
   - Tambahkan controller `AdminCabangChildReportController` dengan method `index` dan `show`.
   - Daftarkan route baru di `routes/admin_cabang.php`:
     - `GET /reports/children` → `index`
     - `GET /reports/children/{child}` → `show`
   - Terapkan middleware/authorization sama seperti modul laporan admin cabang lainnya.

5. **Validasi & Filter Input**
   - Gunakan `FormRequest` untuk memvalidasi filter (tanggal, kata kunci, banding, shelter, group, pagination).
   - Pastikan filter shelter/group diverifikasi agar berada dalam cakupan admin cabang.

6. **Unit & Feature Tests**
   - Buat test service untuk memastikan kalkulasi persentase dan banding benar.
   - Tambahkan feature test untuk endpoint `index` dan `show` yang memverifikasi struktur JSON sesuai contoh.
   - Sertakan skenario filter (rentang tanggal, shelter tertentu, kata kunci) serta akses yang tidak sah.

7. **Integrasi dengan Seeder/Factory (Opsional)**
   - Perbarui factory `Anak`, `Absen`, dan `Aktivitas` bila diperlukan untuk mendukung skenario test.

8. **Dokumentasi**
   - Tambahkan catatan singkat di README modul admin cabang atau wiki internal mengenai endpoint baru dan parameter filternya.

## Catatan Tambahan
- Tidak perlu menyiapkan fitur ekspor/print.
- Gunakan pagination standar Laravel untuk daftar anak.
- Pertahankan format response global: `{ message, last_refreshed_at, data: {...} }`.

