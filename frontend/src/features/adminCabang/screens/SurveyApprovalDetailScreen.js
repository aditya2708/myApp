import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { adminCabangSurveyApi } from '../api/adminCabangSurveyApi';

const SurveyApprovalDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { surveyId } = route.params;
  
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionType, setActionType] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const formatDate = (dateString) => {
    if (!dateString || dateString === '' || dateString === null) {
      return 'Tanggal tidak tersedia';
    }
    
    const date = new Date(dateString);
    
    // Check if date is valid and not epoch (1970-01-01)
    if (isNaN(date.getTime()) || date.getFullYear() === 1970) {
      return 'Tanggal tidak valid';
    }
    
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const fetchSurveyDetail = async () => {
    try {
      setError(null);
      const response = await adminCabangSurveyApi.getSurveyDetail(surveyId);
      setSurvey(response.data.data);
    } catch (err) {
      setError('Gagal memuat detail survei');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSurveyDetail(); }, [surveyId]);

  const showApprovalModal = (type) => {
    setActionType(type);
    setModalVisible(true);
    setNotes('');
    setRejectionReason('');
  };

  const handleApproval = async () => {
    if (actionType === 'reject' && !rejectionReason.trim()) {
      Alert.alert('Kesalahan', 'Alasan penolakan wajib diisi');
      return;
    }

    setActionLoading(true);
    try {
      const data = { approval_notes: notes };
      if (actionType === 'reject') data.rejection_reason = rejectionReason;

      await adminCabangSurveyApi[actionType === 'approve' ? 'approveSurvey' : 'rejectSurvey'](surveyId, data);
      Alert.alert('Berhasil', `Survei berhasil ${actionType === 'approve' ? 'disetujui' : 'ditolak'}`);
      setModalVisible(false);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Kesalahan', 'Gagal memproses survei');
    } finally {
      setActionLoading(false);
    }
  };

  const InfoSection = ({ title, data }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {Object.entries(data).map(([key, value]) => (
          <View key={key} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{key}:</Text>
            <Text style={styles.infoValue}>{value || '-'}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const ActionButton = ({ type, onPress }) => {
    const isApprove = type === 'approve';
    return (
      <TouchableOpacity style={[styles.actionButton, isApprove ? styles.approveButton : styles.rejectButton]} onPress={onPress}>
        <Ionicons name={isApprove ? 'checkmark-circle' : 'close-circle'} size={24} color="#fff" />
        <Text style={styles.actionButtonText}>{isApprove ? 'Setujui' : 'Tolak'}</Text>
      </TouchableOpacity>
    );
  };

  const InputField = ({ label, value, onChangeText, placeholder, required, multiline = true }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label} {required && '*'}</Text>
      <TextInput
        style={styles.textArea}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={3}
      />
    </View>
  );

  if (loading) return <LoadingSpinner fullScreen message="Memuat detail survei..." />;
  if (error) return <View style={styles.container}><ErrorMessage message={error} onRetry={fetchSurveyDetail} /></View>;

  const { keluarga } = survey;
  const anak = keluarga?.anak?.[0];

  const sections = [
    ['Informasi Keluarga', {
      'Kepala Keluarga': keluarga?.kepala_keluarga,
      'Nomor KK': keluarga?.no_kk,
      'Telepon': keluarga?.no_telp,
      'Shelter': keluarga?.shelter?.nama_shelter,
      'Wilbin': keluarga?.shelter?.wilbin?.nama_wilbin
    }],
    ...(anak ? [['Informasi Anak', {
      'Nama Lengkap': anak.full_name,
      'Nama Panggilan': anak.nick_name,
      'Tanggal Lahir': formatDate(anak.tanggal_lahir),
      'Status Saat Ini': anak.status_cpb
    }]] : []),
    ...(keluarga?.ayah ? [['Informasi Ayah', {
      'Nama': keluarga.ayah.nama_ayah,
      'NIK': keluarga.ayah.nik_ayah,
      'Tempat Lahir': keluarga.ayah.tempat_lahir,
      'Penghasilan': keluarga.ayah.penghasilan
    }]] : []),
    ...(keluarga?.ibu ? [['Informasi Ibu', {
      'Nama': keluarga.ibu.nama_ibu,
      'NIK': keluarga.ibu.nik_ibu,
      'Tempat Lahir': keluarga.ibu.tempat_lahir,
      'Penghasilan': keluarga.ibu.penghasilan
    }]] : []),
    ['Informasi Survei', {
      'Pekerjaan Kepala Keluarga': survey.pekerjaan_kepala_keluarga,
      'Penghasilan': survey.penghasilan,
      'Pendidikan': survey.pendidikan_kepala_keluarga,
      'Jumlah Tanggungan': survey.jumlah_tanggungan,
      'Kepemilikan Rumah': survey.kepemilikan_rumah,
      'Kondisi Dinding': survey.kondisi_rumah_dinding,
      'Kondisi Lantai': survey.kondisi_rumah_lantai,
      'Sumber Air Bersih': survey.sumber_air_bersih,
      'Tanggal Survei': formatDate(survey.tanggal_survey),
      'Petugas Survei': survey.petugas_survey
    }]
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {sections.map(([title, data], index) => <InfoSection key={index} title={title} data={data} />)}
      </ScrollView>

      {survey?.hasil_survey === 'pending' && (
        <View style={styles.actionContainer}>
          <ActionButton type="reject" onPress={() => showApprovalModal('reject')} />
          <ActionButton type="approve" onPress={() => showApprovalModal('approve')} />
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === 'approve' ? 'Setujui Survei' : 'Tolak Survei'}
            </Text>
            
            {actionType === 'reject' && (
              <InputField
                label="Alasan Penolakan"
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Masukkan alasan penolakan..."
                required
              />
            )}
            
            <InputField
              label="Catatan"
              value={notes}
              onChangeText={setNotes}
              placeholder="Masukkan catatan tambahan..."
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, actionType === 'approve' ? styles.approveButton : styles.rejectButton]}
                onPress={handleApproval}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <LoadingSpinner size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>
                    {actionType === 'approve' ? 'Setujui' : 'Tolak'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 8, borderRadius: 12, overflow: 'hidden' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', backgroundColor: '#f8f8f8', padding: 16 },
  sectionContent: { padding: 16 },
  infoRow: { flexDirection: 'row', marginBottom: 8 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: '#666', width: 120 },
  infoValue: { fontSize: 14, color: '#333', flex: 1 },
  actionContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 8, marginHorizontal: 4 },
  approveButton: { backgroundColor: '#27ae60' },
  rejectButton: { backgroundColor: '#e74c3c' },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, margin: 16, width: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 16, textAlign: 'center' },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  textArea: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { flex: 1, padding: 16, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  cancelButton: { backgroundColor: '#95a5a6' },
  cancelButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' }
});

export default SurveyApprovalDetailScreen;