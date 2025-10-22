import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { adminCabangSurveyApi } from '../api/adminCabangSurveyApi';
import { formatDateToIndonesian } from '../../../common/utils/dateFormatter';
import { formatEducationLevel, getParentStatusDescription } from '../../adminShelter/utils/keluargaFormUtils';
import { formatCurrency } from '../../../utils/currencyFormatter';

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

  const formatCurrencyValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return formatCurrency(value);
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

  const InfoRow = ({ label, value }) => {
    const displayValue = value !== undefined && value !== null && value !== '' ? value : '-';
    return (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}:</Text>
        <Text style={styles.infoValue}>{displayValue}</Text>
      </View>
    );
  };

  const InfoSection = ({ title, rows = [], children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {rows.map(({ label, value }, index) => (
          <InfoRow key={`${label}-${index}`} label={label} value={value} />
        ))}
        {children}
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

  if (loading) return <LoadingSpinner fullScreen message="Memuat detail survei..." />;
  if (error) return <View style={styles.container}><ErrorMessage message={error} onRetry={fetchSurveyDetail} /></View>;

  const { keluarga } = survey;

  const sections = [];

  sections.push({
    title: 'Informasi Keluarga',
    rows: [
      { label: 'Nomor KK', value: keluarga?.no_kk },
      { label: 'Kepala Keluarga', value: keluarga?.kepala_keluarga },
      { label: 'Status', value: getParentStatusDescription(keluarga?.status_ortu) },
      { label: 'Bank', value: keluarga?.bank?.nama_bank },
      {
        label: 'Rekening',
        value: keluarga?.no_rek
          ? `${keluarga.no_rek}${keluarga?.an_rek ? ` (${keluarga.an_rek})` : ''}`
          : '-'
      },
      {
        label: 'Kontak',
        value: keluarga?.no_tlp
          ? `${keluarga.no_tlp}${keluarga?.an_tlp ? ` (${keluarga.an_tlp})` : ''}`
          : '-'
      },
      { label: 'Shelter', value: keluarga?.shelter?.nama_shelter },
      { label: 'Wilbin', value: keluarga?.shelter?.wilbin?.nama_wilbin },
      { label: 'Kacab', value: keluarga?.kacab?.nama_kacab }
    ]
  });

  if (keluarga?.ayah) {
    sections.push({
      title: 'Informasi Ayah',
      rows: [
        { label: 'Nama', value: keluarga.ayah.nama_ayah },
        { label: 'NIK', value: keluarga.ayah.nik_ayah },
        { label: 'Agama', value: keluarga.ayah.agama },
        {
          label: 'Tempat & Tanggal Lahir',
          value: keluarga.ayah.tempat_lahir
            ? `${keluarga.ayah.tempat_lahir}, ${formatDateToIndonesian(keluarga.ayah.tanggal_lahir)}`
            : '-'
        },
        { label: 'Alamat', value: keluarga.ayah.alamat },
        { label: 'Penghasilan', value: keluarga.ayah.penghasilan },
        ...(keluarga.ayah.tanggal_kematian
          ? [
              { label: 'Meninggal', value: formatDateToIndonesian(keluarga.ayah.tanggal_kematian) },
              { label: 'Penyebab', value: keluarga.ayah.penyebab_kematian }
            ]
          : [])
      ]
    });
  }

  if (keluarga?.ibu) {
    sections.push({
      title: 'Informasi Ibu',
      rows: [
        { label: 'Nama', value: keluarga.ibu.nama_ibu },
        { label: 'NIK', value: keluarga.ibu.nik_ibu },
        { label: 'Agama', value: keluarga.ibu.agama },
        {
          label: 'Tempat & Tanggal Lahir',
          value: keluarga.ibu.tempat_lahir
            ? `${keluarga.ibu.tempat_lahir}, ${formatDateToIndonesian(keluarga.ibu.tanggal_lahir)}`
            : '-'
        },
        { label: 'Alamat', value: keluarga.ibu.alamat },
        { label: 'Penghasilan', value: keluarga.ibu.penghasilan },
        ...(keluarga.ibu.tanggal_kematian
          ? [
              { label: 'Meninggal', value: formatDateToIndonesian(keluarga.ibu.tanggal_kematian) },
              { label: 'Penyebab', value: keluarga.ibu.penyebab_kematian }
            ]
          : [])
      ]
    });
  }

  if (keluarga?.wali && (keluarga.wali.nama_wali || keluarga.wali.nik_wali)) {
    sections.push({
      title: 'Informasi Wali',
      rows: [
        { label: 'Nama', value: keluarga.wali.nama_wali },
        { label: 'NIK', value: keluarga.wali.nik_wali },
        { label: 'Hubungan', value: keluarga.wali.hub_kerabat },
        { label: 'Agama', value: keluarga.wali.agama },
        {
          label: 'Tempat & Tanggal Lahir',
          value: keluarga.wali.tempat_lahir
            ? `${keluarga.wali.tempat_lahir}, ${formatDateToIndonesian(keluarga.wali.tanggal_lahir)}`
            : '-'
        },
        { label: 'Alamat', value: keluarga.wali.alamat },
        { label: 'Penghasilan', value: keluarga.wali.penghasilan }
      ]
    });
  }

  keluarga?.anak?.forEach((child, index) => {
    sections.push({
      title: `Informasi Anak ${child.full_name ? `- ${child.full_name}` : `#${index + 1}`}`,
      rows: [
        { label: 'Nama Lengkap', value: child.full_name },
        { label: 'Nama Panggilan', value: child.nick_name },
        { label: 'NIK', value: child.nik_anak },
        { label: 'Jenis Kelamin', value: child.jenis_kelamin },
        { label: 'Agama', value: child.agama },
        {
          label: 'Tempat & Tanggal Lahir',
          value: child.tempat_lahir
            ? `${child.tempat_lahir}, ${formatDateToIndonesian(child.tanggal_lahir)}`
            : '-'
        },
        {
          label: 'Urutan Anak',
          value: child.anak_ke
            ? `${child.anak_ke}${child.dari_bersaudara ? ` dari ${child.dari_bersaudara}` : ''}`
            : '-'
        },
        { label: 'Status CPB', value: child.status_cpb },
        { label: 'Tinggal Bersama', value: child.tinggal_bersama },
        { label: 'Hafalan', value: child.hafalan },
        { label: 'Hobi', value: child.hobi },
        { label: 'Mata Pelajaran Favorit', value: child.pelajaran_favorit },
        { label: 'Prestasi', value: child.prestasi },
        {
          label: 'Jarak Rumah',
          value: child.jarak_rumah ? `${child.jarak_rumah} km` : '-'
        },
        { label: 'Transportasi', value: child.transportasi }
      ]
    });

    if (child.anakPendidikan) {
      sections.push({
        title: `Pendidikan Anak ${child.full_name ? `- ${child.full_name}` : `#${index + 1}`}`,
        rows: [
          { label: 'Jenjang', value: formatEducationLevel(child.anakPendidikan.jenjang) },
          { label: 'Kelas', value: child.anakPendidikan.kelas },
          { label: 'Jurusan', value: child.anakPendidikan.jurusan },
          { label: 'Semester', value: child.anakPendidikan.semester },
          { label: 'Sekolah', value: child.anakPendidikan.nama_sekolah },
          { label: 'Alamat Sekolah', value: child.anakPendidikan.alamat_sekolah },
          { label: 'Perguruan Tinggi', value: child.anakPendidikan.nama_pt },
          { label: 'Alamat Perguruan Tinggi', value: child.anakPendidikan.alamat_pt }
        ]
      });
    }
  });

  sections.push({
    title: 'Survei - Informasi Dasar',
    rows: [
      { label: 'Pekerjaan Kepala Keluarga', value: survey.pekerjaan_kepala_keluarga },
      { label: 'Pendidikan Kepala Keluarga', value: survey.pendidikan_kepala_keluarga },
      { label: 'Jumlah Tanggungan', value: survey.jumlah_tanggungan },
      { label: 'Status Anak', value: survey.status_anak },
      { label: 'Kepribadian Anak', value: survey.kepribadian_anak },
      { label: 'Kondisi Fisik Anak', value: survey.kondisi_fisik_anak },
      ...(survey.kondisi_fisik_anak === 'Disabilitas'
        ? [{ label: 'Keterangan Disabilitas', value: survey.keterangan_disabilitas }]
        : [])
    ]
  });

  sections.push({
    title: 'Survei - Informasi Keuangan',
    rows: [
      { label: 'Kepemilikan Tabungan', value: survey.kepemilikan_tabungan },
      {
        label: 'Biaya Pendidikan Per Bulan',
        value: formatCurrencyValue(survey.biaya_pendidikan_perbulan)
      },
      { label: 'Bantuan Lembaga Lain', value: survey.bantuan_lembaga_formal_lain },
      ...(survey.bantuan_lembaga_formal_lain === 'Ya'
        ? [
            {
              label: 'Jumlah Bantuan',
              value: formatCurrencyValue(survey.bantuan_lembaga_formal_lain_sebesar)
            }
          ]
        : [])
    ]
  });

  sections.push({
    title: 'Survei - Informasi Aset',
    rows: [
      { label: 'Kepemilikan Tanah', value: survey.kepemilikan_tanah },
      { label: 'Kepemilikan Rumah', value: survey.kepemilikan_rumah },
      { label: 'Kondisi Dinding', value: survey.kondisi_rumah_dinding },
      { label: 'Kondisi Lantai', value: survey.kondisi_rumah_lantai },
      { label: 'Kepemilikan Kendaraan', value: survey.kepemilikan_kendaraan },
      { label: 'Kepemilikan Elektronik', value: survey.kepemilikan_elektronik }
    ]
  });

  sections.push({
    title: 'Survei - Informasi Kesehatan',
    rows: [
      { label: 'Jumlah Makan per Hari', value: survey.jumlah_makan },
      { label: 'Sumber Air Bersih', value: survey.sumber_air_bersih },
      { label: 'Jamban', value: survey.jamban_limbah },
      { label: 'Tempat Sampah', value: survey.tempat_sampah },
      { label: 'Perokok', value: survey.perokok },
      { label: 'Konsumen Minuman Keras', value: survey.konsumen_miras },
      { label: 'Persediaan P3K', value: survey.persediaan_p3k },
      { label: 'Konsumsi Buah & Sayur', value: survey.makan_buah_sayur }
    ]
  });

  sections.push({
    title: 'Survei - Keagamaan & Sosial',
    rows: [
      { label: 'Sholat Lima Waktu', value: survey.solat_lima_waktu },
      { label: 'Membaca Al-Quran', value: survey.membaca_alquran },
      { label: 'Majelis Taklim', value: survey.majelis_taklim },
      { label: 'Membaca Berita', value: survey.membaca_koran },
      { label: 'Pengurus Organisasi', value: survey.pengurus_organisasi },
      ...(survey.pengurus_organisasi === 'Ya'
        ? [{ label: 'Jabatan Organisasi', value: survey.pengurus_organisasi_sebagai }]
        : []),
      { label: 'Kondisi Penerima Manfaat', value: survey.kondisi_penerima_manfaat }
    ]
  });

  sections.push({
    title: 'Informasi Survei',
    rows: [
      { label: 'Tanggal Survei', value: formatDateToIndonesian(survey.tanggal_survey) },
      { label: 'Petugas Survei', value: survey.petugas_survey },
      { label: 'Hasil Survei', value: survey.hasil_survey },
      { label: 'Catatan Survei', value: survey.keterangan_hasil }
    ]
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {sections.map(({ title, rows, children }, index) => (
          <InfoSection key={index} title={title} rows={rows}>
            {children}
          </InfoSection>
        ))}
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

const InputField = ({ label, value, onChangeText, placeholder, required, multiline = true }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>
      {label}
      {required && ' *'}
    </Text>
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