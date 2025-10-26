import { buildTutorSummaryCards } from '../tutorReportHelpers';

describe('buildTutorSummaryCards', () => {
  const baseSummary = {
    total_tutors: 55,
    average_attendance_rate: 0.24,
    distribution: {
      high: { count: 0, percentage: 0 },
      medium: { count: 0, percentage: 0 },
      low: { count: 3, percentage: 5.45 },
      no_data: { count: 52, percentage: 94.55 },
    },
    attendance: {
      verified: {
        present: 17,
        late: 2,
        permit: 0,
        absent: 0,
        total: 19,
      },
      totals: {
        activities: 19,
      },
    },
  };

  it('builds four cards with formatted values from summary payload', () => {
    const cards = buildTutorSummaryCards(baseSummary);

    expect(cards).toHaveLength(4);

    const averageCard = cards.find((card) => card.id === 'average-attendance-rate');
    expect(averageCard).toBeDefined();
    expect(averageCard.value).toBe('24%');
    expect(averageCard.description).toContain('19');

    const totalTutorsCard = cards.find((card) => card.id === 'total-tutors');
    expect(totalTutorsCard.value).toBe('55');

    const distributionCard = cards.find((card) => card.id === 'category-distribution');
    expect(distributionCard.label).toContain('Rendah');
    expect(distributionCard.value).toBe('3');
    expect(distributionCard.description).toContain('52');

    const verifiedCard = cards.find((card) => card.id === 'verified-activities');
    expect(verifiedCard.value).toBe('17/2/0/0');
    expect(verifiedCard.description).toContain('19 aktivitas');
  });

  it('gracefully falls back to zero when fields are missing', () => {
    const cards = buildTutorSummaryCards({
      total_tutors: null,
      average_attendance_rate: undefined,
      distribution: {},
      attendance: {
        verified: {
          present: null,
        },
        totals: {},
      },
    });

    expect(cards).toHaveLength(4);
    expect(cards[0].value).toBe('0%');
    expect(cards[1].value).toBe('0');
    expect(cards[2].value).toBe('0');
    expect(cards[2].description).toContain('0');
    expect(cards[3].value).toBe('0/0/0/0');
  });
});
