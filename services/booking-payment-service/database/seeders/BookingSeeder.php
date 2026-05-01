<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BookingSeeder extends Seeder
{
    public function run(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $total = rand(100000, 500000);
            $dp = $total * 0.3;

            DB::table('bookings')->insert([
                'id' => Str::uuid(),

                'user_id' => Str::uuid(),
                'slot_id' => Str::uuid(),
                'field_id' => Str::uuid(),

                'play_date' => Carbon::now()->addDays(rand(1, 7))->toDateString(),
                'start_time' => '18:00:00',
                'end_time' => '19:00:00',

                'total_price' => $total,
                'dp_amount' => $dp,
                'remaining' => $total - $dp,

                'status' => 'pending_dp',

                'notes' => 'Seeder booking',
                'expires_at' => Carbon::now()->addHours(6),
                'confirmed_at' => null,

                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}