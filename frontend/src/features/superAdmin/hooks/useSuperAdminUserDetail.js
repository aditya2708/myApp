import { useQuery } from '@tanstack/react-query';
import { superAdminUserApi } from '../api/superAdminUserApi';
import { superAdminUserKeys } from './queryKeys';
import { parsePayload } from '../utils/responseHelpers';

export const useSuperAdminUserDetail = (userId, options = {}) => {
  return useQuery({
    queryKey: superAdminUserKeys.detail(userId),
    queryFn: async () => {
      const response = await superAdminUserApi.show(userId);
      return parsePayload(response.data);
    },
    enabled: !!userId,
    ...options,
  });
};
