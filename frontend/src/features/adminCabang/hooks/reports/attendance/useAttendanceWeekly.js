import { useMemo } from 'react';

export const useAttendanceWeekly = () => {
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

export default useAttendanceWeekly;
