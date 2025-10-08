import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

const FALLBACK_STATUS = {
  label: 'Status',
  icon: 'ellipse-outline',
  color: '#636e72',
};

const StudentAttendanceRow = ({
  student,
  onPress,
  renderRightActions,
  containerStyle,
  contentStyle,
  showDivider,
}) => {
  const statusMeta = useMemo(() => {
    if (!student) {
      return FALLBACK_STATUS;
    }

    const color = student?.statusColor || FALLBACK_STATUS.color;

    return {
      label: student?.statusLabel || student?.status || FALLBACK_STATUS.label,
      icon: student?.statusIcon || FALLBACK_STATUS.icon,
      color,
    };
  }, [student]);

  const RowContent = (
    <TouchableOpacity
      style={[styles.row, contentStyle]}
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={[styles.statusIconWrapper, { backgroundColor: `${statusMeta.color}1a` }]}>
        <Ionicons name={statusMeta.icon} size={22} color={statusMeta.color} />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.name}>{student?.name || 'Tanpa Nama'}</Text>
        {student?.identifier ? (
          <Text style={styles.identifier}>{student.identifier}</Text>
        ) : null}
        {student?.note ? <Text style={styles.note}>{student.note}</Text> : null}
      </View>

      <View style={styles.statusSection}>
        <Text style={[styles.statusLabel, { color: statusMeta.color }]}>{statusMeta.label}</Text>
        {student?.timeLabel ? (
          <Text style={styles.timeLabel}>{student.timeLabel}</Text>
        ) : null}
        {!student?.timeLabel && student?.timestampLabel ? (
          <Text style={styles.timeLabel}>{student.timestampLabel}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const ContentWithDivider = (
    <View style={[styles.container, containerStyle]}>
      {RowContent}
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );

  if (renderRightActions) {
    return (
      <Swipeable overshootRight={false} renderRightActions={renderRightActions}>
        {ContentWithDivider}
      </Swipeable>
    );
  }

  return ContentWithDivider;
};

StudentAttendanceRow.defaultProps = {
  student: null,
  onPress: undefined,
  renderRightActions: undefined,
  containerStyle: null,
  contentStyle: null,
  showDivider: true,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  statusIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoSection: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
  },
  identifier: {
    marginTop: 4,
    fontSize: 12,
    color: '#636e72',
  },
  note: {
    marginTop: 6,
    fontSize: 12,
    color: '#636e72',
  },
  statusSection: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  timeLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#636e72',
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ecf0f1',
    marginLeft: 52,
  },
});

export default StudentAttendanceRow;
