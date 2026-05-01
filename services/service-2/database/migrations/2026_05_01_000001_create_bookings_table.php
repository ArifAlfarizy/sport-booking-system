<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Cross-service references (no FK — different databases)
            $table->uuid('user_id')->comment('References user_db.users.id');
            $table->uuid('slot_id')->comment('References field_db.slots.id');
            $table->uuid('field_id')->comment('Denormalized from field_db for efficient queries');

            $table->date('play_date');
            $table->time('start_time');
            $table->time('end_time');

            $table->decimal('total_price', 12, 2);
            $table->decimal('dp_amount',   12, 2);
            $table->decimal('remaining',   12, 2);

            $table->enum('status', [
                'pending_dp',
                'dp_paid',
                'paid',
                'cancelled',
                'done',
            ])->default('pending_dp');

            $table->text('notes')->nullable();
            $table->timestamp('expires_at')->nullable()->comment('DP payment deadline');
            $table->timestamp('confirmed_at')->nullable();

            $table->timestamps(); // created_at, updated_at

            // Indexes
            $table->index('user_id');
            $table->index('slot_id');
            $table->index(['field_id', 'play_date']);
            $table->index('status');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};