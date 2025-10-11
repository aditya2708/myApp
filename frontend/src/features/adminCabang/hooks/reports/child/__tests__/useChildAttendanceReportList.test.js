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

  it('fetches child attendance reports, exposes metadata, and normalizes summary fields', async () => {
    const chart = { title: 'Attendance Trend' };
    const chartData = { series: [{ name: 'Hadir', value: 30 }] };
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
          shelter_id: 'shelter-1',
          group_id: 'group-1',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
        },
        available_filters: {
          attendance_bands: ['low', 'medium', 'high'],
        },
        shelters: [
          { id: 'shelter-1', name: 'Shelter 1' },
          { id: 'shelter-2', name: 'Shelter 2' },
        ],
        groups: [
          { id: 'group-1', name: 'Group 1' },
          { id: 'group-2', name: 'Group 2' },
        ],
        chart,
        chart_data: chartData,
        metadata: {
          export_url: 'https://example.com/export.pdf',
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
    expect(result.current.summary.attendance_percentage).toBe(82.5);
    expect(result.current.summary.presentCount).toBe(30);
    expect(result.current.summary.lateCount).toBe(4);
    expect(result.current.summary.absentCount).toBe(2);
    expect(result.current.summary.totals.totalSessions).toBe(36);
    expect(result.current.children).toHaveLength(2);
    expect(result.current.pagination).toMatchObject({
      page: 2,
      perPage: 5,
      total: 40,
      totalPages: 8,
    });
    expect(result.current.filters).toMatchObject({
      search: '',
      band: null,
      shelterId: 'shelter-1',
      groupId: 'group-1',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });
    expect(result.current.availableFilters).toEqual({
      attendance_bands: ['low', 'medium', 'high'],
    });
    expect(result.current.shelters).toHaveLength(2);
    expect(result.current.groups).toHaveLength(2);
    expect(result.current.chart).toEqual(chart);
    expect(result.current.chartData).toEqual(chartData);
    expect(result.current.metadata).toEqual({
      export_url: 'https://example.com/export.pdf',
    });
    expect(result.current.rawMetadata).toMatchObject({
      available_filters: {
        attendance_bands: ['low', 'medium', 'high'],
      },
      chart,
      chart_data: chartData,
    });
  });

  it('re-fetches data when filters change and resets pagination', async () => {
    adminCabangReportApi.getChildAttendanceReport.mockResolvedValue({
      data: {
        summary: { attendanceRate: 70, presentCount: 14, lateCount: 3, absentCount: 3, totalSessions: 20 },
        children: [],
        pagination: { current_page: 1, per_page: 10, total: 0, total_pages: 1 },
        filters: {},
      },
    });

    const { result } = renderHook(useChildAttendanceReportList);

    await waitFor(() => expect(adminCabangReportApi.getChildAttendanceReport).toHaveBeenCalledTimes(1));

    await act(async () => {
      result.current.setBand('high');
    });

    await waitFor(() => expect(adminCabangReportApi.getChildAttendanceReport).toHaveBeenCalledTimes(2));
    expect(adminCabangReportApi.getChildAttendanceReport.mock.calls[1][0]).toMatchObject({
      page: 1,
      per_page: 10,
      attendance_band: 'high',
    });
    expect(result.current.params.band).toBe('high');
    expect(result.current.pagination.page).toBe(1);
    expect(result.current.filters.band).toBe('high');

    await act(async () => {
      result.current.setShelterId('shelter-42');
    });

    await waitFor(() => expect(adminCabangReportApi.getChildAttendanceReport).toHaveBeenCalledTimes(3));
    expect(adminCabangReportApi.getChildAttendanceReport.mock.calls[2][0]).toMatchObject({
      page: 1,
      per_page: 10,
      attendance_band: 'high',
      shelter_id: 'shelter-42',
    });

    await act(async () => {
      result.current.setGroupId('group-7');
    });

    await waitFor(() => expect(adminCabangReportApi.getChildAttendanceReport).toHaveBeenCalledTimes(4));
    expect(adminCabangReportApi.getChildAttendanceReport.mock.calls[3][0]).toMatchObject({
      page: 1,
      per_page: 10,
      attendance_band: 'high',
      shelter_id: 'shelter-42',
      group_id: 'group-7',
    });

    await act(async () => {
      result.current.setStartDate('2024-02-01');
    });

    await waitFor(() => expect(adminCabangReportApi.getChildAttendanceReport).toHaveBeenCalledTimes(5));
    expect(adminCabangReportApi.getChildAttendanceReport.mock.calls[4][0]).toMatchObject({
      page: 1,
      per_page: 10,
      attendance_band: 'high',
      shelter_id: 'shelter-42',
      group_id: 'group-7',
      start_date: '2024-02-01',
    });

    await act(async () => {
      result.current.setEndDate('2024-02-29');
    });

    await waitFor(() => expect(adminCabangReportApi.getChildAttendanceReport).toHaveBeenCalledTimes(6));
    expect(adminCabangReportApi.getChildAttendanceReport.mock.calls[5][0]).toMatchObject({
      page: 1,
      per_page: 10,
      attendance_band: 'high',
      shelter_id: 'shelter-42',
      group_id: 'group-7',
      start_date: '2024-02-01',
      end_date: '2024-02-29',
    });
    expect(result.current.params).toMatchObject({
      band: 'high',
      shelterId: 'shelter-42',
      groupId: 'group-7',
      startDate: '2024-02-01',
      endDate: '2024-02-29',
    });
  });
});
