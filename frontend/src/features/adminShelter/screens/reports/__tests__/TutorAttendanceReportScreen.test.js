import React from 'react';
import { act, render, within } from '@testing-library/react-native';

import TutorAttendanceReportScreen from '../TutorAttendanceReportScreen';

const mockDispatch = jest.fn();
const mockSetOptions = jest.fn();
const mockNavigate = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn()
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn()
}));

const { useDispatch, useSelector } = require('react-redux');
const { useNavigation } = require('@react-navigation/native');

describe('TutorAttendanceReportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDispatch.mockReturnValue(mockDispatch);
    mockDispatch.mockImplementation(() => ({ unwrap: jest.fn().mockResolvedValue({}) }));
    useNavigation.mockReturnValue({ setOptions: mockSetOptions, navigate: mockNavigate });
  });

  const buildState = (overrides = {}) => ({
    tutorAttendance: {
      summary: [],
      summaryLoading: false,
      summaryError: null,
      ...overrides.tutorAttendance
    }
  });

  it('shows loading state while summary is being fetched', async () => {
    const mockState = buildState({
      tutorAttendance: {
        summary: [],
        summaryLoading: true
      }
    });

    useSelector.mockImplementation((selector) => selector(mockState));

    let screen;
    await act(async () => {
      screen = render(<TutorAttendanceReportScreen />);
    });

    expect(screen.getByText('Memuat ringkasan kehadiran tutor...')).toBeTruthy();
  });

  it('renders tutor summary and verified tutor cards', async () => {
    const mockState = buildState({
      tutorAttendance: {
        summary: [
          {
            id_tutor: 1,
            nama: 'Tutor A',
            maple: 'Matematika',
            total_activities: 3,
            verified_present_count: 1,
            verified_late_count: 1,
            verified_absent_count: 1,
            verified_attendance_count: 3,
            activity_types: ['Matematika']
          },
          {
            id_tutor: 2,
            nama: 'Tutor B',
            maple: 'IPA',
            total_activities: 2,
            verified_present_count: 1,
            verified_late_count: 0,
            verified_absent_count: 1,
            verified_attendance_count: 2,
            activity_types: ['IPA']
          }
        ]
      }
    });

    useSelector.mockImplementation((selector) => selector(mockState));

    let screen;
    await act(async () => {
      screen = render(<TutorAttendanceReportScreen />);
    });

    expect(screen.getByText('Ringkasan Kehadiran Tutor')).toBeTruthy();
    expect(screen.getByText('Tutor A')).toBeTruthy();
    expect(screen.getByText('Tutor B')).toBeTruthy();

    const tutorACard = screen.getByText('Tutor A').parent.parent.parent;
    const tutorBCard = screen.getByText('Tutor B').parent.parent.parent;

    expect(within(tutorACard).getAllByText('1')).toHaveLength(3);
    expect(within(tutorACard).getByText('3')).toBeTruthy();

    expect(within(tutorBCard).getAllByText('1')).toHaveLength(2);
    expect(within(tutorBCard).getByText('2')).toBeTruthy();
  });

  it('shows empty state when there is no verified attendance data', async () => {
    const mockState = buildState();

    useSelector.mockImplementation((selector) => selector(mockState));

    let screen;
    await act(async () => {
      screen = render(<TutorAttendanceReportScreen />);
    });

    expect(screen.getByText('Belum ada kehadiran terverifikasi')).toBeTruthy();
  });
});
