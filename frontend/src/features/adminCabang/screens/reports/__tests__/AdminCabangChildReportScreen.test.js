import React from 'react';
import { ActivityIndicator } from 'react-native';
import { act, render } from '@testing-library/react-native';

import AdminCabangChildReportScreen from '../AdminCabangChildReportScreen';
import ChildAttendanceFilterSheet from '../../../components/reports/child/ChildAttendanceFilterSheet';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../../hooks/reports/child/useChildAttendanceReportList', () => ({
  useChildAttendanceReportList: jest.fn(),
}));

const mockUseChildAttendanceReportList = jest.requireMock(
  '../../../hooks/reports/child/useChildAttendanceReportList',
).useChildAttendanceReportList;

describe('AdminCabangChildReportScreen', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
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

  it('applies filters via individual setters without forcing manual refresh', () => {
    const setSearch = jest.fn();
    const setShelterId = jest.fn();
    const setGroupId = jest.fn();
    const setBand = jest.fn();
    const setStartDate = jest.fn();
    const setEndDate = jest.fn();
    const refresh = jest.fn();
    const refetch = jest.fn();

    mockUseChildAttendanceReportList.mockReturnValue({
      summary: null,
      children: [],
      pagination: null,
      params: {},
      filters: { search: '', shelterId: null, groupId: null, band: null, startDate: null, endDate: null },
      chartData: [],
      shelterAttendanceChart: null,
      shelterBreakdown: null,
      lastRefreshedAt: null,
      generatedAt: null,
      period: null,
      isLoading: false,
      isInitialLoading: false,
      isRefreshing: false,
      isFetchingMore: false,
      error: null,
      errorMessage: null,
      hasNextPage: false,
      refresh,
      refetch,
      loadMore: jest.fn(),
      fetchNextPage: jest.fn(),
      applyFilters: undefined,
      availableFilters: null,
      filterOptions: null,
      resetFilters: jest.fn(),
      clearFilters: jest.fn(),
      setSearch,
      setShelterId,
      setGroupId,
      setBand,
      setDateRange: undefined,
      setStartDate,
      setEndDate,
    });

    const { UNSAFE_getByType } = render(<AdminCabangChildReportScreen />);

    act(() => {
      UNSAFE_getByType(ChildAttendanceFilterSheet).props.onApply({
        search: 'ani',
        shelterId: 'shelter-2',
        groupId: 'group-4',
        band: 'high',
        startDate: '2024-03-01',
        endDate: '2024-03-31',
      });
    });

    expect(setSearch).toHaveBeenCalledWith('ani');
    expect(setShelterId).toHaveBeenCalledWith('shelter-2');
    expect(setGroupId).toHaveBeenCalledWith('group-4');
    expect(setBand).toHaveBeenCalledWith('high');
    expect(setStartDate).toHaveBeenCalledWith('2024-03-01');
    expect(setEndDate).toHaveBeenCalledWith('2024-03-31');
    expect(refresh).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });

  it('resets filters through setters without triggering manual refresh', () => {
    const setSearch = jest.fn();
    const setShelterId = jest.fn();
    const setGroupId = jest.fn();
    const setBand = jest.fn();
    const setDateRange = jest.fn();
    const setStartDate = jest.fn();
    const setEndDate = jest.fn();
    const refresh = jest.fn();
    const refetch = jest.fn();

    mockUseChildAttendanceReportList.mockReturnValue({
      summary: null,
      children: [],
      pagination: null,
      params: { search: '', shelterId: null, groupId: null, band: null, startDate: null, endDate: null },
      filters: { search: '', shelterId: null, groupId: null, band: null, startDate: null, endDate: null },
      chartData: [],
      shelterAttendanceChart: null,
      shelterBreakdown: null,
      lastRefreshedAt: null,
      generatedAt: null,
      period: null,
      isLoading: false,
      isInitialLoading: false,
      isRefreshing: false,
      isFetchingMore: false,
      error: null,
      errorMessage: null,
      hasNextPage: false,
      refresh,
      refetch,
      loadMore: jest.fn(),
      fetchNextPage: jest.fn(),
      applyFilters: undefined,
      availableFilters: null,
      filterOptions: null,
      resetFilters: undefined,
      clearFilters: undefined,
      setSearch,
      setShelterId,
      setGroupId,
      setBand,
      setDateRange,
      setStartDate,
      setEndDate,
    });

    const { UNSAFE_getByType } = render(<AdminCabangChildReportScreen />);

    act(() => {
      UNSAFE_getByType(ChildAttendanceFilterSheet).props.onReset();
    });

    expect(setSearch).toHaveBeenCalledWith('');
    expect(setShelterId).toHaveBeenCalledWith(null);
    expect(setGroupId).toHaveBeenCalledWith(null);
    expect(setBand).toHaveBeenCalledWith(null);
    expect(setDateRange).toHaveBeenCalledWith({ startDate: null, endDate: null });
    expect(setStartDate).not.toHaveBeenCalled();
    expect(setEndDate).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });
});
