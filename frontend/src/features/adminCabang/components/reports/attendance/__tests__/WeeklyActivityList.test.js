import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ShelterActivityCard from '../ShelterActivityCard';
import WeeklyActivityList from '../WeeklyActivityList';

describe('Attendance activity components', () => {
  it('renders schedule entries for a shelter activity', () => {
    const activity = {
      id: 'activity-1',
      name: 'Kelas Matematika',
      tutor: 'Budi',
      schedule: ['Senin 08:00 - 10:00', 'Rabu 09:00'],
      participantsCount: 15,
      summary: {
        present: { count: 10, percentage: 66.7 },
        late: { count: 3, percentage: 20 },
        absent: { count: 2, percentage: 13.3 },
      },
    };

    const { getByText } = render(<ShelterActivityCard activity={activity} />);

    expect(getByText('Senin 08:00 - 10:00')).toBeTruthy();
    expect(getByText('Rabu 09:00')).toBeTruthy();
  });

  it('calls onLoadMore when the end of the list is reached and pagination allows it', () => {
    const onLoadMore = jest.fn();
    const activities = [
      {
        id: 'activity-1',
        name: 'Kelas Matematika',
        summary: { present: {}, late: {}, absent: {} },
      },
      {
        id: 'activity-2',
        name: 'Kelas Bahasa',
        summary: { present: {}, late: {}, absent: {} },
      },
      {
        id: 'activity-3',
        name: 'Kelas Sains',
        summary: { present: {}, late: {}, absent: {} },
      },
    ];

    const { getByTestId } = render(
      <WeeklyActivityList
        activities={activities}
        onLoadMore={onLoadMore}
        pagination={{ page: 1, perPage: 3, totalItems: 6, totalPages: 2, hasNextPage: true }}
        isLoading={false}
        testID="weekly-activity-list"
      />,
    );

    fireEvent.scroll(getByTestId('weekly-activity-list'), {
      nativeEvent: {
        contentOffset: { y: 400 },
        contentSize: { height: 800, width: 300 },
        layoutMeasurement: { height: 200, width: 300 },
      },
    });

    expect(onLoadMore).toHaveBeenCalled();
  });
});
