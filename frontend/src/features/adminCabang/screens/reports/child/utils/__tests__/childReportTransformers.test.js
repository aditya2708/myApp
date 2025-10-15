import {
  BAND_STYLES,
  formatPercentageLabel,
  normalizeStreaks,
  resolveBandMeta,
} from '../childReportTransformers';

describe('childReportTransformers.normalizeStreaks', () => {
  it('filters out nullish streak entries when normalizing objects', () => {
    const input = {
      longestStreak: { value: 7, unit: 'hari' },
      currentStreak: null,
      custom: { value: 3, label: 'Custom Label', unit: 'hari' },
      numericStreak: 2,
      missingStreak: undefined,
    };

    expect(() => normalizeStreaks(input)).not.toThrow();

    const result = normalizeStreaks(input);

    expect(result).toEqual([
      {
        id: 'longestStreak',
        label: 'longest Streak',
        value: 7,
        unit: 'hari',
      },
      {
        id: 'custom',
        label: 'Custom Label',
        value: 3,
        unit: 'hari',
      },
      {
        id: 'numericStreak',
        label: 'numericStreak',
        value: 2,
        unit: null,
      },
    ]);
  });
});

describe('childReportTransformers.formatPercentageLabel', () => {
  it('formats numeric ratios below one into percentages', () => {
    expect(formatPercentageLabel(0.95)).toBe('95,00%');
    expect(formatPercentageLabel('0.125')).toBe('12,50%');
  });

  it('parses fractional representations and converts them to percentages', () => {
    expect(formatPercentageLabel('3/4')).toBe('75,00%');
    expect(formatPercentageLabel('  1 / 5  ')).toBe('20,00%');
  });

  it('returns null when the value cannot be parsed', () => {
    expect(formatPercentageLabel('')).toBeNull();
    expect(formatPercentageLabel('not a number')).toBeNull();
  });
});

describe('childReportTransformers.resolveBandMeta', () => {
  it('honours explicit band values when provided', () => {
    const result = resolveBandMeta('HIGH', 72);

    expect(result).toEqual({ code: 'high', ...BAND_STYLES.high });
  });

  it('derives a high band when attendance is at least 80%', () => {
    const result = resolveBandMeta(null, 80);

    expect(result).toEqual({ code: 'high', ...BAND_STYLES.high });
  });

  it('derives a medium band when attendance is between 60% and 79.99%', () => {
    const result = resolveBandMeta(undefined, 79.9);

    expect(result).toEqual({ code: 'medium', ...BAND_STYLES.medium });
  });

  it('falls back to a low band when attendance is below 60%', () => {
    const result = resolveBandMeta('', 42.5);

    expect(result).toEqual({ code: 'low', ...BAND_STYLES.low });
  });

  it('returns unknown meta when the percentage cannot be parsed', () => {
    const result = resolveBandMeta(null, 'invalid');

    expect(result).toEqual({ code: 'unknown', ...BAND_STYLES.unknown });
  });
});
