import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HistoriCard = ({ 
  histori, 
  isExpanded, 
  onToggle,
  onChildPress 
}) => {
  const getJenisHistoriIcon = (jenis) => {
    switch (jenis?.toLowerCase()) {
      case 'sakit':
        return 'medical-outline';
      case 'kecelakaan':
        return 'warning-outline';
      case 'operasi':
        return 'cut-outline';
      default:
        return 'document-text-outline';
    }
  };

  const getJenisHistoriColor = (jenis) => {
    switch (jenis?.toLowerCase()) {
      case 'sakit':
        return '#f39c12';
      case 'kecelakaan':
        return '#e74c3c';
      case 'operasi':
        return '#9b59b6';
      default:
        return '#7f8c8d';
    }
  };

  const renderExpandedContent = () => {
    if (!isExpanded) return null;

    return (
      <View style={styles.expandedContent}>
        {/* Detail Histori */}
        <View style={styles.detailSection}>
          <Text style={styles.detailTitle}>Detail Histori</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nama Histori:</Text>
            <Text style={styles.detailValue}>{histori.nama_histori}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tanggal:</Text>
            <Text style={styles.detailValue}>{histori.tanggal_formatted}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status Opname:</Text>
            <Text style={[
              styles.detailValue,
              histori.di_opname === 'Ya' ? styles.opnameYes : styles.opnameNo
            ]}>
              {histori.di_opname === 'Ya' ? 'Ya (Dirawat)' : 'Tidak'}
            </Text>
          </View>

          {histori.dirawat_id && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ID Rawat:</Text>
              <Text style={styles.detailValue}>{histori.dirawat_id}</Text>
            </View>
          )}
        </View>

        {/* Foto Histori */}
        {histori.foto_url && (
          <View style={styles.photoSection}>
            <Text style={styles.detailTitle}>Foto Histori</Text>
            <Image
              source={{ uri: histori.foto_url }}
              style={styles.historiPhoto}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Data Anak Lengkap */}
        <View style={styles.detailSection}>
          <Text style={styles.detailTitle}>Data Anak</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nama Lengkap:</Text>
            <Text style={styles.detailValue}>{histori.anak.full_name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nama Panggilan:</Text>
            <Text style={styles.detailValue}>{histori.anak.nick_name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Umur:</Text>
            <Text style={styles.detailValue}>{histori.anak.umur} tahun</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Jenis Kelamin:</Text>
            <Text style={styles.detailValue}>{histori.anak.jenis_kelamin}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Card Header */}
      <TouchableOpacity 
        style={styles.header}
        onPress={onToggle}
      >
        <View style={styles.childInfo}>
          <TouchableOpacity onPress={() => onChildPress?.(histori.anak)}>
            <Image
              source={{ uri: histori.anak.foto_url }}
              style={styles.childPhoto}
              defaultSource={require('../../../assets/images/logo.png')}
            />
          </TouchableOpacity>
          
          <View style={styles.childDetails}>
            <Text style={styles.childName}>{histori.anak.full_name}</Text>
            <Text style={styles.childNickname}>({histori.anak.nick_name})</Text>
            <View style={styles.childMetadata}>
              <Text style={styles.childAge}>{histori.anak.umur} tahun</Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.childGender}>{histori.anak.jenis_kelamin}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {histori.di_opname === 'Ya' && (
            <View style={styles.opnameBadge}>
              <Ionicons name="bed-outline" size={12} color="#fff" />
              <Text style={styles.opnameText}>Opname</Text>
            </View>
          )}
          
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#666" 
          />
        </View>
      </TouchableOpacity>

      {/* Histori Info */}
      <View style={styles.historiInfo}>
        <View style={styles.historiHeader}>
          <View style={[
            styles.jenisIcon, 
            { backgroundColor: getJenisHistoriColor(histori.jenis_histori) }
          ]}>
            <Ionicons 
              name={getJenisHistoriIcon(histori.jenis_histori)} 
              size={16} 
              color="#fff" 
            />
          </View>
          
          <View style={styles.historiDetails}>
            <Text style={styles.jenisHistori}>{histori.jenis_histori}</Text>
            <Text style={styles.namaHistori} numberOfLines={isExpanded ? 0 : 2}>
              {histori.nama_histori}
            </Text>
          </View>

          <View style={styles.historiMeta}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.tanggal}>{histori.tanggal_formatted}</Text>
            </View>

            <View style={styles.indicators}>
              {histori.foto_url && (
                <Ionicons name="camera" size={14} color="#9b59b6" />
              )}
              
              {!histori.is_read && (
                <View style={styles.unreadIndicator} />
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Expanded Content */}
      {renderExpandedContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  childPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12
  },
  childDetails: {
    flex: 1
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  childNickname: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4
  },
  childMetadata: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  childAge: {
    fontSize: 12,
    color: '#999'
  },
  separator: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 6
  },
  childGender: {
    fontSize: 12,
    color: '#999'
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8
  },
  opnameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  opnameText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4
  },
  historiInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  historiHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  jenisIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2
  },
  historiDetails: {
    flex: 1,
    marginRight: 12
  },
  jenisHistori: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2
  },
  namaHistori: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18
  },
  historiMeta: {
    alignItems: 'flex-end'
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  tanggal: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e74c3c'
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  detailSection: {
    marginBottom: 16
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right'
  },
  opnameYes: {
    color: '#e74c3c',
    fontWeight: '600'
  },
  opnameNo: {
    color: '#27ae60'
  },
  photoSection: {
    marginBottom: 16
  },
  historiPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0'
  }
});

export default HistoriCard;