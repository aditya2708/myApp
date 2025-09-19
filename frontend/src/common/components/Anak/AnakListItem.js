import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { calculateAge, getStatusLabel } from '../../../common/utils/ageCalculator';
import { formatEducationDisplay } from '../../../common/utils/educationFormatter';

const AnakListItem = ({ item, onPress, onToggleStatus, onDelete, showDeleteAction = true }) => {
  if (!item) return null;

  const getInitials = (name) => {
    if (!name) return 'NA';
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const statusColor = item.status_validasi === 'aktif' ? '#10B981' : '#EF4444';
  const statusBg = item.status_validasi === 'aktif' ? '#DCFCE7' : '#FEE2E2';
  const statusText = item.status_validasi === 'aktif' ? 'Aktif' : 'Non aktif';

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.foto_url ? (
            <Image source={{ uri: item.foto_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials(item.full_name)}</Text>
            </View>
          )}
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.name} numberOfLines={1}>
            {item.full_name || 'Nama tidak tersedia'}
          </Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={styles.detailText}>
                  {calculateAge(item.tanggal_lahir)}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="school-outline" size={14} color="#6B7280" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {formatEducationDisplay(item.anakPendidikan)}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="bookmark-outline" size={14} color="#6B7280" />
                <Text style={styles.detailText}>
                  {getStatusLabel(item.status_cpb)}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="people-outline" size={14} color="#6B7280" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {item.status_ortu || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {/* Status Badge */}
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
          
          {onDelete && (
            <TouchableOpacity
              testID="anak-delete-action"
              style={[
                styles.actionButton,
                styles.deleteButton,
                !showDeleteAction && styles.hiddenActionButton,
              ]}
              onPress={() => onDelete(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              disabled={!showDeleteAction}
              pointerEvents={showDeleteAction ? 'auto' : 'none'}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  avatarContainer: {
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E11D48',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 20,
  },
  detailsContainer: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0, // Allow text truncation
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  actionContainer: {
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  hiddenActionButton: {
    opacity: 0,
    width: 0,
    height: 0,
  },
});

export default AnakListItem;