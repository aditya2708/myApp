import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ChildAttendanceCard from '../ChildAttendanceCard';

describe('ChildAttendanceCard', () => {
  it('renders child information and statistics', () => {
    const child = {
      name: 'Budi Santoso',
      identifier: 'CH-001',
      shelter: { name: 'Shelter A' },
      group: { name: 'Kelompok 1' },
      totals: { present: 18, late: 2, absent: 1 },
      attendanceRate: { value: 88.5, label: '88.5%' },
      attendanceBand: 'high',
    };

    const { getByText } = render(<ChildAttendanceCard child={child} />);

    expect(getByText('Budi Santoso')).toBeTruthy();
    expect(getByText('ID: CH-001')).toBeTruthy();
    expect(getByText('Shelter A')).toBeTruthy();
    expect(getByText('Kelompok 1')).toBeTruthy();
    expect(getByText('Hadir')).toBeTruthy();
    expect(getByText('18')).toBeTruthy();
    expect(getByText('Terlambat')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('Tidak hadir')).toBeTruthy();
    expect(getByText('1')).toBeTruthy();
    expect(getByText('88.5%')).toBeTruthy();
    expect(getByText('Kehadiran Tinggi')).toBeTruthy();
  });

  it('triggers the detail callback when the button is pressed', () => {
    const onViewDetail = jest.fn();

    const { getByText } = render(
      <ChildAttendanceCard
        child={{
          name: 'Siti Aminah',
          totals: { present: 10, late: 1, absent: 0 },
          attendanceRate: { value: 95, label: '95%' },
        }}
        onViewDetail={onViewDetail}
      />,
    );

    fireEvent.press(getByText('Lihat Detail'));

    expect(onViewDetail).toHaveBeenCalledTimes(1);
  });
});
