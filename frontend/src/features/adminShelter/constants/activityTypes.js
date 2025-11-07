export const ALLOWED_ACTIVITY_TYPES = ['Bimbel', 'Tahfidz', 'Lain-lain'];

export const MANUAL_ATTENDANCE_ACTIVITY_TYPES = ['Bimbel', 'Tahfidz'];

export const MANUAL_ATTENDANCE_ACTIVITY_SET = new Set(MANUAL_ATTENDANCE_ACTIVITY_TYPES);

export const ALLOWED_ACTIVITY_TYPE_SET = new Set(ALLOWED_ACTIVITY_TYPES);

export const MANUAL_ATTENDANCE_ACTIVITY_LOWER_SET = new Set(
  MANUAL_ATTENDANCE_ACTIVITY_TYPES.map(type => type.toLowerCase()),
);

export const ALLOWED_ACTIVITY_TYPE_LOWER_SET = new Set(
  ALLOWED_ACTIVITY_TYPES.map(type => type.toLowerCase()),
);
