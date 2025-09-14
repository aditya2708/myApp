import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import ConfirmationModal from '../../../common/components/ConfirmationModal';
import { adminShelterKeuanganApi } from '../api/adminShelterKeuanganApi';

const KeuanganDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { keuanganId } = route.params;

  const [keuangan, setKeuangan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchKeuanganDetail();
  }, [keuanganId]);

  const fetchKeuanganDetail = async () => {
    try {
      setError(null);
      const response = await adminShelterKeuanganApi.getKeuanganDetail(keuanganId);
      setKeuangan(response.data.data);
    } catch (err) {
      console.error('Error fetching keuangan detail:', err);
      setError('Gagal memuat detail keuangan');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('KeuanganForm', { keuangan, isEdit: true });
  };

  const handleDelete = () => {
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await adminShelterKeuanganApi.deleteKeuangan(keuanganId);
      Alert.alert('Berhasil', 'Data keuangan berhasil dihapus');
      navigation.goBack();
    } catch (err) {
      console.error('Error deleting keuangan:', err);
      Alert.alert('Error', 'Gagal menghapus data keuangan');
    } finally {
      setDeleting(false);
      setDeleteModal(false);
    }
  };

  const formatCurrency = (amount) => {
    const numValue = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue || 0);
  };

  // Use calculated totals from API or calculate as fallback
  const getTotals = () => {
    if (!keuangan) return { totalKebutuhan: 0, totalBantuan: 0, sisaTagihan: 0 };
    
    // Use totals from API if available
    if (keuangan.total_kebutuhan !== undefined && keuangan.total_bantuan !== undefined) {
      return {
        totalKebutuhan: parseFloat(keuangan.total_kebutuhan) || 0,
        totalBantuan: parseFloat(keuangan.total_bantuan) || 0,
        sisaTagihan: parseFloat(keuangan.sisa_tagihan) || 0,
      };
    }
    
    // Fallback calculation
    const bimbel = parseFloat(keuangan.bimbel) || 0;
    const eskulDanKeagamaan = parseFloat(keuangan.eskul_dan_keagamaan) || 0;
    const laporan = parseFloat(keuangan.laporan) || 0;
    const uangTunai = parseFloat(keuangan.uang_tunai) || 0;
    const donasi = parseFloat(keuangan.donasi) || 0;
    const subsidiInfak = parseFloat(keuangan.subsidi_infak) || 0;
    
    const totalKebutuhan = bimbel + eskulDanKeagamaan + laporan + uangTunai;
    const totalBantuan = donasi + subsidiInfak;
    const sisaTagihan = Math.max(0, totalKebutuhan - totalBantuan);
    
    return { totalKebutuhan, totalBantuan, sisaTagihan };
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat detail keuangan..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error} onRetry={fetchKeuanganDetail} />
      </View>
    );
  }

  if (!keuangan) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Data keuangan tidak ditemukan</Text>
      </View>
    );
  }

  const { totalKebutuhan, totalBantuan, sisaTagihan } = getTotals();
  const statusPaid = keuangan.is_lunas !== undefined ? keuangan.is_lunas : (totalKebutuhan <= totalBantuan);

  return (
    <ScrollView style={styles.container}>
      {/* Child Information */}
      <View style={styles.childCard}>
        <View style={styles.childHeader}>
          {keuangan.anak?.foto ? (
            <Image 
              source={{ uri: `http://192.168.8.105:8000/storage/Anak/${keuangan.anak.id_anak}/${keuangan.anak.foto}` }}
              style={styles.childAvatar}
            />
          ) : (
            <View style={styles.childAvatarPlaceholder}>
              <Ionicons name="person" size={40} color="#ffffff" />
            </View>
          )}
          
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{keuangan.anak?.full_name || 'Nama tidak diketahui'}</Text>
            <Text style={styles.childNickname}>{keuangan.anak?.nick_name || 'No nickname'}</Text>
            <Text style={styles.academicInfo}>{keuangan.semester} - {keuangan.tingkat_sekolah}</Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: statusPaid ? '#27ae60' : '#e74c3c' }]}>
            <Text style={styles.statusText}>
              {statusPaid ? 'Lunas' : 'Belum Lunas'}
            </Text>
          </View>
        </View>
      </View>

      {/* Financial Details */}
      <View style={styles.detailCard}>
        <Text style={styles.sectionTitle}>Kebutuhan Biaya</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Bimbel:</Text>
          <Text style={styles.detailValue}>{formatCurrency(keuangan.bimbel)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Eskul & Keagamaan:</Text>
          <Text style={styles.detailValue}>{formatCurrency(keuangan.eskul_dan_keagamaan)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Laporan:</Text>
          <Text style={styles.detailValue}>{formatCurrency(keuangan.laporan)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Uang Tunai:</Text>
          <Text style={styles.detailValue}>{formatCurrency(keuangan.uang_tunai)}</Text>
        </View>
        
        <View style={[styles.detailRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Kebutuhan:</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalKebutuhan)}</Text>
        </View>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.sectionTitle}>Bantuan</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Donasi:</Text>
          <Text style={styles.detailValue}>{formatCurrency(keuangan.donasi)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Subsidi Infak:</Text>
          <Text style={styles.detailValue}>{formatCurrency(keuangan.subsidi_infak)}</Text>
        </View>
        
        <View style={[styles.detailRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total Bantuan:</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalBantuan)}</Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Ringkasan</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Kebutuhan:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalKebutuhan)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Bantuan:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalBantuan)}</Text>
        </View>
        
        <View style={[styles.summaryRow, styles.finalRow]}>
          <Text style={styles.finalLabel}>Sisa Tagihan:</Text>
          <Text style={[styles.finalValue, { color: sisaTagihan > 0 ? '#e74c3c' : '#27ae60' }]}>
            {formatCurrency(sisaTagihan)}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Button
          title="Edit"
          onPress={handleEdit}
          type="primary"
          leftIcon={<Ionicons name="create-outline" size={20} color="white" />}
          style={styles.actionButton}
        />
        
        <Button
          title="Hapus"
          onPress={handleDelete}
          type="danger"
          leftIcon={<Ionicons name="trash-outline" size={20} color="white" />}
          style={styles.actionButton}
        />
      </View>

      {/* Additional Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Informasi Tambahan</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dibuat:</Text>
          <Text style={styles.infoValue}>
            {keuangan.created_at ? new Date(keuangan.created_at).toLocaleDateString('id-ID') : '-'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Diperbarui:</Text>
          <Text style={styles.infoValue}>
            {keuangan.updated_at ? new Date(keuangan.updated_at).toLocaleDateString('id-ID') : '-'}
          </Text>
        </View>
        
        {keuangan.anak?.id_donatur && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status Sponsorship:</Text>
            <Text style={[styles.infoValue, { color: '#27ae60' }]}>Ada Donatur</Text>
          </View>
        )}
      </View>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModal}
        title="Hapus Data Keuangan"
        message={`Apakah Anda yakin ingin menghapus data keuangan ${keuangan.anak?.full_name}?`}
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal(false)}
        loading={deleting}
        type="danger"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  childCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  childAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  childAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#bdc3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
  academicInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  detailCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  finalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#dee2e6',
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  finalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default KeuanganDetailScreen;