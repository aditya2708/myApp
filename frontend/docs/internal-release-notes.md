# Internal Release Notes

## Tutor attendance QR endpoint consolidation
- Updated the frontend QR attendance recording request to use `/admin-shelter/attendance/record` instead of the deprecated `/admin-shelter/tutor-attendance/record`.
- All QR scanning flows (e.g., QrScannerScreen, QrScannerTab) continue to work without change because the request payload structure is unchanged (`type: 'tutor'`, `token`, `id_aktivitas`, optional `arrival_time` and `gps_data`).
- Ensure any external integrations also target the consolidated endpoint moving forward.
