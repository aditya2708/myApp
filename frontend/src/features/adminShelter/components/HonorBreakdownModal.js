import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HonorBreakdownModal = ({
  visible,
  onClose,
  honorData,
  settings,
  tutorName,
  period
}) => {
  const getPaymentSystemName = (paymentSystem) => {
    const systems = {
      'flat_monthly': 'Honor Bulanan Tetap',
      'per_session': 'Per Sesi/Pertemuan',
      'per_student_category': 'Per Kategori Siswa',
      'per_hour': 'Per Jam',
      'base_per_session': 'Dasar + Per Sesi',
      'base_per_student': 'Dasar + Per Siswa',
      'base_per_hour': 'Dasar + Per Jam',
      'session_per_student': 'Per Sesi + Per Siswa'
    };
    return systems[paymentSystem] || paymentSystem;
  };

  const renderCalculationSteps = () => {
    if (!settings || !honorData) return null;

    const { payment_system } = settings;

    switch (payment_system) {
      case 'per_student_category':
        return (
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>Langkah Kalkulasi:</Text>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Hitung per Kategori</Text>
                <View style={styles.stepDetails}>
                  <Text style={styles.stepDetail}>
                    CPB: {honorData.cpb_count || 0} siswa × Rp {settings.cpb_rate?.toLocaleString('id-ID')} = Rp {((honorData.cpb_count || 0) * (settings.cpb_rate || 0)).toLocaleString('id-ID')}
                  </Text>
                  <Text style={styles.stepDetail}>
                    PB: {honorData.pb_count || 0} siswa × Rp {settings.pb_rate?.toLocaleString('id-ID')} = Rp {((honorData.pb_count || 0) * (settings.pb_rate || 0)).toLocaleString('id-ID')}
                  </Text>
                  <Text style={styles.stepDetail}>
                    NPB: {honorData.npb_count || 0} siswa × Rp {settings.npb_rate?.toLocaleString('id-ID')} = Rp {((honorData.npb_count || 0) * (settings.npb_rate || 0)).toLocaleString('id-ID')}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Jumlahkan Total</Text>
                <Text style={styles.stepDetail}>
                  Total Honor = Rp {((honorData.cpb_count || 0) * (settings.cpb_rate || 0) + (honorData.pb_count || 0) * (settings.pb_rate || 0) + (honorData.npb_count || 0) * (settings.npb_rate || 0)).toLocaleString('id-ID')}
                </Text>
              </View>
            </View>
          </View>
        );

      case 'flat_monthly':
        return (
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>Langkah Kalkulasi:</Text>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Honor Tetap Bulanan</Text>
                <Text style={styles.stepDetail}>
                  Honor = Rp {settings.flat_monthly_rate?.toLocaleString('id-ID')} (tetap per bulan)
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>Sistem Kalkulasi:</Text>
            <Text style={styles.stepDetail}>
              {getPaymentSystemName(payment_system)}
            </Text>
          </View>
        );
    }
  };

  const renderActivitiesBreakdown = () => {
    if (!honorData?.details) return null;

    return (
      <View style={styles.activitiesContainer}>
        <Text style={styles.sectionTitle}>Detail per Aktivitas</Text>
        {honorData.details.map((detail, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>{detail.aktivitas?.jenis_kegiatan}</Text>
              <Text style={styles.activityDate}>
                {new Date(detail.tanggal_aktivitas).toLocaleDateString('id-ID')}
              </Text>
            </View>
            <Text style={styles.activityMaterial}>{detail.aktivitas?.materi}</Text>
            <View style={styles.activityStats}>
              <Text style={styles.activityStat}>
                CPB: {detail.cpb_count} | PB: {detail.pb_count} | NPB: {detail.npb_count}
              </Text>
              <Text style={styles.activityHonor}>
                Rp {detail.honor_per_aktivitas?.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderSummaryStats = () => {
    if (!honorData) return null;

    const totalStudents = (honorData.cpb_count || 0) + (honorData.pb_count || 0) + (honorData.npb_count || 0);

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Ringkasan</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{honorData.total_aktivitas || 0}</Text>
            <Text style={styles.summaryLabel}>Total Aktivitas</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalStudents}</Text>
            <Text style={styles.summaryLabel}>Total Siswa</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {honorData.total_aktivitas > 0 ? Math.round(totalStudents / honorData.total_aktivitas) : 0}
            </Text>
            <Text style={styles.summaryLabel}>Rata-rata/Aktivitas</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, styles.totalHonorValue]}>
              Rp {honorData.total_honor?.toLocaleString('id-ID')}
            </Text>
            <Text style={styles.summaryLabel}>Total Honor</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Breakdown Honor</Text>
            <Text style={styles.subtitle}>
              {tutorName} - {period?.month && period?.year ? 
                `${period.month}/${period.year}` : 'Preview'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {settings && (
            <View style={styles.settingsInfo}>
              <Text style={styles.sectionTitle}>Setting Honor Digunakan</Text>
              <View style={styles.settingCard}>
                <Text style={styles.settingSystem}>
                  {getPaymentSystemName(settings.payment_system)}
                </Text>
                <Text style={styles.settingId}>Setting #{settings.id_setting}</Text>
              </View>
            </View>
          )}

          {renderSummaryStats()}
          {renderCalculationSteps()}
          {renderActivitiesBreakdown()}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  closeButton: {
    padding: 8
  },
  content: {
    flex: 1,
    padding: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  settingsInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1
  },
  settingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  settingSystem: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500'
  },
  settingId: {
    fontSize: 12,
    color: '#666'
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  summaryItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 16
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71'
  },
  totalHonorValue: {
    fontSize: 16,
    color: '#e74c3c'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  stepsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  step: {
    flexDirection: 'row',
    marginBottom: 16
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  stepContent: {
    flex: 1
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  stepDetails: {
    gap: 4
  },
  stepDetail: {
    fontSize: 14,
    color: '#666'
  },
  activitiesContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1
  },
  activityItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1
  },
  activityDate: {
    fontSize: 12,
    color: '#666'
  },
  activityMaterial: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  activityStat: {
    fontSize: 12,
    color: '#666'
  },
  activityHonor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ecc71'
  }
});

export default HonorBreakdownModal;