import React from 'react';
import { render } from '@testing-library/react-native';

import TutorAttendanceSummary from '../TutorAttendanceSummary';

const baseSummary = {
  total_tutors: 55,
  average_attendance_rate: 0.24,
  distribution: {
    high: { count: 0, percentage: 0 },
    medium: { count: 0, percentage: 0 },
    low: { count: 3, percentage: 5.45 },
    no_data: { count: 52, percentage: 94.55 },
  },
  attendance: {
    verified: {
      present: 17,
      late: 2,
      permit: 0,
      absent: 0,
      total: 19,
    },
    totals: {
      activities: 19,
    },
  },
};

describe('TutorAttendanceSummary', () => {
  it('renders summary cards with expected values', () => {
    const { getByText } = render(<TutorAttendanceSummary summary={baseSummary} />);

    expect(getByText('Ringkasan Kehadiran Tutor')).toBeTruthy();
    expect(getByText('24.00%')).toBeTruthy();
    expect(getByText('55')).toBeTruthy();
    expect(getByText('Distribusi Kategori Utama (Rendah)')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
    expect(getByText(/Tidak Ada Data: 52/)).toBeTruthy();
    expect(getByText('17/2/0/0')).toBeTruthy();
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
