<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto-cancel bookings that passed DP deadline — runs every 5 minutes
Schedule::call(function () {
    $expired = \App\Models\Booking::expired()->get();

    foreach ($expired as $booking) {
        $booking->update(['status' => 'cancelled']);

        // Unlock slot in Field Service
        app(\App\Services\FieldServiceClient::class)->unlockSlot($booking->slot_id);
    }

    if ($expired->count() > 0) {
        \Illuminate\Support\Facades\Log::info("Auto-expired {$expired->count()} bookings.");
    }
})->everyFiveMinutes()->name('bookings:auto-expire');