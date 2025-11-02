import { format } from 'date-fns';

export const MIN_ACTIVITY_DURATION = 45;

export const parseBackendTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string' || timeStr.trim() === '') {
    return null;
  }

  const timeRegex = /^([0-9]|[0-1][0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
  if (!timeRegex.test(timeStr.trim())) {
    console.warn('Invalid time format:', timeStr);
    return null;
  }

  try {
    const date = new Date(`2000-01-01T${timeStr.trim()}`);
    if (Number.isNaN(date.getTime())) {
      console.warn('Invalid time value:', timeStr);
      return null;
    }
    return date;
  } catch (error) {
    console.warn('Error parsing time:', timeStr, error);
    return null;
  }
};

export const calculateDurationMinutes = (start, end) => {
  if (!start || !end) return null;
  const difference = end.getTime() - start.getTime();
  if (difference <= 0) return null;
  return Math.round(difference / 60000);
};

export const formatTimeDisplay = (time) => (!time ? 'Belum diatur' : format(time, 'HH:mm'));

export const deriveKelompokDisplayLevel = (kelompok) => {
  if (!kelompok) return '';

  if (!kelompok.kelas_gabungan || kelompok.kelas_gabungan.length === 0) {
    return kelompok.level_anak_binaan?.nama_level_binaan || '';
  }

  return `Gabungan ${kelompok.kelas_gabungan.length} kelas`;
};

export const buildConflictAlertMessage = (conflicts) => {
  if (!conflicts || conflicts.length === 0) return '';

  return conflicts
    .map((conflict, index) => `${index + 1}. ${conflict}`)
    .join('\n');
};
