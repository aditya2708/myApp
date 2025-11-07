import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  MANUAL_ATTENDANCE_ACTIVITY_SET,
  MANUAL_ATTENDANCE_ACTIVITY_LOWER_SET,
} from '../constants/activityTypes';

const { width } = Dimensions.get('window');

const ActivityCard = ({ activity, onPress, onEdit, onDelete }) => {
  const jenisKegiatan = activity?.jenis_kegiatan || '';
  const isManualEligibleActivity =
    jenisKegiatan &&
    (
      MANUAL_ATTENDANCE_ACTIVITY_SET.has(jenisKegiatan) ||
      MANUAL_ATTENDANCE_ACTIVITY_LOWER_SET.has(jenisKegiatan.toLowerCase())
    );

  // Determine icon based on activity type
  const getActivityIcon = () => {
    if (isManualEligibleActivity) {
      return 'book';
    }
    return 'people';
  };

  // Get badge color based on activity type
  const getBadgeColor = () => {
    if (isManualEligibleActivity) {
      return '#3498db';
    }
    return '#9b59b6';
  };

  const materiString = activity.materi || '';
  const [parsedSubject, ...parsedMateriParts] = materiString.split(' - ').map(part => part?.trim());
  const parsedMateri = parsedMateriParts.filter(Boolean).join(' - ');

  const subjectLabel = activity.pakai_materi_manual
    ? activity.mata_pelajaran_manual
    : activity.materi_data?.mata_pelajaran?.nama_mata_pelajaran
      || activity.materi_data?.mata_pelajaran
      || parsedSubject;

  const materiLabel = activity.pakai_materi_manual
    ? activity.materi_manual
    : activity.materi_data?.nama_materi
      || (parsedMateri || materiString || 'Materi belum dipilih');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        {/* Left side: image or icon placeholder */}
        <View style={styles.imageContainer}>
          {activity.foto_1_url ? (
            <Image
              source={{ uri: activity.foto_1_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name={getActivityIcon()} size={30} color="#bdc3c7" />
            </View>
          )}
        </View>
        
        {/* Right side: activity details */}
        <View style={styles.details}>
          {/* Activity Type Badge */}
          <View style={styles.badgeContainer}>
            <View style={[styles.typeBadge, { backgroundColor: getBadgeColor() }]}>
              <Text style={styles.typeBadgeText}>
                {activity.jenis_kegiatan || 'Activity'}
              </Text>
            </View>
          </View>
          
          {/* Materi - Main Title */}
          {subjectLabel ? (
            <Text style={styles.subject} numberOfLines={1}>
              {subjectLabel}
            </Text>
          ) : null}
          <Text style={styles.materi} numberOfLines={2}>
            {materiLabel || 'Materi belum dipilih'}
          </Text>
          
          <Text style={styles.date}>
            {activity.tanggal 
              ? format(new Date(activity.tanggal), 'EEEE, dd MMMM yyyy', { locale: id })
              : 'No date'
            }
          </Text>
          
          {isManualEligibleActivity && (
            <View style={styles.bimbelInfo}>
              {activity.nama_kelompok && (
                <Text style={styles.group} numberOfLines={1}>
                  <Ionicons name="people-outline" size={12} color="#7f8c8d" /> {activity.nama_kelompok}
                </Text>
              )}
              
              {activity.level && (
                <Text style={styles.level} numberOfLines={1}>
                  <Ionicons name="school-outline" size={12} color="#7f8c8d" /> {activity.level}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
      
      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onEdit(activity)}
        >
          <Ionicons name="create-outline" size={22} color="#3498db" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onDelete(activity.id_aktivitas)}
        >
          <Ionicons name="trash-outline" size={22} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imageContainer: {
    width: width * 0.15,
    height: width * 0.15,
    maxWidth: 60,
    maxHeight: 60,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  materi: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
    lineHeight: 20,
  },
  subject: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495e',
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  bimbelInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  group: {
    fontSize: 12,
    color: '#34495e',
    flexDirection: 'row',
    alignItems: 'center',
  },
  level: {
    fontSize: 12,
    color: '#34495e',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    padding: 4,
  },
  actionButton: {
    padding: 6,
    marginLeft: 5,
  }
});

export default ActivityCard;
