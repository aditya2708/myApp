import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ReportSection from './ReportSection';

const TimelineActivityList = ({ items = [] }) => {
  return (
    <ReportSection title="Timeline Aktivitas">
      {items.length ? (
        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.indicator}>
                <View style={[styles.dot, { borderColor: item.statusColor }]}>
                  <View style={[styles.innerDot, { backgroundColor: item.statusColor }]} />
                </View>
                {!item.isLast ? <View style={styles.line} /> : null}
              </View>
              <View style={styles.content}>
                <View style={styles.header}>
                  <Text style={styles.activity} numberOfLines={2}>
                    {item.activity}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${item.statusColor}20` }]}>
                    <Text style={[styles.statusText, { color: item.statusColor }]}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.date}>{item.date}</Text>
                {item.mentor ? (
                  <Text style={styles.meta}>Pendamping: {item.mentor}</Text>
                ) : null}
                {item.verification ? (
                  <Text style={styles.meta}>Status verifikasi: {item.verification}</Text>
                ) : null}
                {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>Belum ada histori aktivitas yang tercatat.</Text>
      )}
    </ReportSection>
  );
};

const styles = StyleSheet.create({
  list: {
    marginTop: 4,
  },
  item: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  indicator: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#dfe6e9',
    marginTop: 4,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  activity: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#95a5a6',
  },
  meta: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 4,
  },
  note: {
    marginTop: 8,
    fontSize: 12,
    color: '#2d3436',
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 13,
    color: '#95a5a6',
  },
});

export default TimelineActivityList;
