import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import Button from '../../../common/components/Button';
import MonthYearPicker from '../components/MonthYearPicker';

import {
  calculateHonor,
  selectHonorActionStatus,
  selectHonorActionError,
  resetActionStatus
} from '../redux/tutorHonorSlice';

const HonorCalculationScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();

  const { tutorId, tutorName } = route.params;
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPicker, setShowPicker] = useState(false);

  const calculateStatus = useSelector(state => selectHonorActionStatus(state, 'calculate'));
  const calculateError = useSelector(state => selectHonorActionError(state, 'calculate'));

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handleCalculate = () => {
    dispatch(calculateHonor({
      tutorId,
      data: { month: selectedMonth, year: selectedYear }
    }))
      .unwrap()
      .then(() => {
        Alert.alert('Berhasil', 'Honor berhasil dihitung', [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]);
      })
      .catch((error) => {
        Alert.alert('Gagal', error || 'Gagal menghitung honor');
      });
  };

  const handlePeriodSelect = () => {
    setShowPicker(true);
  };

  const handlePeriodConfirm = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setShowPicker(false);
  };

  const isLoading = calculateStatus === 'loading';

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>Menghitung honor...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.tutorCard}>
          <View style={styles.tutorInfo}>
            <Ionicons name="person-circle" size={48} color="#3498db" />
            <View style={styles.tutorDetails}>
              <Text style={styles.tutorName}>{tutorName}</Text>
              <Text style={styles.tutorLabel}>Tutor</Text>
            </View>
          </View>
        </View>

        <View style={styles.periodCard}>
          <Text style={styles.sectionTitle}>Periode Perhitungan</Text>
          <TouchableOpacity
            style={styles.periodSelector}
            onPress={handlePeriodSelect}
          >
            <View style={styles.periodInfo}>
              <Ionicons name="calendar" size={24} color="#3498db" />
              <View style={styles.periodText}>
                <Text style={styles.periodMonth}>{months[selectedMonth - 1]}</Text>
                <Text style={styles.periodYear}>{selectedYear}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informasi Perhitungan</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle" size={20} color="#f39c12" />
            </View>
            <Text style={styles.infoText}>
              Honor dihitung berdasarkan aktivitas yang sudah dilakukan dalam periode tersebut
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="cash" size={20} color="#27ae60" />
            </View>
            <Text style={styles.infoText}>
              Setiap siswa yang hadir bernilai Rp 10.000
            </Text>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="time" size={20} color="#e74c3c" />
            </View>
            <Text style={styles.infoText}>
              Siswa yang terlambat tetap dihitung sebagai hadir
            </Text>
          </View>
        </View>

        {calculateError && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color="#e74c3c" />
            <Text style={styles.errorText}>{calculateError}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          title="Hitung Honor"
          onPress={handleCalculate}
          loading={isLoading}
          disabled={isLoading}
          style={styles.calculateButton}
          leftIcon={<Ionicons name="calculator" size={20} color="#fff" />}
        />
      </View>

      <MonthYearPicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onConfirm={handlePeriodConfirm}
        initialMonth={selectedMonth}
        initialYear={selectedYear}
        maxYear={new Date().getFullYear()}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  tutorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  tutorInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  tutorDetails: {
    marginLeft: 16,
    flex: 1
  },
  tutorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  tutorLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 4
  },
  periodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    backgroundColor: '#f8f9fa'
  },
  periodInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  periodText: {
    marginLeft: 12
  },
  periodMonth: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  periodYear: {
    fontSize: 16,
    color: '#666',
    marginTop: 2
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2f2',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
    marginBottom: 16
  },
  errorText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#e74c3c',
    flex: 1
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed'
  },
  calculateButton: {
    width: '100%'
  }
});

export default HonorCalculationScreen;