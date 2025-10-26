<?php

use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [App\Http\Controllers\API\AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [App\Http\Controllers\API\AuthController::class, 'logout']);
    Route::get('/auth/user', [App\Http\Controllers\API\AuthController::class, 'user']);
    Route::post('/auth/change-password', [App\Http\Controllers\API\AuthController::class, 'changePassword']);

    require __DIR__ . '/admin_pusat.php';
    require __DIR__ . '/admin_cabang.php';
    require __DIR__ . '/admin_shelter.php';
    require __DIR__ . '/donatur.php';
});
