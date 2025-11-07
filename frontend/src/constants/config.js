// API base URLs
//export const API_BASE_URL = 'http://192.168.1.23:8000/api';
export const API_BASE_URL = 'http://192.168.8.105:8000/api';
//export const API_BASE_URL = 'https://bp.berbagipendidikan.org/api';

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
export const STORAGE_BASE_URL = API_ORIGIN
  ? `${removeTrailingSlashes(API_ORIGIN)}/storage`
  : '';
export const STORAGE_CHILD_PHOTO_BASE_URL = STORAGE_BASE_URL
  ? `${removeTrailingSlashes(STORAGE_BASE_URL)}/Anak`
  : '';

// Asset URLs
const resolveDonationAssetBaseUrl = () => {
  const env =
    (typeof process !== 'undefined' && process?.env) ?
      process.env.EXPO_PUBLIC_DONATION_ASSET_BASE_URL ||
      process.env.DONATION_ASSET_BASE_URL :
      null;

  const value = typeof env === 'string' ? env.trim() : '';
  return value || 'https://home.kilauindonesia.org';
};

export const DONATION_ASSET_BASE_URL = resolveDonationAssetBaseUrl();

// Storage keys
export const STORAGE_TOKEN_KEY = 'berbagipendidikan_token';
export const STORAGE_USER_KEY = 'berbagipendidikan_user';

// Image URLs
export const IMAGE_BASE_URL = 'http://192.168.8.105/storage/AdminShelter/Shelter/';
export const PROFILE_IMAGE_BASE_URL = 'http://192.168.8.105/storage/';

// App constants
export const APP_NAME = 'Berbagi Pendidikan';
export const APP_VERSION = '1.0.0';

// Timeout settings
export const API_TIMEOUT = 15000; // 15 seconds

// User roles
export const USER_ROLES = {
  ADMIN_PUSAT: 'admin_pusat',
  ADMIN_CABANG: 'admin_cabang',
  ADMIN_SHELTER: 'admin_shelter',
  DONATUR: 'donatur'
};