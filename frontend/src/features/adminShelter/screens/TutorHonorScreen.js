import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import Button from '../../../common/components/Button';
import HonorCalculatorInput from '../components/HonorCalculatorInput';
import HonorPreviewResult from '../components/HonorPreviewResult';
import PaymentSystemIndicator from '../components/PaymentSystemIndicator';
import { formatRupiah } from '../../../utils/currencyFormatter';

import {
  fetchTutorHonor,
  calculateHonor,
  fetchCurrentSettings,
  calculatePreview,
  resetPreview,
  setPreviewInputs,
  resetPreviewInputs,
  selectHonorList,
  selectHonorLoading,
  selectHonorError,
  selectHonorSummary,
  selectHonorActionStatus,
  selectCurrentSettings,
  selectPreview,
  selectPreviewInputs,
  selectPaymentSystem,
  resetActionStatus
} from '../redux/tutorHonorSlice';

const TutorHonorScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();

  const { tutorId, tutorName } = route.params;
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const honorList = useSelector(selectHonorList);
  const loading = useSelector(selectHonorLoading);
  const error = useSelector(selectHonorError);
  const summary = useSelector(selectHonorSummary);
  const calculateStatus = useSelector(state => selectHonorActionStatus(state, 'calculate'));
  const currentSettings = useSelector(selectCurrentSettings);
  const preview = useSelector(selectPreview);
  const previewInputs = useSelector(selectPreviewInputs);
  const paymentSystem = useSelector(selectPaymentSystem);
  const previewStatus = useSelector(state => selectHonorActionStatus(state, 'preview'));

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
      dispatch(fetchCurrentSettings());
    }, [selectedYear])
  );

  useEffect(() => {
    if (currentSettings?.payment_system) {
      dispatch(resetPreviewInputs());
    }
  }, [currentSettings?.payment_system]);

  useEffect(() => {
    const delayedPreview = setTimeout(() => {
      if (showPreviewModal && currentSettings) {
        dispatch(calculatePreview(previewInputs));
      }
    }, 500);
    
    return () => clearTimeout(delayedPreview);
  }, [previewInputs, showPreviewModal, currentSettings]);

  const fetchData = () => {
    dispatch(fetchTutorHonor({ 
      tutorId, 
      params: { year: selectedYear } 
    }));
  };

  const handleCalculateHonor = (month) => {
    if (!currentSettings) {
      Alert.alert(
        'Setting Honor Tidak Ditemukan',
        'Setting honor tutor belum dikonfigurasi. Hubungi admin pusat untuk mengatur setting honor.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Hitung Honor',
      `Hitung honor untuk bulan ${getMonthName(month)} ${selectedYear}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hitung',
          onPress: () => {
            dispatch(calculateHonor({
              tutorId,
              data: { month, year: selectedYear }
            }))
              .unwrap()
              .then(() => {
                Alert.alert('Berhasil', 'Honor berhasil dihitung');
                fetchData();
              })
              .catch((err) => {
                Alert.alert('Gagal', err || 'Gagal menghitung honor');
              });
          }
        }
      ]
    );
  };

  const handleOpenCalculationModal = () => {
    navigation.navigate('HonorCalculation', { tutorId, tutorName });
  };

  const handleShowPreview = () => {
    if (!currentSettings) {
      Alert.alert(
        'Setting Honor Tidak Ditemukan',
        'Setting honor tutor belum dikonfigurasi.',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowPreviewModal(true);
  };

  const handlePreviewInputChange = (field, value) => {
    dispatch(setPreviewInputs({ [field]: value }));
  };

  const getMonthName = (month) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month - 1];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#f39c12';
      case 'approved': return '#27ae60';
      case 'paid': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'approved': return 'Disetujui';
      case 'paid': return 'Dibayar';
      default: return 'Unknown';
    }
  };

  const getPaymentSystemName = (paymentSystem) => {
    const systems = {
      'flat_monthly': 'Honor Bulanan Tetap',
      'per_session': 'Per Sesi/Pertemuan',
      'per_student_category': 'Per Kategori Siswa',
      'session_per_student_category': 'Per Sesi + Per Kategori Siswa'
    };
    return systems[paymentSystem] || paymentSystem;
  };

  const renderRateInfo = (setting) => {
    const { payment_system } = setting;

    switch (payment_system) {
      case 'flat_monthly':
        return (
          <View style={styles.rateItem}>
            <Text style={styles.rateLabel}>Bulanan</Text>
            <Text style={styles.rateValue}>
              {formatRupiah(setting.flat_monthly_rate)}
            </Text>
          </View>
        );

      case 'per_session':
        return (
          <View style={styles.rateItem}>
            <Text style={styles.rateLabel}>Per Sesi</Text>
            <Text style={styles.rateValue}>
              {formatRupiah(setting.session_rate)}
            </Text>
          </View>
        );

      case 'per_student_category':
        return (
          <View style={styles.ratesContainer}>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>CPB</Text>
              <Text style={styles.rateValue}>
                {formatRupiah(setting.cpb_rate)}
              </Text>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>PB</Text>
              <Text style={styles.rateValue}>
                {formatRupiah(setting.pb_rate)}
              </Text>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>NPB</Text>
              <Text style={styles.rateValue}>
                {formatRupiah(setting.npb_rate)}
              </Text>
            </View>
          </View>
        );

      case 'session_per_student_category':
        return (
          <View style={styles.ratesContainer}>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>Per Sesi</Text>
              <Text style={styles.rateValue}>
                {formatRupiah(setting.session_rate)}
              </Text>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>CPB</Text>
              <Text style={styles.rateValue}>
                {formatRupiah(setting.cpb_rate)}
              </Text>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>PB</Text>
              <Text style={styles.rateValue}>
                {formatRupiah(setting.pb_rate)}
              </Text>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>NPB</Text>
              <Text style={styles.rateValue}>
                {formatRupiah(setting.npb_rate)}
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderActiveSummary = () => {
    if (!currentSettings) return null;

    return (
      <View style={styles.activeSettingSummary}>
        <Text style={styles.activeSummaryTitle}>Setting Aktif Saat Ini</Text>
        <Text style={styles.activeSummarySystem}>
          {getPaymentSystemName(currentSettings.payment_system)}
        </Text>
        <View style={styles.activeSummaryContent}>
          {renderRateInfo(currentSettings)}
        </View>
      </View>
    );
  };

  const renderSettingsModal = () => (
    <Modal
      visible={showSettingsModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Detail Setting Honor</Text>
          <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <PaymentSystemIndicator 
            settings={currentSettings}
            showDetails={true}
          />
        </ScrollView>
      </View>
    </Modal>
  );

  const renderPreviewModal = () => (
    <Modal
      visible={showPreviewModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Preview Kalkulasi Honor</Text>
          <TouchableOpacity onPress={() => {
            setShowPreviewModal(false);
            dispatch(resetPreview());
          }}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <HonorCalculatorInput
            paymentSystem={paymentSystem}
            values={previewInputs}
            onValueChange={handlePreviewInputChange}
          />

          <HonorPreviewResult
            preview={preview}
            loading={previewStatus === 'loading'}
            inputParameters={previewInputs}
          />
        </ScrollView>
      </View>
    </Modal>
  );

  const renderHonorItem = ({ item }) => (
    <TouchableOpacity
      style={styles.honorItem}
      onPress={() => navigation.navigate('TutorHonorDetail', {
        tutorId,
        tutorName,
        month: item.bulan,
        year: item.tahun
      })}
    >
      <View style={styles.honorHeader}>
        <Text style={styles.monthText}>{item.bulan_nama} {item.tahun}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.honorDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.total_aktivitas} aktivitas</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.total_siswa_hadir} siswa hadir</Text>
        </View>
        {item.payment_system_used && (
          <View style={styles.detailRow}>
            <Ionicons name="settings-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.payment_system_display || item.payment_system_used}</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.honorAmount}>{formatRupiah(item.total_honor)}</Text>
      
      <View style={styles.actionRow}>
        {item.status === 'draft' && (
          <TouchableOpacity
            style={styles.calculateButton}
            onPress={(e) => {
              e.stopPropagation();
              handleCalculateHonor(item.bulan);
            }}
          >
            <Ionicons name="calculator-outline" size={16} color="#3498db" />
            <Text style={styles.calculateButtonText}>Hitung Ulang</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.viewButton}>
          <Ionicons name="eye-outline" size={16} color="#666" />
          <Text style={styles.viewButtonText}>Lihat Detail</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color="#e0e0e0" />
      <Text style={styles.emptyTitle}>Belum Ada Data Honor</Text>
      <Text style={styles.emptySubtitle}>
        Hitung honor tutor untuk melihat data
      </Text>
      <Button
        title="Hitung Honor"
        onPress={handleOpenCalculationModal}
        style={styles.calculateHonorButton}
        leftIcon={<Ionicons name="calculator" size={20} color="#fff" />}
      />
    </View>
  );

  if (loading && honorList.length === 0) {
    return <LoadingSpinner fullScreen message="Memuat data honor..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.tutorName}>{tutorName}</Text>
            <Text style={styles.yearText}>Tahun {selectedYear}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.previewButton}
              onPress={handleShowPreview}
            >
              <Ionicons name="calculator" size={20} color="#3498db" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleOpenCalculationModal}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatRupiah(summary.yearlyTotal)}</Text>
            <Text style={styles.summaryLabel}>Total Honor</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.totalActivities}</Text>
            <Text style={styles.summaryLabel}>Total Aktivitas</Text>
          </View>
        </View>
      </View>

      <PaymentSystemIndicator 
        settings={currentSettings}
        onPress={() => setShowSettingsModal(true)}
      />

      {renderActiveSummary()}

      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchData}
        />
      )}

      <FlatList
        data={honorList}
        renderItem={renderHonorItem}
        keyExtractor={(item) => `${item.bulan}_${item.tahun}`}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchData} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {renderSettingsModal()}
      {renderPreviewModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed'
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tutorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  yearText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  previewButton: {
    backgroundColor: '#f8f9fa',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3498db'
  },
  addButton: {
    backgroundColor: '#3498db',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  summaryItem: {
    alignItems: 'center'
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  activeSettingSummary: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed'
  },
  activeSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2ecc71',
    marginBottom: 8
  },
  activeSummarySystem: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 12
  },
  activeSummaryContent: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  ratesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  rateItem: {
    alignItems: 'center',
    minWidth: 80
  },
  rateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  rateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  listContainer: {
    padding: 16
  },
  honorItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  honorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500'
  },
  honorDetails: {
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  detailText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666'
  },
  honorAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 12
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#ebf3fd'
  },
  calculateButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500'
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  viewButtonText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24
  },
  calculateHonorButton: {
    minWidth: 200
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  modalContent: {
    flex: 1,
    padding: 16
  }
});

export default TutorHonorScreen;