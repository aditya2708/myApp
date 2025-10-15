const percentageFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatPercentageLabel = (value) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  let numericValue = null;
  let hasExplicitPercent = false;

  if (typeof value === 'number') {
    numericValue = Number(value);
  } else if (typeof value === 'string') {
    const normalizedString = value.replace(/,/g, '.').trim();
    if (!normalizedString) {
      return null;
    }

    const percentMatch = normalizedString.match(/(-?\d+(?:\.\d+)?)\s*%/);
    if (percentMatch) {
      hasExplicitPercent = true;
      numericValue = Number(percentMatch[1]);
    } else {
      const fractionMatch = normalizedString.match(
        /(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/,
      );

      if (fractionMatch) {
        const numerator = Number(fractionMatch[1]);
        const denominator = Number(fractionMatch[2]);

        if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
          numericValue = numerator / denominator;
        }
      }

      if (numericValue === null) {
        const genericMatch = normalizedString.match(/-?\d+(?:\.\d+)?/);
        if (genericMatch) {
          numericValue = Number(genericMatch[0]);
        }
      }
    }
  } else {
    numericValue = Number(value);
  }

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  if (!hasExplicitPercent && Math.abs(numericValue) < 1 && numericValue !== 0) {
    numericValue *= 100;
  }

  const finalValue = Object.is(numericValue, -0) ? 0 : numericValue;

  return `${percentageFormatter.format(finalValue)}%`;
};

export const BAND_STYLES = {
  high: {
    label: 'Kehadiran Tinggi',
    color: '#2ecc71',
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
  },
  medium: {
    label: 'Kehadiran Sedang',
    color: '#f39c12',
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
  },
  low: {
    label: 'Kehadiran Rendah',
    color: '#e74c3c',
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
  },
  unknown: {
    label: 'Band tidak diketahui',
    color: '#636e72',
    backgroundColor: 'rgba(99, 110, 114, 0.12)',
  },
};

export const getInitials = (name) => {
  if (!name) return 'AN';
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

export const resolveBandMeta = (band, percentage) => {
  if (band) {
    const normalized = String(band).toLowerCase();
    if (BAND_STYLES[normalized]) {
      return { code: normalized, ...BAND_STYLES[normalized] };
    }
  }

  const numeric = Number(percentage);
  if (!Number.isFinite(numeric)) return { code: 'unknown', ...BAND_STYLES.unknown };
  if (numeric >= 80) return { code: 'high', ...BAND_STYLES.high };
  if (numeric >= 60) return { code: 'medium', ...BAND_STYLES.medium };
  return { code: 'low', ...BAND_STYLES.low };
};

export const resolveMonthlyItems = (child, monthly) => {
  if (Array.isArray(monthly) && monthly.length) return monthly;
  const fromChild = child?.monthlyBreakdown || child?.monthly || child?.monthly_breakdown;
  return Array.isArray(fromChild) ? fromChild : [];
};

export const resolveTimelineItems = (timeline, child) => {
  if (Array.isArray(timeline) && timeline.length) return timeline;
  const fromChild = child?.timeline || child?.attendanceTimeline || child?.activities;
  return Array.isArray(fromChild) ? fromChild : [];
};

export const getStatusColor = (status) => {
  const normalized = status ? String(status).toLowerCase() : '';
  if (normalized.includes('hadir') || normalized === 'present' || normalized === 'attended') return '#2ecc71';
  if (normalized.includes('terlambat') || normalized === 'late') return '#f39c12';
  if (normalized.includes('tidak') || normalized === 'absent' || normalized === 'alfa') return '#e74c3c';
  return '#636e72';
};

export const formatDateLabel = (value) => {
  if (!value) return '-';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed);
};

export const normalizeStreaks = (streaks, child) => {
  const source = Array.isArray(streaks) && streaks.length ? streaks : child?.streaks;

  if (!source) return [];

  if (Array.isArray(source)) {
    return source
      .filter((item) => item && typeof item === 'object')
      .map((item, index) => ({
        id: item.id ?? item.type ?? item.key ?? `streak-${index}`,
        label:
          item.label ??
          item.name ??
          item.title ??
          (item.type ? item.type.replace(/([A-Z])/g, ' $1') : `Streak ${index + 1}`),
        value: item.value ?? item.count ?? item.length ?? 0,
        unit: item.unit ?? item.suffix ?? null,
      }));
  }

  if (typeof source === 'object') {
    return Object.entries(source)
      .map(([key, value], index) => {
        if (value === undefined || value === null) return null;

        const isObjectValue = value && typeof value === 'object';
        const numericValue = isObjectValue
          ? value.value ?? value.count ?? value.length ?? value.total
          : value;

        if (numericValue === undefined || numericValue === null) return null;

        return {
          id: key ?? `streak-${index}`,
          label:
            (isObjectValue && (value.label || value.name || value.title)) ||
            key.replace(/([A-Z])/g, ' $1'),
          value: numericValue,
          unit: isObjectValue ? value.unit ?? value.suffix ?? null : null,
        };
      })
      .filter(Boolean);
  }

  return [];
};

export const normalizeFilterEntries = (filters, period, summary, child) => {
  const combinedFilters = filters && Object.keys(filters || {}).length ? filters : child?.filters;
  const entries = [];

  const formatValue = (value) => {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value
          .map((item) => formatValue(item))
          .filter(Boolean)
          .join(', ');
      }
      return (
        value.label ||
        value.name ||
        value.title ||
        value.value ||
        (value.startDate && value.endDate
          ? `${value.startDate} – ${value.endDate}`
          : value.start_date && value.end_date
          ? `${value.start_date} – ${value.end_date}`
          : null)
      );
    }
    return null;
  };

  if (period?.label || summary?.dateRange?.label || child?.summary?.dateRange?.label) {
    entries.push({
      id: 'period',
      label: 'Periode',
      value: period?.label || summary?.dateRange?.label || child?.summary?.dateRange?.label,
    });
  }

  if (period?.value && !entries.find((entry) => entry.id === 'period-value')) {
    entries.push({ id: 'period-value', label: 'Rentang', value: period.value });
  }

  if (combinedFilters && typeof combinedFilters === 'object') {
    Object.entries(combinedFilters).forEach(([key, value]) => {
      const displayValue = formatValue(value);
      if (!displayValue) return;

      const normalizedLabel =
        ({
          search: 'Pencarian',
          shelter: 'Shelter',
          shelterId: 'Shelter',
          shelterName: 'Shelter',
          group: 'Kelompok',
          groupId: 'Kelompok',
          groupName: 'Kelompok',
          band: 'Kategori Kehadiran',
          attendanceBand: 'Kategori Kehadiran',
          startDate: 'Tanggal Mulai',
          start_date: 'Tanggal Mulai',
          endDate: 'Tanggal Selesai',
          end_date: 'Tanggal Selesai',
        }[key] || key.replace(/([A-Z])/g, ' $1'));

      entries.push({ id: `filter-${key}`, label: normalizedLabel, value: displayValue });
    });
  }

  return entries;
};

export const normalizeMetaEntries = (meta) => {
  if (!meta || typeof meta !== 'object') return [];

  const entries = [];

  const pushIfValue = (id, label, value) => {
    if (!value) return;
    entries.push({ id, label, value });
  };

  pushIfValue('generatedAt', 'Dibuat', meta.generatedAt || meta.generated_at);
  pushIfValue('lastUpdatedAt', 'Diperbarui', meta.lastUpdatedAt || meta.last_updated_at || meta.updatedAt);
  pushIfValue('author', 'Disusun oleh', meta.generatedBy || meta.generated_by || meta.author);

  Object.entries(meta).forEach(([key, value]) => {
    if (entries.find((entry) => entry.id === key)) return;
    if (typeof value !== 'string' && typeof value !== 'number') return;

    entries.push({
      id: key,
      label: key.replace(/([A-Z])/g, ' $1'),
      value: String(value),
    });
  });

  return entries;
};
