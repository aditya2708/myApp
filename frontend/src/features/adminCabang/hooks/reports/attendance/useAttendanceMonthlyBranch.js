import { useMemo } from 'react';

export const useAttendanceMonthlyBranch = () => {
  const state = useMemo(
    () => ({
      data: null,
      isLoading: false,
      error: null,
      refetch: () => {},
    }),
    []
  );

  return state;
};

export default useAttendanceMonthlyBranch;
