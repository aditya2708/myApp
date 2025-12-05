<?php

return [
    'management_base_url' => env('SSO_MANAGEMENT_BASE_URL', 'http://localhost:8000'),
    'timeout' => (int) env('SSO_HTTP_TIMEOUT', 5),
    'cache_ttl' => (int) env('SSO_CACHE_TTL', 60),
    'cache_store' => env('SSO_CACHE_STORE'), // null = default store
    'app_slug' => env('SSO_APP_SLUG'), // optional: gate access based on apps_allowed[] from IdP
    'accept_header' => env('SSO_ACCEPT_HEADER', 'application/vnd.sso.v2+json'),
    'multi_company' => filter_var(env('SSO_MULTI_COMPANY', true), FILTER_VALIDATE_BOOLEAN),
    'default_company_slug' => env('DEFAULT_COMPANY_SLUG'),
    'company_autoprovision_company' => filter_var(env('TENANT_COMPANY_AUTOPROVISION_COMPANY', false), FILTER_VALIDATE_BOOLEAN),
    'company_autoprovision' => filter_var(env('TENANT_COMPANY_AUTOPROVISION', false), FILTER_VALIDATE_BOOLEAN),
    'company_default_role' => env('TENANT_DEFAULT_ROLE', \App\Models\User::DEFAULT_ROLE),
];
