export const formatDateToLocalISO = (value) => {
  if (value === undefined || value === null) return null;

  let date;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    date = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const matches = trimmed.match(isoDatePattern);

    if (matches) {
      const [, year, month, day] = matches;
      date = new Date(Number(year), Number(month) - 1, Number(day));
    } else {
      const parsed = new Date(trimmed);
      if (Number.isNaN(parsed.getTime())) {
        return null;
      }
      date = parsed;
    }
  } else if (typeof value === 'number') {
    date = new Date(value);
  } else {
    return null;
  }

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
