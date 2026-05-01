<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'slot_id',
        'field_id',
        'play_date',
        'start_time',
        'end_time',
        'total_price',
        'dp_amount',
        'remaining',
        'status',
        'notes',
        'expires_at',
        'confirmed_at',
    ];

    protected $casts = [
        'play_date'    => 'date',
        'total_price'  => 'decimal:2',
        'dp_amount'    => 'decimal:2',
        'remaining'    => 'decimal:2',
        'expires_at'   => 'datetime',
        'confirmed_at' => 'datetime',
    ];


    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->orderBy('created_at');
    }

    

    public function scopeByUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByField($query, string $fieldId)
    {
        return $query->where('field_id', $fieldId);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'pending_dp')
                     ->where('expires_at', '<', now());
    }

    public function scopeToday($query)
    {
        return $query->whereDate('play_date', today());
    }

    public function isOwnedBy(string $userId): bool
    {
        return $this->user_id === $userId;
    }

    public function isCancellable(): bool
    {
        return in_array($this->status, ['pending_dp', 'dp_paid']);
    }
}