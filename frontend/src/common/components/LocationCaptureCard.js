import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import {
  formatCoordinates,
  getAccuracyDescription,
} from '../utils/gpsUtils';

const formatCapturedTime = (timestamp) => {
  if (!timestamp) {
    return null;
  }
  try {
    return format(new Date(timestamp), 'HH:mm:ss');
  } catch (error) {
    return null;
  }
};

const LocationCaptureCard = ({
  title = 'Lokasi Saat Ini',
  description = 'Koordinat akan dikirim bersama data.',
  location,
  isStale,
  capturing,
  error,
  lastCapturedAt,
  onCapturePress,
  actionLabel,
}) => {
  const hasLocation = Boolean(location?.latitude && location?.longitude);
  const recordedAt =
    lastCapturedAt ||
    (location?.gps_recorded_at ? Date.parse(location.gps_recorded_at) : null);
  const statusColor = hasLocation
    ? isStale
      ? '#f39c12'
      : '#27ae60'
    : '#95a5a6';

  const buttonLabel =
    actionLabel ||
    (capturing ? 'Mengambil...' : hasLocation ? 'Ambil Ulang' : 'Ambil Lokasi');

  const coordinateText = hasLocation
    ? formatCoordinates(location.latitude, location.longitude)
    : 'Belum ada data lokasi';

  const accuracyText = hasLocation
    ? getAccuracyDescription(location.gps_accuracy)
    : 'Akurasi belum tersedia';

  const capturedTime = formatCapturedTime(recordedAt);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleWrapper}>
          <Ionicons name="location" size={20} color={statusColor} />
          <View style={styles.titleContent}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.button,
            capturing && { opacity: 0.7 },
          ]}
          onPress={onCapturePress}
          disabled={capturing}
        >
          {capturing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>
            {hasLocation ? (isStale ? 'Butuh Pembaruan' : 'Siap Dipakai') : 'Belum Ada Data'}
          </Text>
        </View>
        {capturedTime && (
          <Text style={styles.timestamp}>Diambil {capturedTime}</Text>
        )}
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Koordinat</Text>
        <Text style={styles.infoValue}>{coordinateText}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Akurasi</Text>
        <Text style={styles.infoValue}>{accuracyText}</Text>
      </View>

      {location?.distance_from_activity !== undefined && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Jarak</Text>
          <Text style={styles.infoValue}>
            {`${Math.round(location.distance_from_activity)} m`}
          </Text>
        </View>
      )}

      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  titleContent: {
    marginLeft: 10,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  description: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  infoValue: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 10,
    color: '#e74c3c',
    fontSize: 12,
  },
});

export default LocationCaptureCard;
