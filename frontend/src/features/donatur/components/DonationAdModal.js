import React, { useEffect, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';

import Button from '../../../common/components/Button';
import { DONATION_ASSET_BASE_URL } from '../../../constants/config';

const DonationAdModal = ({ visible, ad, onClose, onActionPress }) => {
  const assetBase = DONATION_ASSET_BASE_URL.replace(/\/$/, '');

  const getFullUrl = (path) => {
    if (!path) {
      return null;
    }

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const cleanedPath = path.replace(/^\//, '');
    return `${assetBase}/${cleanedPath}`;
  };

  const imageUrl = getFullUrl(ad?.file_url);
  const [imageAspectRatio, setImageAspectRatio] = useState(16 / 9);

  useEffect(() => {
    let isMounted = true;

    if (imageUrl) {
      Image.getSize(
        imageUrl,
        (width, height) => {
          if (isMounted && width && height) {
            setImageAspectRatio(width / height);
          }
        },
        () => {
          if (isMounted) {
            setImageAspectRatio(16 / 9);
          }
        }
      );
    }

    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  const getTextValue = (...values) => {
    for (const value of values) {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed) {
          return trimmed;
        }
      }
    }

    return '';
  };

  const mainTitle = getTextValue(ad?.nama, ad?.title, ad?.name, ad?.judul);
  const descriptionText = getTextValue(
    ad?.description,
    ad?.deskripsi,
    ad?.sub_title,
    ad?.subTitle,
    ad?.subjudul,
    ad?.content
  );
  const extraNote = getTextValue(ad?.keterangan);

  const iconValue = ad?.icon_iklan?.trim?.();

  const parseFontAwesomeIcon = (value) => {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return null;
    }

    const match = /^fa(?:(s|r|l|b))?-([a-z0-9-]+)$/i.exec(trimmedValue);

    if (!match) {
      return null;
    }

    const styleCode = (match[1] || 's').toLowerCase();
    const styleMap = {
      s: 'solid',
      r: 'regular',
      l: 'light',
      b: 'brand',
    };

    return {
      name: match[2].toLowerCase(),
      style: styleMap[styleCode] || 'solid',
    };
  };

  const parsedFontAwesomeIcon = parseFontAwesomeIcon(iconValue);
  const isFontAwesomeIcon = Boolean(parsedFontAwesomeIcon);
  const fontAwesomeIconName = parsedFontAwesomeIcon?.name;
  const fontAwesomeIconStyle = parsedFontAwesomeIcon?.style;
  const isImageIcon =
    typeof iconValue === 'string' &&
    (/^https?:\/\//i.test(iconValue) || /\.(png|jpe?g|gif|svg|webp)$/i.test(iconValue));
  const iconUrl = isImageIcon ? getFullUrl(iconValue) : null;

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
          <View style={styles.surface}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={20} color="#333" />
            </TouchableOpacity>

            {imageUrl && (
              <View style={[styles.imageWrapper, { aspectRatio: imageAspectRatio }]}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
                <LinearGradient
                  pointerEvents="none"
                  colors={["rgba(255,255,255,0)", '#ffffff']}
                  style={styles.imageFade}
                />
              </View>
            )}

            <View style={styles.contentPanel}>
              {mainTitle ? <Text style={styles.title}>{mainTitle}</Text> : null}
              {descriptionText ? (
                <Text style={styles.description}>{descriptionText}</Text>
              ) : null}
              {extraNote ? <Text style={styles.note}>{extraNote}</Text> : null}

              <Button
                title={ad?.name_button_iklan || ad?.cta_text || 'Lihat Selengkapnya'}
                onPress={handleActionPress}
                fullWidth
                leftIcon={
                  isFontAwesomeIcon && fontAwesomeIconName ? (
                    <FontAwesome5
                      name={fontAwesomeIconName}
                      size={18}
                      color="#ffffff"
                      solid={fontAwesomeIconStyle === 'solid'}
                      regular={fontAwesomeIconStyle === 'regular'}
                      light={fontAwesomeIconStyle === 'light'}
                      brand={fontAwesomeIconStyle === 'brand'}
                    />
                  ) : iconUrl ? (
                    <Image
                      source={{ uri: iconUrl }}
                      style={styles.ctaIcon}
                      resizeMode="contain"
                    />
                  ) : (
                    <FontAwesome5 name="hands-helping" size={18} color="#ffffff" />
                  )
                }
              />
            </View>
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
    backgroundColor: 'transparent',
  },
  surface: {
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
  imageWrapper: {
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  contentPanel: {
    backgroundColor: '#ffffff',
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
  note: {
    fontSize: 13,
    color: '#95a5a6',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 18,
  },
  ctaIcon: {
    width: 20,
    height: 20,
  },
});

export default DonationAdModal;
