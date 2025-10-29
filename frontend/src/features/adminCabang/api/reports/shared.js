
export const firstDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '');

export const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
};

export const toPlainObject = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return { ...value };
};

export const normalizeNamedEntity = (value, fallbackName) => {
  if (value === undefined || value === null) {
    return fallbackName ? { name: fallbackName } : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallbackName ? { name: fallbackName } : null;
    return { name: trimmed };
  }
  const objectValue = toPlainObject(value);
  if (objectValue) {
    return objectValue;
  }
  return fallbackName ? { name: fallbackName } : null;
};

export const normalizeNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '.').trim();
    if (!normalized) return null;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value === 'object') {
    const candidates = ['value', 'total', 'count', 'amount', 'number'];
    for (const key of candidates) {
      if (key in value) {
        const parsed = normalizeNumber(value[key]);
        if (parsed !== null) {
          return parsed;
        }
      }
    }
  }

  return null;
};

export const normalizeInteger = (value) => {
  const parsed = normalizeNumber(value);
  if (parsed === null) return null;
  if (Number.isInteger(parsed)) return parsed;
  const rounded = Math.round(parsed);
  return Number.isFinite(rounded) ? rounded : null;
};

export const normalizePercentage = (value) => {
  if (value === undefined || value === null || value === '') return null;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    if (value > -1 && value < 1) {
      return value * 100;
    }
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) return null;

    const percentMatch = normalized.match(/(-?\d+(?:\.\d+)?)\s*%/);
    if (percentMatch) {
      const parsed = Number(percentMatch[1]);
      return Number.isFinite(parsed) ? parsed : null;
    }

    const fractionMatch = normalized.match(
      /(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/,
    );
    if (fractionMatch) {
      const numerator = Number(fractionMatch[1]);
      const denominator = Number(fractionMatch[2]);
      if (
        Number.isFinite(numerator)
        && Number.isFinite(denominator)
        && denominator !== 0
      ) {
        return (numerator / denominator) * 100;
      }
    }

    const cleaned = normalized.replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
    if (!cleaned) return null;

    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed)) return null;

    if (parsed > -1 && parsed < 1) {
      return parsed * 100;
    }

    return parsed;
  }

  if (typeof value === 'object') {
    const candidates = ['rate', 'percentage', 'percent', 'value'];
    for (const key of candidates) {
      if (key in value) {
        const parsed = normalizePercentage(value[key]);
        if (parsed !== null) {
          return parsed;
        }
      }
    }
  }

  return null;
};

export const formatPercentageLabel = (value, fallback = '0%') => {
  const normalized = normalizePercentage(value);
  if (normalized === null) {
    return fallback;
  }

  return `${normalized.toFixed(Number.isInteger(normalized) ? 0 : 2)}%`;
};

export const extractPagination = (source) => {
  if (!source) return null;

  if (Array.isArray(source)) {
    if (source.length === 0) return null;
    return extractPagination(source[0]);
  }

  if (typeof source === 'object') {
    if (source.pagination && typeof source.pagination === 'object') {
      return extractPagination(source.pagination);
    }

    const page = firstDefined(source.page, source.current_page);
    const perPage = firstDefined(source.per_page, source.perPage, source.page_size);
    const total = firstDefined(source.total, source.total_items, source.totalItems);
    const totalPages = firstDefined(source.total_pages, source.totalPages, source.last_page);
    const nextPage = firstDefined(source.nextPage, source.next_page);
    const prevPage = firstDefined(source.prevPage, source.prev_page, source.previous_page);

    if (
      page !== undefined
      || perPage !== undefined
      || total !== undefined
      || totalPages !== undefined
      || nextPage !== undefined
      || prevPage !== undefined
    ) {
      return {
        page,
        perPage,
        total,
        totalPages,
        nextPage,
        prevPage,
      };
    }
  }

  return null;
};
