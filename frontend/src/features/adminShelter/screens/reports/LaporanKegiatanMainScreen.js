import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const LaporanKegiatanMainScreen = () => {
  const navigation = useNavigation();

  const handleActivityReportPress = () => {
    const parentNavigator = navigation.getParent();
    if (parentNavigator) {
      parentNavigator.navigate('Home', {
        screen: 'ActivitiesList',
        params: { mode: 'activity-report' }
      });
    } else {
      navigation.navigate('ActivitiesList', { mode: 'activity-report' });
    }
  };

  const handleTutorAttendancePress = () => {
    navigation.navigate('TutorAttendanceReport');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.heading}>Laporan & Analitik</Text>
      <Text style={styles.subheading}>
        Pilih alur laporan yang ingin Anda buat untuk aktivitas dan tutor shelter.
      </Text>

      <View style={styles.cardsContainer}>
        <TouchableOpacity style={styles.card} onPress={handleActivityReportPress} activeOpacity={0.85}>
          <View style={styles.iconWrapperPrimary}>
            <Ionicons name="document-text-outline" size={28} color="#e74c3c" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Laporan Kegiatan</Text>
            <Text style={styles.cardDescription}>
              Buka daftar aktivitas shelter dan pilih kegiatan yang ingin dilaporkan.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9aa5b1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleTutorAttendancePress} activeOpacity={0.85}>
          <View style={styles.iconWrapperSecondary}>
            <Ionicons name="people-outline" size={28} color="#3f51b5" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Laporan Kehadiran Tutor</Text>
            <Text style={styles.cardDescription}>
              Rekap dan tindak lanjuti kehadiran tutor dari aktivitas yang telah berlangsung.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9aa5b1" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc'
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 20
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2933',
    marginBottom: 8
  },
  subheading: {
    fontSize: 14,
    color: '#52606d',
    lineHeight: 20,
    marginBottom: 24
  },
  cardsContainer: {
    marginBottom: 8
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#1f2933',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  iconWrapperPrimary: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  iconWrapperSecondary: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(63, 81, 181, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  cardContent: {
    flex: 1
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2933',
    marginBottom: 6
  },
  cardDescription: {
    fontSize: 13,
    color: '#7b8794',
    lineHeight: 19
  }
});

export default LaporanKegiatanMainScreen;
