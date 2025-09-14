import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ErrorMessage from '../../../../../common/components/ErrorMessage';
import TargetsList from '../../../components/TargetsList';
import { useQrTokenGeneration } from '../../../hooks/useQrTokenGeneration';

const QrTokenGenerationTab = ({ 
  id_aktivitas, activityName, activityDate, activityType, 
  kelompokId, kelompokName, level, completeActivity 
}) => {
  const {
    targets, selectedTargets, searchQuery, setSearchQuery, loading, error,
    tokenLoading, tokenError, tutorLoading, tutorError, exportLoading,
    setQrRef, handleGenerateToken, handleExportQr,
    handleToggleTargetSelection, handleSelectAllTargets,
    handleBatchGenerate, handleBatchExport
  } = useQrTokenGeneration({
    id_aktivitas, activityName, activityDate, activityType,
    kelompokId, kelompokName, level, completeActivity
  });



  return (
    <View style={styles.container}>
      {activityName && (
        <View style={styles.activityInfo}>
          <Text style={styles.activityName}>{activityName}</Text>
          {activityDate && <Text style={styles.activityDate}>{activityDate}</Text>}
          
          {activityType === 'Bimbel' && kelompokName && (
            <View style={styles.contextInfo}>
              <Text style={styles.contextInfoText}>Kelompok: {kelompokName}</Text>
              {level && <Text style={styles.contextInfoText}>Tingkat: {level}</Text>}
            </View>
          )}
        </View>
      )}
      
      
      {(tokenError || tutorError) && <ErrorMessage message={tokenError || tutorError} />}
      
      <TargetsList
        targets={targets}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        loading={loading}
        error={error || tokenError || tutorError}
        selectedTargets={selectedTargets}
        tokenLoading={tokenLoading}
        exportLoading={exportLoading}
        onGenerate={handleGenerateToken}
        onExport={handleExportQr}
        onToggleSelect={handleToggleTargetSelection}
        onSelectAll={handleSelectAllTargets}
        onBatchGenerate={handleBatchGenerate}
        onBatchExport={handleBatchExport}
        setQrRef={setQrRef}
      />
      
      {(tokenLoading || exportLoading || tutorLoading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>
            {exportLoading ? 'Mengekspor kode QR...' : 'Membuat kode QR...'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  activityInfo: { backgroundColor: '#3498db', padding: 16, alignItems: 'center' },
  activityName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  activityDate: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 },
  contextInfo: {
    marginTop: 8, paddingTop: 8, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.3)'
  },
  contextInfoText: { fontSize: 12, color: '#fff', marginVertical: 2 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center', alignItems: 'center'
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#3498db' }
});

export default QrTokenGenerationTab;