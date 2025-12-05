import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { superAdminUserApi } from '../api/superAdminUserApi';
import { superAdminUserKeys } from './queryKeys';
import { extractList } from '../utils/responseHelpers';

export const useSsoDirectory = (search, { enabled } = {}) => {
  return useQuery({
    queryKey: superAdminUserKeys.directory(search || ''),
    queryFn: async () => {
      const response = await superAdminUserApi.listSsoDirectory({
        search: search || undefined,
      });
      return extractList(response.data);
    },
    select: (data) => data ?? [],
    enabled,
  });
};

export const useImportSsoUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sub) => superAdminUserApi.importFromSso(sub),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: superAdminUserKeys.list(),
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: superAdminUserKeys.directory(),
        exact: false,
      });
    },
  });
};
