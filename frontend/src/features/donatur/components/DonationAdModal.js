import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

import Button from '../../../common/components/Button';
import { API_BASE_URL } from '../../../constants/config';

const DonationAdModal = ({ visible, ad, onClose, onActionPress }) => {
  const assetBase = API_BASE_URL.replace(/\/api\/?$/, '');

  const getFullUrl = (path) => {
    if (!path) {
      return null;
    }

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const base = assetBase.replace(/\/$/, '');
    const cleanedPath = path.replace(/^\//, '');
    return `${base}/${cleanedPath}`;
  };

  const imageUrl = getFullUrl(ad?.file_url);
  const iconUrl = getFullUrl(ad?.icon_iklan);

  const handleActionPress = async () => {
    try {
      if (ad?.link_url) {
        await Linking.openURL(ad.link_url);
        onActionPress?.(ad);
      } else {
        onActionPress?.(ad);
        Alert.alert('Informasi', 'Link belum tersedia untuk iklan ini.');
      }
    } catch (error) {
      console.error('Failed to open donation ad link:', error);
      Alert.alert('Error', 'Tidak dapat membuka tautan iklan.');
      onActionPress?.(ad);
    } finally {
      onClose?.();
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  if (!visible || !ad) {
    return null;
  }

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={20} color="#333" />
          </TouchableOpacity>

          {imageUrl && (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          )}

          <View style={styles.content}>
            {ad?.title ? <Text style={styles.title}>{ad.title}</Text> : null}
            {ad?.description ? (
              <Text style={styles.description}>{ad.description}</Text>
            ) : null}

            <Button
              title={ad?.cta_text || 'Lihat Selengkapnya'}
              onPress={handleActionPress}
              fullWidth
              leftIcon={
                iconUrl ? (
                  <Image source={{ uri: iconUrl }} style={styles.ctaIcon} resizeMode="contain" />
                ) : (
                  <FontAwesome5 name="hands-helping" size={18} color="#ffffff" />
                )
              }
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6c7a89',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaIcon: {
    width: 20,
    height: 20,
  },
});

export default DonationAdModal;
