import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getPaymentSystemName = (paymentSystem) => {
  const systems = {
    'flat_monthly': 'Honor Bulanan Tetap',
    'per_session': 'Per Sesi/Pertemuan',
    'per_student_category': 'Per Kategori Siswa',
    'session_per_student_category': 'Per Sesi + Per Kategori Siswa'
  };
  return systems[paymentSystem] || paymentSystem;
};

const getSystemDescription = (paymentSystem) => {
  const descriptions = {
    'flat_monthly': 'Honor tetap per bulan tanpa mempertimbangkan jumlah sesi atau siswa',
    'per_session': 'Honor dihitung berdasarkan jumlah sesi/pertemuan yang dilakukan',
    'per_student_category': 'Honor dihitung berdasarkan kategori dan jumlah siswa (CPB, PB, NPB)',
    'session_per_student_category': 'Honor dihitung berdasarkan kombinasi sesi dan kategori siswa'
  };
  return descriptions[paymentSystem] || '';
};

const PaymentSystemIndicator = ({ 
  settings, 
  onPress, 
  showDetails = false, 
  style 
}) => {
  if (!settings) {
    return (
      <View style={[styles.container, styles.noSettingsContainer, style]}>
        <View style={styles.header}>
          <Ionicons name="warning" size={20} color="#f39c12" />
          <Text style={styles.noSettingsTitle}>Setting Honor Belum Dikonfigurasi</Text>
        </View>
        <Text style={styles.noSettingsSubtitle}>
          Hubungi admin pusat untuk mengatur setting honor tutor
        </Text>
      </View>
    );
  }

  const paymentSystem = settings.payment_system;
  const isClickable = !!onPress;

  const renderRateInfo = () => {
    if (!showDetails) return null;

    switch (paymentSystem) {
      case 'flat_monthly':
        return (
          <View style={styles.rateContainer}>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>Honor Bulanan</Text>
              <Text style={styles.rateValue}>
                Rp {settings.flat_monthly_rate?.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
        );

      case 'per_session':
        return (
          <View style={styles.rateContainer}>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>Per Sesi</Text>
              <Text style={styles.rateValue}>
                Rp {settings.session_rate?.toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
        );

      case 'per_student_category':
        return (
          <View style={styles.rateContainer}>
            <View style={styles.rateGrid}>
              <View style={styles.rateItem}>
                <Text style={styles.rateLabel}>CPB</Text>
                <Text style={styles.rateValue}>
                  Rp {settings.cpb_rate?.toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.rateItem}>
                <Text style={styles.rateLabel}>PB</Text>
                <Text style={styles.rateValue}>
                  Rp {settings.pb_rate?.toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.rateItem}>
                <Text style={styles.rateLabel}>NPB</Text>
                <Text style={styles.rateValue}>
                  Rp {settings.npb_rate?.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>
          </View>
        );

      case 'session_per_student_category':
        return (
          <View style={styles.rateContainer}>
            <View style={styles.rateGrid}>
              <View style={styles.rateItem}>
                <Text style={styles.rateLabel}>Per Sesi</Text>
                <Text style={styles.rateValue}>
                  Rp {settings.session_rate?.toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.rateItem}>
                <Text style={styles.rateLabel}>CPB</Text>
                <Text style={styles.rateValue}>
                  Rp {settings.cpb_rate?.toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.rateItem}>
                <Text style={styles.rateLabel}>PB</Text>
                <Text style={styles.rateValue}>
                  Rp {settings.pb_rate?.toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.rateItem}>
                <Text style={styles.rateLabel}>NPB</Text>
                <Text style={styles.rateValue}>
                  Rp {settings.npb_rate?.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const Container = isClickable ? TouchableOpacity : View;

  return (
    <Container 
      style={[styles.container, style]}
      onPress={onPress}
      disabled={!isClickable}
    >
      <View style={styles.header}>
        <Ionicons name="settings" size={20} color="#3498db" />
        <Text style={styles.title}>Setting Honor Aktif</Text>
        {isClickable && (
          <Ionicons name="chevron-forward" size={16} color="#666" />
        )}
      </View>
      
      <Text style={styles.systemName}>
        {getPaymentSystemName(paymentSystem)}
      </Text>

      {showDetails && (
        <>
          <Text style={styles.description}>
            {getSystemDescription(paymentSystem)}
          </Text>
          
          {renderRateInfo()}

          {settings.id_setting && (
            <View style={styles.metadataContainer}>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>ID Setting:</Text>
                <Text style={styles.metadataValue}>#{settings.id_setting}</Text>
              </View>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Dibuat:</Text>
                <Text style={styles.metadataValue}>
                  {new Date(settings.created_at).toLocaleDateString('id-ID')}
                </Text>
              </View>
              <View style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>Status:</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>AKTIF</Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  noSettingsContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1
  },
  noSettingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f39c12',
    marginLeft: 8,
    flex: 1
  },
  systemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
    marginLeft: 28,
    marginBottom: 8
  },
  noSettingsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 28,
    lineHeight: 20
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginLeft: 28,
    marginBottom: 16,
    lineHeight: 20
  },
  rateContainer: {
    marginLeft: 28,
    marginBottom: 16
  },
  rateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  rateItem: {
    alignItems: 'center',
    minWidth: 80
  },
  rateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center'
  },
  rateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ecc71',
    textAlign: 'center'
  },
  metadataContainer: {
    marginLeft: 28,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16
  },
  metadataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  metadataLabel: {
    fontSize: 14,
    color: '#666'
  },
  metadataValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
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
  }
});

export { getPaymentSystemName, getSystemDescription };
export default PaymentSystemIndicator;