import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Platform,
  Linking
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import EmptyState from '../../../common/components/EmptyState';
import { adminCabangDonaturApi } from '../api/adminCabangDonaturApi';

const AdminCabangDonaturDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { donaturId } = route.params;

  const [donatur, setDonatur] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDonaturDetail = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const response = await adminCabangDonaturApi.getDonaturDetail(donaturId);
      setDonatur(response.data.data);
    } catch (err) {
      console.error('Error fetching donatur detail:', err);
      setError('Gagal memuat detail donatur. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDonaturDetail();
  }, [donaturId]);

  useFocusEffect(
    React.useCallback(() => {
      fetchDonaturDetail(true);
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDonaturDetail(true);
  };

  const handleEdit = () => {
    navigation.navigate('DonaturForm', { donaturId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus donatur "${donatur?.nama_lengkap}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: deleteDonatur
        }
      ]
    );
  };

  const deleteDonatur = async () => {
    try {
      await adminCabangDonaturApi.deleteDonatur(donaturId);
      Alert.alert('Sukses', 'Donatur berhasil dihapus', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Gagal menghapus donatur';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleEmail = (email) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const getDiperuntukan = (value) => {
    const options = {
      'anak': 'Anak',
      'shelter': 'Shelter', 
      'kacab': 'Cabang'
    };
    return options[value] || value;
  };

  const getDiperuntukanbadgeColor = (value) => {
    const colors = {
      'anak': '#3498db',
      'shelter': '#2ecc71',
      'kacab': '#9b59b6'
    };
    return colors[value] || '#95a5a6';
  };

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat detail donatur..." />;
  }

  if (error && !donatur) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error} onRetry={() => fetchDonaturDetail()} />
      </View>
    );
  }

  if (!donatur) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="person-outline"
          title="Donatur Tidak Ditemukan"
          message="Data donatur yang Anda cari tidak ditemukan"
          actionButtonText="Kembali"
          onActionPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  const InfoRow = ({ icon, label, value, onPress, color = '#333' }) => (
    <TouchableOpacity 
      style={styles.infoRow} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color="#666" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, { color }, onPress && styles.linkText]}>
          {value || '-'}
        </Text>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={16} color="#666" />
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {donatur.foto ? (
            <Image
              source={{ uri: `https://bp.berbagipendidikan.org/storage/Donatur/${donatur.id_donatur}/${donatur.foto}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32} color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.donaturName}>{donatur.nama_lengkap}</Text>
          <Text style={styles.donaturEmail}>{donatur.user?.email}</Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: getDiperuntukanbadgeColor(donatur.diperuntukan) }]}>
              <Text style={styles.badgeText}>{getDiperuntukan(donatur.diperuntukan)}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Ionicons name="pencil" size={20} color="#fff" />
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.buttonText}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContactInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Informasi Kontak</Text>
      <InfoRow
        icon="call-outline"
        label="Nomor HP"
        value={donatur.no_hp}
        onPress={() => handleCall(donatur.no_hp)}
        color="#2ecc71"
      />
      <InfoRow
        icon="mail-outline"
        label="Email"
        value={donatur.user?.email}
        onPress={() => handleEmail(donatur.user?.email)}
        color="#3498db"
      />
      <InfoRow
        icon="location-outline"
        label="Alamat"
        value={donatur.alamat}
      />
    </View>
  );

  const renderPlacementInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Penempatan</Text>
      <InfoRow
        icon="map-outline"
        label="Wilayah Binaan"
        value={donatur.wilbin?.nama_wilbin}
      />
      <InfoRow
        icon="home-outline"
        label="Shelter"
        value={donatur.shelter?.nama_shelter}
      />
      <InfoRow
        icon="flag-outline"
        label="Diperuntukan"
        value={getDiperuntukan(donatur.diperuntukan)}
      />
    </View>
  );

  const renderBankInfo = () => {
    if (!donatur.bank && !donatur.no_rekening) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasi Bank</Text>
        <InfoRow
          icon="card-outline"
          label="Bank"
          value={donatur.bank?.nama_bank}
        />
        <InfoRow
          icon="keypad-outline"
          label="Nomor Rekening"
          value={donatur.no_rekening}
        />
      </View>
    );
  };

  const renderChildrenInfo = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Anak Binaan</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{donatur.anak?.length || 0}</Text>
        </View>
      </View>
      
      {donatur.anak && donatur.anak.length > 0 ? (
        donatur.anak.map((child, index) => (
          <View key={child.id_anak} style={styles.childCard}>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{child.nama_lengkap}</Text>
              <Text style={styles.childDetail}>
                {child.jenis_kelamin} • {child.umur} tahun
              </Text>
              <Text style={styles.childShelter}>
                {child.shelter?.nama_shelter}
              </Text>
            </View>
            <TouchableOpacity style={styles.childAction}>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.emptyChildren}>
          <Ionicons name="people-outline" size={48} color="#bdc3c7" />
          <Text style={styles.emptyChildrenText}>Belum ada anak binaan</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {error && <ErrorMessage message={error} />}
      
      {renderHeader()}
      {renderContactInfo()}
      {renderPlacementInfo()}
      {renderBankInfo()}
      {renderChildrenInfo()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#bdc3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  donaturName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  donaturEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f39c12',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    justifyContent: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  countBadge: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoIcon: {
    width: 40,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  childDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  childShelter: {
    fontSize: 12,
    color: '#95a5a6',
  },
  childAction: {
    padding: 4,
  },
  emptyChildren: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyChildrenText: {
    fontSize: 16,
    color: '#95a5a6',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default AdminCabangDonaturDetailScreen;