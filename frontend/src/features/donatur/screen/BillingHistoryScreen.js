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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import SearchBar from '../../../common/components/SearchBar';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import EmptyState from '../../../common/components/EmptyState';
import PickerInput from '../../../common/components/PickerInput';
import { donaturBillingApi } from '../api/donaturBillingApi';

const BillingHistoryScreen = () => {
  const navigation = useNavigation();
  const [billing, setBilling] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [children, setChildren] = useState([]);
  const [semesters, setSemesters] = useState([]);

  const statusOptions = [
    { label: 'Semua Status', value: '' },
    { label: 'Lunas', value: 'paid' },
    { label: 'Belum Lunas', value: 'unpaid' },
  ];

  const fetchBillingData = async () => {
    try {
      setError(null);
      const params = {
        child_id: selectedChild,
        semester: selectedSemester,
        status: selectedStatus,
        per_page: 20,
      };

      const [billingResponse, summaryResponse] = await Promise.all([
        donaturBillingApi.getBilling(params),
        donaturBillingApi.getBillingSummary(),
      ]);

      setBilling(billingResponse.data.data.data || []);
      setSummary(summaryResponse.data.data);

      // Extract children options from billing data
      const childrenSet = new Set();
      billingResponse.data.data.data?.forEach(item => {
        if (item.anak) {
          childrenSet.add(JSON.stringify({
            id: item.anak.id_anak,
            name: item.anak.full_name,
            nickname: item.anak.nick_name
          }));
        }
      });
      
      const childrenOptions = Array.from(childrenSet).map(item => {
        const child = JSON.parse(item);
        return {
          label: `${child.name} (${child.nickname || 'No nickname'})`,
          value: child.id.toString()
        };
      });
      setChildren(childrenOptions);

    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Gagal memuat riwayat tagihan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSemesters = async () => {
    try {
      const response = await donaturBillingApi.getBillingSemesters();
      const semesterOptions = response.data.data.map(semester => ({
        label: semester,
        value: semester
      }));
      setSemesters(semesterOptions);
    } catch (err) {
      console.error('Error fetching semesters:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBillingData();
      fetchSemesters();
    }, [selectedChild, selectedSemester, selectedStatus])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBillingData();
  };

  const clearFilters = () => {
    setSelectedChild('');
    setSelectedSemester('');
    setSelectedStatus('');
    setShowFilters(false);
  };

  const handleBillingDetail = (item) => {
    navigation.navigate('BillingDetail', { 
      billingId: item.id_keuangan, 
      childName: item.anak?.full_name 
    });
  };

  const handleChildBilling = (childId, childName) => {
    navigation.navigate('ChildBilling', { childId, childName });
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

  const renderSummaryCard = () => {
    if (!summary) return null;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Ringkasan Tagihan</Text>
        
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{summary.summary?.total_bills || 0}</Text>
            <Text style={styles.statLabel}>Total Tagihan</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#27ae60' }]}>
              {summary.summary?.paid_bills || 0}
            </Text>
            <Text style={styles.statLabel}>Lunas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#e74c3c' }]}>
              {summary.summary?.unpaid_bills || 0}
            </Text>
            <Text style={styles.statLabel}>Belum Lunas</Text>
          </View>
        </View>

        <View style={styles.summaryFinancial}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Kebutuhan:</Text>
            <Text style={styles.summaryAmount}>
              {formatCurrency(summary.summary?.total_kebutuhan)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Bantuan:</Text>
            <Text style={styles.summaryAmount}>
              {formatCurrency(summary.summary?.total_bantuan)}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Sisa Tagihan:</Text>
            <Text style={[styles.totalAmount, { 
              color: (summary.summary?.total_sisa_tagihan || 0) > 0 ? '#e74c3c' : '#27ae60' 
            }]}>
              {formatCurrency(summary.summary?.total_sisa_tagihan)}
            </Text>
          </View>
        </View>

        <Text style={styles.childrenCount}>
          {summary.sponsored_children_count || 0} Anak Asuh
        </Text>
      </View>
    );
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
          <View style={styles.childInfo}>
            {item.anak?.foto ? (
              <Image 
                source={{ uri: `http://192.168.8.105:8000/storage/Anak/${item.anak.id_anak}/${item.anak.foto}` }}
                style={styles.childAvatar}
              />
            ) : (
              <View style={styles.childAvatarPlaceholder}>
                <Ionicons name="person" size={20} color="#ffffff" />
              </View>
            )}
            <View style={styles.childDetails}>
              <Text style={styles.childName}>{item.anak?.full_name || 'Nama tidak diketahui'}</Text>
              <Text style={styles.semesterText}>{item.semester} - {item.tingkat_sekolah}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.childButton}
            onPress={() => handleChildBilling(item.anak?.id_anak, item.anak?.full_name)}
          >
            <Ionicons name="person-outline" size={16} color="#9b59b6" />
          </TouchableOpacity>
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

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusPaid ? '#27ae60' : '#e74c3c' }]}>
            <Text style={styles.statusText}>
              {statusPaid ? 'Lunas' : 'Belum Lunas'}
            </Text>
          </View>
          
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('id-ID')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat riwayat tagihan..." />;
  }

  return (
    <View style={styles.container}>
      {/* Filter Section */}
      <View style={styles.filterHeader}>
        <TouchableOpacity 
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={20} color="#9b59b6" />
          <Text style={styles.filterToggleText}>Filter</Text>
          <Ionicons 
            name={showFilters ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color="#9b59b6" 
          />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filterContainer}>
          <PickerInput
            label="Anak"
            value={selectedChild}
            onValueChange={setSelectedChild}
            items={[{ label: 'Semua Anak', value: '' }, ...children]}
            placeholder="Pilih Anak"
          />
          
          <PickerInput
            label="Semester"
            value={selectedSemester}
            onValueChange={setSelectedSemester}
            items={[{ label: 'Semua Semester', value: '' }, ...semesters]}
            placeholder="Pilih Semester"
          />
          
          <PickerInput
            label="Status"
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            items={statusOptions}
            placeholder="Pilih Status"
          />

          <TouchableOpacity style={styles.clearFilterButton} onPress={clearFilters}>
            <Text style={styles.clearFilterText}>Bersihkan Filter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchBillingData}
        />
      )}

      {/* Billing List */}
      <FlatList
        data={billing}
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
              title="Belum Ada Riwayat Tagihan"
              message="Belum ada data tagihan untuk anak asuh Anda"
              onRetry={fetchBillingData}
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
  filterHeader: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterToggleText: {
    fontSize: 16,
    color: '#9b59b6',
    marginHorizontal: 8,
    fontWeight: '500',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  clearFilterButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  clearFilterText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '500',
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
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
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
    marginBottom: 12,
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
  childrenCount: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  childAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#bdc3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childDetails: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  semesterText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  childButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  financialInfo: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
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
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  dateText: {
    fontSize: 12,
    color: '#999',
  },
});

export default BillingHistoryScreen;