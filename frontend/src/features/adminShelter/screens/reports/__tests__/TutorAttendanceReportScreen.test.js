import React from 'react';
import { act, render } from '@testing-library/react-native';

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

  it('shows loading state while activities are being fetched', async () => {
    const mockState = {
      aktivitas: {
        aktivitasList: [],
        loading: true,
        error: null
      },
      tutorAttendance: {
        activityRecords: {}
      }
    };

    useSelector.mockImplementation((selector) => selector(mockState));

    let screen;
    await act(async () => {
      screen = render(<TutorAttendanceReportScreen />);
    });

    expect(screen.getByText('Memuat daftar aktivitas...')).toBeTruthy();
  });
});
