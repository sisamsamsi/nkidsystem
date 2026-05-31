<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LogApiResponses
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Quick entry log to verify middleware invocation
        Log::debug('API: LogApiResponses middleware entered', ['path' => $request->path(), 'method' => $request->method(), 'has_authorization' => (bool) $request->header('Authorization')]);

        try {
            $response = $next($request);

            try {
                $status = method_exists($response, 'getStatusCode') ? $response->getStatusCode() : null;
            } catch (\Throwable $e) {
                $status = null;
            }

            if ($status === 401) {
                $payload = [
                    'method' => $request->method(),
                    'path' => $request->path(),
                    'ip' => $request->ip(),
                    'has_authorization' => (bool) $request->header('Authorization'),
                    'bearer_present' => $request->bearerToken() ? true : false,
                    'user_agent' => $request->header('User-Agent'),
                    'query' => $request->query(),
                ];

                Log::warning('API: Unauthenticated request detected', $payload);
            }

            return $response;
        } catch (\Illuminate\Auth\AuthenticationException $e) {
            // Log authentication exceptions as unauthenticated attempts
            $payload = [
                'method' => $request->method(),
                'path' => $request->path(),
                'ip' => $request->ip(),
                'has_authorization' => (bool) $request->header('Authorization'),
                'bearer_present' => $request->bearerToken() ? true : false,
                'user_agent' => $request->header('User-Agent'),
                'query' => $request->query(),
                'error' => $e->getMessage(),
            ];

            Log::warning('API: Authentication exception - unauthenticated request', $payload);

            throw $e;
        }
    }
}
