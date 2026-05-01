<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * HTTP client for Field & Slot Service (:3002)
 */
class FieldServiceClient
{
    private string $baseUrl;
    private int    $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.field_service.url');
        $this->timeout = config('services.field_service.timeout', 5);
    }


    /**
     * Get slot details (price, dp_percent, status, day, times).
     * Returns null if slot not found or service udnreachable.
     */
    public function getSlot(string $slotId): ?array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->get("{$this->baseUrl}/slots/{$slotId}");

            if ($response->successful()) {
                return $response->json('data');
            }

            Log::warning("FieldService: slot {$slotId} not found", [
                'status' => $response->status(),
            ]);

            return null;
        } catch (ConnectionException $e) {
            Log::error("FieldService unreachable: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Lock slot after boking is created (status → booked).
     */
    public function lockSlot(string $slotId): bool
    {
        return $this->patchSlotStatus($slotId, 'booked');
    }

    /**
     * Unlock slot when booking is cancelled (status → available).
     */
    public function unlockSlot(string $slotId): bool
    {
        return $this->patchSlotStatus($slotId, 'available');
    }

    private function patchSlotStatus(string $slotId, string $status): bool
    {
        try {
            $response = Http::timeout($this->timeout)
                ->patch("{$this->baseUrl}/slots/{$slotId}/status", [
                    'status' => $status,
                ]);

            return $response->successful();
        } catch (ConnectionException $e) {
            Log::error("FieldService: failed to set slot {$slotId} → {$status}: {$e->getMessage()}");
            return false;
        }
    }


    /**
     * Fetch basic field info (name, type, owner_id) for booking context.
     */
    public function getField(string $fieldId): ?array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->get("{$this->baseUrl}/fields/{$fieldId}");

            return $response->successful() ? $response->json('data') : null;
        } catch (ConnectionException $e) {
            Log::error("FieldService: getField failed: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Get all field IDs owned by a given owner_id.
     * Used for owner dashboard queries.
     */
    public function getFieldIdsByOwner(string $ownerId): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->get("{$this->baseUrl}/fields", ['owner_id' => $ownerId]);

            if ($response->successful()) {
                return collect($response->json('data'))->pluck('id')->toArray();
            }

            return [];
        } catch (ConnectionException $e) {
            Log::error("FieldService: getFieldIdsByOwner failed: {$e->getMessage()}");
            return [];
        }
    }
}