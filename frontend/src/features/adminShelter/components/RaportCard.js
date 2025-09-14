import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import utils
import { formatDateToIndonesian } from '../../../common/utils/dateFormatter';

const RaportCard = ({ 
  raport, 
  anakData = null, 
  onPress, 
  onPublish, 
  onArchive, 
  onDelete,
  showActions = true,
  showChildInfo = false 
}) => {
  // Safely get child data - prioritize raport.anak, fallback to anakData
  const childData = raport?.anak || anakData;
  
  // Get status-based styling
  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return '#2ecc71';
      case 'draft':
        return '#f39c12';
      case 'archived':
        return '#95a5a6';
      default:
        return '#3498db';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'published':
        return 'Published';
      case 'draft':
        return 'Draft';
      case 'archived':
        return 'Archived';
      default:
        return 'Active';
    }
  };

  const handleActionPress = (action, event) => {
    event.stopPropagation();
    switch (action) {
      case 'publish':
        onPublish && onPublish(raport);
        break;
      case 'archive':
        onArchive && onArchive(raport);
        break;
      case 'delete':
        onDelete && onDelete(raport);
        break;
    }
  };

  const renderActionButtons = () => {
    if (!showActions) return null;

    return (
      <View style={styles.actionButtonsContainer}>
        {raport?.status === 'draft' && onPublish && (
          <TouchableOpacity
            style={[styles.actionButton, styles.publishButton]}
            onPress={(e) => handleActionPress('publish', e)}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#ffffff" />
          </TouchableOpacity>
        )}
        
        {raport?.status === 'published' && onArchive && (
          <TouchableOpacity
            style={[styles.actionButton, styles.archiveButton]}
            onPress={(e) => handleActionPress('archive', e)}
          >
            <Ionicons name="archive-outline" size={16} color="#ffffff" />
          </TouchableOpacity>
        )}
        
        {onDelete && raport?.status !== 'published' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={(e) => handleActionPress('delete', e)}
          >
            <Ionicons name="trash-outline" size={16} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderChildInfo = () => {
    if (!showChildInfo || !childData) return null;

    return (
      <View style={styles.childInfoContainer}>
        <View style={styles.childImageContainer}>
          {childData.foto_url ? (
            <Image
              source={{ uri: childData.foto_url }}
              style={styles.childImage}
              defaultSource={require('../../../assets/images/logo.png')}
            />
          ) : (
            <View style={styles.childImagePlaceholder}>
              <Ionicons name="person" size={20} color="#ffffff" />
            </View>
          )}
        </View>
        <View style={styles.childTextInfo}>
          <Text style={styles.childName} numberOfLines={1}>
            {childData.full_name || childData.nick_name || 'Nama Tidak Tersedia'}
          </Text>
          {childData.nick_name && childData.full_name !== childData.nick_name && (
            <Text style={styles.childNickname} numberOfLines={1}>
              {childData.nick_name}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(raport)}
      activeOpacity={0.7}
    >
      {/* Child Info Section */}
      {renderChildInfo()}
      
      {/* Raport Header */}
      <View style={styles.raportHeader}>
        <View style={styles.raportTitleContainer}>
          <Text style={styles.raportTitle}>
            {raport?.semester?.nama_semester || raport?.semester || 'Semester Tidak Tersedia'}
          </Text>
          <Text style={styles.raportSubtitle}>
            {raport?.tingkat || 'Tingkat'} - Kelas {raport?.kelas || '-'}
          </Text>
        </View>
        
        {/* Status Badge */}
        {raport?.status && (
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(raport.status) }
          ]}>
            <Text style={styles.statusText}>
              {getStatusText(raport.status)}
            </Text>
          </View>
        )}
      </View>

      {/* Scores Section */}
      <View style={styles.scoresContainer}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>Min:</Text>
          <Text style={styles.scoreValue}>
            {raport?.nilai_min || raport?.nilai_minimum || '-'}
          </Text>
        </View>
        
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>Rata-rata:</Text>
          <Text style={[styles.scoreValue, styles.averageScore]}>
            {raport?.nilai_rata_rata || raport?.nilai_average || '-'}
          </Text>
        </View>
        
        <View style={styles.scoreItem}>
          <Text style={styles.scoreLabel}>Max:</Text>
          <Text style={styles.scoreValue}>
            {raport?.nilai_max || raport?.nilai_maximum || '-'}
          </Text>
        </View>
      </View>

      {/* Footer Section */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={14} color="#666666" />
            <Text style={styles.dateText}>
              {raport?.tanggal ? formatDateToIndonesian(raport.tanggal) : 'Tanggal tidak tersedia'}
            </Text>
          </View>
          
          {/* Photo indicator */}
          {raport?.foto_raport && raport.foto_raport.length > 0 && (
            <View style={styles.photoIndicator}>
              <Ionicons name="image" size={14} color="#666666" />
              <Text style={styles.photoCount}>
                {raport.foto_raport.length} foto
              </Text>
            </View>
          )}
          
          {/* Alternative photo indicator for foto_rapor */}
          {raport?.foto_rapor && raport.foto_rapor.length > 0 && (
            <View style={styles.photoIndicator}>
              <Ionicons name="image" size={14} color="#666666" />
              <Text style={styles.photoCount}>
                {raport.foto_rapor.length} foto
              </Text>
            </View>
          )}
        </View>
        
        {/* Action Buttons */}
        {renderActionButtons()}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  childInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  childImageContainer: {
    marginRight: 12,
  },
  childImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  childImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childTextInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  childNickname: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  raportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  raportTitleContainer: {
    flex: 1,
  },
  raportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  raportSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  scoresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  averageScore: {
    color: '#e74c3c',
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoCount: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  publishButton: {
    backgroundColor: '#2ecc71',
  },
  archiveButton: {
    backgroundColor: '#95a5a6',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
});

export default RaportCard;