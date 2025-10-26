import { buildSummaryHighlights } from '../tutorReportHelpers';

describe('buildSummaryHighlights', () => {
  it('uses summary.attendance values when available', () => {
    const summary = {
      attendance: {
        totals: {
          activities: 42,
        },
        verified: {
          present: 30,
          late: 5,
          absent: 7,
          total: 42,
        },
      },
      totalActivities: 100,
      presentCount: 80,
      lateCount: 10,
      absentCount: 10,
    };

    const highlights = buildSummaryHighlights(summary);

    expect(highlights).toEqual([
      { key: 'activities', label: 'Total Aktivitas', value: 42 },
      { key: 'present', label: 'Hadir', value: 30 },
      { key: 'late', label: 'Terlambat', value: 5 },
      { key: 'absent', label: 'Tidak Hadir', value: 7 },
    ]);
  });

  it('falls back to legacy summary fields when attendance data is missing', () => {
    const summary = {
      totalActivities: 12,
      presentCount: 9,
      lateCount: 2,
      absentCount: 1,
    };

    const highlights = buildSummaryHighlights(summary);

    expect(highlights).toEqual([
      { key: 'activities', label: 'Total Aktivitas', value: 12 },
      { key: 'present', label: 'Hadir', value: 9 },
      { key: 'late', label: 'Terlambat', value: 2 },
      { key: 'absent', label: 'Tidak Hadir', value: 1 },
    ]);
  });

  it('uses legacy fields as fallback for missing attendance entries', () => {
    const summary = {
      attendance: {
        totals: {
          activities: 10,
        },
        verified: {
          present: 6,
        },
      },
      absent_count: 3,
      lateCount: 1,
    };

    const highlights = buildSummaryHighlights(summary);

    expect(highlights).toEqual([
      { key: 'activities', label: 'Total Aktivitas', value: 10 },
      { key: 'present', label: 'Hadir', value: 6 },
      { key: 'late', label: 'Terlambat', value: 1 },
      { key: 'absent', label: 'Tidak Hadir', value: 3 },
    ]);
  });
});
