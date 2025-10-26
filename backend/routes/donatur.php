<?php

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
