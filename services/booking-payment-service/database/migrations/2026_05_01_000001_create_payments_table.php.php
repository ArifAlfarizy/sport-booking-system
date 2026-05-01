<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('booking_id');

            $table->enum('type', ['dp', 'settlement']);
            $table->decimal('amount', 12, 2);
            $table->enum('method', ['bank_transfer', 'qris', 'cash']);

            $table->string('proof_url', 500)->nullable()->comment('Uploaded payment proof image URL');

            $table->enum('status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->text('reject_note')->nullable();

            // Who verified (cross-service: owner user_id from user_db)
            $table->uuid('verified_by')->nullable()->comment('Owner user_id from user_db');
            $table->timestamp('verified_at')->nullable();

            $table->timestamps();

            // Indexes & FK
            $table->index(['booking_id', 'type']);
            $table->index('status');

            $table->foreign('booking_id')
                  ->references('id')
                  ->on('bookings')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};