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
      totals: { hadir: 18, tidakHadir: 1, totalAktivitas: 19 },
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
    expect(getByText('Tidak Hadir')).toBeTruthy();
    expect(getByText('1')).toBeTruthy();
    expect(getByText('Total Aktivitas')).toBeTruthy();
    expect(getByText('19')).toBeTruthy();
    expect(getByText('Persentase')).toBeTruthy();
    expect(getByText('88.5%')).toBeTruthy();
    expect(getByText('Kehadiran Tinggi')).toBeTruthy();
  });

  it('triggers the detail callback when the button is pressed', () => {
    const onViewDetail = jest.fn();

    const { getByText } = render(
      <ChildAttendanceCard
        child={{
          name: 'Siti Aminah',
          totals: { hadir: 10, tidakHadir: 0, totalAktivitas: 10 },
          attendanceRate: { value: 95, label: '95%' },
        }}
        onViewDetail={onViewDetail}
      />,
    );

    fireEvent.press(getByText('Lihat Detail'));

    expect(onViewDetail).toHaveBeenCalledTimes(1);
  });

  it('formats fractional attendance rates using the percentage helper as a fallback', () => {
    const child = {
      name: 'Joko',
      totals: { hadir: 19, tidakHadir: 1, totalAktivitas: 20 },
      attendanceRate: { value: 0.95 },
    };

    const { getByText } = render(<ChildAttendanceCard child={child} />);

    expect(getByText('95,00%')).toBeTruthy();
  });

  it('falls back to the attendance percentage to resolve band meta when missing', () => {
    const child = {
      name: 'Rina Sari',
      attendanceRate: { value: 72, label: '72%' },
      totals: { hadir: 15, tidakHadir: 3, totalAktivitas: 18 },
    };

    const { getByText } = render(<ChildAttendanceCard child={child} />);

    const bandLabelNode = getByText('Kehadiran Sedang');
    const labelStyles = Array.isArray(bandLabelNode.props.style)
      ? bandLabelNode.props.style
      : [bandLabelNode.props.style];
    const colorStyle = labelStyles.find((style) => style && style.color);

    expect(colorStyle?.color).toBe('#f39c12');

    const badgeNode = bandLabelNode.parent;
    const badgeStyles = Array.isArray(badgeNode.props.style)
      ? badgeNode.props.style
      : [badgeNode.props.style];
    const backgroundStyle = badgeStyles.find((style) => style && style.backgroundColor);

    expect(backgroundStyle?.backgroundColor).toBe('rgba(243, 156, 18, 0.15)');
  });

  it('classifies attendance of 80% and above as high when band metadata is missing', () => {
    const child = {
      name: 'Adi Wijaya',
      attendanceRate: { value: 82, label: '82%' },
      totals: { hadir: 18, tidakHadir: 2, totalAktivitas: 20 },
    };

    const { getByText } = render(<ChildAttendanceCard child={child} />);

    const bandLabelNode = getByText('Kehadiran Tinggi');
    const labelStyles = Array.isArray(bandLabelNode.props.style)
      ? bandLabelNode.props.style
      : [bandLabelNode.props.style];
    const colorStyle = labelStyles.find((style) => style && style.color);

    expect(colorStyle?.color).toBe('#2ecc71');
  });
});
