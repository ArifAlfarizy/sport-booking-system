<?php

use Illuminate\Support\Facades\Route;

// Health check — accessible without auth
Route::get('/', function () {
    return response()->json([
        'service'   => 'Booking & Payment Service',
        'status'    => 'running',
        'version'   => '1.0.0',
        'timestamp' => now()->toISOString(),
    ]);
});