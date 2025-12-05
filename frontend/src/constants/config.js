const getEnv = (key, fallback = '') =>
  (typeof process !== 'undefined' && process?.env?.[key]
    ? process.env[key]
    : fallback
  ).trim();

// API base URLs
export const API_BASE_URL = getEnv('EXPO_PUBLIC_API_BASE_URL', 'http://127.0.0.1:9000/api');
export const MANAGEMENT_BASE_URL = getEnv(
  'EXPO_PUBLIC_MANAGEMENT_BASE_URL',
  'http://127.0.0.1:8000'
);

const sanitizeUrlValue = (value) =>
  typeof value === 'string' ? value.trim() : '';

const removeTrailingSlashes = (value) =>
  typeof value === 'string' ? value.replace(/\/+$/, '') : '';

const resolveApiOrigin = () => {
  const baseUrl = sanitizeUrlValue(API_BASE_URL);

  if (!baseUrl) {
    return '';
  }

  try {
    return new URL(baseUrl).origin;
  } catch (error) {
    // Fallback for cases where API_BASE_URL might be relative or missing protocol
    const match = baseUrl.match(/^(https?:\/\/[^/]+)/i);
    return match ? match[1] : '';
  }
};

export const API_ORIGIN = resolveApiOrigin();
const BASE_STORAGE = API_ORIGIN
  ? `${removeTrailingSlashes(API_ORIGIN)}/storage`
  : '';

export const STORAGE_BASE_URL = BASE_STORAGE;
export const STORAGE_CHILD_PHOTO_BASE_URL = STORAGE_BASE_URL
  ? `${removeTrailingSlashes(STORAGE_BASE_URL)}/Anak`
  : '';

// Asset URLs
const resolveDonationAssetBaseUrl = () => {
  const envValue = getEnv('EXPO_PUBLIC_DONATION_ASSET_BASE_URL') || getEnv('DONATION_ASSET_BASE_URL');
  return envValue || 'https://home.kilauindonesia.org';
};

export const DONATION_ASSET_BASE_URL = resolveDonationAssetBaseUrl();

// Storage keys
export const STORAGE_TOKEN_KEY = 'berbagipendidikan_token';
export const STORAGE_USER_KEY = 'berbagipendidikan_user';
export const STORAGE_REFRESH_TOKEN_KEY = 'berbagipendidikan_refresh_token';
export const STORAGE_CURRENT_ROLE_KEY = 'berbagipendidikan_current_role';

// OAuth client (exposed for mobile refresh; keep scoped)
export const SSO_CLIENT_ID = getEnv('EXPO_PUBLIC_SSO_CLIENT_ID', '');
export const SSO_CLIENT_SECRET = getEnv('EXPO_PUBLIC_SSO_CLIENT_SECRET', '');

// Image URLs
export const PROFILE_IMAGE_BASE_URL = BASE_STORAGE || '';
export const IMAGE_BASE_URL = PROFILE_IMAGE_BASE_URL
  ? `${removeTrailingSlashes(PROFILE_IMAGE_BASE_URL)}/AdminShelter/Shelter`
  : '';

// App constants
export const APP_NAME = 'Berbagi Pendidikan';
export const APP_VERSION = '1.0.0';

// Timeout settings
export const API_TIMEOUT = 15000; // 15 seconds

// User roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN_PUSAT: 'admin_pusat',
  ADMIN_CABANG: 'admin_cabang',
  ADMIN_SHELTER: 'admin_shelter',
  DONATUR: 'donatur'
};
