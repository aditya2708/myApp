import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import { 
  fetchTemplateStruktur,
  navigateToJenjang,
  selectHierarchyStruktur,
  selectHierarchyLoading,
  selectHierarchyError,
  selectCurrentPath
} from '../../redux/templateHierarchySlice';

const JenjangSelectionScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  
  // Redux state
  const struktur = useSelector(selectHierarchyStruktur);
  const loading = useSelector(selectHierarchyLoading);
  const error = useSelector(selectHierarchyError);
  const currentPath = useSelector(selectCurrentPath);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);

  // Load data saat component mount
  useEffect(() => {
    if (!struktur.length) {
      dispatch(fetchTemplateStruktur());
    }
  }, [dispatch, struktur.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchTemplateStruktur());
    setRefreshing(false);
  };

  const handleJenjangSelect = (jenjang) => {
    // Update current path di Redux
    dispatch(navigateToJenjang(jenjang.id_jenjang));
    
    // Navigate ke KelasSelection dengan jenjang data
    navigation.navigate('KelasSelection', {
      jenjang: jenjang,
      jenjangId: jenjang.id_jenjang,
      jenjangName: jenjang.nama_jenjang
    });
  };

  const handleNavigateBack = () => {
    navigation.goBack();
  };

  if (loading.struktur && !struktur.length) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Header dengan breadcrumb */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleNavigateBack}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pilih Jenjang</Text>
          <Text style={styles.headerSubtitle}>
            Pilih jenjang pendidikan untuk melihat template
          </Text>
        </View>
      </View>

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity 
          style={styles.breadcrumbItem}
          onPress={() => navigation.navigate('TemplateHome')}
        >
          <Ionicons name="home" size={16} color="#3498db" />
          <Text style={styles.breadcrumbText}>Template</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={16} color="#6c757d" />
        <Text style={styles.breadcrumbTextActive}>Jenjang</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#e74c3c']}
          />
        }
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <Ionicons name="library" size={24} color="#3498db" />
            <Text style={styles.statsTitle}>Total Jenjang</Text>
            <Text style={styles.statsValue}>{struktur.length}</Text>
          </View>
        </View>

        {/* Jenjang List */}
        <View style={styles.jenjangContainer}>
          {struktur.map((jenjang, index) => (
            <JenjangCard
              key={jenjang.id_jenjang}
              jenjang={jenjang}
              index={index}
              onPress={() => handleJenjangSelect(jenjang)}
              isSelected={currentPath.jenjang === jenjang.id_jenjang}
            />
          ))}
        </View>

        {/* Empty State */}
        {struktur.length === 0 && !loading.struktur && (
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyStateTitle}>Belum Ada Jenjang</Text>
            <Text style={styles.emptyStateText}>
              Belum ada data jenjang yang tersedia
            </Text>
          </View>
        )}

        {/* Error handling */}
        {error.struktur && (
          <ErrorMessage 
            message={error.struktur}
            onRetry={() => dispatch(fetchTemplateStruktur())}
          />
        )}
      </ScrollView>
    </View>
  );
};

// Jenjang Card Component
const JenjangCard = ({ jenjang, index, onPress, isSelected }) => {
  // Colors untuk different jenjang
  const colors = [
    '#e74c3c', // SD - Red
    '#3498db', // SMP - Blue  
    '#27ae60', // SMA - Green
    '#9b59b6', // Other - Purple
  ];
  
  const cardColor = colors[index % colors.length];
  
  // Calculate template counts dari jenjang data
  const templateCount = jenjang.template_count || 0;
  const activeTemplateCount = jenjang.active_template_count || 0;
  const kelasCount = jenjang.kelas_count || 0;

  return (
    <TouchableOpacity 
      style={[
        styles.jenjangCard,
        isSelected && styles.jenjangCardSelected
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.jenjangCardContent}>
        {/* Icon dan Basic Info */}
        <View style={styles.jenjangCardHeader}>
          <View style={[styles.jenjangIcon, { backgroundColor: cardColor }]}>
            <Text style={styles.jenjangIconText}>
              {jenjang.kode_jenjang || jenjang.nama_jenjang.charAt(0)}
            </Text>
          </View>
          <View style={styles.jenjangInfo}>
            <Text style={styles.jenjangName}>{jenjang.nama_jenjang}</Text>
            <Text style={styles.jenjangDescription}>
              {jenjang.deskripsi || `Jenjang ${jenjang.nama_jenjang}`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
        </View>

        {/* Stats */}
        <View style={styles.jenjangStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{templateCount}</Text>
            <Text style={styles.statLabel}>Template</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: cardColor }]}>
              {activeTemplateCount}
            </Text>
            <Text style={styles.statLabel}>Aktif</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{kelasCount}</Text>
            <Text style={styles.statLabel}>Kelas</Text>
          </View>
        </View>

        {/* Progress Bar untuk adoption rate */}
        {templateCount > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(activeTemplateCount / templateCount) * 100}%`,
                    backgroundColor: cardColor 
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((activeTemplateCount / templateCount) * 100)}% aktif
            </Text>
          </View>
        )}

        {/* Badge untuk status */}
        {jenjang.is_active && (
          <View style={[styles.statusBadge, { backgroundColor: cardColor }]}>
            <Text style={styles.statusBadgeText}>Aktif</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#3498db',
    marginLeft: 4,
  },
  breadcrumbTextActive: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 12,
    flex: 1,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
  },
  jenjangContainer: {
    padding: 16,
    paddingTop: 8,
  },
  jenjangCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  jenjangCardSelected: {
    borderWidth: 2,
    borderColor: '#3498db',
  },
  jenjangCardContent: {
    padding: 16,
  },
  jenjangCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  jenjangIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  jenjangIconText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  jenjangInfo: {
    flex: 1,
  },
  jenjangName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  jenjangDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  jenjangStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e9ecef',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6c757d',
    minWidth: 50,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default JenjangSelectionScreen;