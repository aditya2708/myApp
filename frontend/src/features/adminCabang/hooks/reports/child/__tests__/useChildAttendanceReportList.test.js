import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';

import { useChildAttendanceReportList } from '../useChildAttendanceReportList';
import { adminCabangReportApi } from '../../../../api/adminCabangReportApi';

jest.mock('../../../../api/adminCabangReportApi', () => ({
  adminCabangReportApi: {
    getChildAttendanceReport: jest.fn(),
    getChildAttendanceReportDetail: jest.fn(),
  },
}));

const renderHook = (hook, hookProps = {}) => {
  const result = { current: null };

  const TestComponent = ({ options }) => {
    result.current = hook(options);
    return null;
  };

  const utils = render(<TestComponent options={hookProps} />);

  return {
    result,
    rerender: (nextOptions) => utils.rerender(<TestComponent options={nextOptions} />),
    unmount: utils.unmount,
  };
};

describe('useChildAttendanceReportList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches child attendance reports and updates loading, data, and pagination state', async () => {
    adminCabangReportApi.getChildAttendanceReport.mockResolvedValueOnce({
      data: {
        summary: {
          attendanceRate: 82.5,
          totalChildren: 12,
          presentCount: 30,
          lateCount: 4,
          absentCount: 2,
          totalSessions: 36,
        },
        children: [
          {
            id: 'child-1',
            name: 'Budi',
            attendanceRate: 90,
            presentCount: 18,
            lateCount: 1,
            absentCount: 1,
          },
          {
            id: 'child-2',
            name: 'Siti',
            attendanceRate: 75,
            presentCount: 12,
            lateCount: 2,
            absentCount: 2,
          },
        ],
        pagination: {
          current_page: 2,
          per_page: 5,
          total: 40,
          total_pages: 8,
        },
        filters: {
          attendance_band: null,
          search: '',
        },
      },
    });

    const { result } = renderHook(useChildAttendanceReportList);

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(adminCabangReportApi.getChildAttendanceReport).toHaveBeenCalledTimes(1);
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.summary.attendanceRate.value).toBe(82.5);
    expect(result.current.summary.totals.totalSessions).toBe(36);
    expect(result.current.children).toHaveLength(2);
    expect(result.current.pagination).toMatchObject({
      page: 2,
      perPage: 5,
      total: 40,
      totalPages: 8,
    });
    expect(result.current.filters.search).toBe('');
  });

  it('re-fetches data when filters change and resets pagination', async () => {
    adminCabangReportApi.getChildAttendanceReport
      .mockResolvedValueOnce({
        data: {
          summary: { attendanceRate: 70, presentCount: 14, lateCount: 3, absentCount: 3, totalSessions: 20 },
          children: [],
          pagination: { current_page: 1, per_page: 10, total: 0, total_pages: 1 },
          filters: { attendance_band: null },
        },
      })
      .mockResolvedValueOnce({
        data: {
          summary: { attendanceRate: 90, presentCount: 18, lateCount: 1, absentCount: 1, totalSessions: 20 },
          children: [],
          pagination: { current_page: 1, per_page: 10, total: 0, total_pages: 1 },
          filters: { attendance_band: 'high' },
        },
      });

    const { result } = renderHook(useChildAttendanceReportList);

    await waitFor(() => expect(adminCabangReportApi.getChildAttendanceReport).toHaveBeenCalledTimes(1));

    await act(async () => {
      result.current.setBand('high');
    });

    await waitFor(() => expect(adminCabangReportApi.getChildAttendanceReport).toHaveBeenCalledTimes(2));

    const secondCallQuery = adminCabangReportApi.getChildAttendanceReport.mock.calls[1][0];

    expect(secondCallQuery).toMatchObject({
      page: 1,
      per_page: 10,
      attendance_band: 'high',
    });
    expect(result.current.params.band).toBe('high');
    expect(result.current.pagination.page).toBe(1);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.filters.band).toBe('high');
  });
});
