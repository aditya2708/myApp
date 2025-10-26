<?php

Route::middleware('role:admin_pusat')->group(function () {
    Route::apiResource('kacab', App\Http\Controllers\API\KacabController::class);

    Route::prefix('admin-pusat')->as('admin-pusat.')->group(function () {
        // Dashboard (tetap di AdminPusatController)
        Route::get('dashboard', [App\Http\Controllers\API\AdminPusatController::class, 'dashboard']);

        // User Management + Dropdown (dipindah ke AdminPusatUserController)
        Route::get('users', [App\Http\Controllers\API\AdminPusat\AdminPusatUserController::class, 'index']);
        Route::get('users/{id}', [App\Http\Controllers\API\AdminPusat\AdminPusatUserController::class, 'show']);
        Route::post('create-user', [App\Http\Controllers\API\AdminPusat\AdminPusatUserController::class, 'store']);
        Route::put('users/{id}', [App\Http\Controllers\API\AdminPusat\AdminPusatUserController::class, 'update']);

        // Dropdown berjenjang
        Route::prefix('dropdowns')->group(function () {
            Route::get('kacab', [App\Http\Controllers\API\AdminPusat\AdminPusatUserController::class, 'listKacab']);
            Route::get('kacab/{id}/wilbin', [App\Http\Controllers\API\AdminPusat\AdminPusatUserController::class, 'listWilbinByKacab']);
            Route::get('wilbin/{id}/shelter', [App\Http\Controllers\API\AdminPusat\AdminPusatUserController::class, 'listShelterByWilbin']);
        });

        Route::apiResource('kacab', App\Http\Controllers\API\AdminPusat\KacabController::class);
        Route::apiResource('wilbin', App\Http\Controllers\API\AdminPusat\WilbinController::class);
        Route::apiResource('shelter', App\Http\Controllers\API\AdminPusat\ShelterController::class);

        Route::get('/tutor-honor-settings', [App\Http\Controllers\API\AdminPusat\AdminPusatTutorHonorSettingsController::class, 'index']);
        Route::get('/tutor-honor-settings/active', [App\Http\Controllers\API\AdminPusat\AdminPusatTutorHonorSettingsController::class, 'getActiveSetting']);
        Route::post('/tutor-honor-settings', [App\Http\Controllers\API\AdminPusat\AdminPusatTutorHonorSettingsController::class, 'store']);
        Route::get('/tutor-honor-settings/{id}', [App\Http\Controllers\API\AdminPusat\AdminPusatTutorHonorSettingsController::class, 'show']);
        Route::put('/tutor-honor-settings/{id}', [App\Http\Controllers\API\AdminPusat\AdminPusatTutorHonorSettingsController::class, 'update']);
        Route::post('/tutor-honor-settings/{id}/set-active', [App\Http\Controllers\API\AdminPusat\AdminPusatTutorHonorSettingsController::class, 'setActive']);
        Route::delete('/tutor-honor-settings/{id}', [App\Http\Controllers\API\AdminPusat\AdminPusatTutorHonorSettingsController::class, 'destroy']);
        Route::post('/tutor-honor-settings/calculate-preview', [App\Http\Controllers\API\AdminPusat\AdminPusatTutorHonorSettingsController::class, 'calculatePreview']);
        Route::get('/tutor-honor-settings-statistics', [App\Http\Controllers\API\AdminPusat\AdminPusatTutorHonorSettingsController::class, 'getStatistics']);

        // Admin Pusat Template Management Routes
        Route::prefix('template-kurikulum')->group(function () {
            // Hierarchy & Navigation
            Route::get('/struktur', [App\Http\Controllers\API\AdminPusat\HierarchyController::class, 'getStruktur']);
            Route::get('/kelas/{jenjang}', [App\Http\Controllers\API\AdminPusat\HierarchyController::class, 'getKelas']);
            Route::get('/mata-pelajaran/{kelas}', [App\Http\Controllers\API\AdminPusat\HierarchyController::class, 'getMataPelajaran']);
            Route::get('/mata-pelajaran-stats/{mataPelajaran}/{kelas}', [App\Http\Controllers\API\AdminPusat\HierarchyController::class, 'getTemplateStats']);
            Route::post('/clear-cache', [App\Http\Controllers\API\AdminPusat\HierarchyController::class, 'clearCache']);
        });

        // Template CRUD - Specific routes MUST come before apiResource
        Route::post('/template-materi/{template}/activate', [App\Http\Controllers\API\AdminPusat\TemplateKurikulumController::class, 'activate']);
        Route::post('/template-materi/{template}/deactivate', [App\Http\Controllers\API\AdminPusat\TemplateKurikulumController::class, 'deactivate']);
        Route::post('/template-materi/{template}/duplicate', [App\Http\Controllers\API\AdminPusat\TemplateKurikulumController::class, 'duplicate']);
        Route::get('/template-materi/by-mapel/{mataPelajaran}/{kelas}', [App\Http\Controllers\API\AdminPusat\TemplateKurikulumController::class, 'getByMataPelajaran']);
        Route::apiResource('template-materi', App\Http\Controllers\API\AdminPusat\TemplateKurikulumController::class);

        // Distribution Management
        Route::prefix('distribution')->group(function () {
            Route::get('/cabang', [App\Http\Controllers\API\AdminPusat\DistributionController::class, 'getAvailableCabang']);
            Route::post('/template/{template}', [App\Http\Controllers\API\AdminPusat\DistributionController::class, 'distributeTemplate']);
            Route::post('/bulk', [App\Http\Controllers\API\AdminPusat\DistributionController::class, 'bulkDistribute']);
            Route::get('/history/{template}', [App\Http\Controllers\API\AdminPusat\DistributionController::class, 'getDistributionHistory']);
            Route::get('/summary', [App\Http\Controllers\API\AdminPusat\DistributionController::class, 'getDistributionSummary']);
            Route::delete('/cancel/{adoption}', [App\Http\Controllers\API\AdminPusat\DistributionController::class, 'cancelDistribution']);
        });

        // Monitoring & Analytics
        Route::prefix('monitoring')->group(function () {
            Route::get('/dashboard', [App\Http\Controllers\API\AdminPusat\MonitoringController::class, 'getDashboardStats']);
            Route::get('/cabang-adoption', [App\Http\Controllers\API\AdminPusat\MonitoringController::class, 'getCabangAdoptionRates']);
            Route::get('/template-performance', [App\Http\Controllers\API\AdminPusat\MonitoringController::class, 'getTemplatePerformance']);
            Route::get('/adoption-trends', [App\Http\Controllers\API\AdminPusat\MonitoringController::class, 'getAdoptionTrends']);
            Route::get('/cabang/{kacab}', [App\Http\Controllers\API\AdminPusat\MonitoringController::class, 'getCabangDetails']);
            Route::get('/template/{template}/usage', [App\Http\Controllers\API\AdminPusat\MonitoringController::class, 'getTemplateUsageStats']);
            Route::get('/export-report', [App\Http\Controllers\API\AdminPusat\MonitoringController::class, 'exportAdoptionReport']);
        });
    });
});
