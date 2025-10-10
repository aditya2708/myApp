import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { useChildAttendanceReportDetail } from '../useChildAttendanceReportDetail';
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

describe('useChildAttendanceReportDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches child attendance detail when childId is provided', async () => {
    adminCabangReportApi.getChildAttendanceReportDetail.mockResolvedValueOnce({
      data: {
        child: {
          id: 'child-1',
          name: 'Budi',
          attendanceRate: 88,
          totals: { present: 18, late: 1, absent: 1 },
        },
        summary: {
          attendanceRate: 88,
          presentCount: 18,
          lateCount: 1,
          absentCount: 1,
          totalSessions: 20,
          totalChildren: 1,
          dateRange: { label: '1-7 Januari 2025' },
        },
        shelter_breakdown: [
          {
            id: 'shelter-1',
            name: 'Shelter A',
            attendanceRate: 90,
            totalChildren: 10,
            presentCount: 8,
            lateCount: 1,
            absentCount: 1,
          },
        ],
        attendance_band_distribution: [
          { id: 'high', band: 'high', percentage: 80, count: 8 },
        ],
      },
    });

    const { result } = renderHook(useChildAttendanceReportDetail, {
      childId: 'child-1',
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(adminCabangReportApi.getChildAttendanceReportDetail).toHaveBeenCalledWith('child-1', {});
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.child.name).toBe('Budi');
    expect(result.current.summary.attendanceRate.value).toBe(88);
    expect(result.current.shelterBreakdown).toHaveLength(1);
    expect(result.current.bandDistribution).toHaveLength(1);
  });

  it('captures errors from the API and exposes an error message', async () => {
    adminCabangReportApi.getChildAttendanceReportDetail.mockRejectedValueOnce(
      new Error('Terjadi kesalahan'),
    );

    const { result } = renderHook(useChildAttendanceReportDetail, {
      childId: 'child-2',
    });

    await waitFor(() => {
      expect(adminCabangReportApi.getChildAttendanceReportDetail).toHaveBeenCalledTimes(1);
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.errorMessage).toBe('Terjadi kesalahan');
  });
});
