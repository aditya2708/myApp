import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import ChildAttendanceFilterSheet from '../ChildAttendanceFilterSheet';

const shelters = [
  { id: 'shelter-1', name: 'Shelter A' },
  { id: 'shelter-2', name: 'Shelter B' },
];

const groups = [
  { id: 'group-1', name: 'Kelompok A', shelterId: 'shelter-1' },
  { id: 'group-2', name: 'Kelompok B', shelterId: 'shelter-2' },
];

const bands = [
  { id: 'high', label: 'Kehadiran Tinggi' },
  { id: 'medium', label: 'Kehadiran Sedang' },
];

describe('ChildAttendanceFilterSheet', () => {
  const renderSheet = (props = {}) =>
    render(
      <ChildAttendanceFilterSheet
        visible
        onClose={jest.fn()}
        shelters={shelters}
        groups={groups}
        bands={bands}
        {...props}
      />,
    );

  it('renders picker inputs for shelter, group, and band', () => {
    const { getByTestId, getByText } = renderSheet();

    expect(getByText('Shelter')).toBeTruthy();
    expect(getByText('Kelompok')).toBeTruthy();
    expect(getByText('Band Kehadiran')).toBeTruthy();
    expect(getByTestId('shelter-picker')).toBeTruthy();
    expect(getByTestId('group-picker')).toBeTruthy();
    expect(getByTestId('band-picker')).toBeTruthy();
  });

  it('applies selected filters and filters groups by shelter', async () => {
    const onApply = jest.fn();
    const { getByTestId, getByText, queryByText } = renderSheet({ onApply });

    fireEvent.valueChange(getByTestId('shelter-picker'), 'shelter-1');

    await waitFor(() => {
      expect(queryByText('Kelompok B')).toBeNull();
    });

    fireEvent.valueChange(getByTestId('group-picker'), 'group-1');
    fireEvent.valueChange(getByTestId('band-picker'), 'high');

    fireEvent.press(getByText('Terapkan'));

    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        shelterId: 'shelter-1',
        groupId: 'group-1',
        band: 'high',
      }),
    );
  });
});
