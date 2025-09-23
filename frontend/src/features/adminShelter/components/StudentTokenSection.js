import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import QrCodeDisplay from './QrCodeDisplay';
import ErrorMessage from '../../../common/components/ErrorMessage';
import LoadingSpinner from '../../../common/components/LoadingSpinner';

const StudentTokenSection = ({
  isContextualMode,
  activityType,
  kelompokLoading,
  kelompokError,
  kelompokList,
  selectedKelompokId,
  handleKelompokChange,
  loading,
  searchQuery,
  setSearchQuery,
  validDays,
  setValidDays,
  expiryStrategy,
  setExpiryStrategy,
  selectedStudents,
  filteredStudents,
  selectAllStudents,
  tokenLoading,
  handleGenerateBatchTokens,
  exportLoading,
  handleExportBatchQr,
  renderStudentItem,
  fetchKelompokList
}) => {
  return (
    <>
      {(!isContextualMode || (isContextualMode && activityType !== 'Bimbel')) && (
        <View style={styles.kelompokContainer}>
          <Text style={styles.kelompokLabel}>Filter berdasarkan Kelompok:</Text>
          {kelompokLoading ? (
            <View style={styles.pickerLoadingContainer}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={styles.pickerLoadingText}>Memuat kelompok...</Text>
            </View>
          ) : kelompokError ? (
            <ErrorMessage 
              message={kelompokError} 
              onRetry={fetchKelompokList}
              style={styles.errorContainer} 
            />
          ) : (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedKelompokId}
                onValueChange={handleKelompokChange}
                style={styles.picker}
                enabled={!loading && !kelompokLoading}
              >
                <Picker.Item label="Semua Siswa" value="" />
                {kelompokList.map(kelompok => (
                  <Picker.Item 
                    key={kelompok.id_kelompok} 
                    label={kelompok.nama_kelompok}
                    value={kelompok.id_kelompok} 
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>
      )}
      
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7f8c8d" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        <View style={styles.tokenControls}>
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
            <Text style={styles.validDaysLabel}>Valid for (days):</Text>
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
              Token akan kedaluwarsa pada akhir semester aktif.
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.selectAllButton}
          onPress={selectAllStudents}
        >
          <Text style={styles.selectAllText}>
            {selectedStudents.length === filteredStudents.length
              ? 'Unselect All'
              : 'Select All'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.batchGenerateButton,
            (selectedStudents.length === 0 || tokenLoading) && styles.disabledButton
          ]}
          onPress={handleGenerateBatchTokens}
          disabled={selectedStudents.length === 0 || tokenLoading}
        >
          <Ionicons name="qr-code" size={16} color="#fff" />
          <Text style={styles.batchGenerateText}>
            Generate {selectedStudents.length} QR Codes
          </Text>
        </TouchableOpacity>
      </View>

      {selectedStudents.length > 0 && (
        <TouchableOpacity
          style={[
            styles.exportBatchButton,
            (exportLoading || tokenLoading) && styles.disabledButton
          ]}
          onPress={handleExportBatchQr}
          disabled={exportLoading || tokenLoading}
        >
          <Ionicons name="share-social" size={16} color="#fff" />
          <Text style={styles.exportBatchText}>
            Export {selectedStudents.length} QR Codes
          </Text>
        </TouchableOpacity>
      )}
      
      {loading ? (
        <LoadingSpinner message="Loading students..." />
      ) : (
        <FlatList
          data={filteredStudents}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item.id_anak.toString()}
          contentContainerStyle={styles.studentsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={48} color="#bdc3c7" />
              <Text style={styles.emptyText}>No students found</Text>
              {selectedKelompokId && (
                <Text style={styles.emptySubtext}>Try selecting a different group</Text>
              )}
            </View>
          }
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  kelompokContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  kelompokLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  pickerLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  pickerLoadingText: {
    marginLeft: 8,
    color: '#7f8c8d',
  },
  errorContainer: {
    marginVertical: 0,
  },
  controlsContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  tokenControls: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e1e1e1'
  },
  strategyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  strategyToggleGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
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
    backgroundColor: '#fff'
  },
  strategyOptionLast: {
    marginRight: 0
  },
  strategyOptionActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db'
  },
  strategyOptionText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#3498db'
  },
  strategyOptionTextActive: {
    color: '#fff'
  },
  validDaysRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  validDaysLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginRight: 8
  },
  validDaysInput: {
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    width: 60,
    textAlign: 'center'
  },
  validDaysInputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#95a5a6'
  },
  strategyDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 10
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  selectAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  selectAllText: {
    color: '#3498db',
    fontWeight: '500',
  },
  batchGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  batchGenerateText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 6,
  },
  exportBatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27ae60',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 16,
  },
  exportBatchText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 6,
  },
  studentsList: {
    padding: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 4,
  },
});

export default StudentTokenSection;