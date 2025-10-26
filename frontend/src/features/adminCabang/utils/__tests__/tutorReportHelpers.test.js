import { buildTutorSummaryCards, summarizeTutors } from '../tutorReportHelpers';

describe('buildTutorSummaryCards', () => {
  const baseSummary = {
    total_tutors: 55,
    average_attendance_rate: 0.24,
  };

  it('builds two cards with formatted values from summary payload', () => {
    const cards = buildTutorSummaryCards(baseSummary);

    expect(cards).toHaveLength(2);

    const averageCard = cards.find((card) => card.id === 'average-attendance-rate');
    expect(averageCard).toBeDefined();
    expect(averageCard.value).toBe(24);
    expect(averageCard.description).toBe('Persentase rata-rata kehadiran tutor yang tercatat.');

    const totalTutorsCard = cards.find((card) => card.id === 'total-tutors');
    expect(totalTutorsCard.value).toBe('55');
    expect(totalTutorsCard.description).toBe('Jumlah tutor yang terpantau dalam laporan ini.');
  });

  it('gracefully falls back to zero when fields are missing', () => {
    const cards = buildTutorSummaryCards({
      total_tutors: null,
      average_attendance_rate: null,
    });

    expect(cards).toHaveLength(2);
    expect(cards[0].value).toBeNull();
    expect(cards[1].value).toBe('0');
  });
});

describe('summarizeTutors', () => {
  it('normalizes fractional averages to percentage scale', () => {
    const result = summarizeTutors([], {
      total_tutors: 12,
      average_attendance_rate: 0.24,
      distribution: {},
    });

    expect(result.average_attendance_rate).toBe(24);
  });

  it('converts tutor records with fractional rates to percentages', () => {
    const result = summarizeTutors([
      { attendance_rate: 0.245, category: 'low' },
      { attendance_rate: 0.5, category: 'medium' },
    ]);

    expect(result.average_attendance_rate).toBe(37.25);
  });

  it('retains percent-based averages without additional scaling', () => {
    const result = summarizeTutors([], {
      total_tutors: 8,
      average_attendance_rate: 11.76,
      distribution: {},
    });

    expect(result.average_attendance_rate).toBe(11.76);
  });

  it('parses percentage strings from the API', () => {
    const result = summarizeTutors([], {
      total_tutors: 5,
      average_attendance_rate: '24%',
      distribution: {},
    });

    expect(result.average_attendance_rate).toBe(24);
  });
});
