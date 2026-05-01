<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FieldServiceClient
{
    private string $baseUrl;
    private int    $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.field_service.url');
        $this->timeout = config('services.field_service.timeout', 5);
    }

    public function getSlot(string $slotId): ?array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->get("{$this->baseUrl}/slots/{$slotId}");

            if ($response->successful()) {
                return $response->json();
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

    public function lockSlot(string $slotId): bool
    {
        return $this->patchSlotStatus($slotId, 'booked');
    }

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

            Log::info("FieldService: patchSlotStatus", [
                'url'        => "{$this->baseUrl}/slots/{$slotId}/status",
                'status'     => $status,
                'httpStatus' => $response->status(),
                'body'       => $response->body(),
            ]);

            return $response->successful();
        } catch (ConnectionException $e) {
            Log::error("FieldService: failed to set slot {$slotId} → {$status}: {$e->getMessage()}");
            return false;
        }
    }

    public function getField(string $fieldId): ?array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->get("{$this->baseUrl}/fields/{$fieldId}");

            return $response->successful() ? $response->json() : null;
        } catch (ConnectionException $e) {
            Log::error("FieldService: getField failed: {$e->getMessage()}");
            return null;
        }
    }

    public function getFieldIdsByOwner(string $ownerId): array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->get("{$this->baseUrl}/fields", ['owner_id' => $ownerId]);

            if ($response->successful()) {
                return collect($response->json())->pluck('id')->toArray();
            }

            return [];
        } catch (ConnectionException $e) {
            Log::error("FieldService: getFieldIdsByOwner failed: {$e->getMessage()}");
            return [];
        }
    }
}