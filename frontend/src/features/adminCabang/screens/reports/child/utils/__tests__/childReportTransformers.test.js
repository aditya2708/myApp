import { normalizeStreaks } from '../childReportTransformers';

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
