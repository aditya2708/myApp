import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HonorSettingsCard = ({ 
  settings, 
  onPress, 
  loading = false,
  style 
}) => {
  const getPaymentSystemName = (paymentSystem) => {
    const systems = {
      'flat_monthly': 'Honor Bulanan Tetap',
      'per_session': 'Per Sesi/Pertemuan',
      'per_student_category': 'Per Kategori Siswa',
      'per_hour': 'Per Jam',
      'base_per_session': 'Dasar + Per Sesi',
      'base_per_student': 'Dasar + Per Siswa',
      'base_per_hour': 'Dasar + Per Jam',
      'session_per_student': 'Per Sesi + Per Siswa'
    };
    return systems[paymentSystem] || paymentSystem;
  };

  const renderRatesPreview = () => {
    if (!settings) return null;

    const { payment_system } = settings;

    switch (payment_system) {
      case 'flat_monthly':
        return (
          <View style={styles.ratesPreview}>
            <Text style={styles.rateText}>
              Rp {settings.flat_monthly_rate?.toLocaleString('id-ID')}/bulan
            </Text>
          </View>
        );

      case 'per_session':
        return (
          <View style={styles.ratesPreview}>
            <Text style={styles.rateText}>
              Rp {settings.session_rate?.toLocaleString('id-ID')}/sesi
            </Text>
          </View>
        );

      case 'per_student_category':
        return (
          <View style={styles.ratesPreview}>
            <Text style={styles.rateText}>
              CPB: Rp {settings.cpb_rate?.toLocaleString('id-ID')}
            </Text>
            <Text style={styles.rateText}>
              PB: Rp {settings.pb_rate?.toLocaleString('id-ID')}
            </Text>
            <Text style={styles.rateText}>
              NPB: Rp {settings.npb_rate?.toLocaleString('id-ID')}
            </Text>
          </View>
        );

      case 'per_hour':
        return (
          <View style={styles.ratesPreview}>
            <Text style={styles.rateText}>
              Rp {settings.hourly_rate?.toLocaleString('id-ID')}/jam
            </Text>
          </View>
        );

      case 'base_per_session':
        return (
          <View style={styles.ratesPreview}>
            <Text style={styles.rateText}>
              Dasar: Rp {settings.base_rate?.toLocaleString('id-ID')}
            </Text>
            <Text style={styles.rateText}>
              Sesi: Rp {settings.session_rate?.toLocaleString('id-ID')}
            </Text>
          </View>
        );

      case 'base_per_student':
        return (
          <View style={styles.ratesPreview}>
            <Text style={styles.rateText}>
              Dasar: Rp {settings.base_rate?.toLocaleString('id-ID')}
            </Text>
            <Text style={styles.rateText}>
              Per Siswa: Rp {settings.per_student_rate?.toLocaleString('id-ID')}
            </Text>
          </View>
        );

      case 'base_per_hour':
        return (
          <View style={styles.ratesPreview}>
            <Text style={styles.rateText}>
              Dasar: Rp {settings.base_rate?.toLocaleString('id-ID')}
            </Text>
            <Text style={styles.rateText}>
              Per Jam: Rp {settings.hourly_rate?.toLocaleString('id-ID')}
            </Text>
          </View>
        );

      case 'session_per_student':
        return (
          <View style={styles.ratesPreview}>
            <Text style={styles.rateText}>
              Sesi: Rp {settings.session_rate?.toLocaleString('id-ID')}
            </Text>
            <Text style={styles.rateText}>
              Per Siswa: Rp {settings.per_student_rate?.toLocaleString('id-ID')}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.settingsCard, styles.loadingCard, style]}>
        <View style={styles.settingsHeader}>
          <Ionicons name="hourglass" size={20} color="#666" />
          <Text style={styles.settingsTitle}>Memuat Setting Honor...</Text>
        </View>
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={[styles.settingsCard, styles.warningCard, style]}>
        <View style={styles.settingsHeader}>
          <Ionicons name="warning" size={20} color="#f39c12" />
          <Text style={[styles.settingsTitle, styles.warningTitle]}>
            Setting Honor Belum Dikonfigurasi
          </Text>
        </View>
        <Text style={[styles.settingsSubtitle, styles.warningSubtitle]}>
          Hubungi admin pusat untuk mengatur setting honor tutor
        </Text>
        <View style={styles.warningFooter}>
          <Ionicons name="information-circle" size={16} color="#f39c12" />
          <Text style={styles.warningFooterText}>
            Honor tidak dapat dihitung tanpa setting aktif
          </Text>
        </View>
      </View>
    );
  }

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent 
      style={[styles.settingsCard, styles.activeCard, style]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsHeader}>
        <Ionicons name="settings" size={20} color="#2ecc71" />
        <Text style={[styles.settingsTitle, styles.activeTitle]}>
          Setting Honor Aktif
        </Text>
        {onPress && (
          <Ionicons name="chevron-forward" size={16} color="#666" />
        )}
      </View>
      
      <Text style={[styles.settingsSubtitle, styles.activeSubtitle]}>
        {getPaymentSystemName(settings.payment_system)}
      </Text>

      {renderRatesPreview()}

      <View style={styles.settingsFooter}>
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>AKTIF</Text>
        </View>
        <Text style={styles.settingsDate}>
          Setting #{settings.id_setting}
        </Text>
      </View>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4
  },
  loadingCard: {
    borderLeftColor: '#95a5a6'
  },
  warningCard: {
    borderLeftColor: '#f39c12',
    backgroundColor: '#fffbf0'
  },
  activeCard: {
    borderLeftColor: '#2ecc71'
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1
  },
  warningTitle: {
    color: '#d68910'
  },
  activeTitle: {
    color: '#2ecc71'
  },
  settingsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 28,
    marginBottom: 8
  },
  warningSubtitle: {
    color: '#d68910'
  },
  activeSubtitle: {
    color: '#3498db',
    fontWeight: '500'
  },
  ratesPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 28,
    marginBottom: 12,
    gap: 12
  },
  rateText: {
    fontSize: 12,
    color: '#2ecc71',
    fontWeight: '500',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  warningFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 28
  },
  warningFooterText: {
    fontSize: 12,
    color: '#d68910',
    marginLeft: 6,
    fontStyle: 'italic'
  },
  settingsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 28,
    marginTop: 4
  },
  activeBadge: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  settingsDate: {
    fontSize: 12,
    color: '#666'
  }
});

export default HonorSettingsCard;