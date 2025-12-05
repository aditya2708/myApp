<?php

namespace App\Support;

use App\Models\SsoCompany;
use App\Models\User;

class SsoContext
{
    public function __construct(
        public readonly array $payload,
        public readonly User $user,
        public readonly ?string $accessToken = null,
        public readonly ?SsoCompany $company = null,
        public readonly ?string $role = null,
    ) {
    }

    public function sub(): int|string
    {
        return $this->payload['sub'];
    }

    public function email(): ?string
    {
        return $this->payload['email'] ?? null;
    }

    public function raw(): array
    {
        return $this->payload;
    }

    public function token(): ?string
    {
        return $this->accessToken;
    }

    public function company(): ?SsoCompany
    {
        return $this->company;
    }

    public function role(): ?string
    {
        return $this->role;
    }
}
