import { ensureArray, extractPagination, firstDefined } from './shared';

const normalizeChildAttendanceParams = (params = {}) => {
  const normalized = {};

  const assignIfDefined = (key, ...candidates) => {
    const value = firstDefined(...candidates);
    if (value !== undefined) {
      normalized[key] = value;
    }
  };

  assignIfDefined('page', params.page);
  assignIfDefined('per_page', params.per_page, params.perPage, params.pageSize);
  assignIfDefined('search', params.search, params.keyword, params.q, params.term);
  assignIfDefined('shelter_id', params.shelter_id, params.shelterId);
  assignIfDefined('group_id', params.group_id, params.groupId);
  assignIfDefined('start_date', params.start_date, params.startDate);
  assignIfDefined('end_date', params.end_date, params.endDate);
  normalized.sort_by = 'attendance_rate';

  const direction = firstDefined(
    params.sort_direction,
    params.sortDirection,
    params.order,
  );

  if (typeof direction === 'string') {
    const normalizedDirection = direction.toLowerCase();
    normalized.sort_direction = normalizedDirection === 'asc' ? 'asc' : 'desc';
  } else {
    normalized.sort_direction = 'desc';
  }

  return normalized;
};

const adaptChildAttendanceResponse = (response) => {
  const rawPayload = response?.data ?? response ?? {};
  const dataPayload = rawPayload?.data ?? rawPayload ?? {};

  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      const nested = firstDefined(
        value.data,
        value.items,
        value.list,
        value.records,
        value.children,
        value.rows,
      );
      if (nested !== undefined) {
        return ensureArray(nested).filter(Boolean);
      }
    }
    return ensureArray(value).filter(Boolean);
  };

  const getArrayField = (...candidates) => {
    const source = firstDefined(...candidates);
    return toArray(source);
  };

  const adaptedData = {
    ...dataPayload,
    children: getArrayField(
      dataPayload.children,
      dataPayload.child_list,
      dataPayload.childList,
      rawPayload.children,
      rawPayload.child_list,
      rawPayload.childList,
    ),
    shelter_breakdown: getArrayField(
      dataPayload.shelter_breakdown,
      dataPayload.shelterBreakdown,
      rawPayload.shelter_breakdown,
      rawPayload.shelterBreakdown,
    ),
    shelter_attendance_chart: getArrayField(
      dataPayload.shelter_attendance_chart,
      dataPayload.shelterAttendanceChart,
      rawPayload.shelter_attendance_chart,
      rawPayload.shelterAttendanceChart,
    ),
    attendance_band_distribution: firstDefined(
      dataPayload.attendance_band_distribution,
      dataPayload.attendanceBandDistribution,
      rawPayload.attendance_band_distribution,
      rawPayload.attendanceBandDistribution,
      { high: 0, medium: 0, low: 0 },
    ),
  };

  const metadataSources = [
    dataPayload,
    rawPayload,
    dataPayload.meta,
    rawPayload.meta,
    dataPayload.children,
    rawPayload.children,
    dataPayload.children?.meta,
    rawPayload.children?.meta,
  ].filter(Boolean);

  const assignMetadata = (key) => {
    const value = firstDefined(...metadataSources.map((s) => s?.[key]));
    if (value !== undefined) {
      adaptedData[key] = value;
    }
  };

  ['last_refreshed_at', 'filters', 'available_filters', 'pagination'].forEach(assignMetadata);

  const metaPayload = firstDefined(dataPayload.meta, rawPayload.meta, {}) || {};
  const paginationCandidate = firstDefined(
    metaPayload.pagination,
    metaPayload.paging,
    adaptedData.filters?.pagination,
    dataPayload.pagination,
    rawPayload.pagination,
  );

  const pagination = extractPagination(paginationCandidate);
  if (pagination) {
    adaptedData.pagination = pagination;
  }

  if (response?.data) {
    return { ...response, data: adaptedData };
  }

  return adaptedData;
};

export {
  adaptChildAttendanceResponse,
  normalizeChildAttendanceParams,
};
