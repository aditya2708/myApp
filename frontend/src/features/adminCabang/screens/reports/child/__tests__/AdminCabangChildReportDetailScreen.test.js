import React from 'react';
import { render } from '@testing-library/react-native';

import AdminCabangChildReportDetailScreen from '../AdminCabangChildReportDetailScreen';

jest.mock('../../../../hooks/reports/child/useChildAttendanceReportDetail', () => ({
  useChildAttendanceReportDetail: jest.fn(),
}));

const mockUseChildAttendanceReportDetail = jest.requireMock(
  '../../../../hooks/reports/child/useChildAttendanceReportDetail',
).useChildAttendanceReportDetail;

describe('AdminCabangChildReportDetailScreen', () => {
  const navigationMock = { goBack: jest.fn(), setOptions: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    navigationMock.goBack.mockClear();
    navigationMock.setOptions.mockClear();
  });

  it('requests detail data using filters from route params', () => {
    mockUseChildAttendanceReportDetail.mockReturnValue({
      child: {
        name: 'Anisa Putri',
        attendanceRate: { value: 92 },
        totals: { hadir: 11, tidakHadir: 0, totalAktivitas: 11 },
      },
      summary: {
        attendanceRate: { value: 92 },
        totals: { hadir: 11, tidakHadir: 0, totalAktivitas: 11 },
        dateRange: { label: 'Januari 2024' },
      },
      verificationSummary: [],
      streaks: [],
      filters: {},
      period: { label: 'Januari 2024' },
      meta: {},
      monthlyBreakdown: [],
      attendanceTimeline: [],
      isLoading: false,
      error: null,
      errorMessage: null,
      refresh: jest.fn(),
      refetch: jest.fn(),
    });

    render(
      <AdminCabangChildReportDetailScreen
        navigation={navigationMock}
        route={{
          params: {
            childId: 'child-123',
            filters: { startDate: '2024-01-01', endDate: '2024-01-31' },
            period: { label: 'Januari 2024' },
          },
        }}
      />,
    );

    expect(mockUseChildAttendanceReportDetail).toHaveBeenCalledWith({
      childId: 'child-123',
      params: { startDate: '2024-01-01', endDate: '2024-01-31' },
      enabled: true,
    });
    expect(navigationMock.setOptions).toHaveBeenCalledWith({ headerShown: false });
  });
});
