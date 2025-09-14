import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QrCodeDisplay from './QrCodeDisplay';

const QRTargetItem = ({ 
  target, 
  onGenerate, 
  onExport, 
  onToggleSelect,
  setQrRef,
  tokenLoading,
  exportLoading 
}) => {
  const { type, id, name, token, selected, data } = target;
  
  // Debug target token
  console.log('TARGET ITEM:', { 
    type, 
    id, 
    name, 
    hasToken: !!token,
    tokenValue: token?.token ? `${token.token.substring(0, 8)}...${token.token.substring(token.token.length - 8)}` : 'NO TOKEN',
    tokenFull: token?.token
  });
  
  const getBadgeColor = () => {
    switch (type) {
      case 'tutor': return '#e74c3c';
      case 'student': return '#3498db';
      default: return '#95a5a6';
    }
  };
  
  const getBadgeText = () => {
    switch (type) {
      case 'tutor': return 'Tutor';
      case 'student': return 'Siswa';
      default: return 'Unknown';
    }
  };

  return (
    <View style={styles.targetCard}>
      <View style={styles.targetHeader}>
        {type === 'student' && (
          <TouchableOpacity
            style={[styles.checkbox, selected && styles.checkboxSelected]}
            onPress={() => onToggleSelect(target)}
          >
            {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
          </TouchableOpacity>
        )}
        
        <View style={styles.targetInfo}>
          <Text style={styles.targetName}>{name}</Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: getBadgeColor() }]}>
              <Text style={styles.badgeText}>{getBadgeText()}</Text>
            </View>
            {type === 'student' && (
              <Text style={styles.targetId}>ID: {id}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.targetActions}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => onGenerate(target)}
            disabled={tokenLoading}
          >
            {tokenLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>
                {token ? 'Buat Ulang' : 'Buat'}
              </Text>
            )}
          </TouchableOpacity>
          
          {token && (
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => onExport(target)}
              disabled={exportLoading}
            >
              {exportLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="share-outline" size={16} color="#fff" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {token && (
        <View style={styles.qrContainer}>
          <QrCodeDisplay
            token={token.token}
            studentName={name}
            studentId={id}
            size={180}
            showExportButtons={false}
            ref={(ref) => setQrRef(id, ref)}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  targetCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#3498db',
  },
  targetInfo: {
    flex: 1,
  },
  targetName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  targetId: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  targetActions: {
    flexDirection: 'row',
  },
  generateButton: {
    backgroundColor: '#f1c40f',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginRight: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
  exportButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
});

export default QRTargetItem;