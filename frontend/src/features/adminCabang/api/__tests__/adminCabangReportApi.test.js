import { adaptTutorReportResponse } from '../adminCabangReportApi';

describe('adaptTutorReportResponse', () => {
  it('normalizes tutor meta information from nested meta filters', () => {
    const response = {
      data: {
        data: {
          tutors: [
            {
              id: 't-1',
              tutor: { name: 'Tutor Satu' },
              shelter: { id: 's-1', name: 'Shelter Satu' },
              attendance_stats: {
                present: 10,
                absent: 2,
                late: 1,
                attendance_rate: 0.92,
              },
            },
          ],
          summary: {
            total_tutors: 1,
          },
          meta: {
            branch: { id: 'b-1', name: 'Cabang Utama' },
            pagination: {
              page: 2,
              per_page: 25,
              total: 60,
              last_page: 3,
            },
            filters: {
              applied: { shelter_id: 's-1', jenis_kegiatan: 'visit' },
              available: [
                {
                  field: 'shelter_id',
                  options: [{ key: 's-1', label: 'Shelter Satu' }],
                },
              ],
              collections: [
                {
                  field: 'jenis_kegiatan',
                  options: [{ key: 'visit', label: 'Kunjungan' }],
                },
              ],
            },
            timestamps: {
              last_refreshed_at: '2024-02-01T08:00:00Z',
            },
          },
        },
      },
    };

    const adaptedResponse = adaptTutorReportResponse(response);
    const payload = adaptedResponse.data;

    expect(payload.metadata.branch).toEqual({ id: 'b-1', name: 'Cabang Utama' });
    expect(payload.metadata.pagination).toMatchObject({
      page: 2,
      perPage: 25,
      total: 60,
      totalPages: 3,
    });
    expect(payload.metadata.filters).toEqual({ shelter_id: 's-1', jenis_kegiatan: 'visit' });
    expect(payload.metadata.available_filters).toEqual([
      {
        field: 'shelter_id',
        options: [{ key: 's-1', label: 'Shelter Satu' }],
      },
    ]);
    expect(payload.metadata.filter_collections).toEqual([
      {
        field: 'jenis_kegiatan',
        options: [{ key: 'visit', label: 'Kunjungan' }],
      },
      {
        field: 'shelter_id',
        options: [{ key: 's-1', label: 'Shelter Satu' }],
      },
    ]);
    expect(payload.metadata.last_refreshed_at).toBe('2024-02-01T08:00:00Z');

    const [tutor] = payload.data;
    expect(tutor.shelter).toEqual({ id: 's-1', name: 'Shelter Satu' });
    expect(tutor.attendance).toMatchObject({
      present: 10,
      absent: 2,
      late: 1,
      attendanceRate: 92,
      rate: 92,
    });
    expect(tutor.category).toBe('high');
  });
});
