import { API_ORIGIN, STORAGE_CHILD_PHOTO_BASE_URL } from '../../constants/config';

const trimValue = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeBase = (value) => (typeof value === 'string' ? value.replace(/\/+$/, '') : '');

const buildChildStorageUrl = (idAnak, foto) => {
  const safeId = trimValue(idAnak != null ? String(idAnak) : '');
  const safeFoto = trimValue(foto);

  if (!safeId || !safeFoto || !STORAGE_CHILD_PHOTO_BASE_URL) {
    return null;
  }

  const encodedId = encodeURIComponent(safeId);
  const encodedFoto = encodeURIComponent(safeFoto);

  return `${normalizeBase(STORAGE_CHILD_PHOTO_BASE_URL)}/${encodedId}/${encodedFoto}`;
};

const resolveRelativeUrl = (url) => {
  const trimmedUrl = trimValue(url);

  if (!trimmedUrl) {
    return null;
  }

  if (!API_ORIGIN) {
    return trimmedUrl;
  }

  if (trimmedUrl.startsWith('/')) {
    return `${normalizeBase(API_ORIGIN)}${trimmedUrl}`;
  }

  return `${normalizeBase(API_ORIGIN)}/${trimmedUrl.replace(/^\/+/, '')}`;
};

export const resolveChildPhotoUrl = ({ foto_url, foto, id_anak } = {}) => {
  const trimmedFotoUrl = trimValue(foto_url);
  const fallbackUrl = buildChildStorageUrl(id_anak, foto);

  if (trimmedFotoUrl) {
    try {
      const parsedUrl = new URL(trimmedFotoUrl);

      if (!API_ORIGIN || parsedUrl.origin === API_ORIGIN) {
        return trimmedFotoUrl;
      }

      return fallbackUrl || trimmedFotoUrl;
    } catch (error) {
      const relativeUrl = resolveRelativeUrl(trimmedFotoUrl);

      if (relativeUrl) {
        return relativeUrl;
      }

      return fallbackUrl || trimmedFotoUrl;
    }
  }

  return fallbackUrl;
};

export default resolveChildPhotoUrl;
