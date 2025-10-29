import {
  ensureArray,
  firstDefined,
  formatPercentageLabel,
  normalizeInteger,
  normalizeNamedEntity,
  normalizePercentage,
} from './shared';

const normalizeTutorReportParams = (params = {}) => {
  const normalized = {};

  const toNullableValue = (value) => {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed.toLowerCase() === 'all') return null;
      return trimmed;
    }
    return value;
  };

  const startDate = toNullableValue(
    firstDefined(
      params.start_date,
      params.startDate,
      params.dateRange?.start,
      params.date_range?.start,
      params.period?.start,
    ),
  );
  if (startDate !== null) {
    normalized.start_date = startDate;
    normalized.date_from = startDate;
  }

  const endDate = toNullableValue(
    firstDefined(
      params.end_date,
      params.endDate,
      params.dateRange?.end,
      params.date_range?.end,
      params.period?.end,
    ),
  );
  if (endDate !== null) {
    normalized.end_date = endDate;
    normalized.date_to = endDate;
  }

  const activityType = toNullableValue(
    firstDefined(
      params.jenis_kegiatan,
      params.jenisKegiatan,
      params.activityType,
      params.activity_type,
      params.type,
    ),
  );
  if (activityType !== null) {
    normalized.jenis_kegiatan = activityType;
  }

  const shelterId = toNullableValue(
    firstDefined(
      params.shelter_id,
      params.shelterId,
      params.shelter?.id,
      params.shelter,
    ),
  );
  if (shelterId !== null) {
    normalized.shelter_id = shelterId;
  }

  const wilbinId = toNullableValue(
    firstDefined(
      params.wilbin_id,
      params.wilbinId,
      params.wilbin?.id,
      params.wilbin,
      params.wilayah_binaan,
      params.wilayahBinaan,
    ),
  );
  if (wilbinId !== null) {
    normalized.wilbin_id = wilbinId;
  }

  return normalized;
};

const adaptTutorSummary = (rawSummary = {}, tutors = []) => {
  const summarySource = rawSummary || {};

  const totalTutors = normalizeInteger(
    firstDefined(
      summarySource.total_tutors,
      summarySource.totalTutors,
      summarySource.tutors,
      summarySource.total,
      summarySource.count,
      tutors.length,
    ),
  ) ?? tutors.length;

  const presentCount = normalizeInteger(
    firstDefined(
      summarySource.present,
      summarySource.presentCount,
      summarySource.hadir,
      summarySource.hadir_count,
      summarySource.total_hadir,
    ),
  ) ?? 0;

  const absentCount = normalizeInteger(
    firstDefined(
      summarySource.absent,
      summarySource.absentCount,
      summarySource.tidakHadir,
      summarySource.tidak_hadir,
      summarySource.total_tidak_hadir,
    ),
  ) ?? 0;

  const lateCount = normalizeInteger(
    firstDefined(
      summarySource.late,
      summarySource.lateCount,
      summarySource.telat,
      summarySource.total_telat,
    ),
  ) ?? 0;

  const totalActivities = normalizeInteger(
    firstDefined(
      summarySource.total_activities,
      summarySource.totalActivities,
      summarySource.activities,
      summarySource.total_kegiatan,
    ),
  ) ?? 0;

  const attendanceRateValue = normalizePercentage(
    firstDefined(
      summarySource.attendance_rate,
      summarySource.attendanceRate,
      summarySource.rate,
      summarySource.percentage,
    ),
  );

  const rate = attendanceRateValue ?? (
    totalActivities > 0
      ? ((presentCount + lateCount) / totalActivities) * 100
      : null
  );

  return {
    total_tutors: totalTutors,
    attendance: {
      totals: {
        activities: totalActivities,
        records: totalActivities,
        attended: presentCount + lateCount,
      },
      breakdown: {
        present: presentCount,
        late: lateCount,
        absent: absentCount,
      },
    },
    average_attendance_rate: rate ? Number(rate.toFixed(2)) : null,
  };
};

const adaptTutorRecord = (record = {}, index = 0) => {
  const id = record.id ?? record.tutor_id ?? `tutor-${index}`;
  const name = record.name ?? record.nama_tutor ?? record.nama ?? `Tutor ${index + 1}`;
  const photo = record.photo_url ?? record.photo ?? record.avatar ?? null;

  const attendance = record.attendance ?? {};
  const totals = attendance.totals ?? attendance.total ?? attendance.stats ?? {};
  const breakdown = attendance.breakdown ?? attendance.records ?? {};
  const verified = attendance.verified ?? attendance.validation ?? {};

  const presentCount = normalizeInteger(
    firstDefined(
      breakdown.present,
      record.present_count,
      record.present,
      record.hadir,
    ),
  ) ?? 0;

  const absentCount = normalizeInteger(
    firstDefined(
      breakdown.absent,
      record.absent_count,
      record.absent,
      record.tidakHadir,
    ),
  ) ?? 0;

  const lateCount = normalizeInteger(
    firstDefined(
      breakdown.late,
      record.late_count,
      record.late,
      record.telat,
    ),
  ) ?? 0;

  const totalActivities = normalizeInteger(
    firstDefined(
      totals.activities,
      record.total_activities,
      record.totalActivities,
      record.total_kegiatan,
    ),
  ) ?? (presentCount + absentCount + lateCount);

  const attendanceRateValue = normalizePercentage(
    firstDefined(
      attendance.rate,
      record.attendance_rate,
      record.attendanceRate,
      record.rate,
    ),
  ) ?? (totalActivities > 0 ? ((presentCount + lateCount) / totalActivities) * 100 : 0);

  const attendanceRateLabel = formatPercentageLabel(
    attendanceRateValue,
    totalActivities > 0 ? '0%' : 'Tidak ada data',
  );

  const shelter = normalizeNamedEntity(
    firstDefined(
      record.shelter,
      record.shelter_detail,
      record.shelterDetail,
      record.shelter_info,
      record.shelterInfo,
    ),
  );

  const wilbin = normalizeNamedEntity(
    firstDefined(
      record.wilbin,
      record.wilayah_binaan,
      record.wilayahBinaan,
      record.branch,
    ),
  );

  const category = record.category ?? {};
  const categoryKey = category.key ?? category.id ?? null;
  const categoryLabel = category.label ?? category.name ?? null;

  return {
    id,
    tutor_id: id,
    name,
    photo,
    shelter,
    wilbin,
    attendance: {
      totals: {
        activities: totalActivities,
        records: totals.records ?? totalActivities,
        attended: totals.attended ?? presentCount + lateCount,
      },
      breakdown: {
        present: presentCount,
        late: lateCount,
        absent: absentCount,
      },
      verified: {
        total: normalizeInteger(firstDefined(verified.total, verified.records)),
        present: normalizeInteger(firstDefined(verified.present, verified.hadir)),
        late: normalizeInteger(firstDefined(verified.late, verified.telat)),
        absent: normalizeInteger(firstDefined(verified.absent, verified.tidakHadir)),
        attended: normalizeInteger(firstDefined(verified.attended, verified.hadir_verified)),
      },
      rate: Number(attendanceRateValue?.toFixed(2) ?? 0),
      rate_label: attendanceRateLabel,
    },
    present_count: presentCount,
    late_count: lateCount,
    absent_count: absentCount,
    total_activities: totalActivities,
    attendance_rate: Number(attendanceRateValue?.toFixed(2) ?? 0),
    category: categoryKey || categoryLabel
      ? { key: categoryKey, label: categoryLabel ?? categoryKey }
      : null,
  };
};

const adaptTutorReportResponse = (response) => {
  const rawPayload = response?.data ?? response ?? {};
  const payload = rawPayload?.data ?? rawPayload ?? {};
  const metaPayload = payload.meta ?? rawPayload.meta ?? {};

  const adaptMeta = () => {
    const metadata = {
      branch: payload.branch ?? rawPayload.branch ?? metaPayload.branch ?? null,
    };

    const filtersPayload = payload.filters ?? metaPayload.filters ?? {};
    const availableFilters = payload.available_filters
      ?? payload.availableFilters
      ?? metaPayload.available_filters
      ?? metaPayload.availableFilters
      ?? {};

    if (Object.keys(filtersPayload).length > 0) {
      metadata.filters = filtersPayload;
    }

    if (Object.keys(availableFilters).length > 0) {
      metadata.available_filters = availableFilters;
    }

    const lastRefreshedAt = firstDefined(
      metaPayload.last_refreshed_at,
      metaPayload.lastRefreshedAt,
      metaPayload.timestamps?.last_refreshed_at,
      metaPayload.timestamps?.lastRefreshedAt,
      payload.last_refreshed_at,
      payload.lastRefreshedAt,
      rawPayload.last_refreshed_at,
      rawPayload.lastRefreshedAt,
    );

    if (lastRefreshedAt !== undefined) {
      metadata.last_refreshed_at = lastRefreshedAt;
    }

    return metadata;
  };

  const toArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter((item) => item !== undefined && item !== null);
    }
    if (typeof value === 'object') {
      const nestedCandidates = [
        value.data,
        value.items,
        value.list,
        value.records,
        value.rows,
        value.tutors,
        value.results,
      ];
      for (const candidate of nestedCandidates) {
        const result = toArray(candidate);
        if (result.length > 0) {
          return result;
        }
      }
    }
    return ensureArray(value).filter((item) => item !== undefined && item !== null);
  };

  const tutorCandidates = [
    payload.tutors,
    payload.data,
    payload.items,
    payload.list,
    payload.records,
    rawPayload.tutors,
    rawPayload.data,
    rawPayload.items,
    rawPayload.list,
  ];

  let tutorData = [];
  for (const candidate of tutorCandidates) {
    const arrayCandidate = toArray(candidate);
    if (arrayCandidate.length > 0) {
      tutorData = arrayCandidate;
      break;
    }
  }

  const tutors = tutorData.map((item, index) => adaptTutorRecord(item, index));

  const summarySource = firstDefined(
    payload.summary,
    rawPayload.summary,
    payload.totals,
    rawPayload.totals,
    payload.meta?.summary,
    rawPayload.meta?.summary,
    payload.overview,
    rawPayload.overview,
    {},
  ) || {};

  const summary = adaptTutorSummary(summarySource, tutors);
  const metadata = adaptMeta();

  const adapted = {
    data: tutors,
    summary,
    metadata,
  };

  if (response?.data) {
    return { ...response, data: adapted };
  }

  return adapted;
};

export {
  adaptTutorReportResponse,
  normalizeTutorReportParams,
};
