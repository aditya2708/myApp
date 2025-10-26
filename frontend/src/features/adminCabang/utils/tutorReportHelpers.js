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

const ensureArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const normalizeOptionCollection = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'object') {
    const nestedKeys = ['options', 'data', 'items', 'list', 'records', 'values', 'results'];
    for (const key of nestedKeys) {
      if (value[key] !== undefined) {
        const result = normalizeOptionCollection(value[key]);
        if (result.length > 0) {
          return result;
        }
      }
    }

    return Object.entries(value).map(([key, label]) => ({ key, label }));
  }

  return [value];
};

const toOption = (item) => {
  if (item === null || item === undefined) {
    return null;
  }

  if (Array.isArray(item)) {
    const [key, label] = item;
    if (key === undefined || key === null || key === '') {
      return null;
    }
    return {
      key,
      label: label ?? String(key),
    };
  }

  if (typeof item === 'string' || typeof item === 'number') {
    return { key: item, label: String(item) };
  }

  if (typeof item === 'object') {
    const key = item.key
      ?? item.value
      ?? item.id
      ?? item.code
      ?? item.slug
      ?? item.uuid
      ?? item.identifier
      ?? item.shelter_id
      ?? item.shelterId
      ?? item.kd_shelter
      ?? item.kdShelter;
    const label = item.label
      ?? item.name
      ?? item.title
      ?? item.text
      ?? item.nama
      ?? item.shelterName
      ?? item.shelter_name
      ?? item.description
      ?? (typeof item.value === 'string' || typeof item.value === 'number' ? String(item.value) : undefined);

    if (key === undefined || key === null || key === '') {
      return null;
    }

    const option = {
      key,
      label: label ?? String(key),
    };

    const wilbinIdCandidate = item.wilbin_id
      ?? item.wilbinId
      ?? item.id_wilbin
      ?? item.idWilbin
      ?? item.wilayah_binaan_id
      ?? item.wilayahBinaanId
      ?? item.wilayah_binaan
      ?? item.wilayahBinaan;

    if (wilbinIdCandidate !== undefined) {
      option.wilbin_id = wilbinIdCandidate;
    }

    if (item.wilbin !== undefined) {
      option.wilbin = item.wilbin;
    }

    return option;
  }

  return null;
};

const dedupeOptions = (options = []) => {
  const seen = new Map();
  options.forEach((option) => {
    const normalized = toOption(option);
    if (!normalized) {
      return;
    }

    const key = String(normalized.key);
    if (!seen.has(key)) {
      seen.set(key, normalized);
    }
  });

  return Array.from(seen.values());
};

const ensureAllOption = (options = [], label = 'Semua') => {
  const normalized = dedupeOptions(options);
  const hasAll = normalized.some((option) => String(option.key).toLowerCase() === 'all');
  if (hasAll) {
    return normalized;
  }

  return [{ key: 'all', label }, ...normalized];
};

const extractOptionCandidates = (meta, keys) => {
  if (!meta) {
    return [];
  }

  const sources = ensureArray(meta.available_filters)
    .concat(ensureArray(meta.availableFilters))
    .concat(ensureArray(meta.filters))
    .concat(ensureArray(meta.collections))
    .concat(ensureArray(meta.options))
    .concat(ensureArray(meta.data))
    .concat(meta);

  for (const source of sources) {
    if (!source || typeof source !== 'object') {
      continue;
    }

    if (Array.isArray(source)) {
      const flattened = source.flatMap((item) => {
        if (!item || typeof item !== 'object') {
          return item;
        }

        const descriptorKeys = [item.field, item.name, item.key, item.type, item.id];
        const matchesDescriptor = descriptorKeys.some((descriptor) => (
          descriptor && keys.includes(descriptor)
        ));

        if (matchesDescriptor) {
          const nested = normalizeOptionCollection(item.options ?? item.values ?? item.items ?? item.data);
          if (nested.length > 0) {
            return nested;
          }
        }

        return item;
      });

      const normalizedArray = normalizeOptionCollection(flattened);
      if (normalizedArray.length > 0) {
        return normalizedArray;
      }

      continue;
    }

    for (const key of keys) {
      if (source[key] !== undefined) {
        const result = normalizeOptionCollection(source[key]);
        if (result.length > 0) {
          return result;
        }
      }

      const camelKey = Array.isArray(key)
        ? key
        : [
          key,
          key.replace(/_[a-z]/g, (match) => match[1].toUpperCase()),
        ];

      for (const candidateKey of camelKey) {
        if (source[candidateKey] !== undefined) {
          const result = normalizeOptionCollection(source[candidateKey]);
          if (result.length > 0) {
            return result;
          }
        }
      }
    }
  }

  return [];
};

const normalizeActivityTypes = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : item))
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

export const buildJenisOptions = (meta, tutors = []) => {
  const metaOptions = dedupeOptions(
    extractOptionCandidates(meta, ['jenis_kegiatan', 'jenisKegiatan', 'activity_types', 'activityTypes'])
  );

  if (metaOptions.length > 0) {
    return ensureAllOption(metaOptions, 'Semua Jenis');
  }

  const types = new Set();
  tutors.forEach((tutor) => {
    const sources = [
      tutor.activity_types,
      tutor.activityTypes,
      tutor.raw?.activity_types,
      tutor.raw?.jenis_kegiatan,
      tutor.raw?.jenisKegiatan,
      tutor.raw?.activityTypes,
    ];

    sources.forEach((source) => {
      normalizeActivityTypes(source).forEach((item) => types.add(item));
    });
  });

  const derived = Array.from(types).map((item) => ({ key: item, label: item }));
  return ensureAllOption(derived, 'Semua Jenis');
};

export const buildWilbinOptions = (meta, tutors = []) => {
  const metaOptions = dedupeOptions(
    extractOptionCandidates(meta, [
      'wilbin',
      'wilbins',
      'wilayah_binaan',
      'wilayahBinaan',
      'regions',
      'region',
      'wilayah',
    ]),
  );

  if (metaOptions.length > 0) {
    return ensureAllOption(metaOptions, 'Semua Wilbin');
  }

  const wilbinMap = new Map();

  tutors.forEach((tutor) => {
    const raw = tutor.raw || {};
    const wilbinInfo = tutor.wilbin
      ?? raw.wilbin
      ?? raw.wilbin_info
      ?? raw.wilbinInfo
      ?? null;

    const possibleId = raw.wilbin_id
      ?? raw.wilbinId
      ?? raw.id_wilbin
      ?? tutor.wilbin_id
      ?? tutor.wilbinId
      ?? wilbinInfo?.id
      ?? wilbinInfo?.id_wilbin
      ?? wilbinInfo?.wilbin_id;

    const label = tutor.wilbin_name
      ?? tutor.wilbinName
      ?? raw.wilbin_name
      ?? raw.wilbinName
      ?? wilbinInfo?.nama_wilbin
      ?? wilbinInfo?.nama
      ?? wilbinInfo?.name
      ?? null;

    if (possibleId !== undefined && possibleId !== null && possibleId !== '') {
      const key = String(possibleId);
      if (!wilbinMap.has(key)) {
        wilbinMap.set(key, {
          key: possibleId,
          label: label ?? `Wilbin ${key}`,
        });
      }
      return;
    }

    if (label) {
      const key = String(label);
      if (!wilbinMap.has(key)) {
        wilbinMap.set(key, { key: label, label });
      }
    }
  });

  const derived = Array.from(wilbinMap.values());
  return ensureAllOption(derived, 'Semua Wilbin');
};

export const buildShelterOptions = (meta, tutors = []) => {
  const metaOptions = dedupeOptions(
    extractOptionCandidates(meta, [
      'shelter',
      'shelters',
      'shelter_id',
      'shelterId',
      'locations',
      'location',
      'branches',
      'collections',
    ])
  );

  if (metaOptions.length > 0) {
    return ensureAllOption(metaOptions, 'Semua Shelter');
  }

  const shelterMap = new Map();
  tutors.forEach((tutor) => {
    const raw = tutor.raw || {};
    const shelter = tutor.shelter || raw.shelter || {};
    const wilbinInfo = tutor.wilbin
      ?? raw.wilbin
      ?? shelter.wilbin
      ?? raw.wilbin_info
      ?? raw.wilbinInfo
      ?? null;
    const wilbinIdCandidate = raw.wilbin_id
      ?? raw.wilbinId
      ?? raw.id_wilbin
      ?? shelter.id_wilbin
      ?? shelter.wilbin_id
      ?? tutor.wilbin_id
      ?? tutor.wilbinId
      ?? wilbinInfo?.id
      ?? wilbinInfo?.id_wilbin
      ?? wilbinInfo?.wilbin_id;
    const possibleId = raw.shelter_id
      ?? raw.shelterId
      ?? raw.id_shelter
      ?? tutor.shelter_id
      ?? tutor.shelterId
      ?? shelter.id
      ?? shelter.id_shelter
      ?? raw.shelter?.id;
    const label = tutor.shelterName
      ?? raw.shelter_name
      ?? raw.shelterName
      ?? shelter.name
      ?? shelter.nama
      ?? raw.shelter?.name
      ?? raw.location
      ?? raw.branch
      ?? null;

    if (possibleId !== undefined && possibleId !== null && possibleId !== '') {
      const key = String(possibleId);
      if (!shelterMap.has(key)) {
        const option = {
          key: possibleId,
          label: label ?? `Shelter ${key}`,
        };
        if (wilbinIdCandidate !== undefined) {
          option.wilbin_id = wilbinIdCandidate;
        }
        if (wilbinInfo) {
          option.wilbin = wilbinInfo;
        }
        shelterMap.set(key, option);
      }
      return;
    }

    if (label) {
      const key = String(label);
      if (!shelterMap.has(key)) {
        const option = { key: label, label };
        if (wilbinIdCandidate !== undefined) {
          option.wilbin_id = wilbinIdCandidate;
        }
        if (wilbinInfo) {
          option.wilbin = wilbinInfo;
        }
        shelterMap.set(key, option);
      }
    }
  });

  const derived = Array.from(shelterMap.values());
  return ensureAllOption(derived, 'Semua Shelter');
};

export const scopeShelterOptionsByWilbin = (options = [], wilbinId, meta) => {
  const normalizedWilbinId = wilbinId === undefined || wilbinId === null ? 'all' : wilbinId;
  if (!normalizedWilbinId || normalizedWilbinId === 'all') {
    return ensureAllOption(options, 'Semua Shelter');
  }

  const normalizedIdString = String(normalizedWilbinId);

  const directMatches = options.filter((option) => {
    if (!option) {
      return false;
    }

    const candidateValues = [
      option.wilbin_id,
      option.wilbinId,
      option.id_wilbin,
      option.idWilbin,
      option.wilayah_binaan_id,
      option.wilayahBinaanId,
      option.wilbin?.id,
      option.wilbin?.id_wilbin,
      option.wilbin?.wilbin_id,
    ]
      .filter((value) => value !== undefined && value !== null)
      .map((value) => String(value));

    return candidateValues.includes(normalizedIdString);
  });

  if (directMatches.length > 0) {
    return ensureAllOption(directMatches, 'Semua Shelter');
  }

  const scopedFromMeta = (() => {
    const sources = ensureArray(meta?.shelters_by_wilbin)
      .concat(ensureArray(meta?.shelter_by_wilbin))
      .concat(ensureArray(meta?.wilbin_shelters))
      .concat(ensureArray(meta?.wilbins_shelters))
      .concat(ensureArray(meta?.filters?.shelters_by_wilbin))
      .concat(ensureArray(meta?.filters?.wilbin_shelters))
      .concat(ensureArray(meta?.collections?.shelters_by_wilbin))
      .concat(ensureArray(meta?.collections?.wilbin_shelters));

    for (const source of sources) {
      if (!source) {
        continue;
      }

      if (Array.isArray(source)) {
        const nested = source.flatMap((item) => {
          if (!item || typeof item !== 'object') {
            return [];
          }

          const matchesWilbin = [
            item.wilbin_id,
            item.wilbinId,
            item.id_wilbin,
            item.idWilbin,
            item.wilayah_binaan_id,
            item.wilayahBinaanId,
            item.wilbin?.id,
            item.wilbin?.id_wilbin,
          ]
            .filter((value) => value !== undefined && value !== null)
            .map((value) => String(value))
            .includes(normalizedIdString);

          if (!matchesWilbin) {
            return [];
          }

          const nestedOptions = item.options
            ?? item.shelters
            ?? item.items
            ?? item.data
            ?? item.list
            ?? item.values
            ?? item.records
            ?? [];

          const normalized = normalizeOptionCollection(nestedOptions);
          if (normalized.length > 0) {
            return normalized;
          }

          return [item];
        });

        if (nested.length > 0) {
          return dedupeOptions(nested);
        }

        continue;
      }

      if (typeof source === 'object') {
        const numericKey = Number(normalizedIdString);
        const candidateKeys = [
          normalizedIdString,
          !Number.isNaN(numericKey) ? numericKey : undefined,
          normalizedWilbinId,
          normalizedWilbinId !== undefined && normalizedWilbinId !== null
            ? String(normalizedWilbinId)
            : undefined,
        ].filter((key, index, arr) => key !== undefined && key !== null && arr.indexOf(key) === index);

        for (const key of candidateKeys) {
          if (key !== undefined && key !== null && source[key] !== undefined) {
            const normalized = dedupeOptions(normalizeOptionCollection(source[key]));
            if (normalized.length > 0) {
              return normalized;
            }
          }
        }
      }
    }

    return [];
  })();

  if (scopedFromMeta.length > 0) {
    return ensureAllOption(scopedFromMeta, 'Semua Shelter');
  }

  return ensureAllOption(options, 'Semua Shelter');
};

export const sanitizeFilters = (filters = {}) => ({
  date_from: filters.date_from ?? filters.start_date ?? filters.startDate ?? null,
  date_to: filters.date_to ?? filters.end_date ?? filters.endDate ?? null,
  jenis_kegiatan: filters.jenis_kegiatan ?? filters.jenisKegiatan ?? filters.activity_type ?? filters.activityType ?? 'all',
  wilbin_id: filters.wilbin_id ?? filters.wilbinId ?? filters.wilbin ?? filters.wilayah_binaan ?? filters.wilayahBinaan ?? 'all',
  shelter_id: filters.shelter_id ?? filters.shelterId ?? filters.shelter ?? 'all',
});

export const mergeFilters = (base, overrides) => {
  const sanitizedBase = sanitizeFilters(base);
  const sanitizedOverrides = sanitizeFilters(overrides);

  return {
    date_from: sanitizedOverrides.date_from ?? sanitizedBase.date_from ?? DEFAULT_FILTERS.date_from,
    date_to: sanitizedOverrides.date_to ?? sanitizedBase.date_to ?? DEFAULT_FILTERS.date_to,
    jenis_kegiatan: sanitizedOverrides.jenis_kegiatan ?? sanitizedBase.jenis_kegiatan ?? DEFAULT_FILTERS.jenis_kegiatan,
    wilbin_id: sanitizedOverrides.wilbin_id ?? sanitizedBase.wilbin_id ?? DEFAULT_FILTERS.wilbin_id,
    shelter_id: sanitizedOverrides.shelter_id ?? sanitizedBase.shelter_id ?? DEFAULT_FILTERS.shelter_id,
  };
};

export const composeApiParamsFromFilters = (filters = {}) => ({
  start_date: filters.date_from || null,
  end_date: filters.date_to || null,
  jenis_kegiatan: filters.jenis_kegiatan && filters.jenis_kegiatan !== 'all'
    ? filters.jenis_kegiatan
    : null,
  wilbin_id: filters.wilbin_id && filters.wilbin_id !== 'all'
    ? filters.wilbin_id
    : null,
  shelter_id: filters.shelter_id && filters.shelter_id !== 'all'
    ? filters.shelter_id
    : null,
});

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

export const summarizeTutors = (tutors = [], summary = null) => {
  const fallbackSummary = Array.isArray(tutors) && tutors.length > 0
    ? (() => {
      const totalTutors = tutors.length;
      const totalRate = tutors.reduce((acc, tutor) => (
        typeof tutor.attendance_rate === 'number' ? acc + tutor.attendance_rate : acc
      ), 0);
      const averageRate = totalTutors > 0
        ? Number((totalRate / totalTutors).toFixed(2))
        : 0;

      const distributionCounts = tutors.reduce((acc, tutor) => {
        const categoryKey = tutor.category?.key ?? tutor.category ?? deriveCategoryFromRate(tutor.attendance_rate);
        const key = typeof categoryKey === 'string' ? categoryKey : 'no_data';
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, { high: 0, medium: 0, low: 0, no_data: 0 });

      const distribution = Object.entries(distributionCounts).reduce((acc, [key, count]) => {
        const percentage = totalTutors > 0 ? Number(((count / totalTutors) * 100).toFixed(2)) : 0;
        acc[key] = { count, percentage };
        return acc;
      }, {});

      return {
        total_tutors: totalTutors,
        average_attendance_rate: averageRate,
        distribution: {
          ...DEFAULT_DISTRIBUTION,
          ...distribution,
        },
      };
    })()
    : {
      total_tutors: 0,
      average_attendance_rate: 0,
      distribution: { ...DEFAULT_DISTRIBUTION },
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

  const averageRate = toNumberOrNull(firstDefined(
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
    : Number(averageRate.toFixed(2));

  return {
    total_tutors: totalTutors || fallbackSummary.total_tutors,
    average_attendance_rate: resolvedAverage,
    distribution: {
      ...fallbackSummary.distribution,
      ...distribution,
    },
  };
};

const resolveTutorDistribution = (summary) => {
  const distributionSource = summary?.distribution
    ?? summary?.attendance?.distribution
    ?? summary?.category_distribution
    ?? summary?.categories
    ?? {};

  return {
    high: normalizeDistributionEntry(distributionSource.high),
    medium: normalizeDistributionEntry(distributionSource.medium),
    low: normalizeDistributionEntry(distributionSource.low),
    no_data: normalizeDistributionEntry(
      distributionSource.no_data
        ?? distributionSource.noData
        ?? distributionSource.none
        ?? distributionSource.undefined
        ?? distributionSource.unknown,
    ),
  };
};

const formatTutorPercentage = (value) => {
  const numeric = toNumberOrNull(value);
  if (numeric === null) {
    return '0%';
  }

  const normalized = Math.abs(numeric) <= 1 ? numeric * 100 : numeric;
  const rounded = Number.isFinite(normalized) ? Math.round(normalized) : 0;

  return `${rounded.toLocaleString('id-ID')}%`;
};

const resolveAttendanceBreakdown = (summary = {}) => {
  if (!summary || typeof summary !== 'object') {
    return {
      present: 0,
      late: 0,
      excused: 0,
      absent: 0,
      totalActivities: 0,
    };
  }

  const attendance = typeof summary.attendance === 'object' && summary.attendance !== null
    ? summary.attendance
    : null;

  const attendanceTotals = attendance?.totals ?? attendance ?? {};
  const attendanceVerified = attendance?.verified ?? attendanceTotals.verified ?? {};
  const attendanceBreakdown = attendance?.breakdown ?? attendanceTotals.breakdown ?? {};

  const legacyTotals = summary.totals ?? {};
  const legacyVerified = summary.verified ?? legacyTotals.verified ?? {};
  const legacyBreakdown = summary.breakdown ?? legacyTotals.breakdown ?? {};

  const present = toIntegerOrZero(firstDefined(
    attendanceVerified.present,
    attendanceBreakdown.present,
    attendanceTotals.present,
    legacyVerified.present,
    legacyBreakdown.present,
    legacyTotals.present,
    summary.present,
    summary.presentCount,
    summary.present_count,
  ));

  const late = toIntegerOrZero(firstDefined(
    attendanceVerified.late,
    attendanceBreakdown.late,
    attendanceTotals.late,
    legacyVerified.late,
    legacyBreakdown.late,
    legacyTotals.late,
    summary.late,
    summary.lateCount,
    summary.late_count,
  ));

  const excused = toIntegerOrZero(firstDefined(
    attendanceVerified.excused,
    attendanceVerified.excuse,
    attendanceVerified.permit,
    attendanceVerified.permission,
    attendanceVerified.sick,
    attendanceBreakdown.excused,
    attendanceBreakdown.excuse,
    attendanceBreakdown.permit,
    attendanceBreakdown.permission,
    attendanceBreakdown.sick,
    attendanceTotals.excused,
    attendanceTotals.excuse,
    attendanceTotals.permit,
    attendanceTotals.permission,
    attendanceTotals.sick,
    legacyVerified.excused,
    legacyVerified.excuse,
    legacyVerified.permit,
    legacyVerified.permission,
    legacyVerified.sick,
    legacyBreakdown.excused,
    legacyBreakdown.excuse,
    legacyBreakdown.permit,
    legacyBreakdown.permission,
    legacyBreakdown.sick,
    legacyTotals.excused,
    legacyTotals.excuse,
    legacyTotals.permit,
    legacyTotals.permission,
    legacyTotals.sick,
    summary.excused,
    summary.excused_count,
    summary.excuse,
    summary.permit,
    summary.permission,
    summary.izin,
    summary.sick,
  ));

  const absent = toIntegerOrZero(firstDefined(
    attendanceVerified.absent,
    attendanceBreakdown.absent,
    attendanceTotals.absent,
    legacyVerified.absent,
    legacyBreakdown.absent,
    legacyTotals.absent,
    summary.absent,
    summary.absentCount,
    summary.absent_count,
  ));

  const totalActivities = toIntegerOrZero(firstDefined(
    attendanceTotals.activities,
    attendanceTotals.total,
    attendanceTotals.activity,
    attendanceVerified.total,
    attendanceBreakdown.total,
    legacyTotals.activities,
    legacyTotals.total,
    legacyTotals.activity,
    legacyVerified.total,
    legacyBreakdown.total,
    summary.totalActivities,
    summary.total_activities,
    summary.totalSessions,
    summary.total_sessions,
  ));

  return {
    present,
    late,
    excused,
    absent,
    totalActivities,
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

  const averageRateLabel = formatTutorPercentage(firstDefined(
    summary.average_attendance_rate,
    summary.averageAttendanceRate,
    summary.attendanceRate,
    summary.attendance_rate,
    summary.rate,
  ));

  const distribution = resolveTutorDistribution(summary);
  const primaryDistributionKeys = ['high', 'medium', 'low'];

  let primaryCategoryKey = 'high';
  let highestCount = -1;
  primaryDistributionKeys.forEach((key) => {
    const candidateCount = distribution[key]?.count ?? 0;
    if (candidateCount > highestCount) {
      highestCount = candidateCount;
      primaryCategoryKey = key;
    }
  });

  const primaryCategoryLabel = deriveCategoryLabel(primaryCategoryKey);
  const primaryCategoryCount = formatInteger(distribution[primaryCategoryKey]?.count ?? 0);

  const noDataLabel = deriveCategoryLabel('no_data');
  const noDataCount = formatInteger(distribution.no_data?.count ?? 0);

  const attendanceBreakdown = resolveAttendanceBreakdown(summary);
  const breakdownValue = [
    attendanceBreakdown.present,
    attendanceBreakdown.late,
    attendanceBreakdown.excused,
    attendanceBreakdown.absent,
  ]
    .map((value) => formatInteger(value))
    .join('/');

  const totalActivitiesLabel = formatInteger(attendanceBreakdown.totalActivities);

  return [
    {
      id: 'average-attendance-rate',
      icon: 'stats-chart',
      label: 'Rata-rata Kehadiran',
      value: averageRateLabel,
      description: `Berdasarkan ${totalActivitiesLabel} aktivitas diverifikasi`,
      color: '#0284c7',
    },
    {
      id: 'total-tutors',
      icon: 'people-circle',
      label: 'Total Tutor',
      value: formatInteger(totalTutors),
      description: 'Tutor terpantau dalam laporan ini',
      color: '#6366f1',
    },
    {
      id: 'category-distribution',
      icon: 'pie-chart',
      label: `Distribusi Kategori Utama (${primaryCategoryLabel})`,
      value: primaryCategoryCount,
      description: `${noDataLabel}: ${noDataCount}`,
      color: '#f97316',
    },
    {
      id: 'verified-activities',
      icon: 'checkmark-done-circle',
      label: 'Aktivitas Diverifikasi',
      value: breakdownValue,
      description: `Hadir/Terlambat/Izin/Tidak Hadir · ${totalActivitiesLabel} aktivitas`,
      color: '#10b981',
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
  buildJenisOptions,
  buildWilbinOptions,
  buildShelterOptions,
  scopeShelterOptionsByWilbin,
  sanitizeFilters,
  mergeFilters,
  composeApiParamsFromFilters,
  normalizeTutorRecord,
  summarizeTutors,
  buildTutorSummaryCards,
};
