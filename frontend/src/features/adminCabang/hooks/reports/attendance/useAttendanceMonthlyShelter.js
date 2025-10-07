import { useMemo } from 'react';

const DUMMY_MONTHLY_SHELTERS = [
  {
    id: 'shelter-01',
    name: 'Shelter Mentari Timur',
    wilbin: 'Wilbin A',
    attendanceRate: 95,
    presentCount: 188,
    totalSessions: 198,
    activeChildren: 42,
  },
  {
    id: 'shelter-02',
    name: 'Shelter Harmoni Selatan',
    wilbin: 'Wilbin B',
    attendanceRate: 91,
    presentCount: 174,
    totalSessions: 192,
    activeChildren: 37,
  },
  {
    id: 'shelter-03',
    name: 'Shelter Cahaya Utara',
    wilbin: 'Wilbin C',
    attendanceRate: 88,
    presentCount: 162,
    totalSessions: 184,
    activeChildren: 35,
  },
  {
    id: 'shelter-04',
    name: 'Shelter Damai Barat',
    wilbin: 'Wilbin A',
    attendanceRate: 85,
    presentCount: 156,
    totalSessions: 184,
    activeChildren: 31,
  },
  {
    id: 'shelter-05',
    name: 'Shelter Pelita Pusat',
    wilbin: 'Wilbin D',
    attendanceRate: 82,
    presentCount: 149,
    totalSessions: 182,
    activeChildren: 29,
  },
];

export const useAttendanceMonthlyShelter = () => {
  const state = useMemo(
    () => ({
      data: DUMMY_MONTHLY_SHELTERS,
      isLoading: false,
      error: null,
      refetch: () => {},
    }),
    []
  );

  return state;
};

export default useAttendanceMonthlyShelter;
