import { useCallback, useEffect, useRef, useState } from 'react';

import { adminCabangReportApi } from '../../api/adminCabangReportApi';

const createInitialState = () => ({
  data: [],
  summary: null,
  meta: {},
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
        ? { ...initialParamsRef.current, ...overrides }
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
        const nextData = payload.data ?? [];
        const { meta: payloadMeta, metadata: legacyMetadata } = payload || {};

        const summaryPayload = typeof payload.summary === 'object' || payload.summary === null
          ? payload.summary
          : null;

        setState({
          data: nextData,
          summary: summaryPayload,
          meta: payloadMeta ?? legacyMetadata ?? {},
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

  const refetch = useCallback(
    () => fetchReport({}, { replace: false }),
    [fetchReport],
  );

  const refresh = useCallback(
    () => fetchReport({}, { replace: false, isRefresh: true }),
    [fetchReport],
  );

  const updateFilters = useCallback(
    (nextFilters = {}) => fetchReport({ ...nextFilters }, { replace: false }),
    [fetchReport],
  );

  const resetFilters = useCallback(() => {
    paramsRef.current = { ...initialParamsRef.current };
    return fetchReport(paramsRef.current, { replace: true });
  }, [fetchReport]);

  return {
    tutors: state.data,
    summary: state.summary,
    meta: state.meta ?? {},
    params: paramsRef.current,
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
