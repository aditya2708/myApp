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
  setQrRef,
  validDays,
  setValidDays,
  expiryStrategy,
  setExpiryStrategy
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

      <View style={styles.strategyContainer}>
        <Text style={styles.strategyLabel}>Strategi Kedaluwarsa</Text>
        <View style={styles.strategyToggleGroup}>
          <TouchableOpacity
            style={[
              styles.strategyOption,
              expiryStrategy === 'days' && styles.strategyOptionActive
            ]}
            onPress={() => setExpiryStrategy('days')}
          >
            <Ionicons
              name="time"
              size={16}
              color={expiryStrategy === 'days' ? '#fff' : '#3498db'}
            />
            <Text
              style={[
                styles.strategyOptionText,
                expiryStrategy === 'days' && styles.strategyOptionTextActive
              ]}
            >
              Per X Hari
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.strategyOption,
              styles.strategyOptionLast,
              expiryStrategy === 'semester' && styles.strategyOptionActive
            ]}
            onPress={() => setExpiryStrategy('semester')}
          >
            <Ionicons
              name="calendar"
              size={16}
              color={expiryStrategy === 'semester' ? '#fff' : '#3498db'}
            />
            <Text
              style={[
                styles.strategyOptionText,
                expiryStrategy === 'semester' && styles.strategyOptionTextActive
              ]}
            >
              Akhir Semester
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.validDaysRow}>
          <Text style={styles.validDaysLabel}>Berlaku selama (hari)</Text>
          <TextInput
            style={[
              styles.validDaysInput,
              expiryStrategy !== 'days' && styles.validDaysInputDisabled
            ]}
            value={validDays.toString()}
            onChangeText={(value) => setValidDays(parseInt(value, 10) || 30)}
            keyboardType="number-pad"
            editable={expiryStrategy === 'days'}
            selectTextOnFocus
          />
        </View>

        {expiryStrategy === 'semester' && (
          <Text style={styles.strategyDescription}>
            Token akan kedaluwarsa di akhir semester aktif.
          </Text>
        )}
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
  strategyContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    marginBottom: 12,
  },
  strategyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  strategyToggleGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  strategyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  strategyOptionLast: {
    marginRight: 0,
  },
  strategyOptionActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  strategyOptionText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#3498db',
  },
  strategyOptionTextActive: {
    color: '#fff',
  },
  validDaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  validDaysLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 8,
  },
  validDaysInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 70,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#dce1e6',
  },
  validDaysInputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#95a5a6',
  },
  strategyDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 8,
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