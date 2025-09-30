import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import KurikulumSelectionCard from '../components/KurikulumSelectionCard';

import {
  fetchKurikulumList,
  fetchKurikulumPreview,
  setSelectedKurikulum,
  selectKurikulumList,
  selectKurikulumLoading,
  selectKurikulumError,
  selectSelectedKurikulum,
  selectKurikulumPreview,
  selectActiveKurikulum
} from '../redux/kurikulumShelterSlice';

const resolveKurikulumId = (kurikulum) => kurikulum?.id_kurikulum ?? kurikulum?.id;

const KurikulumSelectionScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const kurikulumList = useSelector(selectKurikulumList);
  const loading = useSelector(selectKurikulumLoading);
  const error = useSelector(selectKurikulumError);
  const selectedKurikulum = useSelector(selectSelectedKurikulum);
  const kurikulumPreview = useSelector(selectKurikulumPreview);
  const activeKurikulum = useSelector(selectActiveKurikulum);

  const [refreshing, setRefreshing] = useState(false);
  const [localSelected, setLocalSelected] = useState(null);

  const loadKurikulum = useCallback(
    (options = {}) => dispatch(fetchKurikulumList(options)),
    [dispatch]
  );

  useFocusEffect(
    useCallback(() => {
      loadKurikulum({ force: true });
    }, [loadKurikulum])
  );

  useEffect(() => {
    if (selectedKurikulum) {
      setLocalSelected(selectedKurikulum);
      return;
    }

    if (activeKurikulum) {
      setLocalSelected(activeKurikulum);
    } else {
      setLocalSelected(null);
    }
  }, [selectedKurikulum, activeKurikulum]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadKurikulum({ force: true });
    setRefreshing(false);
  };

  const handleSelectKurikulum = async (kurikulum) => {
    setLocalSelected(kurikulum);
    // Load preview untuk kurikulum yang dipilih
    const kurikulumId = resolveKurikulumId(kurikulum);

    if (kurikulumId) {
      dispatch(fetchKurikulumPreview(kurikulumId));
    }
  };

  const handleConfirmSelection = () => {
    if (!localSelected) {
      Alert.alert('Peringatan', 'Pilih kurikulum terlebih dahulu');
      return;
    }

    Alert.alert(
      'Konfirmasi Kurikulum',
      `Gunakan kurikulum "${localSelected.nama_kurikulum}" untuk semester ini?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya',
          onPress: () => {
            dispatch(setSelectedKurikulum(localSelected));
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleShowPreview = () => {
    if (!localSelected) {
      Alert.alert('Info', 'Pilih kurikulum untuk melihat preview');
      return;
    }
    
    // Navigate to preview screen atau show modal
    // Untuk sekarang kita tampilkan alert dengan info basic
    Alert.alert(
      'Preview Kurikulum',
      `${localSelected.nama_kurikulum}\n\nMata Pelajaran: ${localSelected.mata_pelajaran_count || 0}\nMateri: ${localSelected.kurikulum_materi_count || 0}`,
      [{ text: 'OK' }]
    );
  };

  const renderKurikulum = ({ item }) => (
    <KurikulumSelectionCard
      kurikulum={item}
      onSelect={handleSelectKurikulum}
      isSelected={
        resolveKurikulumId(localSelected)?.toString() ===
        resolveKurikulumId(item)?.toString()
      }
    />
  );

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat kurikulum..." />;
  }

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => loadKurikulum({ force: true })}
        />
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pilih Kurikulum</Text>
        <Text style={styles.headerSubtitle}>
          Pilih kurikulum yang akan digunakan untuk semester ini
        </Text>
        <View style={styles.activeInfoContainer}>
          <Ionicons
            name={activeKurikulum ? 'checkmark-circle' : 'information-circle-outline'}
            size={18}
            color={activeKurikulum ? '#27ae60' : '#f39c12'}
            style={styles.activeInfoIcon}
          />
          <Text style={styles.activeInfoText}>
            {activeKurikulum
              ? `Kurikulum aktif cabang: ${activeKurikulum.nama_kurikulum}`
              : 'Belum ada kurikulum aktif dari cabang'}
          </Text>
        </View>
      </View>

      <FlatList
        data={kurikulumList}
        renderItem={renderKurikulum}
        keyExtractor={(item, index) =>
          resolveKurikulumId(item)?.toString() ?? `kurikulum-${index}`
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyText}>Belum ada kurikulum</Text>
            <Text style={styles.emptySubText}>
              Hubungi admin cabang untuk membuat kurikulum
            </Text>
          </View>
        }
      />

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {localSelected && (
          <TouchableOpacity
            style={styles.previewButton}
            onPress={handleShowPreview}
          >
            <Ionicons name="eye-outline" size={20} color="#3498db" />
            <Text style={styles.previewButtonText}>Preview</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !localSelected && styles.disabledButton
          ]}
          onPress={handleConfirmSelection}
          disabled={!localSelected}
        >
          <Text style={[
            styles.confirmButtonText,
            !localSelected && styles.disabledButtonText
          ]}>
            Gunakan Kurikulum
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  activeInfoContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeInfoIcon: {
    marginRight: 6,
  },
  activeInfoText: {
    fontSize: 12,
    color: '#34495e',
    flex: 1,
    lineHeight: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 4,
    textAlign: 'center',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  previewButtonText: {
    color: '#3498db',
    fontWeight: '600',
    marginLeft: 4,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: '#ecf0f1',
  },
});

export default KurikulumSelectionScreen;