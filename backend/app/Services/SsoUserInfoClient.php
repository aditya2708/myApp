<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class SsoUserInfoClient
{
    public function fetch(string $accessToken): array
    {
        $cacheKey = 'sso:userinfo:'.sha1($accessToken);
        $ttl = (int) config('sso.cache_ttl', 60);
        $store = config('sso.cache_store');

        $callback = function () use ($accessToken) {
            $request = Http::timeout(config('sso.timeout', 5));

            $accept = config('sso.accept_header');
            if ($accept) {
                $request = $request->withHeaders(['Accept' => $accept]);
            } else {
                $request = $request->acceptJson();
            }

            $response = $request
                ->withToken($accessToken)
                ->get(rtrim(config('sso.management_base_url'), '/').'/api/userinfo');

            if ($response->status() === 401) {
                throw new UnauthorizedHttpException('Bearer', 'Invalid SSO token.');
            }

            try {
                $response->throw();
            } catch (RequestException $exception) {
                throw new UnauthorizedHttpException('Bearer', 'SSO validation failed.', $exception);
            }

            return $response->json();
        };

        if ($ttl <= 0) {
            return $callback();
        }

        $cache = $store ? Cache::store($store) : Cache::store();

        return $cache->remember($cacheKey, now()->addSeconds($ttl), $callback);
    }
}
