import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';

import AttendanceFilterBar from '../../../components/reports/attendance/AttendanceFilterBar';
import AttendanceSummarySection from '../../../components/reports/attendance/AttendanceSummarySection';
import WeeklyBreakdownList from '../../../components/reports/attendance/WeeklyBreakdownList';
import ShelterAttendanceTable from '../../../components/reports/attendance/ShelterAttendanceTable';
import AttendanceTrendChart from '../../../components/reports/attendance/AttendanceTrendChart';
import ShelterAttendanceDetailModal from '../../../components/reports/attendance/ShelterAttendanceDetailModal';

import useAttendanceSummary from '../../../hooks/reports/attendance/useAttendanceSummary';
import useAttendanceWeekly from '../../../hooks/reports/attendance/useAttendanceWeekly';
import useAttendanceWeeklyShelters from '../../../hooks/reports/attendance/useAttendanceWeeklyShelters';
import useAttendanceTrend from '../../../hooks/reports/attendance/useAttendanceTrend';

const AdminCabangAttendanceReportScreen = () => {
  const { data: summaryData } = useAttendanceSummary();
  const {
    data: weeklyData,
    isLoading: isWeeklyLoading,
    error: weeklyError,
    refetch: refetchWeekly,
  } = useAttendanceWeekly();
  const {
    data: shelterData,
    isLoading: isShelterLoading,
    error: shelterError,
    refetch: refetchShelters,
  } = useAttendanceWeeklyShelters();
  const { data: trendData } = useAttendanceTrend();

  const [selectedShelter, setSelectedShelter] = useState(null);
  const [isDetailVisible, setDetailVisible] = useState(false);

  const activeFilters = useMemo(() => {
    const weeks = Array.isArray(weeklyData) ? weeklyData : [];

    const isValidDate = (value) => {
      if (!value) {
        return false;
      }

      const parsed = new Date(value);

      return !Number.isNaN(parsed.getTime());
    };

    const startDates = weeks
      .map((item) => item?.dates?.start)
      .filter((value) => isValidDate(value));
    const endDates = weeks
      .map((item) => item?.dates?.end)
      .filter((value) => isValidDate(value));

    const earliestStart =
      startDates.length > 0
        ? startDates.reduce((earliest, current) => {
            return new Date(current) < new Date(earliest) ? current : earliest;
          }, startDates[0])
        : undefined;

    const latestEnd =
      endDates.length > 0
        ? endDates.reduce((latest, current) => {
            return new Date(current) > new Date(latest) ? current : latest;
          }, endDates[0])
        : undefined;

    return {
      startDate: earliestStart,
      endDate: latestEnd,
      label: summaryData?.periodLabel ?? null,
    };
  }, [weeklyData, summaryData?.periodLabel]);

  const handleShelterRowPress = useCallback((shelter) => {
    if (!shelter) {
      return;
    }

    setSelectedShelter({
      id: shelter.id,
      name: shelter.name,
      wilbin: shelter.wilbin,
    });
    setDetailVisible(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailVisible(false);
    setSelectedShelter(null);
  }, []);

  const summaryMetrics = useMemo(() => {
    if (!summaryData) {
      return [];
    }

    return [
      {
        label: 'Total Kehadiran',
        value: summaryData.presentCount.toLocaleString('id-ID'),
      },
      {
        label: 'Rata-rata Kehadiran',
        value: `${summaryData.attendanceRate}%`,
      },
      {
        label: 'Anak Binaan Aktif',
        value: summaryData.activeChildren.toLocaleString('id-ID'),
      },
      {
        label: 'Total Absen',
        value: summaryData.absentCount.toLocaleString('id-ID'),
      },
    ];
  }, [summaryData]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AttendanceFilterBar />

      <View style={styles.section}>
        <AttendanceSummarySection
          title="Ringkasan Kehadiran"
          description={summaryData ? `Periode laporan ${summaryData.periodLabel}` : undefined}
        >
          <View style={styles.summaryGrid}>
            {summaryMetrics.map((metric) => (
              <View key={metric.label} style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{metric.value}</Text>
                <Text style={styles.summaryLabel}>{metric.label}</Text>
              </View>
            ))}
          </View>
        </AttendanceSummarySection>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rekap Mingguan Cabang</Text>
        <WeeklyBreakdownList
          data={weeklyData}
          isLoading={isWeeklyLoading}
          error={weeklyError}
          onRetry={refetchWeekly}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rekap Mingguan per Shelter</Text>
        <ShelterAttendanceTable
          data={shelterData}
          isLoading={isShelterLoading}
          error={shelterError}
          onRetry={refetchShelters}
          onRowPress={handleShelterRowPress}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tren Kehadiran</Text>
        <AttendanceTrendChart data={trendData} />
      </View>

      <ShelterAttendanceDetailModal
        visible={isDetailVisible}
        onClose={handleCloseDetail}
        shelterId={selectedShelter?.id}
        shelterName={selectedShelter?.name}
        shelterWilbin={selectedShelter?.wilbin}
        filters={activeFilters}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2d3436',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  summaryCard: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0984e3',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#636e72',
    marginTop: 4,
  },
});

export default AdminCabangAttendanceReportScreen;
