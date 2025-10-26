<?php

Route::middleware('role:admin_shelter')->prefix('admin-shelter')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\API\AdminShelterController::class, 'dashboard']);
    Route::get('/profile', [App\Http\Controllers\API\AdminShelterController::class, 'getProfile']);
    Route::post('/profile', [App\Http\Controllers\API\AdminShelterController::class, 'updateProfile']);
    Route::get('/kurikulum/notifications', [App\Http\Controllers\API\AdminShelter\NotificationController::class, 'index']);
    Route::put('/notifications/{notification}/read', [App\Http\Controllers\API\AdminShelter\NotificationController::class, 'markAsRead']);

    Route::controller(App\Http\Controllers\API\AdminShelter\AdminShelterKurikulumController::class)->group(function () {
        Route::get('/kurikulum', 'index');
        Route::get('/kurikulum/{id}', 'show')->whereNumber('id');
        Route::get('/kurikulum/{id}/preview', 'getPreview')->whereNumber('id');
        Route::get('/kurikulum-dropdown', 'getForDropdown');
    });

    Route::get('/anak', [App\Http\Controllers\API\AdminShelter\AdminShelterAnakController::class, 'index']);
    Route::post('/anak', [App\Http\Controllers\API\AdminShelter\AdminShelterAnakController::class, 'store']);
    Route::get('/anak/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterAnakController::class, 'show']);
    Route::post('/anak/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterAnakController::class, 'update']);
    Route::delete('/anak/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterAnakController::class, 'destroy']);
    Route::post('/anak/{id}/toggle-status', [App\Http\Controllers\API\AdminShelter\AdminShelterAnakController::class, 'toggleStatus']);

    Route::get('/anak/{anakId}/prestasi', [App\Http\Controllers\API\AdminShelter\AdminShelterPrestasiController::class, 'index']);
    Route::post('/anak/{anakId}/prestasi', [App\Http\Controllers\API\AdminShelter\AdminShelterPrestasiController::class, 'store']);
    Route::get('/anak/{anakId}/prestasi/{prestasiId}', [App\Http\Controllers\API\AdminShelter\AdminShelterPrestasiController::class, 'show']);
    Route::post('/anak/{anakId}/prestasi/{prestasiId}', [App\Http\Controllers\API\AdminShelter\AdminShelterPrestasiController::class, 'update']);
    Route::delete('/anak/{anakId}/prestasi/{prestasiId}', [App\Http\Controllers\API\AdminShelter\AdminShelterPrestasiController::class, 'destroy']);

    Route::get('/anak/{anakId}/riwayat', [App\Http\Controllers\API\AdminShelter\AdminShelterRiwayatController::class, 'index']);
    Route::post('/anak/{anakId}/riwayat', [App\Http\Controllers\API\AdminShelter\AdminShelterRiwayatController::class, 'store']);
    Route::get('/anak/{anakId}/riwayat/{riwayatId}', [App\Http\Controllers\API\AdminShelter\AdminShelterRiwayatController::class, 'show']);
    Route::post('/anak/{anakId}/riwayat/{riwayatId}', [App\Http\Controllers\API\AdminShelter\AdminShelterRiwayatController::class, 'update']);
    Route::delete('/anak/{anakId}/riwayat/{riwayatId}', [App\Http\Controllers\API\AdminShelter\AdminShelterRiwayatController::class, 'destroy']);

    Route::get('/anak/{childId}/surat', [App\Http\Controllers\API\AdminShelter\AdminShelterSuratController::class, 'index']);
    Route::post('/anak/{childId}/surat', [App\Http\Controllers\API\AdminShelter\AdminShelterSuratController::class, 'store']);
    Route::get('/anak/{childId}/surat/{suratId}', [App\Http\Controllers\API\AdminShelter\AdminShelterSuratController::class, 'show']);
    Route::post('/anak/{childId}/surat/{suratId}', [App\Http\Controllers\API\AdminShelter\AdminShelterSuratController::class, 'update']);
    Route::delete('/anak/{childId}/surat/{suratId}', [App\Http\Controllers\API\AdminShelter\AdminShelterSuratController::class, 'destroy']);

    Route::get('/tutor', [App\Http\Controllers\API\AdminShelter\AdminShelterTutorController::class, 'index']);
    Route::post('/tutor', [App\Http\Controllers\API\AdminShelter\AdminShelterTutorController::class, 'store']);

    // Phase 3: Tutor for form selection (MUST be before /tutor/{id} route)
    Route::get('/tutor/available', [App\Http\Controllers\API\AdminShelter\AdminShelterTutorController::class, 'getAvailableTutor']);

    Route::get('/tutor/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterTutorController::class, 'show']);
    Route::post('/tutor/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterTutorController::class, 'update']);
    Route::delete('/tutor/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterTutorController::class, 'destroy']);

    Route::get('/jenis-kompetensi', [App\Http\Controllers\API\AdminShelter\TutorCompetencyController::class, 'getJenisKompetensi']);

    Route::get('/tutor/{tutorId}/competency', [App\Http\Controllers\API\AdminShelter\TutorCompetencyController::class, 'index']);
    Route::post('/tutor/{tutorId}/competency', [App\Http\Controllers\API\AdminShelter\TutorCompetencyController::class, 'store']);
    Route::get('/tutor/{tutorId}/competency/{id}', [App\Http\Controllers\API\AdminShelter\TutorCompetencyController::class, 'show']);
    Route::post('/tutor/{tutorId}/competency/{id}', [App\Http\Controllers\API\AdminShelter\TutorCompetencyController::class, 'update']);
    Route::delete('/tutor/{tutorId}/competency/{id}', [App\Http\Controllers\API\AdminShelter\TutorCompetencyController::class, 'destroy']);

    Route::get('/kelompok', [App\Http\Controllers\API\AdminShelter\AdminShelterKelompokController::class, 'index']);
    Route::post('/kelompok', [App\Http\Controllers\API\AdminShelter\AdminShelterKelompokController::class, 'store']);
    Route::get('/kelompok/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterKelompokController::class, 'show']);
    Route::post('/kelompok/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterKelompokController::class, 'update']);
    Route::delete('/kelompok/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterKelompokController::class, 'destroy']);

    // Phase 3: Enhanced Kelompok Management Routes (New methods with better naming)
    Route::get('/kelompok/{kelompokId}/available-anak', [App\Http\Controllers\API\AdminShelter\AdminShelterKelompokController::class, 'getAvailableAnak']);
    Route::post('/kelompok/{kelompokId}/add-anak', [App\Http\Controllers\API\AdminShelter\AdminShelterKelompokController::class, 'addAnak']);
    Route::delete('/kelompok/{kelompokId}/remove-anak/{anakId}', [App\Http\Controllers\API\AdminShelter\AdminShelterKelompokController::class, 'removeAnak']);
    Route::get('/kelompok/{kelompokId}/stats', [App\Http\Controllers\API\AdminShelter\AdminShelterKelompokController::class, 'getKelompokStats']);
    Route::get('/kelompok-available-kelas', [App\Http\Controllers\API\AdminShelter\AdminShelterKelompokController::class, 'getAvailableKelas']);

    Route::get('/keluarga', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'index']);
    Route::post('/keluarga', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'store']);
    Route::get('/keluarga/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'show']);
    Route::post('/keluarga/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'update']);
    Route::delete('/keluarga/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'destroy']);
    Route::delete('keluarga/{id}/force', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'forceDestroy']);
    Route::get('/keluarga-dropdown', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'getDropdownData']);
    Route::get('/keluarga-wilbin/{id_kacab}', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'getByWilbin']);

    Route::get('/kebutuhan-anak', [App\Http\Controllers\API\AdminShelter\KebutuhanAnakController::class, 'index']);
    Route::post('/kebutuhan-anak', [App\Http\Controllers\API\AdminShelter\KebutuhanAnakController::class, 'store']);
    Route::put('/kebutuhan-anak/{id}', [App\Http\Controllers\API\AdminShelter\KebutuhanAnakController::class, 'update']);
    Route::delete('/kebutuhan-anak/{id}', [App\Http\Controllers\API\AdminShelter\KebutuhanAnakController::class, 'destroy']);

    Route::get('/activity', [App\Http\Controllers\API\AdminShelter\ActivityController::class, 'index']);
    Route::post('/activity', [App\Http\Controllers\API\AdminShelter\ActivityController::class, 'store']);
    Route::get('/activity/{id}', [App\Http\Controllers\API\AdminShelter\ActivityController::class, 'show']);
    Route::put('/activity/{id}', [App\Http\Controllers\API\AdminShelter\ActivityController::class, 'update']);
    Route::delete('/activity/{id}', [App\Http\Controllers\API\AdminShelter\ActivityController::class, 'destroy']);

    Route::get('/activity-categories', [App\Http\Controllers\API\AdminShelter\ActivityCategoryController::class, 'index']);
    Route::post('/activity-categories', [App\Http\Controllers\API\AdminShelter\ActivityCategoryController::class, 'store']);
    Route::put('/activity-categories/{id}', [App\Http\Controllers\API\AdminShelter\ActivityCategoryController::class, 'update']);
    Route::delete('/activity-categories/{id}', [App\Http\Controllers\API\AdminShelter\ActivityCategoryController::class, 'destroy']);

    Route::post('/activity-reports', [App\Http\Controllers\API\AdminShelter\ActivityReportController::class, 'store']);
    Route::get('/activity-reports/by-activity/{id_aktivitas}', [App\Http\Controllers\API\AdminShelter\ActivityReportController::class, 'getByActivity']);
    Route::delete('/activity-reports/{id}', [App\Http\Controllers\API\AdminShelter\ActivityReportController::class, 'destroy']);

    // Kurikulum read endpoints (index, detail, preview, dropdown)
    Route::get('/kurikulum', [App\Http\Controllers\API\AdminShelter\AdminShelterKurikulumController::class, 'index']);
    Route::get('/kurikulum/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterKurikulumController::class, 'show'])->whereNumber('id');
    Route::get('/kurikulum/{id}/preview', [App\Http\Controllers\API\AdminShelter\AdminShelterKurikulumController::class, 'getPreview'])->whereNumber('id');
    Route::get('/kurikulum-dropdown', [App\Http\Controllers\API\AdminShelter\AdminShelterKurikulumController::class, 'getForDropdown']);

    // Phase 3: Kurikulum Consumer (SIMPLIFIED - Read-only data provider)
    Route::get('/kurikulum/all-materi', [App\Http\Controllers\API\AdminShelter\KurikulumConsumerController::class, 'getAllMateri']);
    Route::get('/kurikulum/available-kelas', [App\Http\Controllers\API\AdminShelter\KurikulumConsumerController::class, 'getAvailableKelas']);
    Route::get('/kurikulum/semester-aktif', [App\Http\Controllers\API\AdminShelter\KurikulumConsumerController::class, 'getSemesterAktif']);
    Route::get('/kurikulum/materi/{materi}', [App\Http\Controllers\API\AdminShelter\KurikulumConsumerController::class, 'getMateriDetail']);

    // Kurikulum Dashboard - Comprehensive dashboard data
    Route::get('/kurikulum/dashboard', [App\Http\Controllers\API\AdminShelter\KurikulumDashboardController::class, 'getDashboard']);
    Route::get('/kurikulum/semester-info', [App\Http\Controllers\API\AdminShelter\KurikulumDashboardController::class, 'getSemesterInfo']);
    Route::get('/kurikulum/today-activities', [App\Http\Controllers\API\AdminShelter\KurikulumDashboardController::class, 'getTodayActivities']);
    Route::post('/kurikulum/{id}/set-active', [App\Http\Controllers\API\AdminShelter\AdminShelterKurikulumController::class, 'setActive'])->whereNumber('id');

    // Semester Management for Admin Shelter (Read-only access to cabang semesters)
    Route::get('/semester', [App\Http\Controllers\API\AdminShelter\SemesterController::class, 'index']);
    Route::get('/semester/active', [App\Http\Controllers\API\AdminShelter\SemesterController::class, 'getActive']);
    Route::get('/semester/statistics', [App\Http\Controllers\API\AdminShelter\SemesterController::class, 'getStatistics']);
    Route::get('/semester/{id}', [App\Http\Controllers\API\AdminShelter\SemesterController::class, 'show']);

    // Debug route to test if routes are working
    Route::get('/semester-test', function() {
        return response()->json(['message' => 'Admin Shelter semester routes are working!', 'time' => now()]);
    });

    // Penilaian Management
    Route::get('/jenis-penilaian', [App\Http\Controllers\API\AdminShelter\PenilaianController::class, 'getJenisPenilaian']);
    Route::get('/penilaian', [App\Http\Controllers\API\AdminShelter\PenilaianController::class, 'index']);
    Route::post('/penilaian', [App\Http\Controllers\API\AdminShelter\PenilaianController::class, 'store']);
    Route::get('/penilaian/{id}', [App\Http\Controllers\API\AdminShelter\PenilaianController::class, 'show']);
    Route::put('/penilaian/{id}', [App\Http\Controllers\API\AdminShelter\PenilaianController::class, 'update']);
    Route::delete('/penilaian/{id}', [App\Http\Controllers\API\AdminShelter\PenilaianController::class, 'destroy']);
    Route::get('/penilaian/anak/{idAnak}/semester/{idSemester}', [App\Http\Controllers\API\AdminShelter\PenilaianController::class, 'getByAnakSemester']);
    Route::post('/penilaian/bulk', [App\Http\Controllers\API\AdminShelter\PenilaianController::class, 'bulkStore']);
    Route::post('/penilaian/calculate-nilai-akhir', [App\Http\Controllers\API\AdminShelter\PenilaianController::class, 'calculateNilaiAkhir']);

    // Shelter GPS Configuration
    Route::get('/shelter/gps-config', [App\Http\Controllers\API\AdminShelter\ShelterGpsController::class, 'getGpsConfig']);
    Route::put('/shelter/gps-config', [App\Http\Controllers\API\AdminShelter\ShelterGpsController::class, 'updateGpsConfig']);
    Route::post('/shelter/gps-test', [App\Http\Controllers\API\AdminShelter\ShelterGpsController::class, 'testGpsDistance']);

    // QR Token Management
    Route::prefix('qr-tokens')->group(function () {
        Route::post('/generate', [App\Http\Controllers\API\QrTokenController::class, 'generate']);
        Route::post('/generate-batch', [App\Http\Controllers\API\QrTokenController::class, 'generateBatch']);
        Route::post('/validate-token', [App\Http\Controllers\API\QrTokenController::class, 'validateToken']);
        Route::get('/student/{id_anak}', [App\Http\Controllers\API\QrTokenController::class, 'getActiveToken']);
        Route::post('/invalidate', [App\Http\Controllers\API\QrTokenController::class, 'invalidate']);
        Route::get('/activity/{id_aktivitas}/gps-config', [App\Http\Controllers\API\QrTokenController::class, 'getActivityGpsConfig']);
    });

    // Attendance Management
    Route::prefix('attendance')->group(function () {
        // New unified endpoints
        Route::post('/record', [App\Http\Controllers\API\AttendanceController::class, 'recordByQr']);
        Route::post('/record-manual', [App\Http\Controllers\API\AttendanceController::class, 'recordManually']);

        // Activity attendance endpoints
        Route::get('/activity/{id_aktivitas}', [App\Http\Controllers\API\AttendanceController::class, 'getByActivity']);
        Route::get('/activity/{id_aktivitas}/tutor', [App\Http\Controllers\API\AttendanceController::class, 'getTutorAttendanceForActivity']);
        Route::get('/activity/{id_aktivitas}/members', [App\Http\Controllers\API\AttendanceController::class, 'getActivityMembersWithAttendance']);

        // Student attendance endpoints
        Route::get('/student/{id_anak}', [App\Http\Controllers\API\AttendanceController::class, 'getByStudent']);

        // Verification endpoints
        Route::post('/{id_absen}/verify', [App\Http\Controllers\API\AttendanceController::class, 'manualVerify']);
        Route::post('/{id_absen}/reject', [App\Http\Controllers\API\AttendanceController::class, 'rejectVerification']);
        Route::get('/{id_absen}/verification-history', [App\Http\Controllers\API\AttendanceController::class, 'getVerificationHistory']);

        // Tutor endpoints (moved from tutor-attendance)
        Route::post('/generate-tutor-token', [App\Http\Controllers\API\AttendanceController::class, 'generateTutorToken']);
        Route::post('/validate-tutor-token', [App\Http\Controllers\API\AttendanceController::class, 'validateTutorToken']);
        Route::get('/tutor/{id_tutor}/history', [App\Http\Controllers\API\AttendanceController::class, 'getTutorAttendanceHistory']);
        Route::get('/tutor/summary', [App\Http\Controllers\API\AttendanceController::class, 'getTutorAttendanceSummary']);
    });

    // Tutor Honor Management
    Route::prefix('tutor-honor')->group(function () {
        Route::get('/tutor/{id_tutor}', [App\Http\Controllers\API\AdminShelter\TutorHonorController::class, 'getTutorHonor']);
        Route::get('/tutor/{id_tutor}/history', [App\Http\Controllers\API\AdminShelter\TutorHonorController::class, 'getHonorHistory']);
        Route::get('/tutor/{id_tutor}/statistics', [App\Http\Controllers\API\AdminShelter\TutorHonorController::class, 'getHonorStatistics']);
        Route::get('/tutor/{id_tutor}/month/{month}/year/{year}', [App\Http\Controllers\API\AdminShelter\TutorHonorController::class, 'getMonthlyDetail']);
        Route::get('/tutor/{id_tutor}/year-range', [TutorHonorController::class, 'getYearRange']);
        Route::post('/calculate/{id_tutor}', [App\Http\Controllers\API\AdminShelter\TutorHonorController::class, 'calculateHonor']);
        Route::post('/approve/{id_honor}', [App\Http\Controllers\API\AdminShelter\TutorHonorController::class, 'approveHonor']);
        Route::post('/mark-paid/{id_honor}', [App\Http\Controllers\API\AdminShelter\TutorHonorController::class, 'markAsPaid']);
        Route::get('/stats', [App\Http\Controllers\API\AdminShelter\TutorHonorController::class, 'getHonorStats']);
        Route::get('/current-settings', [App\Http\Controllers\API\AdminShelter\TutorHonorController::class, 'getCurrentSettings']);
        Route::post('/calculate-preview', [App\Http\Controllers\API\AdminShelter\TutorHonorController::class, 'calculatePreview']);
    });

    // Other existing routes
    Route::get('/materi/by-level', [App\Http\Controllers\API\AdminShelter\MateriController::class, 'getByLevel']);

    // Attendance Reports
    Route::prefix('attendance-reports')->group(function () {
        Route::post('/statistics', [App\Http\Controllers\API\AttendanceReportController::class, 'generateStats']);
        Route::post('/tutor-payment', [App\Http\Controllers\API\AttendanceReportController::class, 'generateTutorPaymentReport']);
        Route::post('/export', [App\Http\Controllers\API\AttendanceReportController::class, 'exportAttendanceData']);
    });

    // Raport Management
    Route::get('/nilai-sikap/{idAnak}/{idSemester}', [App\Http\Controllers\API\AdminShelter\RaportController::class, 'getNilaiSikap']);
    Route::post('/nilai-sikap', [App\Http\Controllers\API\AdminShelter\RaportController::class, 'storeNilaiSikap']);
    Route::put('/nilai-sikap/{id}', [App\Http\Controllers\API\AdminShelter\RaportController::class, 'updateNilaiSikap']);

    Route::get('/raport', [App\Http\Controllers\API\AdminShelter\RaportController::class, 'index']);
    Route::post('/raport/generate', [App\Http\Controllers\API\AdminShelter\RaportController::class, 'generate']);
    Route::get('/raport/{id}', [App\Http\Controllers\API\AdminShelter\RaportController::class, 'show']);
    Route::put('/raport/{id}', [App\Http\Controllers\API\AdminShelter\RaportController::class, 'update']);
    Route::delete('/raport/{id}', [App\Http\Controllers\API\AdminShelter\RaportController::class, 'destroy']);
    Route::get('/raport/anak/{idAnak}', [App\Http\Controllers\API\AdminShelter\RaportController::class, 'getByAnak']);
    Route::post('/raport/{id}/publish', [App\Http\Controllers\API\AdminShelter\RaportController::class, 'publish']);
    Route::post('/raport/{id}/archive', [App\Http\Controllers\API\AdminShelter\RaportController::class, 'archive']);
    Route::get('/raport/preview/{idAnak}/{idSemester}', [App\Http\Controllers\API\AdminShelter\RaportController::class, 'getPreviewData']);
    Route::put('/raport/{idRaport}/detail/{idDetail}', [App\Http\Controllers\API\AdminShelter\RaportController::class, 'updateDetail']);
    Route::get('/raport/check-existing/{idAnak}/{idSemester}', [App\Http\Controllers\API\AdminShelter\RaportController::class, 'checkExistingRaport']);

    // Raport Formal Management
    Route::get('anak/{anakId}/raport-formal', [App\Http\Controllers\API\AdminShelter\AdminShelterRaportFormalController::class, 'index']);
    Route::post('anak/{anakId}/raport-formal', [App\Http\Controllers\API\AdminShelter\AdminShelterRaportFormalController::class, 'store']);
    Route::get('anak/{anakId}/raport-formal/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterRaportFormalController::class, 'show']);
    Route::post('anak/{anakId}/raport-formal/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterRaportFormalController::class, 'update']);
    Route::delete('anak/{anakId}/raport-formal/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterRaportFormalController::class, 'destroy']);

    // Keuangan Management
    Route::get('/keuangan', [App\Http\Controllers\API\AdminShelter\AdminShelterKeuanganController::class, 'index']);
    Route::post('/keuangan', [App\Http\Controllers\API\AdminShelter\AdminShelterKeuanganController::class, 'store']);
    Route::get('/keuangan/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterKeuanganController::class, 'show']);
    Route::put('/keuangan/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterKeuanganController::class, 'update']);
    Route::delete('/keuangan/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterKeuanganController::class, 'destroy']);
    Route::get('/keuangan/child/{childId}', [App\Http\Controllers\API\AdminShelter\AdminShelterKeuanganController::class, 'getByChild']);
    Route::get('/keuangan-statistics', [App\Http\Controllers\API\AdminShelter\AdminShelterKeuanganController::class, 'getStatistics']);

    // Laporan Management routes removed (legacy endpoints retired)
});
