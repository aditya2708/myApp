<?php

// REFACTORED: Admin Cabang routes with cleaner patterns
Route::middleware('role:admin_cabang')->prefix('admin-cabang')->group(function () {
    // Dashboard & Profile
    Route::get('/dashboard', [App\Http\Controllers\API\AdminCabangController::class, 'dashboard']);
    Route::get('/profile', [App\Http\Controllers\API\AdminCabangController::class, 'getProfile']);
    Route::post('/profile', [App\Http\Controllers\API\AdminCabangController::class, 'updateProfile']);

    // User Management + Dropdown
    Route::get('/users', [App\Http\Controllers\API\AdminCabang\AdminCabangUserController::class, 'index']);
    Route::post('/users', [App\Http\Controllers\API\AdminCabang\AdminCabangUserController::class, 'store']);
    Route::get('/users/{id}', [App\Http\Controllers\API\AdminCabang\AdminCabangUserController::class, 'show']);
    Route::put('/users/{id}', [App\Http\Controllers\API\AdminCabang\AdminCabangUserController::class, 'update']);
    Route::delete('/users/{id}', [App\Http\Controllers\API\AdminCabang\AdminCabangUserController::class, 'destroy']);

    Route::get('/roles', [App\Http\Controllers\API\AdminCabang\AdminCabangUserController::class, 'listRoles']);
    Route::get('/users-dropdown', [App\Http\Controllers\API\AdminCabang\AdminCabangUserController::class, 'listUsersForDropdown']);

    // Dashboard Stats & Summaries
    Route::get('/stats', [App\Http\Controllers\API\AdminCabang\DashboardController::class, 'getStats']);
    Route::get('/summary', [App\Http\Controllers\API\AdminCabang\DashboardController::class, 'getSummary']);

    // Wilayah Binaan & Shelter Management
    Route::prefix('wilbin')->group(function () {
        Route::get('/', [App\Http\Controllers\API\AdminCabang\WilbinController::class, 'index']);
        Route::post('/', [App\Http\Controllers\API\AdminCabang\WilbinController::class, 'store']);
        Route::get('/{id}', [App\Http\Controllers\API\AdminCabang\WilbinController::class, 'show']);
        Route::put('/{id}', [App\Http\Controllers\API\AdminCabang\WilbinController::class, 'update']);
        Route::delete('/{id}', [App\Http\Controllers\API\AdminCabang\WilbinController::class, 'destroy']);
    });

    Route::prefix('shelter')->group(function () {
        Route::get('/', [App\Http\Controllers\API\AdminCabang\ShelterController::class, 'index']);
        Route::post('/', [App\Http\Controllers\API\AdminCabang\ShelterController::class, 'store']);
        Route::get('/{id}', [App\Http\Controllers\API\AdminCabang\ShelterController::class, 'show']);
        Route::put('/{id}', [App\Http\Controllers\API\AdminCabang\ShelterController::class, 'update']);
        Route::delete('/{id}', [App\Http\Controllers\API\AdminCabang\ShelterController::class, 'destroy']);

        Route::get('/{shelterId}/tutor', [App\Http\Controllers\API\AdminCabang\AdminCabangShelterTutorController::class, 'index']);
        Route::post('/{shelterId}/tutor', [App\Http\Controllers\API\AdminCabang\AdminCabangShelterTutorController::class, 'store']);
        Route::delete('/{shelterId}/tutor/{tutorShelterId}', [App\Http\Controllers\API\AdminCabang\AdminCabangShelterTutorController::class, 'destroy']);

        Route::get('/{shelterId}/children', [App\Http\Controllers\API\AdminCabang\AdminCabangShelterAnakController::class, 'index']);
        Route::post('/{shelterId}/children', [App\Http\Controllers\API\AdminCabang\AdminCabangShelterAnakController::class, 'store']);
        Route::delete('/{shelterId}/children/{shelterChildId}', [App\Http\Controllers\API\AdminCabang\AdminCabangShelterAnakController::class, 'destroy']);
    });

    // GPS Approval Workflow
    Route::prefix('gps-approval')->group(function () {
        Route::get('/', [App\Http\Controllers\API\AdminCabang\GpsApprovalController::class, 'index']);
        Route::get('/pending', [App\Http\Controllers\API\AdminCabang\GpsApprovalController::class, 'pendingRequests']);
        Route::post('/{shelterId}/approve', [App\Http\Controllers\API\AdminCabang\GpsApprovalController::class, 'approveGpsRequest']);
        Route::post('/{shelterId}/reject', [App\Http\Controllers\API\AdminCabang\GpsApprovalController::class, 'rejectGpsRequest']);
    });

    // Survey Approval
    Route::prefix('survey-approval')->group(function () {
        Route::get('/', [App\Http\Controllers\API\AdminCabang\AdminCabangSurveyController::class, 'index']);
        Route::get('/stats', [App\Http\Controllers\API\AdminCabang\AdminCabangSurveyController::class, 'getStats']);
        Route::get('/{id}', [App\Http\Controllers\API\AdminCabang\AdminCabangSurveyController::class, 'show']);
        Route::post('/{id}/approve', [App\Http\Controllers\API\AdminCabang\AdminCabangSurveyController::class, 'approve']);
        Route::post('/{id}/reject', [App\Http\Controllers\API\AdminCabang\AdminCabangSurveyController::class, 'reject']);
    });

    // Donatur CRUD
    Route::apiResource('donatur', App\Http\Controllers\API\AdminCabang\AdminCabangDonaturController::class);
    Route::get('/donatur-stats', [App\Http\Controllers\API\AdminCabang\AdminCabangDonaturController::class, 'getStats']);
    Route::get('/donatur-dropdown', [App\Http\Controllers\API\AdminCabang\AdminCabangDonaturController::class, 'getDropdownData']);

    // Kurikulum main endpoints
    Route::get('/kurikulum', [App\Http\Controllers\API\AdminCabang\KurikulumController::class, 'index']);
    Route::post('/kurikulum', [App\Http\Controllers\API\AdminCabang\KurikulumController::class, 'store']);
    Route::get('/kurikulum/statistics', [App\Http\Controllers\API\AdminCabang\KurikulumController::class, 'getStatistics']);
    Route::get('/kurikulum/dropdown-data', [App\Http\Controllers\API\AdminCabang\KurikulumController::class, 'getDropdownData']);
    Route::get('/kurikulum/mata-pelajaran', [App\Http\Controllers\API\AdminCabang\KurikulumController::class, 'getMataPelajaran']);
    Route::post('/kurikulum/{kurikulum}/set-active', [App\Http\Controllers\API\AdminCabang\KurikulumController::class, 'setActive']);

    // Kurikulum materi management
    Route::get('/kurikulum/{kurikulum}/materi', [App\Http\Controllers\API\AdminCabang\KurikulumMateriController::class, 'index']);
    Route::post('/kurikulum/{kurikulum}/materi', [App\Http\Controllers\API\AdminCabang\KurikulumMateriController::class, 'store']);
    Route::delete('/kurikulum/{kurikulum}/materi/{materi}', [App\Http\Controllers\API\AdminCabang\KurikulumMateriController::class, 'destroy']);
    Route::post('/kurikulum/{kurikulum}/materi/reorder', [App\Http\Controllers\API\AdminCabang\KurikulumMateriController::class, 'reorder']);

    // Hierarchy & Navigation
    Route::get('/kurikulum/struktur', [App\Http\Controllers\API\AdminCabang\HierarchyController::class, 'getStruktur']);
    Route::get('/kurikulum/kelas/{jenjang}', [App\Http\Controllers\API\AdminCabang\HierarchyController::class, 'getKelas']);
    Route::get('/kurikulum/mata-pelajaran/{kelas}', [App\Http\Controllers\API\AdminCabang\HierarchyController::class, 'getMataPelajaran']);
    Route::get('/kurikulum/mata-pelajaran-stats/{mataPelajaran}/{kelas}', [App\Http\Controllers\API\AdminCabang\HierarchyController::class, 'getMataPelajaranStats']);
    Route::post('/kurikulum/clear-cache', [App\Http\Controllers\API\AdminCabang\HierarchyController::class, 'clearCache']);

    // Materi CRUD - Specific routes MUST come before apiResource
    Route::post('/materi/reorder', [App\Http\Controllers\API\AdminCabang\MateriController::class, 'reorder']);
    Route::get('/materi/by-mapel/{mataPelajaran}/{kelas}', [App\Http\Controllers\API\AdminCabang\MateriController::class, 'getByMataPelajaran']);
    Route::apiResource('materi', App\Http\Controllers\API\AdminCabang\MateriController::class);

    // Template Adoption - Specific routes before dynamic ones
    Route::get('/template-adoptions', [App\Http\Controllers\API\AdminCabang\TemplateAdoptionController::class, 'index']);
    Route::get('/template-adoptions-history', [App\Http\Controllers\API\AdminCabang\TemplateAdoptionController::class, 'getAdoptionHistory']);
    Route::get('/template-adoptions/{adoption}', [App\Http\Controllers\API\AdminCabang\TemplateAdoptionController::class, 'show']);
    Route::post('/template-adoptions/{adoption}/adopt', [App\Http\Controllers\API\AdminCabang\TemplateAdoptionController::class, 'adopt']);
    Route::post('/template-adoptions/{adoption}/customize', [App\Http\Controllers\API\AdminCabang\TemplateAdoptionController::class, 'customize']);
    Route::post('/template-adoptions/{adoption}/skip', [App\Http\Controllers\API\AdminCabang\TemplateAdoptionController::class, 'skip']);

    // Master Data - Custom Kelas & Mata Pelajaran
    Route::get('/kelas-custom', [App\Http\Controllers\API\AdminCabang\MasterDataController::class, 'getKelasCustom']);
    Route::post('/kelas-custom', [App\Http\Controllers\API\AdminCabang\MasterDataController::class, 'storeKelasCustom']);
    Route::put('/kelas-custom/{id}', [App\Http\Controllers\API\AdminCabang\MasterDataController::class, 'updateKelasCustom']);
    Route::delete('/kelas-custom/{id}', [App\Http\Controllers\API\AdminCabang\MasterDataController::class, 'destroyKelasCustom']);

    Route::get('/mata-pelajaran-custom', [App\Http\Controllers\API\AdminCabang\MasterDataController::class, 'getMataPelajaranCustom']);
    Route::post('/mata-pelajaran-custom', [App\Http\Controllers\API\AdminCabang\MasterDataController::class, 'storeMataPelajaranCustom']);
    Route::put('/mata-pelajaran-custom/{id}', [App\Http\Controllers\API\AdminCabang\MasterDataController::class, 'updateMataPelajaranCustom']);
    Route::delete('/mata-pelajaran-custom/{id}', [App\Http\Controllers\API\AdminCabang\MasterDataController::class, 'destroyMataPelajaranCustom']);

    Route::get('/master-data/dropdown', [App\Http\Controllers\API\AdminCabang\MasterDataController::class, 'getDropdownData']);

    // Semester Management - Explicit routes without prefix
    Route::get('/semester', [App\Http\Controllers\API\AdminCabang\SemesterController::class, 'index']);
    Route::post('/semester', [App\Http\Controllers\API\AdminCabang\SemesterController::class, 'store']);
    Route::get('/semester/active', [App\Http\Controllers\API\AdminCabang\SemesterController::class, 'getActive']);
    Route::get('/semester/statistics', [App\Http\Controllers\API\AdminCabang\SemesterController::class, 'getStatistics']);
    Route::get('/semester/{id}', [App\Http\Controllers\API\AdminCabang\SemesterController::class, 'show']);
    Route::put('/semester/{id}', [App\Http\Controllers\API\AdminCabang\SemesterController::class, 'update']);
    Route::patch('/semester/{id}', [App\Http\Controllers\API\AdminCabang\SemesterController::class, 'update']);
    Route::post('/semester/{id}/update', [App\Http\Controllers\API\AdminCabang\SemesterController::class, 'update']);
    Route::delete('/semester/{id}', [App\Http\Controllers\API\AdminCabang\SemesterController::class, 'destroy']);
    Route::post('/semester/{id}/set-active', [App\Http\Controllers\API\AdminCabang\SemesterController::class, 'setActive']);
    Route::post('/semester/{id}/activate', [App\Http\Controllers\API\AdminCabang\SemesterController::class, 'activate']);
    Route::post('/semester/{id}/deactivate', [App\Http\Controllers\API\AdminCabang\SemesterController::class, 'deactivate']);
    Route::post('/semester/{id}/complete', [App\Http\Controllers\API\AdminCabang\SemesterController::class, 'complete']);

    Route::post('/semester/{id}/archive', [App\Http\Controllers\API\AdminCabang\SemesterController::class, 'archive']);

    // Debug route to test if routes are working
    Route::get('/semester-test', function() {
        return response()->json(['message' => 'Semester routes are working!', 'time' => now()]);
    });

    Route::prefix('laporan')->group(function () {
        Route::get('/summary', [App\Http\Controllers\API\AdminCabang\Reports\AdminCabangReportSummaryController::class, 'getSummary']);
        Route::get('/tutors', [App\Http\Controllers\API\AdminCabang\Reports\AdminCabangTutorReportController::class, 'index']);
        Route::prefix('attendance')->group(function () {
            Route::get('/monthly-shelter', App\Http\Controllers\API\AdminCabang\Reports\Attendance\AttendanceMonthlyShelterController::class);
            Route::get('/monthly-branch', App\Http\Controllers\API\AdminCabang\Reports\Attendance\AttendanceMonthlyBranchController::class);
            Route::get('/children', [App\Http\Controllers\API\AdminCabang\Reports\AdminCabangChildReportController::class, 'index']);
            Route::get('/children/{child}', [App\Http\Controllers\API\AdminCabang\Reports\AdminCabangChildReportController::class, 'show']);
        });
    });
});
