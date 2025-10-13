import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import QrTokenGenerationTab from './components/QrTokenGenerationTab';
import QrScannerTab from './components/QrScannerTab';
import AttendanceListTab from './components/AttendanceListTab';
import {
  selectAktivitasAttendanceSummary,
  selectAktivitasDetail
} from '../../redux/aktivitasSlice';

const Tab = createMaterialTopTabNavigator();

const AttendanceManagementScreen = ({ navigation, route }) => {
  const {
    id_aktivitas, activityName, activityDate, activityType,
    kelompokId, kelompokName, level, completeActivity, initialTab,
    activityStatus: routeActivityStatus,
    attendanceSummary: routeAttendanceSummary
  } = route.params || {};

  const aktivitasDetail = useSelector(selectAktivitasDetail);
  const aktivitasSummary = useSelector(selectAktivitasAttendanceSummary);

  const detailMatches = aktivitasDetail?.id_aktivitas === id_aktivitas;
  const derivedActivityStatus = detailMatches ? aktivitasDetail?.status : null;
  const derivedAttendanceSummary = detailMatches ? aktivitasSummary : null;

  const effectiveActivityStatus = derivedActivityStatus ?? routeActivityStatus ?? null;
  const effectiveAttendanceSummary = derivedAttendanceSummary ?? routeAttendanceSummary ?? null;
  
  // Extract timing info from activity
  const startTime = completeActivity?.start_time;
  const endTime = completeActivity?.end_time;

  const screenOptions = useMemo(() => ({
    tabBarActiveTintColor: '#fff',
    tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
    tabBarStyle: {
      backgroundColor: '#3498db',
      elevation: 0,
      shadowOpacity: 0,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'none',
    },
    tabBarIndicatorStyle: {
      backgroundColor: '#fff',
      height: 3,
    },
    tabBarShowIcon: true,
    tabBarIconStyle: { marginBottom: 2 },
    lazy: true, // Enable lazy loading
    lazyPreloadDistance: 0, // Only load tab when focused
    swipeEnabled: true,
  }), []);

  const getTabBarIcon = useCallback((iconName) => ({ color }) => (
    <Ionicons name={iconName} size={20} color={color} />
  ), []);

  // Memoize tab props to prevent re-renders
  const qrTokenProps = useMemo(() => ({
    id_aktivitas,
    activityName,
    activityDate,
    activityType,
    kelompokId,
    kelompokName,
    level,
    completeActivity,
  }), [id_aktivitas, activityName, activityDate, activityType, kelompokId, kelompokName, level, completeActivity]);

  const qrScannerProps = useMemo(() => ({
    navigation,
    id_aktivitas,
    activityName,
    activityDate,
    activityType,
    kelompokId,
    kelompokName,
    startTime,
    endTime,
  }), [navigation, id_aktivitas, activityName, activityDate, activityType, kelompokId, kelompokName, startTime, endTime]);

  const attendanceListProps = useMemo(() => ({
    navigation,
    id_aktivitas,
    activityName,
    activityDate,
    activityType,
    kelompokId,
    kelompokName,
    activityStatus: effectiveActivityStatus,
    attendanceSummary: effectiveAttendanceSummary,
  }), [
    navigation,
    id_aktivitas,
    activityName,
    activityDate,
    activityType,
    kelompokId,
    kelompokName,
    effectiveActivityStatus,
    effectiveAttendanceSummary,
  ]);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName={initialTab || 'QrScanner'}
        screenOptions={screenOptions}
      >
        <Tab.Screen
          name="QrTokenGeneration"
          options={{
            tabBarLabel: 'Buat QR',
            tabBarIcon: getTabBarIcon('qr-code-outline'),
          }}
        >
          {() => <QrTokenGenerationTab {...qrTokenProps} />}
        </Tab.Screen>
        
        <Tab.Screen
          name="QrScanner"
          options={{
            tabBarLabel: 'Scan QR',
            tabBarIcon: getTabBarIcon('scan-outline'),
          }}
        >
          {() => <QrScannerTab {...qrScannerProps} />}
        </Tab.Screen>
        
        <Tab.Screen
          name="AttendanceList"
          options={{
            tabBarLabel: 'Daftar',
            tabBarIcon: getTabBarIcon('list-outline'),
          }}
        >
          {() => <AttendanceListTab {...attendanceListProps} />}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default AttendanceManagementScreen;