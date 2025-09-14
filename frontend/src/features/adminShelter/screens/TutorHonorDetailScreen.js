import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import Button from '../../../common/components/Button';
import HonorBreakdownDisplay from '../components/HonorBreakdownDisplay';
import PaymentSystemIndicator from '../components/PaymentSystemIndicator';
import { formatRupiah } from '../../../utils/currencyFormatter';

import {
  fetchMonthlyDetail,
  approveHonor,
  markAsPaid,
  selectMonthlyDetail,
  selectHonorStats,
  selectHonorLoading,
  selectHonorError,
  selectHonorActionStatus,
  selectCurrentSettings
} from '../redux/tutorHonorSlice';

const TutorHonorDetailScreen = () => {
  const dispatch = useDispatch();
  const route = useRoute();

  const { tutorId, tutorName, month, year } = route.params;

  const monthlyDetail = useSelector(selectMonthlyDetail);
  const stats = useSelector(selectHonorStats);
  const loading = useSelector(selectHonorLoading);
  const error = useSelector(selectHonorError);
  const approveStatus = useSelector(state => selectHonorActionStatus(state, 'approve'));
  const paidStatus = useSelector(state => selectHonorActionStatus(state, 'markPaid'));
  const currentSettings = useSelector(selectCurrentSettings);

  useEffect(() => {
    dispatch(fetchMonthlyDetail({ tutorId, month, year }));
  }, [dispatch, tutorId, month, year]);

  const getMonthName = (month) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month - 1];
  };

  const handleApproveHonor = () => {
    Alert.alert(
      'Setujui Honor',
      'Apakah Anda yakin ingin menyetujui honor ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Setujui',
          onPress: () => {
            dispatch(approveHonor(monthlyDetail.id_honor))
              .unwrap()
              .then(() => {
                Alert.alert('Berhasil', 'Honor berhasil disetujui');
              })
              .catch((err) => {
                Alert.alert('Gagal', err || 'Gagal menyetujui honor');
              });
          }
        }
      ]
    );
  };

  const handleMarkAsPaid = () => {
    Alert.alert(
      'Tandai Sebagai Dibayar',
      'Apakah Anda yakin honor ini sudah dibayar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Sudah Dibayar',
          onPress: () => {
            dispatch(markAsPaid(monthlyDetail.id_honor))
              .unwrap()
              .then(() => {
                Alert.alert('Berhasil', 'Honor berhasil ditandai sebagai dibayar');
              })
              .catch((err) => {
                Alert.alert('Gagal', err || 'Gagal menandai honor');
              });
          }
        }
      ]
    );
  };

  const renderActivityItem = ({ item }) => {
    const paymentSystem = monthlyDetail?.payment_system_used;
    
    return (
      <View style={styles.activityItem}>
        <View style={styles.activityHeader}>
          <View style={styles.activityInfo}>
            <Text style={styles.activityType}>{item.aktivitas?.jenis_kegiatan}</Text>
            <Text style={styles.activityDate}>
              {new Date(item.tanggal_aktivitas).toLocaleDateString('id-ID')}
            </Text>
          </View>
          <Text style={styles.honorAmount}>
            {formatRupiah(item.honor_per_aktivitas)}
          </Text>
        </View>
        
        <Text style={styles.activityMaterial}>{item.aktivitas?.materi}</Text>
        
        {/* Dynamic breakdown based on payment system */}
        {item.dynamic_breakdown && (
          <HonorBreakdownDisplay 
            breakdown={item.dynamic_breakdown}
            paymentSystem={paymentSystem}
            compact={true}
          />
        )}

        {/* Attendance info - show if relevant to payment system */}
        {(paymentSystem === 'per_student_category' || 
          paymentSystem === 'session_per_student_category') && (
          <View style={styles.attendanceInfo}>
            <View style={styles.attendanceItem}>
              <Ionicons name="people" size={16} color="#e74c3c" />
              <Text style={styles.attendanceText}>CPB: {item.cpb_count}</Text>
            </View>
            <View style={styles.attendanceItem}>
              <Ionicons name="people" size={16} color="#f39c12" />
              <Text style={styles.attendanceText}>PB: {item.pb_count}</Text>
            </View>
            <View style={styles.attendanceItem}>
              <Ionicons name="people" size={16} color="#2ecc71" />
              <Text style={styles.attendanceText}>NPB: {item.npb_count}</Text>
            </View>
          </View>
        )}

        {/* Session info - show if relevant */}
        {(paymentSystem === 'per_session' || 
          paymentSystem === 'session_per_student_category') && (
          <View style={styles.sessionInfo}>
            <View style={styles.attendanceItem}>
              <Ionicons name="calendar" size={16} color="#3498db" />
              <Text style={styles.attendanceText}>
                {item.session_count || 1} sesi
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat detail honor..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => dispatch(fetchMonthlyDetail({ tutorId, month, year }))}
      />
    );
  }

  if (!monthlyDetail) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-outline" size={64} color="#e0e0e0" />
        <Text style={styles.emptyTitle}>Data Tidak Ditemukan</Text>
        <Text style={styles.emptySubtitle}>
          Belum ada data honor untuk periode ini
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.tutorName}>{tutorName}</Text>
        <Text style={styles.periodText}>
          {getMonthName(month)} {year}
        </Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {formatRupiah(monthlyDetail.total_honor)}
            </Text>
            <Text style={styles.summaryLabel}>Total Honor</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{monthlyDetail.total_aktivitas}</Text>
            <Text style={styles.summaryLabel}>Aktivitas</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{monthlyDetail.total_siswa_hadir}</Text>
            <Text style={styles.summaryLabel}>Total Siswa</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {stats?.rata_rata_siswa || 0}
            </Text>
            <Text style={styles.summaryLabel}>Rata-rata/Aktivitas</Text>
          </View>
        </View>
      </View>

      {/* Payment System Indicator */}
      <PaymentSystemIndicator 
        settings={currentSettings || { payment_system: monthlyDetail.payment_system_used }}
      />

      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Status Honor</Text>
        <View style={styles.statusCard}>
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: monthlyDetail.status === 'paid' ? '#2ecc71' : 
                               monthlyDetail.status === 'approved' ? '#f39c12' : '#95a5a6' }
          ]} />
          <Text style={styles.statusText}>
            {monthlyDetail.status === 'draft' ? 'Draft - Belum Disetujui' :
             monthlyDetail.status === 'approved' ? 'Disetujui - Menunggu Pembayaran' :
             'Sudah Dibayar'}
          </Text>
        </View>
      </View>

      {/* Monthly Summary Breakdown */}
      {monthlyDetail.dynamic_summary && (
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Ringkasan Honor</Text>
          <HonorBreakdownDisplay 
            breakdown={{
              ...monthlyDetail.dynamic_summary.breakdown,
              total_amount: monthlyDetail.total_honor,
              formatted_total: formatRupiah(monthlyDetail.total_honor)
            }}
            paymentSystem={monthlyDetail.payment_system_used}
            showTitle={false}
          />
        </View>
      )}

      <View style={styles.activitiesSection}>
        <Text style={styles.sectionTitle}>Detail Aktivitas</Text>
        {monthlyDetail.details && monthlyDetail.details.length > 0 ? (
          <FlatList
            data={monthlyDetail.details}
            renderItem={renderActivityItem}
            keyExtractor={(item) => item.id_detail.toString()}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.noActivities}>
            <Text style={styles.noActivitiesText}>Tidak ada aktivitas</Text>
          </View>
        )}
      </View>

      <View style={styles.actionSection}>
        {monthlyDetail.status === 'draft' && (
          <Button
            title="Setujui Honor"
            onPress={handleApproveHonor}
            loading={approveStatus === 'loading'}
            style={styles.actionButton}
            leftIcon={<Ionicons name="checkmark-circle" size={20} color="#fff" />}
          />
        )}
        
        {monthlyDetail.status === 'approved' && (
          <Button
            title="Tandai Sebagai Dibayar"
            onPress={handleMarkAsPaid}
            loading={paidStatus === 'loading'}
            type="success"
            style={styles.actionButton}
            leftIcon={<Ionicons name="cash" size={20} color="#fff" />}
          />
        )}
        
        {monthlyDetail.status === 'paid' && (
          <View style={styles.paidIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#2ecc71" />
            <Text style={styles.paidText}>Honor Sudah Dibayar</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  headerCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed'
  },
  tutorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  periodText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16
  },
  summaryItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 16
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  statusSection: {
    padding: 16
  },
  summarySection: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 1
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12
  },
  statusText: {
    fontSize: 14,
    color: '#333'
  },
  activitiesSection: {
    padding: 16
  },
  activityItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  activityInfo: {
    flex: 1
  },
  activityType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  activityDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  honorAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71'
  },
  activityMaterial: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12
  },
  attendanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  sessionInfo: {
    flexDirection: 'row',
    marginTop: 8
  },
  attendanceItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  attendanceText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666'
  },
  actionSection: {
    padding: 16
  },
  actionButton: {
    marginBottom: 16
  },
  paidIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    elevation: 1
  },
  paidText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#2ecc71'
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
    marginTop: 8
  },
  noActivities: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 8,
    alignItems: 'center'
  },
  noActivitiesText: {
    fontSize: 14,
    color: '#666'
  }
});

export default TutorHonorDetailScreen;