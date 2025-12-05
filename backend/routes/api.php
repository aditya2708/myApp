<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\SsoProfileController;
use App\Http\Controllers\API\SuperAdmin\SsoImportController;
use App\Http\Controllers\API\SuperAdmin\UserManagementController;
use App\Support\SsoContext;


Route::post('/auth/login', [App\Http\Controllers\API\AuthController::class, 'login']);

Route::middleware('sso.auth')->group(function () {
    Route::get('/me', SsoProfileController::class);
    Route::get('/sso/debug', function (SsoContext $sso) {
        return response()->json([
            'sub' => $sso->sub(),
            'email' => $sso->email(),
            'current_company' => $sso->company() ? [
                'id' => $sso->company()->id,
                'slug' => $sso->company()->slug,
                'name' => $sso->company()->name,
            ] : null,
            'current_company_role' => $sso->role(),
            'companies_allowed' => $sso->raw()['companies_allowed'] ?? [],
        ]);
    });

    Route::prefix('sso')->group(function () {
        Route::get('/me', SsoProfileController::class);
    });

    Route::post('/auth/logout', [App\Http\Controllers\API\AuthController::class, 'logout']);
    Route::get('/auth/user', [App\Http\Controllers\API\AuthController::class, 'user']);
    Route::post('/auth/change-password', [App\Http\Controllers\API\AuthController::class, 'changePassword']);

    Route::middleware('role:super_admin')
        ->prefix('admin-super')
        ->group(function () {
            Route::get('users', [UserManagementController::class, 'index']);
            Route::get('users/{user}', [UserManagementController::class, 'show']);
            Route::put('users/{user}', [UserManagementController::class, 'update']);
            Route::get('sso-users', [SsoImportController::class, 'index']);
            Route::post('sso-users/import', [SsoImportController::class, 'store']);
            Route::prefix('dropdowns')->group(function () {
                Route::get('kacab', [UserManagementController::class, 'listKacab']);
                Route::get('kacab/{kacab}/wilbin', [UserManagementController::class, 'listWilbinByKacab']);
                Route::get('wilbin/{wilbin}/shelter', [UserManagementController::class, 'listShelterByWilbin']);
            });
        });

    Route::middleware('role:admin_pusat')->group(function () {
        Route::apiResource('kacab', App\Http\Controllers\API\KacabController::class);

        Route::prefix('admin-pusat')->as('admin-pusat.')->group(function () {
            // Dashboard (tetap di AdminPusatController)
            Route::get('dashboard', [App\Http\Controllers\API\AdminPusatController::class, 'dashboard']);

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

// REFACTORED: Admin Cabang routes with cleaner patterns
    Route::middleware('role:admin_cabang')->prefix('admin-cabang')->group(function () {
            // Dashboard & Profile
    Route::get('/dashboard', [App\Http\Controllers\API\AdminCabangController::class, 'dashboard']);
    Route::get('/profile', [App\Http\Controllers\API\AdminCabangController::class, 'getProfile']);
    Route::post('/profile', [App\Http\Controllers\API\AdminCabangController::class, 'updateProfile']);

        // GPS Approval Management
        Route::prefix('gps-approval')->group(function () {
            Route::get('/needs-review', [App\Http\Controllers\API\AdminCabang\GpsApprovalController::class, 'getNeedsReviewItems']);
            Route::get('/', [App\Http\Controllers\API\AdminCabang\GpsApprovalController::class, 'getGpsApprovalList']);
            Route::get('/{shelterId}', [App\Http\Controllers\API\AdminCabang\GpsApprovalController::class, 'getGpsApprovalDetail']);
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
        Route::prefix('tutors/filters')->group(function () {
            Route::get('/wilayah', [App\Http\Controllers\API\AdminCabang\Reports\AdminCabangTutorFilterController::class, 'wilayah']);
            Route::get('/shelters', [App\Http\Controllers\API\AdminCabang\Reports\AdminCabangTutorFilterController::class, 'shelters']);
        });
        Route::prefix('attendance')->group(function () {
            Route::get('/monthly-shelter', App\Http\Controllers\API\AdminCabang\Reports\Attendance\AttendanceMonthlyShelterController::class);
            Route::get('/monthly-branch', App\Http\Controllers\API\AdminCabang\Reports\Attendance\AttendanceMonthlyBranchController::class);
            Route::get('/children', [App\Http\Controllers\API\AdminCabang\Reports\AdminCabangChildReportController::class, 'index']);
            Route::get('/children/{child}', [App\Http\Controllers\API\AdminCabang\Reports\AdminCabangChildReportController::class, 'show']);
        });
    });

    });

 Route::middleware(['role:admin_shelter', 'ensure.admin.shelter'])->prefix('admin-shelter')->group(function () {
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

        Route::get('/kegiatan', [App\Http\Controllers\API\AdminShelter\KegiatanController::class, 'index']);

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
        Route::patch('/tutor/{id}/toggle-status', [App\Http\Controllers\API\AdminShelter\AdminShelterTutorController::class, 'toggleStatus']);
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
        
        Route::get('/keluarga/import/template', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaImportController::class, 'template']);
        Route::post('/keluarga/import', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaImportController::class, 'import']);
        Route::get('/keluarga', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'index']);
        Route::post('/keluarga', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'store']);
        Route::get('/keluarga/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'show']);
        Route::post('/keluarga/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'update']);
        Route::delete('/keluarga/{id}', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'destroy']);
        Route::delete('keluarga/{id}/force', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'forceDestroy']);
        Route::get('/keluarga-dropdown', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'getDropdownData']);
        Route::get('/keluarga-wilbin/{id_kacab}', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'getWilbinByKacab']);
        Route::get('/keluarga-shelter/{id_wilbin}', [App\Http\Controllers\API\AdminShelter\AdminShelterKeluargaController::class, 'getShelterByWilbin']);
        Route::get('/pengajuan-anak', [App\Http\Controllers\API\AdminShelter\AdminShelterPengajuanAnakController::class, 'index']);
        Route::get('/pengajuan-anak/priority-families', [App\Http\Controllers\API\AdminShelter\AdminShelterPengajuanAnakController::class, 'getPriorityFamilies']);
        Route::get('/pengajuan-anak/search-keluarga', [App\Http\Controllers\API\AdminShelter\AdminShelterPengajuanAnakController::class, 'searchKeluarga']);
        Route::post('/pengajuan-anak/validate-kk', [App\Http\Controllers\API\AdminShelter\AdminShelterPengajuanAnakController::class, 'validateKK']);
        Route::post('/pengajuan-anak/submit', [App\Http\Controllers\API\AdminShelter\AdminShelterPengajuanAnakController::class, 'submitAnak']);  
        Route::get('/aktivitas', [App\Http\Controllers\API\AdminShelter\AktivitasController::class, 'index']);
        Route::post('/aktivitas', [App\Http\Controllers\API\AdminShelter\AktivitasController::class, 'store']);
        Route::get('/aktivitas/{id}', [App\Http\Controllers\API\AdminShelter\AktivitasController::class, 'show']);
        Route::put('/aktivitas/{id}', [App\Http\Controllers\API\AdminShelter\AktivitasController::class, 'update']);
        Route::put('/aktivitas/{id}/status', [App\Http\Controllers\API\AdminShelter\AktivitasController::class, 'updateStatus']);
        Route::delete('/aktivitas/{id}', [App\Http\Controllers\API\AdminShelter\AktivitasController::class, 'destroy']);

        // Phase 3: Enhanced Aktivitas with Kurikulum Integration
        Route::get('/aktivitas/by-semester/{semester}', [App\Http\Controllers\API\AdminShelter\AktivitasController::class, 'getAktivitasBySemester']);
        Route::get('/aktivitas/by-materi/{materi}', [App\Http\Controllers\API\AdminShelter\AktivitasController::class, 'getAktivitasByMateri']);
        Route::post('/aktivitas/{aktivitas}/duplicate', [App\Http\Controllers\API\AdminShelter\AktivitasController::class, 'duplicateAktivitas']);
        Route::get('/aktivitas-stats', [App\Http\Controllers\API\AdminShelter\AktivitasController::class, 'getAktivitasStats']);

        // Activity Reports
        Route::get('/activity-reports', [App\Http\Controllers\API\AdminShelter\ActivityReportController::class, 'index']);
        Route::post('/activity-reports', [App\Http\Controllers\API\AdminShelter\ActivityReportController::class, 'store']);
        Route::get('/activity-reports/by-activity/{id_aktivitas}', [App\Http\Controllers\API\AdminShelter\ActivityReportController::class, 'getByActivity']);

        // Achievement Reports
        Route::get('/achievement-reports', [App\Http\Controllers\API\AdminShelter\AchievementReportController::class, 'index']);

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
            Route::get('/today', [App\Http\Controllers\API\AttendanceController::class, 'getTodaySummary']);
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

    }); // End Admin Shelter middleware group
    
    Route::middleware('role:donatur')
    ->prefix('donatur')
    ->group(function () {
        Route::get('/dashboard', [App\Http\Controllers\API\DonaturController::class, 'dashboard']);
        Route::get('/profile', [App\Http\Controllers\API\DonaturController::class, 'getProfile']);
        Route::post('/profile', [App\Http\Controllers\API\DonaturController::class, 'updateProfile']);
        Route::get('/children', [App\Http\Controllers\Api\Donatur\DonaturAnakController::class, 'index']);
        Route::get('/children/{childId}', [App\Http\Controllers\Api\Donatur\DonaturAnakController::class, 'show']);

        Route::get('/children/{childId}/surat', [App\Http\Controllers\Api\Donatur\DonaturSuratController::class, 'index']);
        Route::post('/children/{childId}/surat', [App\Http\Controllers\Api\Donatur\DonaturSuratController::class, 'store']);
        Route::get('/children/{childId}/surat/{suratId}', [App\Http\Controllers\Api\Donatur\DonaturSuratController::class, 'show']);
        Route::put('/children/{childId}/surat/{suratId}/read', [App\Http\Controllers\Api\Donatur\DonaturSuratController::class, 'markAsRead']);

        Route::get('/children/{childId}/prestasi', [App\Http\Controllers\Api\Donatur\DonaturPrestasiController::class, 'index']);
        Route::get('/children/{childId}/prestasi/{prestasiId}', [App\Http\Controllers\Api\Donatur\DonaturPrestasiController::class, 'show']);
        Route::put('/children/{childId}/prestasi/{prestasiId}/read', [App\Http\Controllers\Api\Donatur\DonaturPrestasiController::class, 'markAsRead']);

        Route::get('/children/{childId}/raport', [App\Http\Controllers\Api\Donatur\DonaturRaportController::class, 'index']);
        Route::get('/children/{childId}/raport/{raportId}', [App\Http\Controllers\Api\Donatur\DonaturRaportController::class, 'show']);
        Route::get('/children/{childId}/raport-summary', [App\Http\Controllers\Api\Donatur\DonaturRaportController::class, 'summary']);

        Route::get('/children/{childId}/aktivitas', [App\Http\Controllers\Api\Donatur\DonaturAktivitasController::class, 'index']);
        Route::get('/children/{childId}/aktivitas/{aktivitasId}', [App\Http\Controllers\Api\Donatur\DonaturAktivitasController::class, 'show']);
        Route::get('/children/{childId}/attendance-summary', [App\Http\Controllers\Api\Donatur\DonaturAktivitasController::class, 'attendanceSummary']);
  
        Route::get('/berita', [App\Http\Controllers\API\Donatur\DonaturBeritaController::class, 'index']);
        Route::get('/berita/{id}', [App\Http\Controllers\API\Donatur\DonaturBeritaController::class, 'show']);
        Route::put('/berita/{id}/increment-view', [App\Http\Controllers\API\Donatur\DonaturBeritaController::class, 'incrementView']);

        Route::prefix('marketplace')->group(function () {
            Route::get('/available-children', [App\Http\Controllers\Api\Donatur\DonaturMarketplaceController::class, 'availableChildren']);
            Route::get('/children/{childId}/profile', [App\Http\Controllers\Api\Donatur\DonaturMarketplaceController::class, 'childProfile']);
            Route::post('/children/{childId}/sponsor', [App\Http\Controllers\Api\Donatur\DonaturSponsorshipController::class, 'sponsorChild']);
            Route::get('/filters', [App\Http\Controllers\Api\Donatur\DonaturMarketplaceController::class, 'getFilters']);
            Route::get('/featured-children', [App\Http\Controllers\Api\Donatur\DonaturMarketplaceController::class, 'featuredChildren']);
        });

        // Billing/Keuangan routes for Donatur
        Route::get('/billing', [App\Http\Controllers\API\Donatur\DonaturKeuanganController::class, 'index']);
        Route::get('/billing/{id}', [App\Http\Controllers\API\Donatur\DonaturKeuanganController::class, 'show']);
        Route::get('/billing/child/{childId}', [App\Http\Controllers\API\Donatur\DonaturKeuanganController::class, 'getByChild']);
        Route::get('/billing-summary', [App\Http\Controllers\API\Donatur\DonaturKeuanganController::class, 'getSummary']);
        Route::get('/billing-semesters', [App\Http\Controllers\API\Donatur\DonaturKeuanganController::class, 'getSemesters']);
    });
});
