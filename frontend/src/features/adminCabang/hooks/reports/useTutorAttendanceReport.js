import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminCabangReportApi } from '../../api/adminCabangReportApi';

const createInitialState = () => ({
  data: [],
  summary: null,
  metadata: {},
});

export const useTutorAttendanceReport = (initialParams = {}) => {
  const initialParamsRef = useRef({ ...initialParams });
  const paramsRef = useRef({ ...initialParamsRef.current });

  const [state, setState] = useState(createInitialState);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(
    async (overrides = {}, { replace = false, isRefresh = false } = {}) => {
      const nextParams = replace
        ? { ...overrides }
        : { ...paramsRef.current, ...overrides };

      paramsRef.current = nextParams;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await adminCabangReportApi.getTutorAttendanceReport(nextParams);
        const payload = response?.data ?? response ?? {};

        setState({
          data: payload.data ?? [],
          summary: payload.summary ?? null,
          metadata: payload.metadata ?? {},
        });
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        }
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    paramsRef.current = { ...initialParamsRef.current };
    fetchReport(paramsRef.current, { replace: true });
  }, [fetchReport]);

  const refetch = useCallback(() => fetchReport({}, { replace: false }), [fetchReport]);

  const refresh = useCallback(
    () => fetchReport({}, { replace: false, isRefresh: true }),
    [fetchReport],
  );

  const updateFilters = useCallback(
    (nextFilters = {}) => fetchReport(nextFilters, { replace: false }),
    [fetchReport],
  );

  const resetFilters = useCallback(() => {
    paramsRef.current = { ...initialParamsRef.current };
    return fetchReport(paramsRef.current, { replace: true });
  }, [fetchReport]);

  const memoizedState = useMemo(
    () => ({
      tutors: state.data,
      summary: state.summary,
      metadata: state.metadata,
      params: paramsRef.current,
    }),
    [state],
  );

  return {
    ...memoizedState,
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
