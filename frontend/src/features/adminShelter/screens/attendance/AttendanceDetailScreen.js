import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Alert, ActivityIndicator
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

import VerificationStatusBadge from '../../components/VerificationStatusBadge';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import { formatDateToIndonesian } from '../../../../common/utils/dateFormatter';

const AttendanceDetailScreen = ({ navigation }) => {
  const route = useRoute();
  const { id_absen } = route.params || {};
  
  const attendanceRecord = useSelector(state => 
    state.attendance.attendanceRecords[id_absen] || null
  );
  
  const verificationHistory = useSelector(state =>
    state.attendance.verificationHistory[id_absen] || []
  );
  
  const [expandedSection, setExpandedSection] = useState('details');
  
  if (!attendanceRecord) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message="Catatan kehadiran tidak ditemukan"
          onRetry={() => navigation.goBack()}
          retryText="Kembali"
        />
      </View>
    );
  }
  
  const {
    absen, is_verified, verification_status, absen_user, aktivitas, latest_verification
  } = attendanceRecord;
  
  const person = absen_user?.anak || absen_user?.tutor || {};
  const personType = absen_user?.anak ? 'Siswa' : 'Tutor';
  const personName = absen_user?.anak ? 
    (person.full_name || person.name || 'Siswa Tidak Dikenal') : 
    (person.nama || 'Tutor Tidak Dikenal');
  const personId = absen_user?.anak ? person.id_anak : person.id_tutor;
  const activity = aktivitas || {};
  
  const shareAttendance = async () => {
    try {
      await Share.share({
        message: `Catatan kehadiran untuk ${personName}\n` +
                 `Tipe: ${personType}\n` +
                 `Status: ${absen === 'Ya' ? 'Hadir' : 'Tidak Hadir'}\n` +
                 `Aktivitas: ${activity.jenis_kegiatan || 'Aktivitas'}\n` +
                 `Tanggal: ${formatDateToIndonesian(activity.tanggal) || 'T/A'}\n` +
                 `Verifikasi: ${is_verified ? 'Terverifikasi' : 'Belum Terverifikasi'}`
      });
    } catch (error) {
      Alert.alert('Error', 'Gagal membagikan catatan kehadiran');
    }
  };
  
  const getVerificationMethodText = (method) => ({
    'qr_code': 'Kode QR',
    'manual': 'Verifikasi Manual',
    'face_recognition': 'Pengenalan Wajah',
    'dual': 'Verifikasi Ganda'
  }[method] || method || 'Tidak Diketahui');

  const getMethodIcon = (method) => ({
    'qr_code': 'qr-code',
    'manual': 'create',
    'face_recognition': 'person',
    'dual': 'shield-checkmark'
  }[method] || 'shield-checkmark');

  const DetailItem = ({ label, value, color }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={[styles.detailValue, color && { color, fontWeight: 'bold' }]}>
        {value}
      </Text>
    </View>
  );

  const SectionHeader = ({ title, section, onPress }) => (
    <TouchableOpacity
      style={[styles.sectionHeader, expandedSection === section && styles.activeSectionHeader]}
      onPress={onPress}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <Ionicons
        name={expandedSection === section ? 'chevron-up' : 'chevron-down'}
        size={24}
        color="#333"
      />
    </TouchableOpacity>
  );

  const VerificationItem = ({ verification, index }) => (
    <View key={index} style={styles.verificationItem}>
      <View style={styles.verificationHeader}>
        <View style={styles.verificationMethod}>
          <Ionicons 
            name={getMethodIcon(verification.verification_method)} 
            size={18} 
            color="#fff" 
          />
          <Text style={styles.verificationMethodText}>
            {getVerificationMethodText(verification.verification_method)}
          </Text>
        </View>
        
        <Text style={styles.verificationDate}>
          {formatDateToIndonesian(verification.verified_at)}
        </Text>
      </View>
      
      <View style={styles.verificationBody}>
        <Text style={styles.verificationStatus}>
          Status: <Text style={{ 
            color: verification.is_verified ? '#2ecc71' : '#e74c3c',
            fontWeight: 'bold'
          }}>
            {verification.is_verified ? 'Terverifikasi' : 'Ditolak'}
          </Text>
        </Text>
        
        <Text style={styles.verificationNotes}>
          Catatan: {verification.verification_notes || 'Tidak ada catatan'}
        </Text>
        
        <Text style={styles.verificationPerson}>
          Diverifikasi oleh: {verification.verified_by || 'Sistem'}
        </Text>
      </View>
    </View>
  );

  const ActionButton = ({ onPress, icon, text, style }) => (
    <TouchableOpacity style={[styles.actionButton, style]} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#fff" />
      <Text style={styles.actionButtonText}>{text}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.personInfo}>
          <Text style={styles.personName}>{personName}</Text>
          <Text style={styles.personType}>{personType}</Text>
          <Text style={styles.activityName}>{activity.jenis_kegiatan || 'Aktivitas'}</Text>
          <Text style={styles.activityDate}>
            {formatDateToIndonesian(activity.tanggal) || 'Tanggal tidak tersedia'}
          </Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.attendanceStatus,
            { backgroundColor: absen === 'Ya' ? '#2ecc71' : '#e74c3c' }
          ]}>
            <Text style={styles.attendanceStatusText}>
              {absen === 'Ya' ? 'Hadir' : 'Tidak Hadir'}
            </Text>
          </View>
          
          <View style={styles.verificationStatus}>
            <VerificationStatusBadge
              isVerified={is_verified}
              status={verification_status}
              method={latest_verification?.verification_method}
              showMethod={true}
            />
          </View>
        </View>
      </View>
      
      <SectionHeader
        title="Detail Kehadiran"
        section="details"
        onPress={() => setExpandedSection(expandedSection === 'details' ? null : 'details')}
      />
      
      {expandedSection === 'details' && (
        <View style={styles.sectionContent}>
          <DetailItem label="ID Catatan" value={id_absen} />
          <DetailItem label={`ID ${personType}`} value={personId || 'T/A'} />
          <DetailItem label="ID Aktivitas" value={activity.id_aktivitas || 'T/A'} />
          <DetailItem label="Jenis Aktivitas" value={activity.jenis_kegiatan || 'T/A'} />
          <DetailItem label="Tanggal" value={formatDateToIndonesian(activity.tanggal) || 'T/A'} />
          <DetailItem 
            label="Status" 
            value={absen === 'Ya' ? 'Hadir' : 'Tidak Hadir'}
            color={absen === 'Ya' ? '#2ecc71' : '#e74c3c'}
          />
          <DetailItem 
            label="Status Verifikasi" 
            value={is_verified ? 
              (verification_status === 'manual' ? 'Diverifikasi Manual' : 'Terverifikasi') : 
              verification_status === 'rejected' ? 'Ditolak' : 'Menunggu Verifikasi'}
            color={is_verified ? '#2ecc71' : 
                  verification_status === 'rejected' ? '#e74c3c' : '#f39c12'}
          />
        </View>
      )}
      
      <SectionHeader
        title="Riwayat Verifikasi"
        section="verification"
        onPress={() => setExpandedSection(expandedSection === 'verification' ? null : 'verification')}
      />
      
      {expandedSection === 'verification' && (
        <View style={styles.sectionContent}>
          {verificationHistory.length > 0 ? (
            verificationHistory.map((verification, index) => (
              <VerificationItem key={index} verification={verification} index={index} />
            ))
          ) : (
            <Text style={styles.noDataText}>Tidak ada riwayat verifikasi tersedia</Text>
          )}
        </View>
      )}
      
      <View style={styles.actionButtons}>
        <ActionButton
          onPress={shareAttendance}
          icon="share-outline"
          text="Bagikan"
          style={styles.shareButton}
        />
        
        <ActionButton
          onPress={() => navigation.goBack()}
          icon="arrow-back"
          text="Kembali"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  headerCard: {
    backgroundColor: '#fff', padding: 16, margin: 16, borderRadius: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
  },
  personInfo: { marginBottom: 12 },
  personName: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 4 },
  personType: { fontSize: 14, color: '#7f8c8d', marginBottom: 8 },
  activityName: { fontSize: 16, color: '#34495e', marginBottom: 4 },
  activityDate: { fontSize: 14, color: '#7f8c8d' },
  statusContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8
  },
  attendanceStatus: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  attendanceStatusText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  verificationStatus: { flexDirection: 'row', alignItems: 'center' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginTop: 16,
    borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 1
  },
  activeSectionHeader: {
    backgroundColor: '#ecf0f1', borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0, marginBottom: 0
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  sectionContent: {
    backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginBottom: 16,
    borderBottomLeftRadius: 10, borderBottomRightRadius: 10, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1
  },
  detailRow: { flexDirection: 'row', marginBottom: 10 },
  detailLabel: { width: 140, fontSize: 14, color: '#7f8c8d', fontWeight: '500' },
  detailValue: { flex: 1, fontSize: 14, color: '#2c3e50' },
  verificationItem: {
    marginBottom: 12, borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8, overflow: 'hidden'
  },
  verificationHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 10, backgroundColor: '#3498db'
  },
  verificationMethod: { flexDirection: 'row', alignItems: 'center' },
  verificationMethodText: { color: '#fff', marginLeft: 6, fontWeight: '500' },
  verificationDate: { color: '#fff', fontSize: 12 },
  verificationBody: { padding: 12, backgroundColor: '#f9f9f9' },
  verificationStatus: { fontSize: 14, marginBottom: 4 },
  verificationNotes: { fontSize: 14, marginBottom: 4 },
  verificationPerson: { fontSize: 14, color: '#7f8c8d' },
  noDataText: { textAlign: 'center', padding: 20, color: '#7f8c8d' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, marginBottom: 20 },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#3498db', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 8, flex: 1, marginHorizontal: 4
  },
  shareButton: { backgroundColor: '#9b59b6' },
  actionButtonText: { color: '#fff', fontWeight: '500', marginLeft: 8 }
});

export default AttendanceDetailScreen;