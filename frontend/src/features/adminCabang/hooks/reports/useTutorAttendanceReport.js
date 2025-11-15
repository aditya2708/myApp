import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { adminCabangReportApi } from '../../api/adminCabangReportApi';

const REPORT_QUERY_KEY = 'adminCabangTutorAttendanceReport';

const parseReportPayload = (response) => {
  const payload = response?.data ?? response ?? {};
  const tutors = Array.isArray(payload.data) ? payload.data : payload.tutors ?? [];
  const summary = typeof payload.summary === 'object' || payload.summary === null
    ? payload.summary
    : null;
  const meta = payload.meta ?? payload.metadata ?? {};

  return {
    tutors,
    summary,
    meta,
  };
};

export const useTutorAttendanceReport = (initialParams = {}) => {
  const initialParamsRef = useRef({ ...initialParams });
  const [filters, setFilters] = useState(() => ({ ...initialParamsRef.current }));
  const [refreshing, setRefreshing] = useState(false);

  const queryKey = useMemo(
    () => [REPORT_QUERY_KEY, filters],
    [filters],
  );

  const {
    data: report,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => adminCabangReportApi.getTutorAttendanceReport(filters),
    select: parseReportPayload,
    keepPreviousData: true,
  });

  const loading = (isLoading || isFetching) && !refreshing;

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const updateFilters = useCallback((nextFilters = {}) => {
    setFilters((prev) => ({ ...prev, ...nextFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...initialParamsRef.current });
  }, []);

  return {
    tutors: report?.tutors ?? [],
    summary: report?.summary ?? null,
    meta: report?.meta ?? {},
    params: filters,
    loading,
    refreshing,
    error,
    refetch,
    refresh,
    updateFilters,
    resetFilters,
  };
};

export default useTutorAttendanceReport;
