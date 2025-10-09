import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import ShelterActivityCard from './ShelterActivityCard';

const WeeklyActivityList = ({
  activities,
  onActivityPress,
  onLoadMore,
  isLoading,
  isFetchingMore,
  pagination,
  ListHeaderComponent,
  ListEmptyComponent,
  contentContainerStyle,
  refreshing,
  onRefresh,
  testID,
}) => {
  const keyExtractor = useCallback(
    (item, index) => item?.id?.toString() || item?.name || `activity-${index}`,
    [],
  );

  const handleEndReached = useCallback(() => {
    if (!pagination?.hasNextPage || !onLoadMore) {
      return;
    }

    onLoadMore();
  }, [onLoadMore, pagination?.hasNextPage]);

  const renderItem = useCallback(
    ({ item }) => (
      <ShelterActivityCard
        activity={item}
        onPress={onActivityPress ? () => onActivityPress(item) : undefined}
      />
    ),
    [onActivityPress],
  );

  const footerComponent = useMemo(() => {
    if (!isFetchingMore) {
      return null;
    }

    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator color="#0984e3" />
      </View>
    );
  }, [isFetchingMore]);

  const defaultEmptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#0984e3" />
          <Text style={styles.emptyText}>Memuat aktivitas...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Belum ada aktivitas</Text>
        <Text style={styles.emptyText}>
          Aktivitas belum tersedia untuk periode atau filter yang dipilih.
        </Text>
      </View>
    );
  }, [isLoading]);

  const resolvedEmptyComponent = useMemo(() => {
    if (ListEmptyComponent) {
      return ListEmptyComponent;
    }

    return defaultEmptyComponent;
  }, [ListEmptyComponent, defaultEmptyComponent]);

  return (
    <FlatList
      data={activities}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeaderComponent || null}
      ListEmptyComponent={resolvedEmptyComponent}
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      ListFooterComponent={footerComponent}
      refreshControl={
        onRefresh
          ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                colors={["#0984e3"]}
              />
            )
          : undefined
      }
      testID={testID || 'weekly-activity-list'}
    />
  );
};

WeeklyActivityList.defaultProps = {
  activities: [],
  onActivityPress: undefined,
  onLoadMore: undefined,
  isLoading: false,
  isFetchingMore: false,
  pagination: null,
  ListHeaderComponent: null,
  ListEmptyComponent: null,
  contentContainerStyle: null,
  refreshing: false,
  onRefresh: undefined,
  testID: undefined,
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#636e72',
    lineHeight: 18,
    textAlign: 'center',
  },
  footerLoading: {
    paddingVertical: 16,
  },
});

export default WeeklyActivityList;
