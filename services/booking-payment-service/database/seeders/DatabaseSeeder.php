<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $booking = Booking::create([
            'id'           => Str::uuid(),
            'user_id'      => 'usr-001',
            'slot_id'      => 'slt-001',
            'field_id'     => 'fld-001',
            'play_date'    => now()->addDays(3)->toDateString(),
            'start_time'   => '08:00:00',
            'end_time'     => '09:00:00',
            'total_price'  => 150000,
            'dp_amount'    => 45000,
            'remaining'    => 105000,
            'status'       => 'dp_paid',
            'expires_at'   => now()->addDay(),
            'confirmed_at' => now(),
        ]);

        Payment::create([
            'id'          => Str::uuid(),
            'booking_id'  => $booking->id,
            'type'        => 'dp',
            'amount'      => 45000,
            'method'      => 'bank_transfer',
            'proof_url'   => 'https://storage.example.com/proof/sample-dp.jpg',
            'status'      => 'verified',
            'verified_by' => 'usr-002',
            'verified_at' => now(),
        ]);

        $bookingPaid = Booking::create([
            'id'           => Str::uuid(),
            'user_id'      => 'usr-003',
            'slot_id'      => 'slt-002',
            'field_id'     => 'fld-002',
            'play_date'    => now()->addDays(5)->toDateString(),
            'start_time'   => '10:00:00',
            'end_time'     => '11:00:00',
            'total_price'  => 200000,
            'dp_amount'    => 60000,
            'remaining'    => 140000,
            'status'       => 'paid',
            'expires_at'   => now()->addDay(),
            'confirmed_at' => now(),
        ]);

        Payment::create([
            'id'          => Str::uuid(),
            'booking_id'  => $bookingPaid->id,
            'type'        => 'dp',
            'amount'      => 60000,
            'method'      => 'bank_transfer',
            'proof_url'   => 'https://storage.example.com/proof/sample-dp2.jpg',
            'status'      => 'verified',
            'verified_by' => 'usr-002',
            'verified_at' => now(),
        ]);

        Payment::create([
            'id'          => Str::uuid(),
            'booking_id'  => $bookingPaid->id,
            'type'        => 'settlement',
            'amount'      => 140000,
            'method'      => 'qris',
            'proof_url'   => 'https://storage.example.com/proof/sample-settlement.jpg',
            'status'      => 'verified',
            'verified_by' => 'usr-002',
            'verified_at' => now(),
        ]);

        $this->command->info('Seeding completed.');
    }
}