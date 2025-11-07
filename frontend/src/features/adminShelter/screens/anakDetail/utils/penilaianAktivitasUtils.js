const toIdString = (value) => (value !== undefined && value !== null ? value.toString() : '');

const unwrapCollection = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const collectionHasTargetChild = (collection, targetAnakId) => {
  if (!Array.isArray(collection) || !targetAnakId) return false;

  return collection.some(item => {
    if (!item) return false;
    const possibleIds = [
      item.id_anak,
      item.anak_id,
      item.child_id,
      item?.anak?.id_anak,
      item?.pivot?.id_anak,
      item?.target_id
    ];
    return possibleIds.some(id => toIdString(id) === targetAnakId);
  });
};

const inferMembershipFromActivity = (activity, anakData, targetAnakId) => {
  if (!activity) return null;

  const candidateCollections = [
    activity.members,
    activity.participants,
    activity.peserta,
    activity.anak,
    activity.anak_binaan,
    activity.students,
    activity.child_list,
    activity.attendance_members,
    activity?.attendance_summary?.members,
    activity?.kelompok?.anggota,
    activity?.kelompok?.members
  ];

  for (const raw of candidateCollections) {
    const collection = unwrapCollection(raw);
    if (collection.length === 0) continue;
    if (collectionHasTargetChild(collection, targetAnakId)) {
      return true;
    }
  }

  return null;
};

const extractMembersFromPayload = (payload) => {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.members)) {
    return payload.members;
  }

  if (Array.isArray(payload.data?.members)) {
    return payload.data.members;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.data?.data?.members)) {
    return payload.data.data.members;
  }

  return [];
};

const parseDateSafe = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sortActivitiesByLatest = (activities) => {
  return activities.slice().sort((a, b) => {
    const dateA = parseDateSafe(a?.tanggal);
    const dateB = parseDateSafe(b?.tanggal);

    if (dateA && dateB) {
      return dateB.getTime() - dateA.getTime();
    }

    if (dateB) return 1;
    if (dateA) return -1;
    return 0;
  });
};

const filterActivitiesForChild = async (
  activities,
  usedActivityIds,
  {
    allowedActivityId,
    targetAnakId,
    anakData,
    attendanceApi
  }
) => {
  if (!Array.isArray(activities)) return { list: [], unresolved: 0 };

  const allowedIdString = toIdString(allowedActivityId);
  const result = [];
  const pendingVerification = [];

  activities.forEach(activity => {
    if (!activity?.id_aktivitas) return;

    const aktivitasIdString = toIdString(activity.id_aktivitas);
    if (!aktivitasIdString) return;

    const isAllowedActivity = aktivitasIdString === allowedIdString;

    if (usedActivityIds.has(aktivitasIdString) && !isAllowedActivity) {
      return;
    }

    const inferred = inferMembershipFromActivity(activity, anakData, targetAnakId);
    if (inferred === true) {
      result.push(activity);
      return;
    }

    if (inferred === false && !isAllowedActivity) {
      return;
    }

    pendingVerification.push({ activity, isAllowedActivity });
  });

  let unresolvedCount = 0;

  if (pendingVerification.length > 0 && targetAnakId && attendanceApi) {
    const verificationResults = await Promise.allSettled(
      pendingVerification.map(({ activity }) =>
        attendanceApi.getActivityMembers(activity.id_aktivitas, { include_summary: true })
      )
    );

    verificationResults.forEach((verification, index) => {
      const { activity, isAllowedActivity } = pendingVerification[index];

      if (verification.status !== 'fulfilled') {
        if (!isAllowedActivity) {
          unresolvedCount += 1;
        }
        return;
      }

      const payload = verification.value?.data;
      const members = extractMembersFromPayload(payload?.data ?? payload);

      if (collectionHasTargetChild(members, targetAnakId) || isAllowedActivity) {
        result.push(activity);
      }
    });
  }

  if (allowedActivityId && !result.some(item => toIdString(item.id_aktivitas) === allowedIdString)) {
    const fallbackActivity = activities.find(item => toIdString(item?.id_aktivitas) === allowedIdString);
    if (fallbackActivity) {
      result.push(fallbackActivity);
    }
  }

  return {
    list: sortActivitiesByLatest(result),
    unresolved: unresolvedCount
  };
};

const formatDateForQuery = (date) => {
  if (!(date instanceof Date)) return null;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export {
  toIdString,
  collectionHasTargetChild,
  unwrapCollection,
  inferMembershipFromActivity,
  extractMembersFromPayload,
  parseDateSafe,
  sortActivitiesByLatest,
  filterActivitiesForChild,
  formatDateForQuery
};
