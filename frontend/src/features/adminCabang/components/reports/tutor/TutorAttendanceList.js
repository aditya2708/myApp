import React, { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

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
}) => {
  const contentStyle = useMemo(() => {
    const base = [styles.content];
    if (!tutors || tutors.length === 0) {
      base.push(styles.emptyContent);
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
    paddingBottom: 48,
    gap: 12,
  },
  emptyContent: {
    flexGrow: 1,
  },
  headerWrapper: {
    marginBottom: 12,
  },
});

export default TutorAttendanceList;
