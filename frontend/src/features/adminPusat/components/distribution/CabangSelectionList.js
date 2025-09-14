import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CabangSelectionList = ({
  cabangList = [],
  selectedCabang = [],
  onSelectionChange,
  showStats = true,
  selectionMode = 'multiple', // 'single' or 'multiple'
  loading = false,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter cabang berdasarkan search
  const filteredCabang = cabangList.filter(cabang => {
    const searchLower = searchQuery.toLowerCase();
    return (
      cabang.nama_cabang.toLowerCase().includes(searchLower) ||
      cabang.kode_cabang.toLowerCase().includes(searchLower) ||
      (cabang.alamat && cabang.alamat.toLowerCase().includes(searchLower))
    );
  });

  // Handle selection
  const handleCabangSelect = (cabangId) => {
    if (selectionMode === 'single') {
      onSelectionChange([cabangId]);
    } else {
      const newSelection = selectedCabang.includes(cabangId)
        ? selectedCabang.filter(id => id !== cabangId)
        : [...selectedCabang, cabangId];
      onSelectionChange(newSelection);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedCabang.length === filteredCabang.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredCabang.map(cabang => cabang.id_cabang));
    }
  };

  // Calculate stats
  const stats = {
    total: cabangList.length,
    selected: selectedCabang.length,
    filtered: filteredCabang.length
  };

  const selectedCabangDetails = cabangList.filter(cabang => 
    selectedCabang.includes(cabang.id_cabang)
  );

  const totalEstimatedUsers = selectedCabangDetails.reduce(
    (sum, cabang) => sum + (cabang.total_users || 0), 0
  );

  const avgAdoptionRate = selectedCabangDetails.length > 0
    ? Math.round(
        selectedCabangDetails.reduce((sum, cabang) => 
          sum + (cabang.adoption_rate || 0), 0
        ) / selectedCabangDetails.length
      )
    : 0;

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6c757d" />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari cabang..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#6c757d" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats and Actions */}
      {showStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.selected}</Text>
              <Text style={styles.statLabel}>Dipilih</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalEstimatedUsers}</Text>
              <Text style={styles.statLabel}>Est. Users</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{avgAdoptionRate}%</Text>
              <Text style={styles.statLabel}>Avg. Adopsi</Text>
            </View>
          </View>
          
          {selectionMode === 'multiple' && (
            <TouchableOpacity 
              style={styles.selectAllButton}
              onPress={handleSelectAll}
            >
              <Ionicons 
                name={selectedCabang.length === filteredCabang.length ? "checkmark-circle" : "ellipse-outline"} 
                size={20} 
                color="#3498db" 
              />
              <Text style={styles.selectAllText}>
                {selectedCabang.length === filteredCabang.length ? 'Batal Semua' : 'Pilih Semua'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Cabang List */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredCabang.map((cabang) => (
          <CabangCard
            key={cabang.id_cabang}
            cabang={cabang}
            isSelected={selectedCabang.includes(cabang.id_cabang)}
            onPress={() => handleCabangSelect(cabang.id_cabang)}
            showStats={showStats}
          />
        ))}

        {/* Empty State */}
        {filteredCabang.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'Tidak Ada Hasil' : 'Tidak Ada Cabang'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? `Tidak ditemukan cabang dengan kata kunci "${searchQuery}"`
                : 'Belum ada data cabang yang tersedia'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Cabang Card Component
const CabangCard = ({ cabang, isSelected, onPress, showStats }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#27ae60';
      case 'inactive': return '#e74c3c';
      case 'pending': return '#f39c12';
      default: return '#6c757d';
    }
  };

  const getAdoptionRateColor = (rate) => {
    if (rate >= 80) return '#27ae60';
    if (rate >= 50) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <TouchableOpacity 
      style={[styles.cabangCard, isSelected && styles.cabangCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cabangCardContent}>
        {/* Header */}
        <View style={styles.cabangCardHeader}>
          <View style={styles.cabangInfo}>
            <View style={styles.cabangTitleRow}>
              <Text style={styles.cabangName}>{cabang.nama_cabang}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(cabang.status) }]}>
                <Text style={styles.statusBadgeText}>
                  {cabang.status || 'Unknown'}
                </Text>
              </View>
            </View>
            <Text style={styles.cabangCode}>Kode: {cabang.kode_cabang}</Text>
            {cabang.alamat && (
              <Text style={styles.cabangAddress} numberOfLines={2}>
                {cabang.alamat}
              </Text>
            )}
          </View>
          
          <View style={styles.selectionIndicator}>
            <Ionicons 
              name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={isSelected ? "#3498db" : "#bdc3c7"} 
            />
          </View>
        </View>

        {/* Stats */}
        {showStats && (
          <View style={styles.cabangStats}>
            <View style={styles.statsGrid}>
              <View style={styles.statGridItem}>
                <Text style={styles.statGridValue}>{cabang.total_users || 0}</Text>
                <Text style={styles.statGridLabel}>Users</Text>
              </View>
              <View style={styles.statGridItem}>
                <Text style={styles.statGridValue}>{cabang.active_templates || 0}</Text>
                <Text style={styles.statGridLabel}>Templates</Text>
              </View>
              <View style={styles.statGridItem}>
                <Text style={[
                  styles.statGridValue, 
                  { color: getAdoptionRateColor(cabang.adoption_rate || 0) }
                ]}>
                  {cabang.adoption_rate || 0}%
                </Text>
                <Text style={styles.statGridLabel}>Adopsi</Text>
              </View>
            </View>

            {/* Adoption Progress Bar */}
            {(cabang.adoption_rate || 0) > 0 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${cabang.adoption_rate}%`,
                        backgroundColor: getAdoptionRateColor(cabang.adoption_rate)
                      }
                    ]} 
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Region info */}
        {cabang.region && (
          <View style={styles.regionContainer}>
            <Ionicons name="location-outline" size={16} color="#6c757d" />
            <Text style={styles.regionText}>{cabang.region}</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  statsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
  },
  selectAllText: {
    fontSize: 16,
    color: '#3498db',
    marginLeft: 8,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cabangCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cabangCardSelected: {
    borderWidth: 2,
    borderColor: '#3498db',
  },
  cabangCardContent: {
    padding: 16,
  },
  cabangCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cabangInfo: {
    flex: 1,
  },
  cabangTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cabangName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  cabangCode: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  cabangAddress: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },
  selectionIndicator: {
    marginLeft: 12,
  },
  cabangStats: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statGridItem: {
    alignItems: 'center',
  },
  statGridValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  statGridLabel: {
    fontSize: 11,
    color: '#6c757d',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  regionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  regionText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
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

export default CabangSelectionList;