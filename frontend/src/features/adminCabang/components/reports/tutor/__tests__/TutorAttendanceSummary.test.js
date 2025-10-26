import React from 'react';
import { render } from '@testing-library/react-native';

import TutorAttendanceSummary from '../TutorAttendanceSummary';

const baseSummary = {
  total_tutors: 55,
  average_attendance_rate: 0.24,
};

describe('TutorAttendanceSummary', () => {
  it('renders summary cards with expected values', () => {
    const { getByText, queryByText } = render(<TutorAttendanceSummary summary={baseSummary} />);

    expect(getByText('Ringkasan Kehadiran Tutor')).toBeTruthy();
    expect(getByText('Rata-rata Kehadiran')).toBeTruthy();
    expect(getByText('Persentase rata-rata kehadiran tutor yang tercatat.')).toBeTruthy();
    expect(getByText('24%')).toBeTruthy();
    expect(getByText('Total Tutor')).toBeTruthy();
    expect(getByText('Jumlah tutor yang terpantau dalam laporan ini.')).toBeTruthy();
    expect(getByText('55')).toBeTruthy();
    expect(queryByText(/Distribusi Kategori/)).toBeNull();
    expect(queryByText(/Aktivitas Diverifikasi/)).toBeNull();
  });

  it('keeps percent-scale averages untouched', () => {
    const summary = {
      ...baseSummary,
      average_attendance_rate: 11.76,
    };

    const { getByText } = render(<TutorAttendanceSummary summary={summary} />);

    expect(getByText('11.76%')).toBeTruthy();
  });

  it('shows fallback dash when the rate is unavailable', () => {
    const summary = {
      ...baseSummary,
      average_attendance_rate: null,
    };

    const { getByText } = render(<TutorAttendanceSummary summary={summary} />);

    expect(getByText('-')).toBeTruthy();
  });

  it('does not render when summary produces no cards', () => {
    const { queryByText } = render(<TutorAttendanceSummary summary={null} />);

    expect(queryByText('Ringkasan Kehadiran Tutor')).toBeNull();
  });
});
