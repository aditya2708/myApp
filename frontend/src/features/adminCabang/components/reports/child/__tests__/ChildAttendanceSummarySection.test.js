import React from 'react';
import { render } from '@testing-library/react-native';

import ChildAttendanceSummarySection from '../ChildAttendanceSummarySection';

describe('ChildAttendanceSummarySection', () => {
  it('renders summary items and period label', () => {
    const summary = {
      attendanceRate: { label: '88%' },
      breakdown: { present: 24, late: 3, absent: 2 },
      totals: { totalSessions: 30 },
      totalChildren: 40,
      activeChildren: 35,
      dateRange: { label: 'Periode 1-7 Januari 2025' },
    };

    const { getByText } = render(
      <ChildAttendanceSummarySection summary={summary} periodLabel="Periode Minggu Ini" />,
    );

    expect(getByText('Ringkasan Kehadiran')).toBeTruthy();
    expect(getByText('Periode Minggu Ini')).toBeTruthy();
    expect(getByText('Rata-rata Kehadiran')).toBeTruthy();
    expect(getByText('88%')).toBeTruthy();
    expect(getByText('Jumlah Hadir')).toBeTruthy();
    expect(getByText('Jumlah Tidak Hadir')).toBeTruthy();
    expect(getByText('Total Anak Dipantau')).toBeTruthy();
  });
});
