import React from 'react';
import { ActivityIndicator } from 'react-native';
import { render } from '@testing-library/react-native';

import AdminCabangChildReportScreen from '../AdminCabangChildReportScreen';

jest.mock('../../../hooks/reports/child/useChildAttendanceReportList', () => ({
  useChildAttendanceReportList: jest.fn(),
}));

jest.mock('../../../hooks/reports/child/useChildAttendanceReportDetail', () => ({
  useChildAttendanceReportDetail: jest.fn(() => ({
    child: null,
    monthlyBreakdown: [],
    timeline: [],
    isLoading: false,
    error: null,
    errorMessage: null,
    refresh: jest.fn(),
    refetch: jest.fn(),
  })),
}));

const mockUseChildAttendanceReportList = jest.requireMock(
  '../../../hooks/reports/child/useChildAttendanceReportList',
).useChildAttendanceReportList;

describe('AdminCabangChildReportScreen', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders safely when filter data is not yet available and shows loading state', () => {
    mockUseChildAttendanceReportList.mockReturnValue({
      summary: null,
      children: [],
      pagination: null,
      params: {},
      filters: {},
      chartData: [],
      shelterAttendanceChart: null,
      shelterBreakdown: null,
      lastRefreshedAt: null,
      generatedAt: null,
      period: null,
      isLoading: true,
      isInitialLoading: true,
      isRefreshing: false,
      isFetchingMore: false,
      error: null,
      errorMessage: null,
      hasNextPage: false,
      refresh: jest.fn(),
      refetch: jest.fn(),
      loadMore: jest.fn(),
      fetchNextPage: jest.fn(),
      applyFilters: jest.fn(),
      availableFilters: null,
      filterOptions: null,
      resetFilters: jest.fn(),
      clearFilters: jest.fn(),
      setSearch: jest.fn(),
      setShelterId: jest.fn(),
      setGroupId: jest.fn(),
      setBand: jest.fn(),
      setDateRange: jest.fn(),
      setStartDate: jest.fn(),
      setEndDate: jest.fn(),
    });

    let renderResult;
    expect(() => {
      renderResult = render(<AdminCabangChildReportScreen />);
    }).not.toThrow();

    const loadingIndicators = renderResult.getAllByType(ActivityIndicator);
    expect(loadingIndicators.length).toBeGreaterThan(0);
  });
});
