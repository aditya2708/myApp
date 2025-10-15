import React from 'react';
import { render } from '@testing-library/react-native';

import ChildAttendanceSummarySection from '../ChildAttendanceSummarySection';

describe('ChildAttendanceSummarySection', () => {
  it('renders summary items and period label', () => {
    const summary = {
      attendanceRate: { label: '88%' },
      totals: { hadir: 24, tidakHadir: 6, totalAktivitas: 30, activeChildren: 35, inactiveChildren: 5 },
      hadir: 24,
      tidakHadir: 6,
      totalAktivitas: 30,
      totalChildren: 40,
      activeChildren: 35,
      inactiveChildren: 5,
      dateRange: { label: 'Periode 1-7 Januari 2025' },
    };

    const { getByText } = render(
      <ChildAttendanceSummarySection summary={summary} periodLabel="Periode Minggu Ini" />,
    );

    expect(getByText('Ringkasan Kehadiran')).toBeTruthy();
    expect(getByText('Periode Minggu Ini')).toBeTruthy();
    expect(getByText('Persentase Kehadiran')).toBeTruthy();
    expect(getByText('88%')).toBeTruthy();
    expect(getByText('Jumlah Hadir')).toBeTruthy();
    expect(getByText('Jumlah Tidak Hadir')).toBeTruthy();
    expect(getByText('Total Aktivitas')).toBeTruthy();
    expect(getByText('Anak dipantau: 40 (aktif: 35, inaktif: 5)')).toBeTruthy();
  });
});
