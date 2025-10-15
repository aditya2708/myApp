import React from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
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
      filters: { sortDirection: null },
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
      setSortDirection: jest.fn(),
      sortDirection: 'desc',
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

  it('does not count null sort direction as an active filter', () => {
    mockUseChildAttendanceReportList.mockReturnValue({
      summary: null,
      children: [],
      pagination: null,
      params: { sortDirection: null },
      filters: {
        search: '',
        shelterId: null,
        groupId: null,
        sortDirection: null,
        startDate: null,
        endDate: null,
      },
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
      refresh: jest.fn(),
      refetch: jest.fn(),
      loadMore: jest.fn(),
      fetchNextPage: jest.fn(),
      applyFilters: undefined,
      availableFilters: null,
      filterOptions: null,
      resetFilters: jest.fn(),
      clearFilters: jest.fn(),
      setSearch: jest.fn(),
      setShelterId: jest.fn(),
      setGroupId: jest.fn(),
      setSortDirection: jest.fn(),
      sortDirection: 'desc',
      setDateRange: undefined,
      setStartDate: jest.fn(),
      setEndDate: jest.fn(),
    });

    const { queryByText } = render(<AdminCabangChildReportScreen />);

    expect(queryByText('1')).toBeNull();
  });

  it('applies filters via individual setters without forcing manual refresh', () => {
    const setSearch = jest.fn();
    const setShelterId = jest.fn();
    const setGroupId = jest.fn();
    const setSortDirection = jest.fn();
    const setStartDate = jest.fn();
    const setEndDate = jest.fn();
    const refresh = jest.fn();
    const refetch = jest.fn();

    mockUseChildAttendanceReportList.mockReturnValue({
      summary: null,
      children: [],
      pagination: null,
      params: {},
      filters: {
        search: '',
        shelterId: null,
        groupId: null,
        sortDirection: null,
        startDate: null,
        endDate: null,
      },
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
      setSortDirection,
      sortDirection: 'desc',
      setDateRange: undefined,
      setStartDate,
      setEndDate,
    });

    const { UNSAFE_getByType } = render(<AdminCabangChildReportScreen />);

    const filterSheet = UNSAFE_getByType(ChildAttendanceFilterSheet);

    act(() => {
      filterSheet.props.onApply({
        search: 'ani',
        shelterId: 'shelter-2',
        groupId: 'group-4',
        sortDirection: 'asc',
        startDate: '2024-03-01',
        endDate: '2024-03-31',
      });
    });

    act(() => {
      filterSheet.props.onApply({
        search: 'budi',
        shelterId: 'shelter-9',
        groupId: 'group-3',
        startDate: '2024-04-01',
        endDate: '2024-04-30',
      });
    });

    expect(setSearch).toHaveBeenCalledWith('ani');
    expect(setShelterId).toHaveBeenCalledWith('shelter-2');
    expect(setGroupId).toHaveBeenCalledWith('group-4');
    expect(setSortDirection).toHaveBeenNthCalledWith(1, 'asc');
    expect(setSortDirection).toHaveBeenNthCalledWith(2, null);
    expect(setStartDate).toHaveBeenCalledWith('2024-03-01');
    expect(setEndDate).toHaveBeenCalledWith('2024-03-31');
    expect(refresh).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });

  it('sorts children before passing them to FlatList based on sort direction', () => {
    const baseState = {
      summary: null,
      pagination: null,
      params: {},
      filters: {},
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
      refresh: jest.fn(),
      refetch: jest.fn(),
      loadMore: jest.fn(),
      fetchNextPage: jest.fn(),
      applyFilters: undefined,
      availableFilters: null,
      filterOptions: null,
      resetFilters: jest.fn(),
      clearFilters: jest.fn(),
      setSearch: jest.fn(),
      setShelterId: jest.fn(),
      setGroupId: jest.fn(),
      setSortDirection: jest.fn(),
      setDateRange: undefined,
      setStartDate: jest.fn(),
      setEndDate: jest.fn(),
    };

    const children = [
      { id: 'child-1', attendanceRate: { value: 40 } },
      { id: 'child-2', attendanceRate: { value: 95 } },
      { id: 'child-3', attendance_rate: 0 },
      { id: 'child-4', attendanceRateLabel: '33,3%' },
    ];

    mockUseChildAttendanceReportList
      .mockReturnValueOnce({ ...baseState, children, sortDirection: 'desc' })
      .mockReturnValue({ ...baseState, children, sortDirection: 'asc' });

    const { UNSAFE_getByType, rerender } = render(<AdminCabangChildReportScreen />);

    const flatListDesc = UNSAFE_getByType(FlatList);
    expect(flatListDesc.props.data.map((item) => item.id)).toEqual([
      'child-2',
      'child-1',
      'child-4',
      'child-3',
    ]);

    rerender(<AdminCabangChildReportScreen />);

    const flatListAsc = UNSAFE_getByType(FlatList);
    expect(flatListAsc.props.data.map((item) => item.id)).toEqual([
      'child-3',
      'child-4',
      'child-1',
      'child-2',
    ]);
  });
});
