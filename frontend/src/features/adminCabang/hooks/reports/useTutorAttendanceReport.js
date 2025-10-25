import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminCabangReportApi } from '../../api/adminCabangReportApi';

const createInitialState = () => ({
  data: [],
  summary: null,
  meta: {},
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
        const { meta: payloadMeta, metadata: legacyMetadata } = payload || {};

        setState((prevState) => ({
          data: isLoadMore ? [...prevState.data, ...nextData] : nextData,
          summary: payload.summary ?? (isLoadMore ? prevState.summary : null),
          meta:
            payloadMeta
              ?? legacyMetadata
              ?? (isLoadMore ? prevState.meta : {}),
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
    const meta = state?.meta ?? {};
    const rawPagination = meta?.pagination ?? {};

    const page =
      rawPagination.page ?? rawPagination.currentPage ?? rawPagination.current_page;
    const perPage =
      rawPagination.perPage
      ?? rawPagination.per_page
      ?? rawPagination.pageSize
      ?? rawPagination.limit;
    const total =
      rawPagination.total
      ?? rawPagination.total_items
      ?? rawPagination.totalItems
      ?? rawPagination.total_records
      ?? rawPagination.totalRecords
      ?? rawPagination.count;
    const totalPagesCandidate =
      rawPagination.totalPages
      ?? rawPagination.total_pages
      ?? rawPagination.last_page
      ?? rawPagination.pages;

    const computedTotalPages =
      typeof totalPagesCandidate === 'number' && Number.isFinite(totalPagesCandidate)
        ? totalPagesCandidate
        : typeof total === 'number'
            && typeof perPage === 'number'
            && Number.isFinite(perPage)
            && perPage > 0
          ? Math.ceil(total / perPage)
          : undefined;

    const rawNextPage =
      rawPagination.nextPage !== undefined
        ? rawPagination.nextPage
        : rawPagination.next_page;
    const computedNextPage =
      rawNextPage !== undefined
        ? rawNextPage
        : typeof page === 'number'
            && typeof computedTotalPages === 'number'
            && page < computedTotalPages
          ? page + 1
          : undefined;

    const hasNextPage = (() => {
      if (rawNextPage !== undefined) {
        return Boolean(rawNextPage);
      }

      if (
        typeof page === 'number'
        && typeof computedTotalPages === 'number'
      ) {
        return page < computedTotalPages;
      }

      if (
        typeof page === 'number'
        && typeof perPage === 'number'
        && typeof total === 'number'
        && Number.isFinite(perPage)
        && perPage > 0
      ) {
        return page * perPage < total;
      }

      return false;
    })();

    const pagination = {
      ...rawPagination,
      page: page ?? rawPagination.page,
      perPage: perPage ?? rawPagination.perPage,
      total: total ?? rawPagination.total,
      totalPages: computedTotalPages ?? rawPagination.totalPages,
      nextPage:
        computedNextPage !== undefined
          ? computedNextPage
          : rawPagination.nextPage,
    };

    return {
      tutors: state.data,
      summary: state.summary,
      meta,
      pagination,
      params: paramsRef.current,
      hasNextPage,
      nextPage: computedNextPage,
    };
  }, [state]);

  const { nextPage } = memoizedState;

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
