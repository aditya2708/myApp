import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import components
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import Button from '../../../../common/components/Button';

// Import API
import { adminShelterSuratApi } from '../../api/adminShelterSuratApi';

const SuratListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { childId, childName } = route.params || {};

  const [suratList, setSuratList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Set navigation title
  useEffect(() => {
    navigation.setOptions({
      title: `Messages - ${childName || 'Anak'}`,
    });
  }, [navigation, childName]);

  // Validate childId
  useEffect(() => {
    if (!childId) {
      setError('Child ID is missing. Please go back and try again.');
      setLoading(false);
    }
  }, [childId]);

  // Fetch surat list
  const fetchSuratList = async () => {
    if (!childId) {
      console.error('fetchSuratList: childId is missing');
      return;
    }

    try {
      setError(null);
      console.log('Fetching surat list for childId:', childId);
      const response = await adminShelterSuratApi.getSuratList(childId);
      console.log('Surat list response:', response.data);
      setSuratList(response.data.data || []);
    } catch (err) {
      console.error('Error fetching surat list:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (childId) {
      fetchSuratList();
    }
  }, [childId]);

  // Handle refresh
  const handleRefresh = () => {
    if (childId) {
      setRefreshing(true);
      fetchSuratList();
    }
  };

  // Navigate to surat detail
  const handleViewSurat = (suratId) => {
    navigation.navigate('SuratDetail', { 
      childId, 
      suratId, 
      childName: childName || 'Anak',
      onGoBack: fetchSuratList 
    });
  };

  // Navigate to compose new surat
  const handleComposeSurat = () => {
    navigation.navigate('SuratForm', { 
      childId, 
      childName: childName || 'Anak',
      onSuccess: fetchSuratList 
    });
  };

  // Handle delete surat
  const handleDeleteSurat = (surat) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await adminShelterSuratApi.deleteSurat(childId, surat.id_surat);
              fetchSuratList();
              Alert.alert('Success', 'Message deleted successfully');
            } catch (err) {
              console.error('Error deleting surat:', err);
              Alert.alert('Error', 'Failed to delete message');
            }
          }
        }
      ]
    );
  };

  // Mark surat as read
  const handleMarkAsRead = async (suratId) => {
    try {
      await adminShelterSuratApi.markAsRead(childId, suratId);
      // Update local state
      setSuratList(prev => 
        prev.map(surat => 
          surat.id_surat === suratId 
            ? { ...surat, is_read: true }
            : surat
        )
      );
    } catch (err) {
      console.error('Error marking surat as read:', err);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render surat item
  const renderSuratItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.suratCard,
        !item.is_read && styles.unreadCard
      ]}
      onPress={() => {
        handleViewSurat(item.id_surat);
        if (!item.is_read) {
          handleMarkAsRead(item.id_surat);
        }
      }}
    >
      <View style={styles.suratHeader}>
        <View style={styles.suratInfo}>
          <Text style={[
            styles.suratDate,
            !item.is_read && styles.unreadText
          ]}>
            {formatDate(item.tanggal)}
          </Text>
          {!item.is_read && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>NEW</Text>
            </View>
          )}
        </View>
        <View style={styles.suratActions}>
          {item.foto && (
            <Ionicons name="image" size={20} color="#f39c12" style={styles.photoIcon} />
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteSurat(item);
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text 
        style={[
          styles.suratMessage,
          !item.is_read && styles.unreadText
        ]}
        numberOfLines={3}
      >
        {item.pesan}
      </Text>
      
      <View style={styles.suratFooter}>
        {item.foto && (
          <View style={styles.attachmentIndicator}>
            <Ionicons name="attach" size={16} color="#666" />
            <Text style={styles.attachmentText}>Photo attached</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color="#cccccc" />
      </View>
    </TouchableOpacity>
  );

  if (!childId) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#e74c3c" />
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorMessage}>Child information is missing</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          type="primary"
          style={styles.goBackButton}
        />
      </View>
    );
  }

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Loading messages..." />;
  }

  return (
    <View style={styles.container}>
      {/* Error Message */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchSuratList}
        />
      )}

      {/* Compose Button */}
      <View style={styles.composeContainer}>
        <Button
          title="Compose Message"
          onPress={handleComposeSurat}
          leftIcon={<Ionicons name="create" size={20} color="white" />}
          type="primary"
        />
      </View>

      {/* Messages List */}
      {suratList.length > 0 ? (
        <FlatList
          data={suratList}
          renderItem={renderSuratItem}
          keyExtractor={(item) => item.id_surat.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="mail-outline" size={60} color="#cccccc" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubText}>
            Start a conversation with the donatur about {childName || 'this child'}
          </Text>
          <Button
            title="Send First Message"
            onPress={handleComposeSurat}
            type="primary"
            style={styles.firstMessageButton}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  composeContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  listContainer: {
    padding: 16,
  },
  suratCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  suratHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suratInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suratDate: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '600',
    color: '#333333',
  },
  unreadBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  suratActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoIcon: {
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  suratMessage: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
    marginBottom: 12,
  },
  suratFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  firstMessageButton: {
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  goBackButton: {
    minWidth: 120,
  },
});

export default SuratListScreen;