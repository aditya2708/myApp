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
        attendanceRate: { value: 0.08 },
        totals: { hadir: 11, tidakHadir: 0, totalAktivitas: 11 },
      },
      summary: {
        attendanceRate: { value: 0.08 },
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

    const { getByTestId } = render(
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
    expect(getByTestId('totals-persentase-value').props.children).toBe('0,08%');
  });

  it('falls back to attendance percentage to resolve band meta when missing', () => {
    mockUseChildAttendanceReportDetail.mockReturnValue({
      child: {
        name: 'Siti Aminah',
        attendanceRate: { value: 82, label: '82%' },
        totals: { hadir: 18, tidakHadir: 2, totalAktivitas: 20 },
      },
      summary: {
        attendanceRate: { value: 82, label: '82%' },
        totals: { hadir: 18, tidakHadir: 2, totalAktivitas: 20 },
      },
      period: { label: 'Februari 2024' },
      filters: {},
      monthlyBreakdown: [],
      attendanceTimeline: [],
      isLoading: false,
      error: null,
      errorMessage: null,
      refresh: jest.fn(),
      refetch: jest.fn(),
    });

    const { getByText } = render(
      <AdminCabangChildReportDetailScreen navigation={navigationMock} route={{ params: {} }} />,
    );

    const bandLabelNode = getByText('Kehadiran Tinggi');
    const labelStyles = Array.isArray(bandLabelNode.props.style)
      ? bandLabelNode.props.style
      : [bandLabelNode.props.style];
    const colorStyle = labelStyles.find((style) => style && style.color);

    expect(colorStyle?.color).toBe('#2ecc71');
  });
});
