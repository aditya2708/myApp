import { useMemo } from 'react';

const DUMMY_SUMMARY = {
  periodLabel: 'September 2023',
  presentCount: 912,
  attendanceRate: 92,
  activeChildren: 134,
  absentCount: 78,
};

export const useAttendanceSummary = () => {
  const state = useMemo(
    () => ({
      data: DUMMY_SUMMARY,
      isLoading: false,
      error: null,
      refetch: () => {},
    }),
    []
  );

  return state;
};

export default useAttendanceSummary;
