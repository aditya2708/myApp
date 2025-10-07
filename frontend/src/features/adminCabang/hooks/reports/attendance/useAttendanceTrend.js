import { useMemo } from 'react';

const DUMMY_TREND = [
  { monthLabel: 'Apr 2023', attendanceRate: 88 },
  { monthLabel: 'Mei 2023', attendanceRate: 90 },
  { monthLabel: 'Jun 2023', attendanceRate: 87 },
  { monthLabel: 'Jul 2023', attendanceRate: 91 },
  { monthLabel: 'Agu 2023', attendanceRate: 93 },
  { monthLabel: 'Sep 2023', attendanceRate: 92 },
];

export const useAttendanceTrend = () => {
  const state = useMemo(
    () => ({
      data: DUMMY_TREND,
      isLoading: false,
      error: null,
      refetch: () => {},
    }),
    []
  );

  return state;
};

export default useAttendanceTrend;
