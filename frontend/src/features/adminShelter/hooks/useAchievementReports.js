import { useQuery } from '@tanstack/react-query';
import { achievementReportApi } from '../api/achievementReportApi';
import { kegiatanApi } from '../api/kegiatanApi';

const PER_PAGE = 15;

const formatDateForRequest = (isoString) => {
  if (!isoString) {
    return null;
  }

  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return isoString;
    }

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return isoString;
  }
};

export const useAchievementReports = (filters = { startDate: null, endDate: null, jenisKegiatan: null }, page = 1) => {
  const fetchRecords = async () => {
    const params = {
      page,
      per_page: PER_PAGE
    };

    if (filters.startDate) {
      params.start_date = formatDateForRequest(filters.startDate);
    }

    if (filters.endDate) {
      params.end_date = formatDateForRequest(filters.endDate);
    }

    if (filters.jenisKegiatan) {
      params.jenis_kegiatan = filters.jenisKegiatan;
    }

    const response = await achievementReportApi.list(params);
    return response;
  };

  return useQuery({
    queryKey: ['achievementReports', filters, page],
    queryFn: fetchRecords,
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useJenisKegiatanOptions = () => {
  const fetchJenisOptions = async () => {
    const response = await kegiatanApi.getAllKegiatan();
    const payload = response?.data?.data ?? [];
    const uniqueNames = Array.from(new Set(
      payload
        .map(item => item?.nama_kegiatan)
        .filter(name => typeof name === 'string' && name.trim() !== '')
    ));

    return [
      { value: null, label: 'Semua Jenis' },
      ...uniqueNames.map(name => ({
        value: name,
        label: name
      }))
    ];
  };

  return useQuery({
    queryKey: ['jenisKegiatanOptions'],
    queryFn: fetchJenisOptions,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
};
