import { createAsyncThunk } from '@reduxjs/toolkit';
import { adminCabangReportApi } from '../api/adminCabangReportApi';

const parseError = (error, defaultMessage = 'Terjadi kesalahan. Silakan coba lagi.') => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (typeof error?.message === 'string') {
    return error.message;
  }

  return defaultMessage;
};

const ensureArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') {
    return Object.values(value);
  }
  return [value];
};

const normalizeOptionItem = (item) => {
  if (item && typeof item === 'object') {
    const idCandidate =
      item.value ??
      item.id ??
      item.slug ??
      item.key ??
      item.kode ??
      item.code ??
      item.uid ??
      item.uuid ??
      item.identifier ??
      null;

    const labelCandidate =
      item.label ??
      item.name ??
      item.nama ??
      item.title ??
      item.text ??
      item.description ??
      null;

    const fallback = labelCandidate ?? idCandidate;

    return {
      ...item,
      id: idCandidate ?? fallback ?? '',
      name: labelCandidate ?? (fallback != null ? fallback : ''),
    };
  }

  return {
    id: item,
    name: item,
  };
};

const extractWilbinId = (shelter) => {
  if (!shelter) return null;

  const directId =
    shelter.wilbin_id ??
    shelter.wilbinId ??
    shelter.wilayah_id ??
    shelter.wilayahId ??
    shelter.wilayahBinaanId ??
    shelter.wilbin ??
    shelter.wilayah ??
    shelter.wilayahBinaan ??
    null;

  if (directId && typeof directId !== 'object') {
    return directId;
  }

  const nested =
    (directId && typeof directId === 'object' ? directId : null) ||
    shelter.wilbin ||
    shelter.wilayah ||
    shelter.wilayahBinaan ||
    null;

  if (!nested) {
    return null;
  }

  if (typeof nested !== 'object') {
    return nested;
  }

  return (
    nested.id ??
    nested.value ??
    nested.slug ??
    nested.key ??
    nested.kode ??
    nested.code ??
    nested.uid ??
    nested.uuid ??
    nested.identifier ??
    null
  );
};

const normalizeFilterOptions = (raw = {}) => {
  const safeRaw = raw || {};

  const jenisSource = ensureArray(
    safeRaw.jenisKegiatan ||
      safeRaw.jenis_kegiatan ||
      safeRaw.activity_types ||
      safeRaw.activities ||
      safeRaw.available_activity_types
  );

  const wilayahSource = ensureArray(
    safeRaw.wilayahBinaan ||
      safeRaw.wilayah_binaan ||
      safeRaw.wilayah ||
      safeRaw.regions ||
      safeRaw.wilbins
  );

  const sheltersSource =
    safeRaw.sheltersByWilayah ||
    safeRaw.shelters_by_wilayah ||
    safeRaw.shelter_map ||
    safeRaw.shelters ||
    {};

  const jenisKegiatan = jenisSource
    .filter((item) => item !== undefined && item !== null)
    .map((item) => normalizeOptionItem(item));
  const wilayahBinaan = wilayahSource
    .filter((item) => item !== undefined && item !== null)
    .map((item) => normalizeOptionItem(item));

  const sheltersByWilayah = {};

  if (Array.isArray(sheltersSource)) {
    sheltersSource.forEach((shelter) => {
      const normalizedShelter = normalizeOptionItem(shelter);
      const wilbinId = extractWilbinId(shelter);

      if (wilbinId == null) {
        return;
      }

      if (!sheltersByWilayah[wilbinId]) {
        sheltersByWilayah[wilbinId] = [];
      }

      sheltersByWilayah[wilbinId].push(normalizedShelter);
    });
  } else if (sheltersSource && typeof sheltersSource === 'object') {
    Object.entries(sheltersSource).forEach(([wilbinKey, shelterList]) => {
      const normalizedList = ensureArray(shelterList).map((item) => normalizeOptionItem(item));
      if (normalizedList.length > 0) {
        sheltersByWilayah[wilbinKey] = normalizedList;
      }
    });
  }

  return {
    jenisKegiatan,
    wilayahBinaan,
    sheltersByWilayah,
    raw: safeRaw,
  };
};

const extractListPayload = (response) => {
  const payload = response?.data?.data || response?.data || {};
  const children =
    payload.children ||
    payload.data ||
    payload.items ||
    payload.results ||
    [];

  const summary =
    payload.summary ||
    payload.overview ||
    payload.meta?.summary ||
    null;

  const pagination =
    payload.pagination ||
    payload.meta?.pagination || {
      current_page: payload.current_page || payload.meta?.current_page || 1,
      last_page: payload.last_page || payload.meta?.last_page || 1,
      per_page: payload.per_page || payload.meta?.per_page || children.length || 10,
      total: payload.total || payload.meta?.total || children.length || 0,
    };

  const filterOptions = normalizeFilterOptions(payload.filter_options || payload.filters || {});

  return {
    children,
    summary,
    pagination,
    filterOptions,
  };
};

const extractDetailPayload = (response) => {
  const payload = response?.data?.data || response?.data || {};

  return {
    child: payload.child || payload.profile || payload.data || payload,
    summary: payload.summary || payload.overview || null,
    activities: payload.activities || payload.records || payload.attendance || [],
    metadata: payload.metadata || payload.meta || {},
  };
};

export const initializeReportAnak = createAsyncThunk(
  'reportAnak/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminCabangReportApi.getLaporanAnakBinaan();
      return extractListPayload(response);
    } catch (error) {
      return rejectWithValue(parseError(error, 'Gagal memuat laporan anak binaan.'));
    }
  }
);

export const fetchReportAnakList = createAsyncThunk(
  'reportAnak/fetchList',
  async ({ filters = {}, page = 1, append = false } = {}, { rejectWithValue }) => {
    try {
      const params = { ...filters, page };
      const response = await adminCabangReportApi.getLaporanAnakBinaan(params);
      const payload = extractListPayload(response);

      return { ...payload, append };
    } catch (error) {
      return rejectWithValue(parseError(error, 'Gagal memuat daftar anak.'));
    }
  }
);

export const fetchMoreReportAnak = createAsyncThunk(
  'reportAnak/fetchMore',
  async ({ filters = {}, page }, { rejectWithValue }) => {
    try {
      const params = { ...filters, page };
      const response = await adminCabangReportApi.getLaporanAnakBinaan(params);
      const payload = extractListPayload(response);

      return { ...payload, append: true };
    } catch (error) {
      return rejectWithValue(parseError(error, 'Gagal memuat data tambahan.'));
    }
  }
);

export const fetchReportAnakChildDetail = createAsyncThunk(
  'reportAnak/fetchChildDetail',
  async ({ childId, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await adminCabangReportApi.getChildDetailReport(childId, filters);
      return extractDetailPayload(response);
    } catch (error) {
      return rejectWithValue(parseError(error, 'Gagal memuat detail anak.'));
    }
  }
);

export const fetchShelterOptionsByWilayah = createAsyncThunk(
  'reportAnak/fetchShelterOptions',
  async (wilbinId, { rejectWithValue, getState }) => {
    if (!wilbinId) {
      return [];
    }

    const state = getState();
    const existing =
      state?.reportAnak?.filterOptions?.sheltersByWilayah?.[wilbinId] ||
      state?.reportAnak?.filterOptions?.sheltersByWilayah?.[String(wilbinId)];

    if (Array.isArray(existing)) {
      return existing;
    }

    try {
      const response = await adminCabangReportApi.getShelterOptionsByWilayah(wilbinId);
      return (
        response?.data?.data ||
        response?.data?.options ||
        response?.data ||
        []
      );
    } catch (error) {
      return rejectWithValue(parseError(error, 'Gagal memuat daftar shelter.'));
    }
  }
);
