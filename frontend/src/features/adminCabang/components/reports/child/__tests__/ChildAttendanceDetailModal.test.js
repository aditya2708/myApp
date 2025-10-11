import React from 'react';
import { render } from '@testing-library/react-native';

import ChildAttendanceDetailModal from '../ChildAttendanceDetailModal';

describe('ChildAttendanceDetailModal', () => {
  const baseChild = {
    name: 'Budi Santoso',
    attendanceRate: { label: '75%', value: 75 },
    totals: {
      present: 11,
      late: 4,
      absent: 2,
      totalSessions: 17,
    },
    summary: {
      attendanceRate: { label: '75%', value: 75 },
      totals: { present: 11, late: 4, absent: 2, totalSessions: 17 },
      dateRange: { label: 'Feb 2024' },
    },
  };

  it('prefers API summary props over child fallback data and renders extended context', () => {
    const summary = {
      attendanceRate: { value: 42, label: '42%' },
      totals: { present: 5, late: 3, absent: 2, totalSessions: 10 },
      dateRange: { label: 'Jan 2024' },
    };

    const verificationSummary = {
      verified: 7,
      pending: 2,
      rejected: 1,
    };

    const streaks = [{ id: 'present', label: 'Streak Hadir', value: 4, unit: 'hari' }];

    const filters = {
      search: 'andi',
      shelter: { name: 'Shelter Mawar' },
      band: { label: 'Tinggi' },
    };

    const period = { label: 'Triwulan 1 2024' };
    const meta = { generatedAt: '2024-03-01', generatedBy: 'Sistem' };

    const { getByTestId, getByText, queryByText } = render(
      <ChildAttendanceDetailModal
        visible
        onClose={() => {}}
        child={baseChild}
        summary={summary}
        verificationSummary={verificationSummary}
        streaks={streaks}
        filters={filters}
        period={period}
        meta={meta}
        monthlyBreakdown={[]}
        timeline={[]}
      />,
    );

    expect(getByText('42%')).toBeTruthy();
    expect(queryByText('75%')).toBeNull();

    expect(getByTestId('totals-present-value').props.children).toBe(5);
    expect(getByTestId('totals-late-value').props.children).toBe(3);
    expect(getByTestId('totals-absent-value').props.children).toBe(2);
    expect(getByTestId('totals-sessions-value').props.children).toBe(10);

    expect(getByTestId('verification-verified')).toBeTruthy();
    expect(getByTestId('verification-pending')).toBeTruthy();
    expect(getByTestId('verification-rejected')).toBeTruthy();

    expect(getByTestId('streak-present')).toBeTruthy();

    expect(getByText('Konteks Laporan')).toBeTruthy();
    expect(getByText('Triwulan 1 2024')).toBeTruthy();
    expect(getByText('Shelter Mawar')).toBeTruthy();

    expect(getByText('Informasi Tambahan')).toBeTruthy();
    expect(getByText('2024-03-01')).toBeTruthy();
    expect(getByText('Sistem')).toBeTruthy();
  });
});
