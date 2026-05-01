<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;


Route::middleware(\App\Http\Middleware\AuthMiddleware::class)->group(function () {

  
    Route::middleware('role:user')->group(function () {
        Route::get('/bookings/me',           [BookingController::class, 'myBookings']);
        Route::post('/bookings',             [BookingController::class, 'store']);
        Route::put('/bookings/{id}/cancel',  [BookingController::class, 'cancel']);
    });

   
    Route::middleware('role:owner,admin')->group(function () {
        Route::get('/bookings',              [BookingController::class, 'index']);
        Route::put('/bookings/{id}/confirm', [BookingController::class, 'confirm']);
    });

    Route::get('/bookings/{id}',             [BookingController::class, 'show']);

    Route::middleware('role:admin')->group(function () {
        Route::put('/bookings/expire',       [BookingController::class, 'expireAll']);
    });

    Route::middleware('role:user')->group(function () {
        Route::post('/payments',             [PaymentController::class, 'store']);
    });

    Route::middleware('role:owner,admin')->group(function () {
        Route::put('/payments/{id}/verify',  [PaymentController::class, 'verify']);
        Route::put('/payments/{id}/reject',  [PaymentController::class, 'reject']);
    });

    Route::get('/payments/{bookingId}',      [PaymentController::class, 'index']);

    Route::middleware('role:owner,admin')->group(function () {
        Route::get('/dashboard/today',       [DashboardController::class, 'today']);
        Route::get('/dashboard/revenue',     [DashboardController::class, 'revenue']);
        Route::get('/dashboard/pending',     [DashboardController::class, 'pending']);
    });
});