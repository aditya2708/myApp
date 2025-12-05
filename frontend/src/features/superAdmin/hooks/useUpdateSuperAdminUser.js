import { useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminUserApi } from '../api/superAdminUserApi';
import { superAdminUserKeys } from './queryKeys';

export const useUpdateSuperAdminUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }) => superAdminUserApi.update(userId, payload),
    onSuccess: (_, variables) => {
      if (variables?.userId) {
        queryClient.invalidateQueries({
          queryKey: superAdminUserKeys.detail(variables.userId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: superAdminUserKeys.list(),
        exact: false,
      });
    },
  });
};
