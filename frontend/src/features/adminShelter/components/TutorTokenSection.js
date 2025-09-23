import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QrCodeDisplay from './QrCodeDisplay';

const TutorTokenSection = ({
  activityTutor,
  validDays,
  setValidDays,
  tutorLoading,
  handleGenerateTutorToken,
  tutorToken,
  tutorQrRef,
  exportLoading,
  handleExportTutorQr
}) => {
  const getExpiryInfo = () => {
    if (!tutorToken) {
      return null;
    }

    const rawDate = tutorToken?.expiry_date || tutorToken?.expires_at || tutorToken?.expired_at || tutorToken?.valid_until;
    const strategy = tutorToken?.expiry_strategy || tutorToken?.expiryStrategy;

    if (rawDate) {
      const parsedDate = new Date(rawDate);
      if (!Number.isNaN(parsedDate.getTime())) {
        try {
          return `Berlaku hingga: ${parsedDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}`;
        } catch (error) {
          return `Berlaku hingga: ${parsedDate.toDateString()}`;
        }
      }

      return `Berlaku hingga: ${rawDate}`;
    }

    if (strategy === 'semester') {
      return 'Berlaku hingga akhir semester aktif';
    }

    return null;
  };

  const expiryInfo = getExpiryInfo();

  return (
    <ScrollView style={styles.tutorContainer}>
      {activityTutor ? (
        <View style={styles.tutorCard}>
          <View style={styles.tutorHeader}>
            <View style={styles.tutorInfo}>
              <Text style={styles.tutorName}>{activityTutor.nama}</Text>
              <Text style={styles.tutorId}>ID: {activityTutor.id_tutor}</Text>
              {activityTutor.email && (
                <Text style={styles.tutorDetail}>Email: {activityTutor.email}</Text>
              )}
              {activityTutor.no_hp && (
                <Text style={styles.tutorDetail}>Phone: {activityTutor.no_hp}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.tutorTokenControls}>
            <Text style={styles.validDaysLabel}>Valid for (days):</Text>
            <TextInput
              style={styles.validDaysInput}
              value={validDays.toString()}
              onChangeText={(value) => setValidDays(parseInt(value, 10) || 30)}
              keyboardType="number-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.tutorGenerateButton, tutorLoading && styles.disabledButton]}
            onPress={handleGenerateTutorToken}
            disabled={tutorLoading}
          >
            {tutorLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="qr-code" size={20} color="#fff" />
            )}
            <Text style={styles.tutorGenerateText}>
              {tutorToken ? 'Regenerate QR Code' : 'Generate QR Code'}
            </Text>
          </TouchableOpacity>
          
          {tutorToken && (
            <View style={styles.tutorQrContainer}>
              <QrCodeDisplay
                token={tutorToken.token}
                studentName={activityTutor.nama}
                studentId={`Tutor-${activityTutor.id_tutor}`}
                size={250}
                showExportButtons={false}
                ref={tutorQrRef}
              />

              {expiryInfo && (
                <Text style={styles.expiryText}>{expiryInfo}</Text>
              )}

              <TouchableOpacity
                style={[styles.tutorExportButton, exportLoading && styles.disabledButton]}
                onPress={handleExportTutorQr}
                disabled={exportLoading}
              >
                {exportLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="share-outline" size={20} color="#fff" />
                )}
                <Text style={styles.tutorExportText}>Export QR Code</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noTutorContainer}>
          <Ionicons name="person-outline" size={48} color="#bdc3c7" />
          <Text style={styles.noTutorText}>No tutor assigned to this activity</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tutorContainer: {
    flex: 1,
    padding: 16,
  },
  tutorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tutorHeader: {
    marginBottom: 16,
  },
  tutorInfo: {
    marginBottom: 12,
  },
  tutorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  tutorId: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  tutorDetail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  tutorTokenControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  validDaysLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 8,
  },
  validDaysInput: {
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    width: 60,
    textAlign: 'center',
  },
  tutorGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  tutorGenerateText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  tutorQrContainer: {
    alignItems: 'center',
  },
  tutorExportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  tutorExportText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  expiryText: {
    marginTop: 12,
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic'
  },
  noTutorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noTutorText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 12,
  },
});

export default TutorTokenSection;