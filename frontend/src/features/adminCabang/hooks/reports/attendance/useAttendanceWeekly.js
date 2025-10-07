import { useMemo } from 'react';

const DUMMY_WEEKLY = [
  {
    id: 'week-1',
    weekLabel: 'Minggu 1 (1-7 Sep)',
    attendanceRate: 90,
    presentCount: 228,
    totalSessions: 252,
    absentCount: 24,
  },
  {
    id: 'week-2',
    weekLabel: 'Minggu 2 (8-14 Sep)',
    attendanceRate: 93,
    presentCount: 236,
    totalSessions: 254,
    absentCount: 18,
  },
  {
    id: 'week-3',
    weekLabel: 'Minggu 3 (15-21 Sep)',
    attendanceRate: 89,
    presentCount: 221,
    totalSessions: 248,
    absentCount: 27,
  },
  {
    id: 'week-4',
    weekLabel: 'Minggu 4 (22-30 Sep)',
    attendanceRate: 95,
    presentCount: 243,
    totalSessions: 256,
    absentCount: 13,
  },
];

export const useAttendanceWeekly = () => {
  const state = useMemo(
    () => ({
      data: DUMMY_WEEKLY,
      isLoading: false,
      error: null,
      refetch: () => {},
    }),
    []
  );

  return state;
};

export default useAttendanceWeekly;
