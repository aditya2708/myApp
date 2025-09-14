import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Share,
  Linking,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const CampaignShareModal = ({ visible, onClose, onShareComplete }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('https://berbagibahagia.org/api/getcampung', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Campaigns loaded:', result.data?.length || 0);
      setCampaigns(result.data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      if (err.name === 'AbortError') {
        Alert.alert('Error', 'Koneksi timeout. Silakan periksa koneksi internet Anda dan coba lagi.');
      } else {
        Alert.alert('Error', 'Gagal memuat kampanye. Silakan periksa koneksi internet dan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('CampaignShareModal visibility changed:', visible);
    if (visible) {
      console.log('Fetching campaigns...');
      fetchCampaigns();
      setSelectedCampaign(null);
    }
  }, [visible]);

  const handleShare = async (campaign) => {
    try {
      const shareMessage = `${campaign.title}\n\n${campaign.url_link}\n\n#BerbagiBareng #BerbagiBahagia`;
      
      const result = await Share.share({
        message: shareMessage,
        url: campaign.url_link,
        title: campaign.title,
      });

      if (result.action === Share.sharedAction) {
        setSelectedCampaign(campaign);
        // Directly call onShareComplete without additional alert
        // Alert will be handled in parent component (ActivityFormScreen)
        onShareComplete(campaign);
      } else if (result.action === Share.dismissedAction) {
        // User dismissed the share sheet without sharing
        console.log('User cancelled sharing');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Gagal membagikan kampanye. Silakan coba lagi.');
    }
  };

  const handleOpenLink = async (campaign) => {
    try {
      const canOpen = await Linking.canOpenURL(campaign.url_link);
      if (canOpen) {
        await Linking.openURL(campaign.url_link);
        // After user opens the link, we consider this as "shared"
        Alert.alert(
          'Konfirmasi',
          'Apakah Anda sudah membagikan kampanye ini?',
          [
            {
              text: 'Belum',
              style: 'cancel'
            },
            {
              text: 'Sudah',
              onPress: () => {
                setSelectedCampaign(campaign);
                onShareComplete(campaign);
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Tidak dapat membuka link kampanye.');
      }
    } catch (error) {
      console.error('Error opening link:', error);
      Alert.alert('Error', 'Gagal membuka link kampanye.');
    }
  };

  const renderCampaignCard = (campaign) => {
    console.log('Rendering campaign card:', campaign.title);
    
    return (
      <View key={campaign.id_konten} style={styles.campaignCard}>
        <Image 
          source={{ uri: campaign.url_image }} 
          style={styles.campaignImage}
          onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
        />
        
        <View style={styles.campaignContent}>
          <Text style={styles.campaignTitle} numberOfLines={2}>
            {campaign.title}
          </Text>
          
          <Text style={styles.campaignCategory}>
            {campaign.kategori}
            {campaign.nama_kota && ` - ${campaign.nama_kota}`}
          </Text>
          
          <Text style={styles.campaignEndDate}>
            Berakhir: {new Date(campaign.end_date).toLocaleDateString('id-ID')}
          </Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.shareButton]}
            onPress={() => handleShare(campaign)}
            activeOpacity={0.8}
          >
            <Ionicons name="share" size={20} color="#fff" />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.linkButton]}
            onPress={() => handleOpenLink(campaign)}
            activeOpacity={0.8}
          >
            <Ionicons name="link" size={20} color="#3498db" />
            <Text style={styles.linkButtonText}>Buka Link</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="share" size={24} color="#e74c3c" />
            <Text style={styles.headerTitle}>Wajib Share Kampanye</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={20} color="#3498db" />
          <Text style={styles.infoText}>
            Sebelum membuat laporan aktivitas, Anda wajib membagikan salah satu kampanye di bawah ini.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e74c3c" />
            <Text style={styles.loadingText}>Memuat kampanye...</Text>
          </View>
        ) : (
          <ScrollView style={styles.campaignsList} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>
              Pilih salah satu kampanye untuk dibagikan:
            </Text>
            
            {campaigns.map(renderCampaignCard)}
            
            {campaigns.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="sad-outline" size={48} color="#bdc3c7" />
                <Text style={styles.emptyText}>Tidak ada kampanye tersedia</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchCampaigns}>
                  <Text style={styles.retryButtonText}>Coba Lagi</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Batal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e3f2fd',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1565c0',
    marginLeft: 8,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  campaignsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  campaignCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  campaignImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  campaignContent: {
    padding: 16,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 22,
  },
  campaignCategory: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  campaignEndDate: {
    fontSize: 13,
    color: '#e74c3c',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  shareButton: {
    backgroundColor: '#27ae60',
    borderWidth: 1,
    borderColor: '#219a52',
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 16,
  },
  linkButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3498db',
  },
  linkButtonText: {
    color: '#3498db',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#bdc3c7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CampaignShareModal;