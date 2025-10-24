import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminCabangReportApi } from '../../api/adminCabangReportApi';

const createInitialState = () => ({
  data: [],
  summary: null,
  metadata: {},
});

export const useTutorAttendanceReport = (initialParams = {}) => {
  const initialParamsRef = useRef({ per_page: 20, page: 1, ...initialParams });
  const paramsRef = useRef({ ...initialParamsRef.current });

  const [state, setState] = useState(createInitialState);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(
    async (overrides = {}, { replace = false, isRefresh = false } = {}) => {
      const nextParams = replace
        ? { ...initialParamsRef.current, ...overrides }
        : { ...paramsRef.current, ...overrides };

      const requestedPage = nextParams.page ?? 1;
      const isLoadMore = !replace && !isRefresh && requestedPage > 1;

      paramsRef.current = nextParams;

      if (isRefresh) {
        setRefreshing(true);
      } else if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await adminCabangReportApi.getTutorAttendanceReport(nextParams);
        const payload = response?.data ?? response ?? {};
        const nextData = payload.data ?? [];

        setState((prevState) => ({
          data: isLoadMore ? [...prevState.data, ...nextData] : nextData,
          summary: payload.summary ?? (isLoadMore ? prevState.summary : null),
          metadata: payload.metadata ?? {},
        }));
        
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        }
        if (isLoadMore) {
          setLoadingMore(false);
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
    () => fetchReport({ page: 1 }, { replace: false }),
    [fetchReport],
  );

  const refresh = useCallback(
    () => fetchReport({ page: 1 }, { replace: false, isRefresh: true }),
    [fetchReport],
  );

  const updateFilters = useCallback(
    (nextFilters = {}) => fetchReport({ ...nextFilters, page: 1 }, { replace: false }),
    [fetchReport],
  );

  const resetFilters = useCallback(() => {
    paramsRef.current = { ...initialParamsRef.current };
    return fetchReport(paramsRef.current, { replace: true });
  }, [fetchReport]);

  const memoizedState = useMemo(() => {
    const pagination = state?.metadata?.pagination ?? {};

    return {
      tutors: state.data,
      summary: state.summary,
      metadata: state.metadata,
      pagination,
      params: paramsRef.current,
      hasNextPage: Boolean(pagination?.nextPage),
    };
  }, [state]);

  const nextPage = state?.metadata?.pagination?.nextPage;

  const loadMore = useCallback(() => {
    if (!nextPage) {
      return Promise.resolve();
    }

    return fetchReport({ page: nextPage }, { replace: false });
  }, [fetchReport, nextPage]);

  return {
    ...memoizedState,
    loading,
    refreshing,
    loadingMore,
    error,
    refetch,
    refresh,
    updateFilters,
    resetFilters,
    loadMore,
  };
};

export default useTutorAttendanceReport;
