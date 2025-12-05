import { useQuery } from '@tanstack/react-query';
import { superAdminUserApi } from '../api/superAdminUserApi';
import { superAdminUserKeys } from './queryKeys';
import { extractList } from '../utils/responseHelpers';

export const useKacabOptions = () => {
  return useQuery({
    queryKey: superAdminUserKeys.dropdowns.kacabs,
    queryFn: async () => {
      const response = await superAdminUserApi.listKacabs();
      return extractList(response.data).map((item) => ({
        label: item.nama_kacab || item.nama_cabang || `Cabang ${item.id_kacab}`,
        value: String(item.id_kacab),
      }));
    },
    select: (data) => data ?? [],
  });
};

export const useWilbinOptions = (kacabId, { enabled } = {}) => {
  return useQuery({
    queryKey: superAdminUserKeys.dropdowns.wilbins(kacabId),
    queryFn: async () => {
      const response = await superAdminUserApi.listWilbins(kacabId);
      return extractList(response.data).map((item) => ({
        label: item.nama_wilbin || `Wilbin ${item.id_wilbin}`,
        value: String(item.id_wilbin),
      }));
    },
    select: (data) => data ?? [],
    enabled,
  });
};

export const useShelterOptions = (wilbinId, { enabled } = {}) => {
  return useQuery({
    queryKey: superAdminUserKeys.dropdowns.shelters(wilbinId),
    queryFn: async () => {
      const response = await superAdminUserApi.listShelters(wilbinId);
      return extractList(response.data).map((item) => ({
        label: item.nama_shelter || `Shelter ${item.id_shelter}`,
        value: String(item.id_shelter),
      }));
    },
    select: (data) => data ?? [],
    enabled,
  });
};
