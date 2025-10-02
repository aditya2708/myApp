<?php

$projectId = env('FIREBASE_PROJECT_ID', 'app');
$credentials = env('FIREBASE_CREDENTIALS');
$credentialsValue = null;

if (! empty($credentials)) {
    $decoded = base64_decode($credentials, true);
    $payload = $decoded !== false ? $decoded : $credentials;

    $json = json_decode($payload, true);

    if (json_last_error() === JSON_ERROR_NONE && is_array($json)) {
        $credentialsValue = $json;
    } elseif ($decoded !== false) {
        $credentialsValue = $decoded;
    } else {
        $credentialsValue = $credentials;
    }
}

return [
    'default' => $projectId,

    'projects' => [
        $projectId => array_filter([
            'credentials' => $credentialsValue,
        ], static fn ($value) => $value !== null),
    ],
];
