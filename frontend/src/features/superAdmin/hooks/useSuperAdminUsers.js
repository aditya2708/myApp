import { useQuery } from '@tanstack/react-query';
import { superAdminUserApi } from '../api/superAdminUserApi';
import { superAdminUserKeys } from './queryKeys';
import { extractList } from '../utils/responseHelpers';

export const useSuperAdminUsers = (search) => {
  return useQuery({
    queryKey: superAdminUserKeys.list(search || ''),
    queryFn: async () => {
      const response = await superAdminUserApi.list({
        search: search || undefined,
        per_page: 25,
      });
      return extractList(response.data);
    },
    select: (data) => data ?? [],
  });
};
