<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $internalKey = $request->header('x-internal-key');

        if ($internalKey !== env('INTERNAL_GATEWAY_KEY')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized gateway.',
            ], 401);
        }

        $userId = $request->header('x-user-id');
        $role   = $request->header('x-user-role');

        if (! $userId || ! $role) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Missing authentication context.',
            ], 401);
        }

        $request->merge([
            '__auth_user_id'    => $userId,
            '__auth_user_role'  => $role,
            '__auth_user_email' => $request->header('x-user-email'),
        ]);

        return $next($request);
    }
}