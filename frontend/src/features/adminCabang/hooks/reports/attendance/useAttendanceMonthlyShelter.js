import { useMemo } from 'react';

export const useAttendanceMonthlyShelter = () => {
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

export default useAttendanceMonthlyShelter;
