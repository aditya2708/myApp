import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';

// Import components
import TextInput from '../../../../common/components/TextInput';
import Button from '../../../../common/components/Button';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';

// Import API
import { adminShelterSuratApi } from '../../api/adminShelterSuratApi';

const SuratFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { childId, childName, replyTo, editSurat, isEdit = false, onSuccess } = route.params;

  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Set navigation title
  useEffect(() => {
    const title = isEdit ? `Edit Message - ${childName}` : 
                  replyTo ? `Reply - ${childName}` : 
                  `New Message - ${childName}`;
    navigation.setOptions({ title });
  }, [navigation, childName, replyTo, isEdit]);

  // Initialize form data
  useEffect(() => {
    if (isEdit && editSurat) {
      setMessage(editSurat.pesan);
      if (editSurat.foto_url) {
        setSelectedImage(editSurat.foto_url);
      }
    } else if (replyTo) {
      const replyPrefix = `Replying to: "${replyTo.pesan.substring(0, 50)}${replyTo.pesan.length > 50 ? '...' : ''}"\n\n`;
      setMessage(replyPrefix);
    }
  }, [isEdit, editSurat, replyTo]);

  // Handle image selection
  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera roll permission is required to attach photos',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Select Photo',
        'Choose a photo to attach to your message',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Camera Roll', onPress: () => openImagePicker() },
          { text: 'Camera', onPress: () => openCamera() },
        ]
      );
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Error', 'Failed to request permission');
    }
  };

  // Open image picker
  const openImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Open camera
  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove the attached photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => setSelectedImage(null) },
      ]
    );
  };

  // Handle send/update message
  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please enter a message');
      return;
    }

    if (message.trim().length < 10) {
      Alert.alert('Message Too Short', 'Please enter at least 10 characters');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('pesan', message.trim());

      // Add image if selected
      if (selectedImage && selectedImage.uri) {
        const filename = selectedImage.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('foto', {
          uri: selectedImage.uri,
          name: filename,
          type,
        });
      }

      if (isEdit && editSurat) {
        await adminShelterSuratApi.updateSurat(childId, editSurat.id_surat, formData);
      } else {
        await adminShelterSuratApi.createSurat(childId, formData);
      }

      Alert.alert(
        'Success',
        isEdit ? 'Message updated successfully' : 'Message sent successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              if (onSuccess) onSuccess();
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting message:', error);
      Alert.alert(
        'Error',
        isEdit ? 'Failed to update message. Please try again.' : 'Failed to send message. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (message.trim() || selectedImage) {
      Alert.alert(
        'Discard Message',
        'Are you sure you want to discard this message?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <Text style={styles.recipientLabel}>To:</Text>
          <Text style={styles.recipientText}>Donatur</Text>
          <Text style={styles.subjectLabel}>About:</Text>
          <Text style={styles.subjectText}>{childName}</Text>
        </View>

        {/* Reply Context */}
        {replyTo && (
          <View style={styles.replyContext}>
            <Text style={styles.replyLabel}>Replying to:</Text>
            <Text style={styles.replyText} numberOfLines={3}>
              {replyTo.pesan}
            </Text>
          </View>
        )}

        {/* Message Input */}
        <View style={styles.messageContainer}>
          <Text style={styles.inputLabel}>Message *</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message here..."
            multiline
            inputProps={{
              numberOfLines: 8,
              textAlignVertical: 'top',
              style: styles.messageInput,
            }}
            style={styles.messageInputContainer}
          />
          <Text style={styles.characterCount}>
            {message.length}/1000 characters
          </Text>
        </View>

        {/* Photo Attachment */}
        <View style={styles.attachmentContainer}>
          <Text style={styles.attachmentLabel}>Photo Attachment (Optional)</Text>
          
          {selectedImage ? (
            <View style={styles.selectedImageContainer}>
              <Image
                source={{ uri: selectedImage.uri || selectedImage }}
                style={styles.selectedImage}
                resizeMode="cover"
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <Ionicons name="close-circle" size={24} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.selectImageButton}
              onPress={handleSelectImage}
            >
              <Ionicons name="camera" size={24} color="#e74c3c" />
              <Text style={styles.selectImageText}>Add Photo</Text>
            </TouchableOpacity>
          )}
          
          {selectedImage && (
            <Button
              title="Change Photo"
              onPress={handleSelectImage}
              type="outline"
              size="small"
              style={styles.changePhotoButton}
            />
          )}
        </View>

        {/* Guidelines */}
        <View style={styles.guidelines}>
          <Text style={styles.guidelinesTitle}>Message Guidelines:</Text>
          <Text style={styles.guidelineItem}>• Be professional and informative</Text>
          <Text style={styles.guidelineItem}>• Share child's progress and activities</Text>
          <Text style={styles.guidelineItem}>• Include relevant photos when possible</Text>
          <Text style={styles.guidelineItem}>• Maintain child privacy and safety</Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Button
          title="Cancel"
          onPress={handleCancel}
          type="outline"
          style={styles.cancelButton}
          disabled={loading}
        />
        <Button
          title={isEdit ? "Update Message" : "Send Message"}
          onPress={handleSubmit}
          type="primary"
          style={styles.sendButton}
          loading={loading}
          disabled={loading || !message.trim()}
          leftIcon={<Ionicons name={isEdit ? "checkmark" : "send"} size={20} color="white" />}
        />
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner message={isEdit ? "Updating message..." : "Sending message..."} />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  headerInfo: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recipientLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  recipientText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  subjectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  subjectText: {
    fontSize: 16,
    color: '#333333',
  },
  replyContext: {
    backgroundColor: '#f0f0f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  replyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 8,
  },
  replyText: {
    fontSize: 14,
    color: '#333333',
    fontStyle: 'italic',
  },
  messageContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  messageInputContainer: {
    marginBottom: 8,
  },
  messageInput: {
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
  },
  attachmentContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  attachmentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  selectImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#e74c3c',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  selectImageText: {
    fontSize: 16,
    color: '#e74c3c',
    marginLeft: 8,
    fontWeight: '500',
  },
  selectedImageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  changePhotoButton: {
    alignSelf: 'center',
    width: 150,
  },
  guidelines: {
    backgroundColor: '#fff3f3',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 8,
  },
  guidelineItem: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  sendButton: {
    flex: 2,
    marginLeft: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});

export default SuratFormScreen;