import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import TutorAttendanceCard from './TutorAttendanceCard';
import TutorAttendanceSummary from './TutorAttendanceSummary';

const TutorAttendanceList = ({
  tutors,
  summary,
  refreshing,
  onRefresh,
  onTutorPress,
  ListEmptyComponent,
  renderHeader,
  onEndReached,
  onEndReachedThreshold,
  loadingMore,
  ListFooterComponent,
}) => {
  const contentStyle = useMemo(() => {
    const base = [styles.content];
    if (!tutors || tutors.length === 0) {
      base.push(styles.emptyContent);
    } else {
      base.push(styles.contentWithItems);
    }
    return base;
  }, [tutors]);

  return (
    <FlatList
      data={tutors}
      keyExtractor={(item, index) => (item.id_tutor ? item.id_tutor.toString() : `tutor-${index}`)}
      renderItem={({ item }) => (
        <TutorAttendanceCard
          tutor={item}
          onPress={() => onTutorPress?.(item)}
        />
      )}
      contentContainerStyle={contentStyle}
      ListHeaderComponent={renderHeader
        ? renderHeader({ summary, tutors })
        : summary ? (
          <View style={styles.headerWrapper}>
            <TutorAttendanceSummary summary={summary} />
          </View>
        ) : null}
      ListEmptyComponent={ListEmptyComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold ?? 0.2}
      ListFooterComponent={ListFooterComponent ?? (loadingMore ? (
        <View style={styles.footerWrapper}>
          <ActivityIndicator size="small" color="#2563eb" />
        </View>
      ) : null)}
      refreshControl={(
        <RefreshControl
          refreshing={Boolean(refreshing)}
          onRefresh={onRefresh}
        />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 12,
  },
  emptyContent: {
    flexGrow: 1,
  },
  contentWithItems: {
    paddingBottom: 48,
  },
  headerWrapper: {
    marginBottom: 12,
  },
  footerWrapper: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default TutorAttendanceList;
