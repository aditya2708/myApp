import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import Button from '../../../common/components/Button';
import { adminCabangPengajuanDonaturApi } from '../api/adminCabangPengajuanDonaturApi';

const ChildDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { childId } = route.params;

  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChildDetail = async () => {
    try {
      setError(null);
      const response = await adminCabangPengajuanDonaturApi.getChildDetail(childId);
      setChild(response.data.data);
    } catch (err) {
      setError('Gagal memuat detail anak');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildDetail();
  }, [childId]);

  const handleAssignDonatur = () => {
    navigation.navigate('DonaturSelection', { child });
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat detail anak..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error} onRetry={fetchChildDetail} />
      </View>
    );
  }

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color="#666" style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '-'}</Text>
      </View>
    </View>
  );

  const InfoCard = ({ title, children }) => (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.childImageContainer}>
          {child.foto_url ? (
            <Image source={{ uri: child.foto_url }} style={styles.childImage} />
          ) : (
            <View style={styles.childImagePlaceholder}>
              <Ionicons name="person" size={60} color="#ccc" />
            </View>
          )}
        </View>
        
        <View style={styles.childBasicInfo}>
          <Text style={styles.childName}>{child.full_name}</Text>
          <Text style={styles.childNick}>"{child.nick_name}"</Text>
          
          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{child.status_cpb}</Text>
            </View>
            <Text style={styles.statusDescription}>
              {child.id_donatur ? 'Sudah memiliki donatur' : 'Belum memiliki donatur'}
            </Text>
          </View>
        </View>
      </View>

      <InfoCard title="Informasi Personal">
        <InfoRow icon="calendar-outline" label="Tanggal Lahir" value={child.tanggal_lahir} />
        <InfoRow icon="location-outline" label="Tempat Lahir" value={child.tempat_lahir} />
        <InfoRow icon="person-outline" label="Jenis Kelamin" value={child.jenis_kelamin} />
        <InfoRow icon="time-outline" label="Umur" value={`${child.umur} tahun`} />
        <InfoRow icon="people-outline" label="Anak ke" value={`${child.anak_ke} dari ${child.dari_bersaudara} bersaudara`} />
        <InfoRow icon="home-outline" label="Tinggal Bersama" value={child.tinggal_bersama} />
      </InfoCard>

      <InfoCard title="Informasi Pendidikan">
        <InfoRow icon="school-outline" label="Tingkat Pendidikan" value={child.anakPendidikan?.tingkat} />
        <InfoRow icon="book-outline" label="Pelajaran Favorit" value={child.pelajaran_favorit} />
        <InfoRow icon="trophy-outline" label="Prestasi" value={child.prestasi} />
        <InfoRow icon="library-outline" label="Hafalan" value={child.hafalan} />
      </InfoCard>

      <InfoCard title="Informasi Lokasi">
        <InfoRow icon="business-outline" label="Shelter" value={child.shelter?.nama_shelter} />
        <InfoRow icon="map-outline" label="Wilayah Binaan" value={child.shelter?.wilbin?.nama_wilbin} />
        <InfoRow icon="car-outline" label="Transportasi" value={child.transportasi} />
        <InfoRow icon="location-outline" label="Jarak Rumah" value={child.jarak_rumah} />
      </InfoCard>

      <InfoCard title="Informasi Keluarga">
        <InfoRow icon="people-outline" label="Kepala Keluarga" value={child.keluarga?.nama_kepala_keluarga} />
        <InfoRow icon="call-outline" label="No. HP Keluarga" value={child.keluarga?.no_hp} />
        <InfoRow icon="location-outline" label="Alamat Keluarga" value={child.keluarga?.alamat} />
      </InfoCard>

      {child.hobi && (
        <InfoCard title="Minat & Bakat">
          <InfoRow icon="heart-outline" label="Hobi" value={child.hobi} />
        </InfoCard>
      )}

      {child.background_story && (
        <InfoCard title="Latar Belakang">
          <Text style={styles.storyText}>{child.background_story}</Text>
        </InfoCard>
      )}

      {child.prestasi?.length > 0 && (
        <InfoCard title="Prestasi Terkini">
          {child.prestasi.slice(0, 3).map((prestasi, index) => (
            <View key={index} style={styles.achievementItem}>
              <Ionicons name="trophy" size={16} color="#f39c12" />
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>{prestasi.nama_prestasi}</Text>
                <Text style={styles.achievementDate}>{prestasi.tanggal}</Text>
              </View>
            </View>
          ))}
        </InfoCard>
      )}

      {!child.id_donatur && (
        <View style={styles.actionContainer}>
          <Button
            title="Ajukan Donatur"
            type="primary"
            onPress={handleAssignDonatur}
            leftIcon={<Ionicons name="person-add" size={20} color="white" />}
            style={styles.assignButton}
          />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: { paddingBottom: 20 },
  header: { backgroundColor: '#fff', padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  childImageContainer: { marginRight: 16 },
  childImage: { width: 100, height: 100, borderRadius: 50 },
  childImagePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  childBasicInfo: { flex: 1 },
  childName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  childNick: { fontSize: 16, color: '#666', fontStyle: 'italic', marginVertical: 4 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  statusBadge: { backgroundColor: '#f39c12', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  statusDescription: { fontSize: 12, color: '#666' },
  infoCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  infoIcon: { marginRight: 12, marginTop: 2 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 13, color: '#666', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  storyText: { fontSize: 14, color: '#333', lineHeight: 20 },
  achievementItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  achievementContent: { marginLeft: 8, flex: 1 },
  achievementTitle: { fontSize: 14, fontWeight: '500', color: '#333' },
  achievementDate: { fontSize: 12, color: '#666', marginTop: 2 },
  actionContainer: { padding: 16 },
  assignButton: { paddingVertical: 16 }
});

export default ChildDetailScreen;