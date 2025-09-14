import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRTargetItem from './QRTargetItem';

const TargetsList = ({
  targets,
  searchQuery,
  setSearchQuery,
  loading,
  error,
  selectedTargets,
  tokenLoading,
  exportLoading,
  onGenerate,
  onExport,
  onToggleSelect,
  onSelectAll,
  onBatchGenerate,
  onBatchExport,
  setQrRef
}) => {
  // Filter targets based on search query
  const filteredTargets = targets.filter(target =>
    target.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected student targets for batch operations
  const selectedStudents = selectedTargets.filter(t => t.type === 'student');
  const hasSelectedStudents = selectedStudents.length > 0;
  const allStudentsSelected = targets
    .filter(t => t.type === 'student')
    .every(t => selectedTargets.find(s => s.id === t.id));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const renderTargetItem = ({ item }) => (
    <QRTargetItem
      target={item}
      onGenerate={onGenerate}
      onExport={onExport}
      onToggleSelect={onToggleSelect}
      setQrRef={setQrRef}
      tokenLoading={tokenLoading}
      exportLoading={exportLoading}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#7f8c8d" />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Batch Actions for Students */}
      {targets.some(t => t.type === 'student') && (
        <View style={styles.batchActions}>
          <TouchableOpacity
            style={[styles.batchButton, styles.selectAllButton]}
            onPress={onSelectAll}
          >
            <Ionicons 
              name={allStudentsSelected ? "checkbox" : "square-outline"} 
              size={16} 
              color="#3498db" 
            />
            <Text style={styles.batchButtonText}>
              {allStudentsSelected ? 'Batal Pilih' : 'Pilih Semua'}
            </Text>
          </TouchableOpacity>

          {hasSelectedStudents && (
            <>
              <TouchableOpacity
                style={[styles.batchButton, styles.generateBatchButton]}
                onPress={onBatchGenerate}
                disabled={tokenLoading}
              >
                <Ionicons name="qr-code" size={16} color="#fff" />
                <Text style={styles.batchButtonTextWhite}>
                  Buat ({selectedStudents.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.batchButton, styles.exportBatchButton]}
                onPress={onBatchExport}
                disabled={exportLoading}
              >
                <Ionicons name="share" size={16} color="#fff" />
                <Text style={styles.batchButtonTextWhite}>
                  Ekspor ({selectedStudents.length})
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          Total: {filteredTargets.length} target
          {filteredTargets.filter(t => t.token).length > 0 && 
            ` • ${filteredTargets.filter(t => t.token).length} dengan QR`
          }
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTargets}
        keyExtractor={(item) => `${item.type}_${item.id}`}
        renderItem={renderTargetItem}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    paddingVertical: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 8,
    fontSize: 16,
    color: '#2c3e50',
  },
  batchActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  batchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  selectAllButton: {
    backgroundColor: '#ecf0f1',
  },
  generateBatchButton: {
    backgroundColor: '#f1c40f',
  },
  exportBatchButton: {
    backgroundColor: '#27ae60',
  },
  batchButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#3498db',
  },
  batchButtonTextWhite: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  summary: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  summaryText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  },
});

export default TargetsList;