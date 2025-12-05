<?php

namespace App\Services;

use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\RequestException;

class SsoUserDirectoryClient
{
    public function __construct(
        private readonly HttpFactory $http
    ) {
    }

    /**
     * @throws RequestException
     */
    public function fetchList(string $accessToken, array $params = []): array
    {
        $response = $this->http
            ->withToken($accessToken)
            ->acceptJson()
            ->get($this->baseUrl('/api/admin/users'), $params);

        return $response->throw()->json();
    }

    /**
     * @throws RequestException
     */
    public function fetchUser(string $accessToken, int|string $userId): array
    {
        $response = $this->http
            ->withToken($accessToken)
            ->acceptJson()
            ->get($this->baseUrl("/api/admin/users/{$userId}"));

        return $response->throw()->json('data');
    }

    private function baseUrl(string $path): string
    {
        return rtrim(config('sso.management_base_url'), '/') . $path;
    }
}
