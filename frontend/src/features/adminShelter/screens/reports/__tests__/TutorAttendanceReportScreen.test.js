import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

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
      attendanceRecords: {},
      activityRecords: {},
      tutorRecords: {},
      tokens: {},
      currentToken: null,
      loading: false,
      error: null,
      duplicateError: null,
      dateValidationError: null,
      lastUpdated: null,
      offlineQueue: [],
      isSyncing: false,
      summary: [],
      summaryStats: null,
      summaryLoading: false,
      summaryError: null,
      ...overrides.tutorAttendance
    },
    aktivitas: {
      aktivitasList: [],
      loading: false,
      error: null,
      ...overrides.aktivitas
    }
  });

  it('shows loading state while tutor summary is being fetched', async () => {
    const mockState = buildState({
      tutorAttendance: {
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

  it('renders tutor summary cards with category badges', async () => {
    const mockState = buildState({
      tutorAttendance: {
        summary: [
          { id_tutor: 1, nama: 'Tutor A', category: 'high', category_label: 'Baik', attendance_rate: 95, total_activities: 10, present_count: 9, late_count: 1, absent_count: 0 },
          { id_tutor: 2, nama: 'Tutor B', category: 'medium', category_label: 'Sedang', attendance_rate: 65, total_activities: 10, present_count: 6, late_count: 1, absent_count: 3 },
          { id_tutor: 3, nama: 'Tutor C', category: 'low', category_label: 'Rendah', attendance_rate: 40, total_activities: 10, present_count: 4, late_count: 0, absent_count: 6 },
          { id_tutor: 4, nama: 'Tutor D', category: 'no_data', category_label: 'Tidak Ada Data', attendance_rate: null, total_activities: 0, present_count: 0, late_count: 0, absent_count: 0 }
        ],
        summaryStats: {
          total_tutors: 4,
          average_attendance_rate: 66,
          distribution: {
            high: { count: 1, percentage: 25 },
            medium: { count: 1, percentage: 25 },
            low: { count: 1, percentage: 25 },
            no_data: { count: 1, percentage: 25 }
          }
        }
      }
    });

    useSelector.mockImplementation((selector) => selector(mockState));

    let screen;
    await act(async () => {
      screen = render(<TutorAttendanceReportScreen />);
    });

    expect(screen.getByText('Ringkasan Kehadiran Tutor')).toBeTruthy();
    expect(screen.getByText('Baik')).toBeTruthy();
    expect(screen.getByText('Sedang')).toBeTruthy();
    expect(screen.getByText('Rendah')).toBeTruthy();
    expect(screen.getByText('Tidak Ada Data')).toBeTruthy();
    expect(screen.getByText('Tutor A')).toBeTruthy();
  });

  it('allows switching to activity tab and shows empty state', async () => {
    const mockState = buildState();

    useSelector.mockImplementation((selector) => selector(mockState));

    let screen;
    await act(async () => {
      screen = render(<TutorAttendanceReportScreen />);
    });

    const activityTab = screen.getByText('Per Aktivitas');
    fireEvent.press(activityTab);

    expect(screen.getByText('Belum ada aktivitas yang sesuai')).toBeTruthy();
  });
});
