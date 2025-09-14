import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import KelasCustomTab from './components/KelasCustomTab';
import MataPelajaranCustomTab from './components/MataPelajaranCustomTab';

/**
 * Master Data Screen - CRUD Kelas Custom & Mata Pelajaran Custom
 * Menggunakan tab navigation untuk memisahkan dua jenis data
 */
const MasterDataScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('kelas');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Tab definitions
  const tabs = [
    {
      key: 'kelas',
      title: 'Kelas Custom',
      icon: 'school',
      color: '#007bff'
    },
    {
      key: 'mata_pelajaran',
      title: 'Mata Pelajaran Custom',
      icon: 'book',
      color: '#28a745'
    }
  ];

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    // The tab components will handle their own refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Navigation effect
  useFocusEffect(
    React.useCallback(() => {
      // Reset to default tab when screen focuses
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  const renderTabButton = (tab) => {
    const isActive = activeTab === tab.key;
    
    return (
      <TouchableOpacity
        key={tab.key}
        style={[
          styles.tabButton,
          isActive && { ...styles.activeTabButton, borderBottomColor: tab.color }
        ]}
        onPress={() => setActiveTab(tab.key)}
      >
        <View style={styles.tabContent}>
          <Ionicons
            name={tab.icon}
            size={20}
            color={isActive ? tab.color : '#6c757d'}
          />
          <Text
            style={[
              styles.tabText,
              isActive && { ...styles.activeTabText, color: tab.color }
            ]}
          >
            {tab.title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'kelas':
        return <KelasCustomTab refreshing={refreshing} onRefresh={handleRefresh} />;
      case 'mata_pelajaran':
        return <MataPelajaranCustomTab refreshing={refreshing} onRefresh={handleRefresh} />;
      default:
        return null;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data master..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#343a40" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Master Data</Text>
          <Text style={styles.headerSubtitle}>
            Kelola kelas custom & mata pelajaran custom
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollView}
        >
          {tabs.map(renderTabButton)}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={16} color="#17a2b8" />
        <Text style={styles.infoText}>
          Data yang dibuat akan tersedia untuk semua shelter di cabang ini
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tabScrollView: {
    flexGrow: 0,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    minWidth: 120,
  },
  activeTabButton: {
    borderBottomWidth: 3,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
    marginLeft: 8,
    textAlign: 'center',
  },
  activeTabText: {
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  infoBanner: {
    backgroundColor: '#e7f3ff',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#0056b3',
    marginLeft: 8,
    lineHeight: 16,
  },
});

export default MasterDataScreen;