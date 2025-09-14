import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import SearchBar from '../../../common/components/SearchBar';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import EmptyState from '../../../common/components/EmptyState';
import PickerInput from '../../../common/components/PickerInput';
import { donaturBillingApi } from '../api/donaturBillingApi';

const ChildBillingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { childId, childName } = route.params;

  const [billingData, setBillingData] = useState(null);
  const [billingList, setBillingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [semesters, setSemesters] = useState([]);

  const fetchChildBilling = async () => {
    try {
      setError(null);
      const response = await donaturBillingApi.getChildBilling(childId);
      setBillingData(response.data.data);
      
      // Filter by semester if selected
      let filteredBilling = response.data.data.billing || [];
      if (selectedSemester) {
        filteredBilling = filteredBilling.filter(item => item.semester === selectedSemester);
      }
      setBillingList(filteredBilling);

      // Extract unique semesters for filter
      const uniqueSemesters = [...new Set((response.data.data.billing || []).map(item => item.semester))]
        .sort()
        .map(semester => ({ label: semester, value: semester }));
      setSemesters(uniqueSemesters);

    } catch (err) {
      console.error('Error fetching child billing:', err);
      setError('Gagal memuat data tagihan anak');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChildBilling();
    }, [childId, selectedSemester])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChildBilling();
  };

  const handleBillingDetail = (item) => {
    navigation.navigate('BillingDetail', { billingId: item.id_keuangan, childName });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const calculateTotals = (item) => {
    const totalKebutuhan = (item.bimbel || 0) + (item.eskul_dan_keagamaan || 0) + 
                          (item.laporan || 0) + (item.uang_tunai || 0);
    const totalBantuan = (item.donasi || 0) + (item.subsidi_infak || 0);
    const sisaTagihan = Math.max(0, totalKebutuhan - totalBantuan);
    
    return { totalKebutuhan, totalBantuan, sisaTagihan };
  };

  const renderBillingItem = ({ item }) => {
    const { totalKebutuhan, totalBantuan, sisaTagihan } = calculateTotals(item);
    const statusPaid = totalKebutuhan <= totalBantuan;

    return (
      <TouchableOpacity 
        style={styles.billingCard}
        onPress={() => handleBillingDetail(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.semesterInfo}>
            <Text style={styles.semesterText}>{item.semester}</Text>
            <Text style={styles.tingkatText}>{item.tingkat_sekolah}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: statusPaid ? '#27ae60' : '#e74c3c' }]}>
            <Text style={styles.statusText}>
              {statusPaid ? 'Lunas' : 'Belum Lunas'}
            </Text>
          </View>
        </View>

        <View style={styles.financialInfo}>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Total Kebutuhan:</Text>
            <Text style={styles.financialAmount}>{formatCurrency(totalKebutuhan)}</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Total Bantuan:</Text>
            <Text style={styles.financialAmount}>{formatCurrency(totalBantuan)}</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Sisa Tagihan:</Text>
            <Text style={[styles.financialAmount, { color: sisaTagihan > 0 ? '#e74c3c' : '#27ae60' }]}>
              {formatCurrency(sisaTagihan)}
            </Text>
          </View>
        </View>

        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>Rincian Kebutuhan:</Text>
          <View style={styles.breakdownGrid}>
            {item.bimbel > 0 && (
              <Text style={styles.breakdownItem}>Bimbel: {formatCurrency(item.bimbel)}</Text>
            )}
            {item.eskul_dan_keagamaan > 0 && (
              <Text style={styles.breakdownItem}>Eskul: {formatCurrency(item.eskul_dan_keagamaan)}</Text>
            )}
            {item.laporan > 0 && (
              <Text style={styles.breakdownItem}>Laporan: {formatCurrency(item.laporan)}</Text>
            )}
            {item.uang_tunai > 0 && (
              <Text style={styles.breakdownItem}>Uang Tunai: {formatCurrency(item.uang_tunai)}</Text>
            )}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            Dibuat: {new Date(item.created_at).toLocaleDateString('id-ID')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSummaryCard = () => {
    if (!billingData?.child) return null;

    const totalBills = billingList.length;
    const paidBills = billingList.filter(item => {
      const { totalKebutuhan, totalBantuan } = calculateTotals(item);
      return totalKebutuhan <= totalBantuan;
    }).length;

    const totalKebutuhan = billingList.reduce((sum, item) => {
      const { totalKebutuhan } = calculateTotals(item);
      return sum + totalKebutuhan;
    }, 0);

    const totalBantuan = billingList.reduce((sum, item) => {
      const { totalBantuan } = calculateTotals(item);
      return sum + totalBantuan;
    }, 0);

    const totalSisaTagihan = Math.max(0, totalKebutuhan - totalBantuan);

    return (
      <View style={styles.summaryCard}>
        <View style={styles.childHeader}>
          {billingData.child.foto ? (
            <Image 
              source={{ uri: `http://192.168.8.105:8000/storage/Anak/${billingData.child.id_anak}/${billingData.child.foto}` }}
              style={styles.childAvatar}
            />
          ) : (
            <View style={styles.childAvatarPlaceholder}>
              <Ionicons name="person" size={24} color="#ffffff" />
            </View>
          )}
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{billingData.child.full_name}</Text>
            <Text style={styles.childNickname}>{billingData.child.nick_name}</Text>
          </View>
        </View>

        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalBills}</Text>
            <Text style={styles.statLabel}>Total Tagihan</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#27ae60' }]}>{paidBills}</Text>
            <Text style={styles.statLabel}>Lunas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#e74c3c' }]}>{totalBills - paidBills}</Text>
            <Text style={styles.statLabel}>Belum Lunas</Text>
          </View>
        </View>

        <View style={styles.summaryFinancial}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Kebutuhan:</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalKebutuhan)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Bantuan:</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(totalBantuan)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Sisa Tagihan:</Text>
            <Text style={[styles.totalAmount, { color: totalSisaTagihan > 0 ? '#e74c3c' : '#27ae60' }]}>
              {formatCurrency(totalSisaTagihan)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat data tagihan..." />;
  }

  return (
    <View style={styles.container}>
      {/* Filter Section */}
      <View style={styles.filterContainer}>
        <PickerInput
          label="Filter Semester"
          value={selectedSemester}
          onValueChange={setSelectedSemester}
          items={[{ label: 'Semua Semester', value: '' }, ...semesters]}
          placeholder="Pilih Semester"
        />
      </View>

      {/* Error Message */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchChildBilling}
        />
      )}

      {/* Content */}
      <FlatList
        data={billingList}
        renderItem={renderBillingItem}
        keyExtractor={(item) => item.id_keuangan.toString()}
        ListHeaderComponent={renderSummaryCard}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          !loading && !error && (
            <EmptyState
              icon="receipt-outline"
              title="Belum Ada Data Tagihan"
              message={selectedSemester 
                ? `Tidak ada tagihan untuk ${selectedSemester}`
                : "Belum ada data tagihan untuk anak ini"
              }
              onRetry={selectedSemester ? () => setSelectedSemester('') : undefined}
              retryButtonText="Lihat Semua"
            />
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listContainer: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  childAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  childAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#9b59b6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  childNickname: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  summaryFinancial: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  billingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  semesterInfo: {
    flex: 1,
  },
  semesterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tingkatText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  financialInfo: {
    marginBottom: 12,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  financialLabel: {
    fontSize: 14,
    color: '#666',
  },
  financialAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  breakdownContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  breakdownItem: {
    fontSize: 12,
    color: '#666',
    marginRight: 16,
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
});

export default ChildBillingScreen;