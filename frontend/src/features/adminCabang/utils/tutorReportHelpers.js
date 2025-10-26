export const DEFAULT_FILTERS = {
  date_from: null,
  date_to: null,
  jenis_kegiatan: 'all',
  wilbin_id: 'all',
  shelter_id: 'all',
};

const CATEGORY_LABELS = {
  high: 'Baik',
  medium: 'Sedang',
  low: 'Rendah',
  no_data: 'Tidak Ada Data',
};

export const deriveCategoryFromRate = (rate) => {
  if (typeof rate !== 'number' || Number.isNaN(rate)) {
    return 'no_data';
  }

  if (rate >= 80) {
    return 'high';
  }

  if (rate >= 60) {
    return 'medium';
  }

  if (rate >= 0) {
    return 'low';
  }

  return 'no_data';
};

export const deriveCategoryLabel = (category) => CATEGORY_LABELS[category] || CATEGORY_LABELS.no_data;

export const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export const toIntegerOrZero = (value) => {
  const numeric = toNumberOrNull(value);
  return numeric === null ? 0 : Math.round(numeric);
};

export const formatInteger = (value) => {
  const numeric = toNumberOrNull(value);
  if (numeric === null) {
    return '-';
  }

  return Math.round(numeric).toLocaleString('id-ID');
};

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);


export const normalizeTutorRecord = (tutor = {}, index = 0) => {
  const attendance = tutor.attendance
    ?? tutor.raw?.attendance
    ?? {};
  const verifiedAttendance = attendance?.verified ?? {};
  const attendanceBreakdown = attendance?.breakdown ?? {};
  const attendanceTotals = attendance?.totals ?? {};

  const attendanceRate = toNumberOrNull(
    attendance?.rate
      ?? verifiedAttendance?.rate
      ?? tutor.attendanceRate
      ?? tutor.attendance_rate
      ?? tutor.attendanceRateValue
      ?? tutor.raw?.attendance_rate
      ?? tutor.raw?.attendanceRate,
  );

  const present = toIntegerOrZero(
    verifiedAttendance.present
      ?? attendanceBreakdown.present
      ?? tutor.presentCount
      ?? tutor.present_count
      ?? tutor.raw?.present_count
      ?? tutor.raw?.present,
  );

  const late = toIntegerOrZero(
    verifiedAttendance.late
      ?? attendanceBreakdown.late
      ?? tutor.lateCount
      ?? tutor.late_count
      ?? tutor.raw?.late_count
      ?? tutor.raw?.late,
  );

  const absent = toIntegerOrZero(
    verifiedAttendance.absent
      ?? attendanceBreakdown.absent
      ?? tutor.absentCount
      ?? tutor.absent_count
      ?? tutor.raw?.absent_count
      ?? tutor.raw?.absent,
  );

  const totalActivities = toNumberOrNull(
    attendanceTotals.activities
      ?? attendanceTotals.total
      ?? verifiedAttendance.total
      ?? tutor.totalActivities
      ?? tutor.total_activities
      ?? tutor.raw?.total_activities
      ?? tutor.raw?.totalActivities,
  ) ?? present + late + absent;

  const id = tutor.id
    ?? tutor.id_tutor
    ?? tutor.user_id
    ?? tutor.code
    ?? tutor.tutorId
    ?? tutor.raw?.id
    ?? tutor.raw?.tutor_id
    ?? tutor.raw?.user_id
    ?? `tutor-${index}`;

  const name = tutor.name
    ?? tutor.nama
    ?? tutor.raw?.name
    ?? tutor.raw?.nama
    ?? 'Tutor';

  const shelterName = tutor.shelterName
    ?? tutor.shelter_name
    ?? tutor.shelter?.name
    ?? tutor.shelter?.nama
    ?? tutor.raw?.shelter_name
    ?? tutor.raw?.shelterName
    ?? tutor.raw?.shelter?.name
    ?? tutor.raw?.shelter?.nama
    ?? tutor.raw?.location
    ?? tutor.raw?.branch
    ?? null;

  const category = tutor.category
    ?? tutor.raw?.category
    ?? deriveCategoryFromRate(attendanceRate);

  const categoryLabel = tutor.category_label
    ?? tutor.categoryLabel
    ?? tutor.raw?.category_label
    ?? deriveCategoryLabel(category);

  return {
    ...tutor,
    id_tutor: id,
    nama: name,
    maple: shelterName,
    attendance_rate: attendanceRate,
    category,
    category_label: categoryLabel,
    total_activities: totalActivities,
    present_count: present,
    late_count: late,
    absent_count: absent,
  };
};

const DEFAULT_DISTRIBUTION = {
  high: { count: 0, percentage: 0 },
  medium: { count: 0, percentage: 0 },
  low: { count: 0, percentage: 0 },
  no_data: { count: 0, percentage: 0 },
};

const normalizeDistributionEntry = (entry) => {
  if (!entry || typeof entry !== 'object') {
    return { count: 0, percentage: 0 };
  }

  const count = toIntegerOrZero(firstDefined(entry.count, entry.total, entry.value));
  const percentageValue = toNumberOrNull(firstDefined(entry.percentage, entry.percent, entry.rate));

  return {
    count,
    percentage: percentageValue === null ? 0 : Number(percentageValue.toFixed(2)),
  };
};

const toOptionalInteger = (value) => {
  const numeric = toNumberOrNull(value);
  return numeric === null ? null : Math.round(numeric);
};

const hasValue = (value) => {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  return true;
};

const assignIntegerField = (target, key, candidate, fallbackValue) => {
  if (hasValue(target[key])) {
    return;
  }

  if (candidate !== null) {
    target[key] = candidate;
    return;
  }

  if (fallbackValue !== undefined) {
    target[key] = fallbackValue;
  }
};

const assignRateField = (target, candidate, fallbackValue) => {
  if (hasValue(target.rate)) {
    return;
  }

  if (candidate !== null) {
    target.rate = candidate;
    return;
  }

  if (fallbackValue !== undefined) {
    target.rate = fallbackValue;
  }
};

const buildAttendanceDetailFromTutors = (tutors = []) => {
  if (!Array.isArray(tutors) || tutors.length === 0) {
    return {
      activities: 0,
      records: 0,
      attended: 0,
      rate: 0,
    };
  }

  const totals = tutors.reduce((acc, tutor, index) => {
    if (!tutor || typeof tutor !== 'object') {
      return acc;
    }

    const normalized = normalizeTutorRecord(tutor, index);
    const present = toIntegerOrZero(normalized.present_count);
    const late = toIntegerOrZero(normalized.late_count);
    const absent = toIntegerOrZero(normalized.absent_count);
    const totalActivities = toOptionalInteger(normalized.total_activities);

    const records = present + late + absent;

    acc.records += records;
    acc.attended += present + late;
    acc.activities += totalActivities === null ? records : totalActivities;

    return acc;
  }, {
    activities: 0,
    records: 0,
    attended: 0,
  });

  const rate = totals.records > 0
    ? Number(((totals.attended / totals.records) * 100).toFixed(2))
    : 0;

  return {
    activities: totals.activities,
    records: totals.records,
    attended: totals.attended,
    rate,
  };
};

const normalizeAttendanceDetail = (
  attendanceSource,
  fallback = { activities: 0, records: 0, attended: 0, rate: 0 },
) => {
  const base = {
    activities: fallback?.activities ?? 0,
    records: fallback?.records ?? 0,
    attended: fallback?.attended ?? 0,
    rate: fallback?.rate ?? 0,
  };

  if (!attendanceSource || typeof attendanceSource !== 'object') {
    return { ...base };
  }

  const normalizedDetail = { ...attendanceSource };

  const directAttended = toOptionalInteger(firstDefined(
    attendanceSource.attended,
    attendanceSource.total_attended,
    attendanceSource.totalAttended,
  ));

  const presentValue = toOptionalInteger(firstDefined(
    attendanceSource.present,
    attendanceSource.present_count,
    attendanceSource.presentCount,
    attendanceSource.hadir,
    attendanceSource.hadir_count,
    attendanceSource.total_hadir,
    attendanceSource.totalHadir,
    attendanceSource?.verified?.present,
    attendanceSource?.verified?.present_count,
    attendanceSource?.verified?.presentCount,
    attendanceSource?.breakdown?.present,
    attendanceSource?.breakdown?.present_count,
    attendanceSource?.breakdown?.presentCount,
    attendanceSource?.totals?.present,
    attendanceSource?.totals?.present_count,
    attendanceSource?.totals?.presentCount,
  ));

  const lateValue = toOptionalInteger(firstDefined(
    attendanceSource.late,
    attendanceSource.late_count,
    attendanceSource.lateCount,
    attendanceSource.terlambat,
    attendanceSource.terlambat_count,
    attendanceSource.total_terlambat,
    attendanceSource.totalTerlambat,
    attendanceSource?.verified?.late,
    attendanceSource?.verified?.late_count,
    attendanceSource?.verified?.lateCount,
    attendanceSource?.breakdown?.late,
    attendanceSource?.breakdown?.late_count,
    attendanceSource?.breakdown?.lateCount,
    attendanceSource?.totals?.late,
    attendanceSource?.totals?.late_count,
    attendanceSource?.totals?.lateCount,
  ));

  const absentValue = toOptionalInteger(firstDefined(
    attendanceSource.absent,
    attendanceSource.absent_count,
    attendanceSource.absentCount,
    attendanceSource.tidakHadir,
    attendanceSource.tidak_hadir,
    attendanceSource.total_tidak_hadir,
    attendanceSource.totalTidakHadir,
    attendanceSource?.verified?.absent,
    attendanceSource?.verified?.absent_count,
    attendanceSource?.verified?.absentCount,
    attendanceSource?.breakdown?.absent,
    attendanceSource?.breakdown?.absent_count,
    attendanceSource?.breakdown?.absentCount,
    attendanceSource?.totals?.absent,
    attendanceSource?.totals?.absent_count,
    attendanceSource?.totals?.absentCount,
  ));

  const derivedAttended = directAttended !== null
    ? directAttended
    : (presentValue ?? 0) + (lateValue ?? 0);

  const recordsCandidate = toOptionalInteger(firstDefined(
    attendanceSource.records,
    attendanceSource.total_records,
    attendanceSource.totalRecords,
    attendanceSource.records_count,
    attendanceSource.recordsCount,
    attendanceSource.total,
    attendanceSource.count,
    attendanceSource?.verified?.total,
    attendanceSource?.totals?.total,
    attendanceSource?.totals?.records,
    attendanceSource?.totals?.activities,
    attendanceSource?.breakdown?.total,
  ));

  const derivedRecords = recordsCandidate !== null
    ? recordsCandidate
    : (presentValue ?? 0) + (lateValue ?? 0) + (absentValue ?? 0);

  const activitiesCandidate = toOptionalInteger(firstDefined(
    attendanceSource.activities,
    attendanceSource.total_activities,
    attendanceSource.totalActivities,
    attendanceSource.activity_count,
    attendanceSource.activities_count,
    attendanceSource.activityCount,
    attendanceSource.activitiesCount,
    attendanceSource.total,
    attendanceSource.count,
    attendanceSource?.totals?.activities,
    attendanceSource?.totals?.total,
  ));

  const derivedActivities = activitiesCandidate !== null
    ? activitiesCandidate
    : derivedRecords;

  const rateCandidate = normalizeTutorPercentageValue(firstDefined(
    attendanceSource.rate,
    attendanceSource.percentage,
    attendanceSource.attendance_rate,
    attendanceSource.attendanceRate,
    attendanceSource.average,
    attendanceSource.average_rate,
    attendanceSource.averageRate,
    attendanceSource?.verified?.rate,
    attendanceSource?.verified?.percentage,
    attendanceSource?.verified?.attendance_rate,
  ));

  const derivedRate = rateCandidate !== null
    ? rateCandidate
    : (derivedRecords > 0 ? Number(((derivedAttended / derivedRecords) * 100).toFixed(2)) : base.rate);

  assignIntegerField(normalizedDetail, 'activities', derivedActivities, base.activities);
  assignIntegerField(normalizedDetail, 'records', derivedRecords, base.records);
  assignIntegerField(normalizedDetail, 'attended', derivedAttended, base.attended);
  assignRateField(normalizedDetail, derivedRate, base.rate);

  return normalizedDetail;
};

const toPercentageScale = (value) => {
  const rawValue = typeof value === 'string' ? value.replace(/%/g, '').trim() : value;
  const numeric = toNumberOrNull(rawValue);
  if (numeric === null) {
    return null;
  }

  const normalized = Math.abs(numeric) <= 1 ? numeric * 100 : numeric;
  return Number.isFinite(normalized) ? normalized : null;
};

const normalizeTutorPercentageValue = (value) => {
  const scaled = toPercentageScale(value);
  if (scaled === null) {
    return null;
  }

  return Number(scaled.toFixed(2));
};

export const summarizeTutors = (tutors = [], summary = null) => {
  const fallbackAttendanceDetail = buildAttendanceDetailFromTutors(tutors);

  const fallbackSummary = Array.isArray(tutors) && tutors.length > 0
    ? (() => {
      const totalTutors = tutors.length;
      const totalRate = tutors.reduce((acc, tutor) => {
        const normalizedRate = toPercentageScale(tutor.attendance_rate);
        return normalizedRate === null ? acc : acc + normalizedRate;
      }, 0);
      const averageRate = totalTutors > 0
        ? Number((totalRate / totalTutors).toFixed(2))
        : 0;

      const distributionCounts = tutors.reduce((acc, tutor) => {
        const normalizedRate = toPercentageScale(tutor.attendance_rate);
        const rateForCategory = normalizedRate ?? toNumberOrNull(tutor.attendance_rate) ?? 0;
        const categoryKey = tutor.category?.key ?? tutor.category ?? deriveCategoryFromRate(rateForCategory);
        const key = typeof categoryKey === 'string' ? categoryKey : 'no_data';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, { high: 0, medium: 0, low: 0, no_data: 0 });

      const distribution = Object.entries(distributionCounts).reduce((acc, [key, count]) => {
        const percentage = totalTutors > 0 ? Number(((count / totalTutors) * 100).toFixed(2)) : 0;
        acc[key] = { count, percentage };
        return acc;
      }, {});

      const attendanceDetail = { ...fallbackAttendanceDetail };

      return {
        total_tutors: totalTutors,
        average_attendance_rate: averageRate,
        distribution: {
          ...DEFAULT_DISTRIBUTION,
          ...distribution,
        },
        attendance: attendanceDetail,
        attendance_detail: attendanceDetail,
      };
    })()
    : {
      total_tutors: 0,
      average_attendance_rate: 0,
      distribution: { ...DEFAULT_DISTRIBUTION },
      attendance: { ...fallbackAttendanceDetail },
      attendance_detail: { ...fallbackAttendanceDetail },
    };

  if (!summary || typeof summary !== 'object') {
    return fallbackSummary;
  }

  const totalTutors = toIntegerOrZero(firstDefined(
    summary.total_tutors,
    summary.totalTutors,
    summary.total,
    summary.count,
  ));

  const averageRate = normalizeTutorPercentageValue(firstDefined(
    summary.average_attendance_rate,
    summary.averageAttendanceRate,
    summary.attendanceRate,
    summary.attendance_rate,
    summary.rate,
  ));

  const distributionSource = summary.distribution
    ?? summary.attendance?.distribution
    ?? summary.category_distribution
    ?? {};

  const distribution = {
    high: normalizeDistributionEntry(distributionSource.high),
    medium: normalizeDistributionEntry(distributionSource.medium),
    low: normalizeDistributionEntry(distributionSource.low),
    no_data: normalizeDistributionEntry(distributionSource.no_data ?? distributionSource.noData),
  };

  const resolvedAverage = averageRate === null
    ? fallbackSummary.average_attendance_rate
    : averageRate;

  const attendanceSource = firstDefined(
    summary.attendance,
    summary.attendance_detail,
    summary.attendanceDetail,
    summary.attendance_stats,
    summary.attendanceStats,
    summary.attendanceSummary,
  );
  const attendanceDetail = normalizeAttendanceDetail(attendanceSource, fallbackAttendanceDetail);

  return {
    total_tutors: totalTutors || fallbackSummary.total_tutors,
    average_attendance_rate: resolvedAverage,
    distribution: {
      ...fallbackSummary.distribution,
      ...distribution,
    },
    attendance: attendanceDetail,
    attendance_detail: attendanceDetail,
  };
};

export const buildTutorSummaryCards = (summary) => {
  if (!summary || typeof summary !== 'object') {
    return [];
  }

  const totalTutors = toIntegerOrZero(firstDefined(
    summary.total_tutors,
    summary.totalTutors,
    summary.total,
    summary.count,
  ));

  const averageRateValue = normalizeTutorPercentageValue(firstDefined(
    summary.average_attendance_rate,
    summary.averageAttendanceRate,
    summary.attendanceRate,
    summary.attendance_rate,
    summary.rate,
  ));

  return [
    {
      id: 'average-attendance-rate',
      icon: 'stats-chart',
      label: 'Rata-rata Kehadiran',
      value: averageRateValue,
      description: 'Persentase rata-rata kehadiran tutor yang tercatat.',
      color: '#0284c7',
    },
    {
      id: 'total-tutors',
      icon: 'people-circle',
      label: 'Total Tutor',
      value: formatInteger(totalTutors),
      description: 'Jumlah tutor yang terpantau dalam laporan ini.',
      color: '#6366f1',
    },
  ];
};

export default {
  DEFAULT_FILTERS,
  deriveCategoryFromRate,
  deriveCategoryLabel,
  toNumberOrNull,
  toIntegerOrZero,
  formatInteger,
  normalizeTutorRecord,
  summarizeTutors,
  buildTutorSummaryCards,
};
