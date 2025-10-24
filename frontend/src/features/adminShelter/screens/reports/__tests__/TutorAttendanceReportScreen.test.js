import React from 'react';
import { act, render, within } from '@testing-library/react-native';

const mockDispatch = jest.fn();
const mockSetOptions = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../components/TutorAttendanceFilters', () => jest.fn(() => null));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn()
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn()
}));

jest.mock('../../redux/tutorAttendanceSlice', () => {
  const actual = jest.requireActual('../../redux/tutorAttendanceSlice');
  return {
    ...actual,
    fetchTutorAttendanceSummary: jest.fn((filters = {}) => ({
      type: 'tutorAttendance/fetchSummary',
      payload: filters
    }))
  };
});

import TutorAttendanceReportScreen from '../TutorAttendanceReportScreen';

const { useDispatch, useSelector } = require('react-redux');
const { useNavigation } = require('@react-navigation/native');
const TutorAttendanceFilters = require('../../components/TutorAttendanceFilters');
const { fetchTutorAttendanceSummary } = require('../../redux/tutorAttendanceSlice');

describe('TutorAttendanceReportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDispatch.mockReturnValue(mockDispatch);
    mockDispatch.mockImplementation(() => ({ unwrap: jest.fn().mockResolvedValue({}) }));
    useNavigation.mockReturnValue({ setOptions: mockSetOptions, navigate: mockNavigate });
    TutorAttendanceFilters.mockClear();
    fetchTutorAttendanceSummary.mockClear();
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

  it('passes default filters to the filter sheet and clears using provided defaults', async () => {
    const mockState = buildState();

    useSelector.mockImplementation((selector) => selector(mockState));

    let screen;
    await act(async () => {
      screen = render(<TutorAttendanceReportScreen />);
    });

    expect(TutorAttendanceFilters).toHaveBeenCalled();
    const filterProps = TutorAttendanceFilters.mock.calls[0][0];

    expect(filterProps.defaultFilters).toEqual({
      date_from: null,
      date_to: null,
      jenis_kegiatan: 'all'
    });
    expect(filterProps.shelterOptions).toBeUndefined();

    await act(async () => {
      filterProps.onApply?.({
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        jenis_kegiatan: 'matematika'
      });
    });

    expect(fetchTutorAttendanceSummary).toHaveBeenLastCalledWith({
      date_from: '2024-01-01',
      date_to: '2024-01-31',
      jenis_kegiatan: 'matematika'
    });

    await act(async () => {
      filterProps.onClear?.({
        date_from: null,
        date_to: null,
        jenis_kegiatan: 'all'
      });
    });

    expect(fetchTutorAttendanceSummary).toHaveBeenLastCalledWith({});
  });
});
