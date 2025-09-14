import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';

import {
  activateTemplate,
  deactivateTemplate,
  deleteTemplate,
  duplicateTemplate,
  toggleTemplateSelection
} from '../../redux/templateSlice';

const TemplateCard = ({
  template,
  onEdit,
  onDelete,
  onDistribute,
  selectionMode = false,
  isSelected = false,
  onSelect,
  showActions = true
}) => {
  const dispatch = useDispatch();
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Helper functions
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Event handlers
  const handleCardPress = () => {
    if (selectionMode) {
      handleToggleSelection();
    } else {
      setShowDetailModal(true);
    }
  };

  const handleToggleSelection = () => {
    dispatch(toggleTemplateSelection(template.id_template_materi));
    if (onSelect) {
      onSelect(template.id_template_materi);
    }
  };

  const handleActivateToggle = async () => {
    try {
      if (template.is_active) {
        await dispatch(deactivateTemplate(template.id_template_materi)).unwrap();
        Alert.alert('Sukses', 'Template berhasil dinonaktifkan');
      } else {
        await dispatch(activateTemplate(template.id_template_materi)).unwrap();
        Alert.alert('Sukses', 'Template berhasil diaktifkan');
      }
    } catch (error) {
      Alert.alert('Kesalahan', error || 'Gagal mengubah status template');
    }
    setShowActionsMenu(false);
  };

  const handleDuplicate = async () => {
    try {
      const duplicateData = {
        nama_template: `${template.nama_template} (Copy)`,
        deskripsi: template.deskripsi,
        kategori: template.kategori
      };
      
      await dispatch(duplicateTemplate({
        templateId: template.id_template_materi,
        duplicateData
      })).unwrap();
      
      Alert.alert('Sukses', 'Template berhasil diduplikasi');
    } catch (error) {
      Alert.alert('Kesalahan', error || 'Gagal menduplikasi template');
    }
    setShowActionsMenu(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus template "${template.nama_template}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteTemplate(template.id_template_materi)).unwrap();
              Alert.alert('Sukses', 'Template berhasil dihapus');
              if (onDelete) onDelete(template.id_template_materi);
            } catch (error) {
              Alert.alert('Kesalahan', error || 'Gagal menghapus template');
            }
          }
        }
      ]
    );
    setShowActionsMenu(false);
  };

  // Determine card color based on status
  const getStatusColor = () => {
    if (template.is_active) return '#27ae60';
    return '#6c757d';
  };

  const getCategoryColor = () => {
    switch (template.kategori) {
      case 'materi': return '#3498db';
      case 'latihan': return '#f39c12';
      case 'evaluasi': return '#e74c3c';
      default: return '#6c757d';
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          isSelected && styles.cardSelected,
          selectionMode && styles.cardSelectionMode
        ]}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        {/* Selection Checkbox */}
        {selectionMode && (
          <View style={styles.selectionContainer}>
            <TouchableOpacity
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
              onPress={handleToggleSelection}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.statusIcon, { backgroundColor: getStatusColor() }]}>
                <Ionicons 
                  name={template.is_active ? "checkmark-circle" : "pause-circle"} 
                  size={16} 
                  color="white" 
                />
              </View>
              <View style={styles.templateInfo}>
                <Text style={styles.templateName} numberOfLines={2}>
                  {template.nama_template}
                </Text>
                <Text style={styles.templateMeta}>
                  v{template.version} • {formatDate(template.created_at)}
                </Text>
              </View>
            </View>

            {/* Actions Menu */}
            {showActions && !selectionMode && (
              <TouchableOpacity
                style={styles.actionsButton}
                onPress={() => setShowActionsMenu(true)}
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#6c757d" />
              </TouchableOpacity>
            )}
          </View>

          {/* Description */}
          {template.deskripsi && (
            <Text style={styles.description} numberOfLines={2}>
              {template.deskripsi}
            </Text>
          )}

          {/* Mata Pelajaran & Kelas Info */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="book" size={14} color="#6c757d" />
              <Text style={styles.infoText}>
                {template.mata_pelajaran?.nama_mata_pelajaran || 'N/A'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="school" size={14} color="#6c757d" />
              <Text style={styles.infoText}>
                {template.kelas?.nama_kelas || 'N/A'}
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {template.total_distributions || 0}
              </Text>
              <Text style={styles.statLabel}>Distribusi</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#27ae60' }]}>
                {template.adopted_count || 0}
              </Text>
              <Text style={styles.statLabel}>Diadopsi</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatFileSize(template.file_size)}
              </Text>
              <Text style={styles.statLabel}>Ukuran</Text>
            </View>
          </View>

          {/* Badges */}
          <View style={styles.badgeRow}>
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusBadgeText}>
                {template.is_active ? 'Aktif' : 'Nonaktif'}
              </Text>
            </View>

            {/* Category Badge */}
            {template.kategori && (
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor() }]}>
                <Text style={styles.categoryBadgeText}>
                  {template.kategori}
                </Text>
              </View>
            )}
          </View>

          {/* Adoption Progress */}
          {template.total_distributions > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View 
                  style={[
                    styles.progressFill,
                    {
                      width: `${((template.adopted_count || 0) / template.total_distributions) * 100}%`,
                      backgroundColor: '#27ae60'
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(((template.adopted_count || 0) / template.total_distributions) * 100)}% diadopsi
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Actions Menu Modal */}
      <Modal
        visible={showActionsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionsMenu(false)}
        >
          <View style={styles.actionsMenu}>
            <TouchableOpacity style={styles.actionItem} onPress={() => { setShowActionsMenu(false); if (onEdit) onEdit(template); }}>
              <Ionicons name="create" size={20} color="#3498db" />
              <Text style={styles.actionText}>Ubah</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={handleActivateToggle}>
              <Ionicons 
                name={template.is_active ? "pause" : "play"} 
                size={20} 
                color={template.is_active ? "#f39c12" : "#27ae60"} 
              />
              <Text style={styles.actionText}>
                {template.is_active ? 'Nonaktifkan' : 'Aktifkan'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={handleDuplicate}>
              <Ionicons name="copy" size={20} color="#9b59b6" />
              <Text style={styles.actionText}>Duplikasi</Text>
            </TouchableOpacity>
            
            {template.is_active && (
              <TouchableOpacity style={styles.actionItem} onPress={() => { setShowActionsMenu(false); if (onDistribute) onDistribute(template); }}>
                <Ionicons name="share" size={20} color="#1abc9c" />
                <Text style={styles.actionText}>Distribusi</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.actionDivider} />
            
            <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
              <Ionicons name="trash" size={20} color="#e74c3c" />
              <Text style={[styles.actionText, { color: '#e74c3c' }]}>Hapus</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.detailModal}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Detail Template</Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="close" size={24} color="#2c3e50" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.detailContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Informasi Umum</Text>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Nama Template:</Text>
                <Text style={styles.detailValue}>{template.nama_template}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Deskripsi:</Text>
                <Text style={styles.detailValue}>{template.deskripsi || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Kategori:</Text>
                <Text style={styles.detailValue}>{template.kategori || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Version:</Text>
                <Text style={styles.detailValue}>{template.version}</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>File</Text>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Nama File:</Text>
                <Text style={styles.detailValue}>{template.file_name || '-'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Ukuran:</Text>
                <Text style={styles.detailValue}>{formatFileSize(template.file_size)}</Text>
              </View>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Statistik</Text>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Total Distribusi:</Text>
                <Text style={styles.detailValue}>{template.total_distributions || 0}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Diadopsi:</Text>
                <Text style={styles.detailValue}>{template.adopted_count || 0}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Pending:</Text>
                <Text style={styles.detailValue}>{template.pending_adoptions || 0}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#3498db',
  },
  cardSelectionMode: {
    paddingLeft: 50,
  },
  selectionContainer: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  checkboxSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
    lineHeight: 20,
  },
  templateMeta: {
    fontSize: 12,
    color: '#6c757d',
  },
  actionsButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6c757d',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e9ecef',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
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
    fontSize: 11,
    color: '#6c757d',
    minWidth: 70,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsMenu: {
    backgroundColor: 'white',
    borderRadius: 12,
    minWidth: 200,
    paddingVertical: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 12,
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 4,
  },
  detailModal: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  detailContent: {
    flex: 1,
  },
  detailSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  detailItem: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
});

export default TemplateCard;