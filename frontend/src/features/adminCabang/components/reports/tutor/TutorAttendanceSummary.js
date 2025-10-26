import React, { useMemo } from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';

import ReportSummaryCard from '../../ReportSummaryCard';
import { buildTutorSummaryCards, formatInteger } from '../../../utils/tutorReportHelpers';

const formatRate = (rate) => {
  if (rate === null || rate === undefined || rate === '') {
    return '-';
  }

  const sanitized = typeof rate === 'string' ? rate.replace(/%/g, '').trim() : rate;
  const numericRate = Number(sanitized);

  if (!Number.isFinite(numericRate)) {
    return '-';
  }

  const isFraction = numericRate !== 0 && Math.abs(numericRate) <= 1;
  const normalized = isFraction ? numericRate * 100 : numericRate;
  const rounded = Number(normalized.toFixed(2));

  return `${rounded}%`;
};

const DETAIL_FIELD_ALIASES = {
  activities: [
    'activities',
    'total_activities',
    'totalActivities',
    'activity_count',
    'activities_count',
    'activityCount',
    'activitiesCount',
  ],
  records: ['records', 'total_records', 'totalRecords', 'total', 'count'],
  attended: [
    'attended',
    'total_attended',
    'totalAttended',
    'hadir_total',
    'present_total',
    'presentTotal',
  ],
  present: [
    'present',
    'present_count',
    'presentCount',
    'hadir',
    'hadir_count',
    'hadirCount',
  ],
  late: [
    'late',
    'late_count',
    'lateCount',
    'terlambat',
    'terlambat_count',
    'terlambatCount',
  ],
  absent: [
    'absent',
    'absent_count',
    'absentCount',
    'tidak_hadir',
    'tidakHadir',
    'tidak_hadir_count',
    'tidakHadirCount',
  ],
  rate: [
    'rate',
    'percentage',
    'attendance_rate',
    'attendanceRate',
    'average',
    'average_rate',
    'averageRate',
    'percentage_rate',
    'percentageRate',
  ],
  pending: [
    'pending',
    'unverified',
    'not_verified',
    'notVerified',
    'belum_terverifikasi',
    'belumTerverifikasi',
  ],
  verifiedTotal: [
    'total',
    'records',
    'count',
    'verified',
    'total_verified',
    'totalVerified',
  ],
};

const toNumeric = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const normalized = trimmed.replace(/%/g, '').trim();
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  return null;
};

const parseMetricValue = (rawValue) => {
  if (rawValue === null || rawValue === undefined) {
    return null;
  }

  if (typeof rawValue === 'object' && !Array.isArray(rawValue)) {
    const countCandidate = rawValue.count
      ?? rawValue.total
      ?? rawValue.value
      ?? rawValue.number
      ?? rawValue.qty
      ?? rawValue.quantity
      ?? rawValue.activities
      ?? rawValue.records;
    const percentageCandidate = rawValue.percentage
      ?? rawValue.percent
      ?? rawValue.rate
      ?? rawValue.ratio
      ?? rawValue.percentage_value
      ?? rawValue.percentageValue;

    const count = toNumeric(countCandidate);
    const percentage = toNumeric(percentageCandidate);

    return {
      count,
      percentage,
    };
  }

  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.endsWith('%')) {
      const numeric = toNumeric(trimmed);
      return {
        count: null,
        percentage: numeric,
      };
    }

    const numeric = toNumeric(trimmed);
    return numeric === null
      ? null
      : {
        count: numeric,
        percentage: null,
      };
  }

  if (typeof rawValue === 'number') {
    return Number.isFinite(rawValue)
      ? { count: rawValue, percentage: null }
      : null;
  }

  return null;
};

const findMetricInSource = (source, aliases = []) => {
  if (!source || typeof source !== 'object') {
    return null;
  }

  for (const alias of aliases) {
    if (source[alias] !== undefined && source[alias] !== null) {
      const parsed = parseMetricValue(source[alias]);
      if (parsed) {
        return parsed;
      }
    }
  }

  return null;
};

const extractMetricValue = (primarySource, fallbackSource, aliases = []) => {
  const primaryMetric = findMetricInSource(primarySource, aliases);
  if (primaryMetric) {
    return primaryMetric;
  }

  if (fallbackSource && fallbackSource !== primarySource) {
    return findMetricInSource(fallbackSource, aliases);
  }

  return null;
};

const formatCountValue = (value, fallbackZero = true) => {
  const formatted = formatInteger(value);
  if (formatted === '-' && fallbackZero) {
    return '0';
  }
  return formatted;
};

const formatDetailMetricValue = (metric, { type = 'count', fallbackZero = true } = {}) => {
  if (!metric) {
    if (type === 'rate' || type === 'percentage') {
      return fallbackZero ? '0%' : '-';
    }
    if (type === 'combined') {
      return fallbackZero ? '0 (0%)' : '-';
    }
    return fallbackZero ? '0' : '-';
  }

  if (type === 'rate') {
    const rateSource = metric.percentage ?? metric.count;
    const formattedRate = formatRate(rateSource);
    return formattedRate === '-' && fallbackZero ? '0%' : formattedRate;
  }

  const formattedCount = formatCountValue(metric.count, fallbackZero);
  const percentageValue = metric.percentage;
  const formattedPercentage = percentageValue !== null && percentageValue !== undefined
    ? formatRate(percentageValue)
    : null;
  const hasPercentage = formattedPercentage && formattedPercentage !== '-';

  if (type === 'percentage') {
    if (hasPercentage) {
      return formattedPercentage;
    }
    return fallbackZero ? '0%' : '-';
  }

  if (type === 'combined') {
    if (hasPercentage && formattedCount !== '-') {
      return `${formattedCount} (${formattedPercentage})`;
    }
    if (hasPercentage) {
      return formattedPercentage;
    }
    return formattedCount;
  }

  return formattedCount;
};

const createDetailSection = (id, title, primarySource, fallbackSource, fields = []) => ({
  id,
  title,
  rows: fields.map((field) => {
    const metric = extractMetricValue(primarySource, fallbackSource, field.aliases);
    const value = formatDetailMetricValue(metric, {
      type: field.type,
      fallbackZero: field.fallbackZero !== false,
    });

    return {
      key: `${id}-${field.key || field.aliases?.[0] || field.label}`,
      label: field.label,
      value,
    };
  }),
});

const totalsFieldConfigs = [
  {
    key: 'activities',
    label: 'Total Aktivitas',
    aliases: DETAIL_FIELD_ALIASES.activities,
  },
  {
    key: 'records',
    label: 'Total Catatan Kehadiran',
    aliases: DETAIL_FIELD_ALIASES.records,
  },
  {
    key: 'attended',
    label: 'Tutor Hadir',
    aliases: [...DETAIL_FIELD_ALIASES.attended, ...DETAIL_FIELD_ALIASES.present],
  },
  {
    key: 'late',
    label: 'Tutor Terlambat',
    aliases: DETAIL_FIELD_ALIASES.late,
  },
  {
    key: 'absent',
    label: 'Tutor Tidak Hadir',
    aliases: DETAIL_FIELD_ALIASES.absent,
  },
  {
    key: 'rate',
    label: 'Persentase Kehadiran',
    aliases: DETAIL_FIELD_ALIASES.rate,
    type: 'rate',
  },
];

const breakdownFieldConfigs = [
  {
    key: 'breakdown-present',
    label: 'Hadir',
    aliases: DETAIL_FIELD_ALIASES.present,
    type: 'combined',
  },
  {
    key: 'breakdown-late',
    label: 'Terlambat',
    aliases: DETAIL_FIELD_ALIASES.late,
    type: 'combined',
  },
  {
    key: 'breakdown-absent',
    label: 'Tidak Hadir',
    aliases: DETAIL_FIELD_ALIASES.absent,
    type: 'combined',
  },
];

const verifiedFieldConfigs = [
  {
    key: 'verified-total',
    label: 'Total Terverifikasi',
    aliases: DETAIL_FIELD_ALIASES.verifiedTotal,
    type: 'combined',
  },
  {
    key: 'verified-present',
    label: 'Hadir Terverifikasi',
    aliases: DETAIL_FIELD_ALIASES.present,
    type: 'combined',
  },
  {
    key: 'verified-late',
    label: 'Terlambat Terverifikasi',
    aliases: DETAIL_FIELD_ALIASES.late,
    type: 'combined',
  },
  {
    key: 'verified-absent',
    label: 'Tidak Hadir Terverifikasi',
    aliases: DETAIL_FIELD_ALIASES.absent,
    type: 'combined',
  },
  {
    key: 'verified-rate',
    label: 'Persentase Terverifikasi',
    aliases: DETAIL_FIELD_ALIASES.rate,
    type: 'rate',
  },
  {
    key: 'verified-pending',
    label: 'Belum Terverifikasi',
    aliases: DETAIL_FIELD_ALIASES.pending,
    type: 'combined',
  },
];

const buildAttendanceDetailSections = (summary) => {
  if (!summary || typeof summary !== 'object') {
    return [];
  }

  const detailSource = summary.attendance_detail
    ?? summary.attendance
    ?? null;

  const detail = detailSource && typeof detailSource === 'object' ? detailSource : {};
  const totalsSource = detail.totals && typeof detail.totals === 'object' ? detail.totals : detail;
  const breakdownSource = detail.breakdown && typeof detail.breakdown === 'object' ? detail.breakdown : {};
  const verifiedSource = detail.verified && typeof detail.verified === 'object' ? detail.verified : {};

  return [
    createDetailSection('totals', 'Rekap Total Kehadiran', totalsSource, detail, totalsFieldConfigs),
    createDetailSection('breakdown', 'Rincian Status Kehadiran', breakdownSource, detail, breakdownFieldConfigs),
    createDetailSection('verified', 'Verifikasi Kehadiran', verifiedSource, detail, verifiedFieldConfigs),
  ];
};

const TutorAttendanceSummary = ({ summary, style }) => {
  const cards = useMemo(() => {
    const baseCards = buildTutorSummaryCards(summary);
    return baseCards.map((card) => (
      card.id === 'average-attendance-rate'
        ? { ...card, value: formatRate(card.value) }
        : card
    ));
  }, [summary]);
  const detailSections = useMemo(
    () => buildAttendanceDetailSections(summary),
    [summary],
  );
  const { width } = useWindowDimensions();
  const isCompact = width < 720;

  if (!cards.length) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.title}>Ringkasan Kehadiran Tutor</Text>
        <Text style={styles.subtitle}>Ikhtisar performa tutor cabang berdasarkan filter aktif.</Text>
      </View>

      <View style={[styles.cardsGrid, isCompact && styles.cardsGridCompact]}>
        {cards.map((card) => (
          <View
            key={card.id}
            style={[styles.cardWrapper, isCompact && styles.cardWrapperCompact]}
          >
            <ReportSummaryCard
              icon={card.icon}
              label={card.label}
              value={card.value}
              description={card.description}
              color={card.color}
              variant={isCompact ? 'compact' : 'default'}
            />
          </View>
        ))}
      </View>

      {detailSections.length ? (
        <View style={[styles.detailGrid, isCompact && styles.detailGridCompact]}>
          {detailSections.map((section) => (
            <View
              key={section.id}
              style={[styles.detailSectionWrapper, isCompact && styles.detailSectionWrapperCompact]}
            >
              <View style={styles.detailCard}>
                <Text style={styles.detailSectionTitle}>{section.title}</Text>
                <View style={styles.detailRows}>
                  {section.rows.map((row) => (
                    <View key={row.key} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{row.label}</Text>
                      <Text style={styles.detailValue}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  cardsGridCompact: {
    flexDirection: 'column',
    marginHorizontal: 0,
  },
  cardWrapper: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  cardWrapperCompact: {
    width: '100%',
    paddingHorizontal: 0,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  detailGridCompact: {
    flexDirection: 'column',
    marginHorizontal: 0,
  },
  detailSectionWrapper: {
    width: '33.33%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  detailSectionWrapperCompact: {
    width: '100%',
    paddingHorizontal: 0,
  },
  detailCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 12,
  },
  detailSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  detailRows: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailLabel: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
});

export default TutorAttendanceSummary;
