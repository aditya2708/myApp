# Semester Management Filtering Tasks

## Context
Saat ini `SemesterManagementScreen` menampilkan seluruh semester dari API tanpa mempertimbangkan kurikulum yang sedang dipilih atau aktif. Akibatnya, cabang yang baru mengganti kurikulum aktif tetap melihat semester milik kurikulum lama sehingga bisa terjadi mismatch data saat memilih semester aktif.

## Tujuan
Pastikan daftar semester yang tampil di antarmuka Admin Cabang selalu selaras dengan kurikulum yang sedang dikelola (aktif atau terpilih).

## Task List

1. **Tambahkan filter kurikulum pada query daftar semester**
   - Update pemanggilan `useGetSemesterListQuery` di `SemesterManagementScreen` agar mengirimkan `kurikulum_id` sesuai `effectiveKurikulumId`.
   - Sesuaikan definisi endpoint `getSemesterList` di `kurikulumApi` (jika perlu) supaya meneruskan parameter `kurikulum_id` ke backend.
   - Pastikan fallback (mis. ketika `effectiveKurikulumId` belum tersedia) tetap berfungsi tanpa memunculkan error jaringan.

2. **Lakukan penyaringan sisi-klien sebagai pertahanan tambahan**
   - Setelah menerima response semester, filter array `allSemesters` berdasarkan `kurikulum_id` yang cocok dengan `effectiveKurikulumId`.
   - Jika tidak ada kurikulum aktif/terpilih, tampilkan seluruh semester apa adanya untuk mempertahankan perilaku lama.

3. **Perbaiki UX ketika tidak ada semester yang cocok**
   - Tampilkan pesan kosong yang menjelaskan bahwa kurikulum aktif belum memiliki semester ketika hasil filter kosong.
   - Opsional: tambahkan call-to-action untuk membuat semester baru.

## Catatan Tambahan
- Verifikasi bahwa perubahan tidak memengaruhi fitur aktivasi semester atau proses CRUD lainnya.
- Pertimbangkan untuk menambahkan pengujian manual/regresi guna memastikan pergantian kurikulum memicu daftar semester yang benar.
