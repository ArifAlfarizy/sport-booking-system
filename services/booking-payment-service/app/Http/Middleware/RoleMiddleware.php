<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;


class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $userRole = $request->input('__auth_user_role');

        if (! $userRole || ! in_array($userRole, $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Required role: ' . implode(' or ', $roles) . '.',
            ], 403);
        }

        return $next($request);
    }
}