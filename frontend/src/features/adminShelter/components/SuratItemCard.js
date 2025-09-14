import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SuratItemCard = ({ 
  surat, 
  onPress,
  onDelete,
  style 
}) => {
  const { 
    id_surat, 
    pesan, 
    foto, 
    tanggal, 
    is_read, 
    anak 
  } = surat;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const truncateMessage = (message, maxLength = 100) => {
    if (!message) return '';
    return message.length > maxLength 
      ? message.substring(0, maxLength) + '...' 
      : message;
  };

  return (
    <TouchableOpacity
      style={[styles.card, !is_read && styles.unreadCard, style]}
      onPress={() => onPress(surat)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.childInfo}>
          <Image
            source={{ uri: anak.foto_url || 'https://via.placeholder.com/40' }}
            style={styles.childPhoto}
          />
          <View style={styles.childDetails}>
            <Text style={styles.childName} numberOfLines={1}>
              {anak.full_name}
            </Text>
            {anak.nick_name && (
              <Text style={styles.childNickname} numberOfLines={1}>
                ({anak.nick_name})
              </Text>
            )}
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View style={[
            styles.statusIndicator, 
            is_read ? styles.readIndicator : styles.unreadIndicator
          ]}>
            <Ionicons 
              name={is_read ? "checkmark-circle" : "mail-unread"} 
              size={16} 
              color={is_read ? "#4caf50" : "#f44336"} 
            />
          </View>
          <Text style={styles.dateText}>{formatDate(tanggal)}</Text>
        </View>
      </View>

      <View style={styles.messageContainer}>
        <Text style={styles.messageText} numberOfLines={3}>
          {truncateMessage(pesan)}
        </Text>
      </View>

      {foto && (
        <View style={styles.attachmentContainer}>
          <Ionicons name="image" size={16} color="#9b59b6" />
          <Text style={styles.attachmentText}>Ada lampiran foto</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={[
          styles.statusText,
          is_read ? styles.readText : styles.unreadText
        ]}>
          {is_read ? 'Sudah dibaca' : 'Belum dibaca'}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onPress(surat)}
          >
            <Ionicons name="eye" size={16} color="#2196f3" />
          </TouchableOpacity>
          
          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onDelete(surat)}
            >
              <Ionicons name="trash" size={16} color="#f44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  childPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f0f0f0'
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
    fontSize: 12,
    color: '#666'
  },
  statusContainer: {
    alignItems: 'flex-end'
  },
  statusIndicator: {
    marginBottom: 4
  },
  readIndicator: {
    opacity: 1
  },
  unreadIndicator: {
    opacity: 1
  },
  dateText: {
    fontSize: 12,
    color: '#666'
  },
  messageContainer: {
    marginBottom: 12
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f4ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12
  },
  attachmentText: {
    fontSize: 12,
    color: '#9b59b6',
    marginLeft: 4
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500'
  },
  readText: {
    color: '#4caf50'
  },
  unreadText: {
    color: '#f44336'
  },
  actions: {
    flexDirection: 'row',
    gap: 8
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa'
  },
  deleteButton: {
    backgroundColor: '#ffebee'
  }
});

export default SuratItemCard;