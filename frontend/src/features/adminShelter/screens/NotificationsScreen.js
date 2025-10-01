import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotifications,
  markNotificationAsRead,
  selectMarkingNotificationIds,
  selectNotificationError,
  selectNotificationStatus,
  selectNotifications,
} from '../redux/notificationSlice';

const formatDateTime = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return String(timestamp);
  }

  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const NotificationsScreen = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const status = useSelector(selectNotificationStatus);
  const error = useSelector(selectNotificationError);
  const markingIds = useSelector(selectMarkingNotificationIds);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchNotifications());
    }, [dispatch])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(fetchNotifications())
      .finally(() => {
        setRefreshing(false);
      });
  }, [dispatch]);

  const handleNotificationPress = useCallback(
    (notification) => {
      if (notification.is_read) {
        return;
      }

      const notificationId = notification.id ?? notification.notification_id;
      if (!notificationId) {
        return;
      }

      const normalizedId = String(notificationId);
      if (markingIds.includes(normalizedId)) {
        return;
      }

      dispatch(markNotificationAsRead(normalizedId));
    },
    [dispatch, markingIds]
  );

  const renderNotificationItem = useCallback(
    ({ item }) => {
      const isUpdating = markingIds.includes(String(item.id));

      return (
        <TouchableOpacity
          style={[styles.card, !item.is_read && styles.unreadCard]}
          activeOpacity={0.8}
          onPress={() => handleNotificationPress(item)}
        >
          <View style={styles.iconWrapper}>
            <Ionicons
              name={item.is_read ? 'notifications' : 'notifications-outline'}
              size={22}
              color={item.is_read ? '#4caf50' : '#f39c12'}
            />
          </View>
          <View style={styles.contentWrapper}>
            <Text style={[styles.title, !item.is_read && styles.unreadTitle]} numberOfLines={2}>
              {item.title || 'Pembaruan Kurikulum'}
            </Text>
            {item.message ? (
              <Text style={styles.message} numberOfLines={3}>
                {item.message}
              </Text>
            ) : null}
            {item.created_at || item.updated_at ? (
              <Text style={styles.timestamp}>
                {formatDateTime(item.created_at || item.updated_at)}
              </Text>
            ) : null}
          </View>
          {!item.is_read && !isUpdating ? <View style={styles.unreadDot} /> : null}
          {isUpdating ? <ActivityIndicator size="small" color="#1976d2" style={styles.loader} /> : null}
        </TouchableOpacity>
      );
    },
    [handleNotificationPress, markingIds]
  );

  const keyExtractor = useCallback((item, index) => {
    if (item.id !== undefined && item.id !== null) {
      return String(item.id);
    }

    if (item.notification_id !== undefined && item.notification_id !== null) {
      return String(item.notification_id);
    }

    return `notification-${index}`;
  }, []);

  const listEmptyComponent = (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="notifications-off" size={48} color="#b0bec5" style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>Belum ada notifikasi</Text>
      <Text style={styles.emptySubtitle}>Semua notifikasi terbaru akan tampil di sini.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={notifications}
        keyExtractor={keyExtractor}
        renderItem={renderNotificationItem}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyListContent : styles.listContent
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1976d2" />
        }
        ListEmptyComponent={status === 'loading' ? null : listEmptyComponent}
        ListHeaderComponent={
          status === 'failed' && error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#e53935" style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null
        }
      />
      {status === 'loading' && notifications.length === 0 ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1976d2" />
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
    backgroundColor: '#eef5ff',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    marginRight: 12,
  },
  contentWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#263238',
    marginBottom: 4,
  },
  unreadTitle: {
    color: '#0d47a1',
  },
  message: {
    fontSize: 13,
    color: '#546e7a',
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 12,
    color: '#90a4ae',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e53935',
    marginLeft: 10,
  },
  loader: {
    marginLeft: 10,
  },
  emptyStateContainer: {
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#37474f',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#90a4ae',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdecea',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    color: '#c62828',
    flex: 1,
    fontSize: 13,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationsScreen;
