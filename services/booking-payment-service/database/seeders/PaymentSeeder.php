<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $bookings = DB::table('bookings')->get();

        foreach ($bookings as $booking) {
            // DP Payment
            DB::table('payments')->insert([
                'id' => Str::uuid(),
                'booking_id' => $booking->id,

                'type' => 'dp',
                'amount' => $booking->dp_amount,
                'method' => 'bank_transfer',

                'proof_url' => 'https://example.com/proof.jpg',

                'status' => 'verified',
                'reject_note' => null,

                'verified_by' => Str::uuid(),
                'verified_at' => now(),

                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Settlement Payment
            DB::table('payments')->insert([
                'id' => Str::uuid(),
                'booking_id' => $booking->id,

                'type' => 'settlement',
                'amount' => $booking->remaining,
                'method' => 'qris',

                'proof_url' => 'https://example.com/proof2.jpg',

                'status' => 'pending',
                'reject_note' => null,

                'verified_by' => null,
                'verified_at' => null,

                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}