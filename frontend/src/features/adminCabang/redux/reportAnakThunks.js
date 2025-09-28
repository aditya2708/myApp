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

const normalizeFilterOptions = (raw = {}) => {
  const safeRaw = raw || {};
  const jenis = safeRaw.jenisKegiatan || safeRaw.jenis_kegiatan || safeRaw.activity_types || safeRaw.activities || [];
  const wilayah = safeRaw.wilayahBinaan || safeRaw.wilayah_binaan || safeRaw.wilayah || safeRaw.regions || [];
  const sheltersMap = safeRaw.sheltersByWilayah || safeRaw.shelters_by_wilayah || safeRaw.shelter_map || safeRaw.shelters || {};

  return {
    jenisKegiatan: jenis,
    wilayahBinaan: wilayah,
    sheltersByWilayah: sheltersMap,
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
      const [listResponse, jenisResponse, wilayahResponse] = await Promise.all([
        adminCabangReportApi.getLaporanAnakBinaan(),
        adminCabangReportApi.getJenisKegiatanOptions(),
        adminCabangReportApi.getWilayahBinaanOptions(),
      ]);

      const listPayload = extractListPayload(listResponse);
      const jenisOptions =
        jenisResponse?.data?.data ||
        jenisResponse?.data?.options ||
        jenisResponse?.data ||
        [];
      const wilayahOptions =
        wilayahResponse?.data?.data ||
        wilayahResponse?.data?.options ||
        wilayahResponse?.data ||
        [];

      return {
        ...listPayload,
        filterOptions: {
          ...listPayload.filterOptions,
          jenisKegiatan: jenisOptions.length > 0 ? jenisOptions : listPayload.filterOptions.jenisKegiatan,
          wilayahBinaan: wilayahOptions.length > 0 ? wilayahOptions : listPayload.filterOptions.wilayahBinaan,
        },
      };
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
  async (wilbinId, { rejectWithValue }) => {
    if (!wilbinId) {
      return [];
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
