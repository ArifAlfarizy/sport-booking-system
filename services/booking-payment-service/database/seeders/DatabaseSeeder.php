<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Sample booking — references user/slot/field from other services
        $booking = Booking::create([
            'user_id'     => 'usr-001',
            'slot_id'     => 'slt-001',
            'field_id'    => 'fld-001',
            'play_date'   => now()->addDays(3)->toDateString(),
            'start_time'  => '08:00:00',
            'end_time'    => '09:00:00',
            'total_price' => 150000,
            'dp_amount'   => 45000,
            'remaining'   => 105000,
            'status'      => 'dp_paid',
            'expires_at'  => now()->addDay(),
        ]);

        Payment::create([
            'booking_id' => $booking->id,
            'type'       => 'dp',
            'amount'     => 45000,
            'method'     => 'bank_transfer',
            'proof_url'  => 'https://storage.example.com/proof/sample-dp.jpg',
            'status'     => 'verified',
            'verified_by' => 'usr-002',
            'verified_at' => now(),
        ]);

        $this->command->info('✅ Sample booking and payment seeded.');
    }
}