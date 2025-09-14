import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import Button from '../../../common/components/Button';
import { formatRupiah } from '../../../utils/currencyFormatter';

import {
  fetchSettings,
  fetchActiveSetting,
  setActiveSetting,
  deleteSetting,
  resetError,
  resetActionStatus,
  selectSettings,
  selectActiveSetting,
  selectLoading,
  selectError,
  selectPagination,
  selectActionStatus,
  selectPaymentSystems
} from '../redux/tutorHonorSettingsSlice';

const TutorHonorSettingsScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const settings = useSelector(selectSettings);
  const activeSetting = useSelector(selectActiveSetting);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const pagination = useSelector(selectPagination);
  const paymentSystems = useSelector(selectPaymentSystems);
  const setActiveStatus = useSelector(state => selectActionStatus(state, 'setActive'));
  const deleteStatus = useSelector(state => selectActionStatus(state, 'delete'));

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    dispatch(fetchSettings());
    dispatch(fetchActiveSetting());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreate = () => {
    navigation.navigate('TutorHonorSettingsForm', { isNew: true });
  };

  const handleEdit = (setting) => {
    navigation.navigate('TutorHonorSettingsForm', { 
      setting,
      isEdit: true 
    });
  };

  const handleSetActive = (setting) => {
    if (setting.is_active) return;

    Alert.alert(
      'Aktifkan Setting',
      `Yakin akan mengaktifkan setting ${getPaymentSystemName(setting.payment_system)}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Aktifkan',
          onPress: () => {
            dispatch(setActiveSetting(setting.id_setting))
              .unwrap()
              .then(() => {
                Alert.alert('Berhasil', 'Setting berhasil diaktifkan');
              })
              .catch((err) => {
                Alert.alert('Gagal', err || 'Gagal mengaktifkan setting');
              });
          }
        }
      ]
    );
  };

  const handleDelete = (setting) => {
    if (setting.is_active) {
      Alert.alert('Tidak Bisa Dihapus', 'Setting yang aktif tidak bisa dihapus');
      return;
    }

    Alert.alert(
      'Hapus Setting',
      'Yakin akan menghapus setting ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteSetting(setting.id_setting))
              .unwrap()
              .then(() => {
                Alert.alert('Berhasil', 'Setting berhasil dihapus');
              })
              .catch((err) => {
                Alert.alert('Gagal', err || 'Gagal menghapus setting');
              });
          }
        }
      ]
    );
  };

  const getPaymentSystemName = (paymentSystem) => {
    const system = paymentSystems.find(s => s.value === paymentSystem);
    return system ? system.label : paymentSystem;
  };

  const renderRateInfo = (setting) => {
    const { payment_system } = setting;

    switch (payment_system) {
      case 'flat_monthly':
        return (
          <View style={styles.rateItem}>
            <Text style={styles.rateLabel}>Bulanan</Text>
            <Text style={styles.rateValue}>
              {formatRupiah(setting.flat_monthly_rate)}
            </Text>
          </View>
        );

      case 'per_session':
        return (
          <View style={styles.rateItem}>
            <Text style={styles.rateLabel}>Per Sesi</Text>
            <Text style={styles.rateValue}>
              {formatRupiah(setting.session_rate)}
            </Text>
          </View>
        );

      case 'per_student_category':
        return (
          <View style={styles.ratesContainer}>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>CPB</Text>
              <Text style={styles.rateValue}>
                {formatRupiah(setting.cpb_rate)}
              </Text>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>PB</Text>
              <Text style={styles.rateValue}>
                {formatRupiah(setting.pb_rate)}
              </Text>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>NPB</Text>
              <Text style={styles.rateValue}>
                {formatRupiah(setting.npb_rate)}
              </Text>
            </View>
          </View>
        );

      case 'session_per_student_category':
        return (
          <View style={styles.ratesContainer}>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>Per Sesi</Text>
              <Text style={styles.rateValue}>
                {formatRupiah(setting.session_rate)}
              </Text>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>CPB</Text>
              <Text style={styles.rateValue}>
                {formatRupiah(setting.cpb_rate)}
              </Text>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>PB</Text>
              <Text style={styles.rateValue}>
                {formatRupiah(setting.pb_rate)}
              </Text>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.rateLabel}>NPB</Text>
              <Text style={styles.rateValue}>
                {formatRupiah(setting.npb_rate)}
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderActiveSummary = () => {
    if (!activeSetting) return null;

    return (
      <View style={styles.activeSettingSummary}>
        <Text style={styles.activeSummaryTitle}>Setting Aktif Saat Ini</Text>
        <Text style={styles.activeSummarySystem}>
          {getPaymentSystemName(activeSetting.payment_system)}
        </Text>
        <View style={styles.activeSummaryContent}>
          {renderRateInfo(activeSetting)}
        </View>
      </View>
    );
  };

  const renderSettingItem = ({ item }) => (
    <View style={[styles.settingItem, item.is_active && styles.activeSettingItem]}>
      <View style={styles.settingHeader}>
        <View style={styles.settingInfo}>
          <View style={styles.settingTitleRow}>
            <Text style={styles.settingTitle}>
              Setting #{item.id_setting}
            </Text>
            {item.is_active && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>AKTIF</Text>
              </View>
            )}
          </View>
          <Text style={styles.settingSystem}>
            {getPaymentSystemName(item.payment_system)}
          </Text>
          <Text style={styles.settingDate}>
            Dibuat: {new Date(item.created_at).toLocaleDateString('id-ID')}
          </Text>
        </View>
        <View style={styles.settingActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="pencil" size={16} color="#3498db" />
          </TouchableOpacity>
          {!item.is_active && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <Ionicons name="trash" size={16} color="#e74c3c" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderRateInfo(item)}

      {!item.is_active && (
        <TouchableOpacity
          style={styles.activateButton}
          onPress={() => handleSetActive(item)}
          disabled={setActiveStatus === 'loading'}
        >
          <Text style={styles.activateButtonText}>
            {setActiveStatus === 'loading' ? 'Mengaktifkan...' : 'Aktifkan Setting Ini'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="settings-outline" size={64} color="#e0e0e0" />
      <Text style={styles.emptyTitle}>Belum Ada Setting Honor</Text>
      <Text style={styles.emptySubtitle}>
        Buat setting honor tutor pertama
      </Text>
      <Button
        title="Buat Setting"
        onPress={handleCreate}
        style={styles.createButton}
        leftIcon={<Ionicons name="add" size={20} color="#fff" />}
      />
    </View>
  );

  if (loading && settings.length === 0) {
    return <LoadingSpinner fullScreen message="Memuat setting honor..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Setting Honor Tutor</Text>
          <Text style={styles.headerSubtitle}>
            {settings.length} setting tersedia
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreate}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Active Setting Summary */}
      {renderActiveSummary()}

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => {
            dispatch(resetError());
            loadData();
          }}
        />
      )}

      <FlatList
        data={settings}
        renderItem={renderSettingItem}
        keyExtractor={(item) => item.id_setting.toString()}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  addButton: {
    backgroundColor: '#3498db',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  activeSettingSummary: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed'
  },
  activeSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2ecc71',
    marginBottom: 8
  },
  activeSummarySystem: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 12
  },
  activeSummaryContent: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  listContainer: {
    padding: 16
  },
  settingItem: {
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
  activeSettingItem: {
    borderWidth: 2,
    borderColor: '#2ecc71'
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  settingInfo: {
    flex: 1
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8
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
  settingSystem: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
    marginBottom: 4
  },
  settingDate: {
    fontSize: 12,
    color: '#666'
  },
  settingActions: {
    flexDirection: 'row'
  },
  actionButton: {
    padding: 8,
    marginLeft: 4
  },
  ratesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12
  },
  rateItem: {
    alignItems: 'center',
    minWidth: 80
  },
  rateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  rateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  activateButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  activateButtonText: {
    color: '#fff',
    fontWeight: '500'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24
  },
  createButton: {
    minWidth: 200
  }
});

export default TutorHonorSettingsScreen;