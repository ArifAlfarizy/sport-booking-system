<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UserServiceClient
{
    private string $baseUrl;
    private int    $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.user_service.url');
        $this->timeout = config('services.user_service.timeout', 5);
    }

  
    public function getUser(string $userId): ?array
    {
        try {
            $response = Http::timeout($this->timeout)
                ->get("{$this->baseUrl}/user/{$userId}");

           return $response->successful() ? $response->json() : null;
        } catch (ConnectionException $e) {
            Log::error("UserService: getUser({$userId}) failed: {$e->getMessage()}");
            return null;
        }
    }
}