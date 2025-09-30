import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../../constants/config';

/**
 * RTK Query API for Admin Cabang Kurikulum management
 * Handles all API calls related to kurikulum, materi, and semester
 */
export const kurikulumApi = createApi({
  reducerPath: 'kurikulumApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/admin-cabang`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Accept', 'application/json');
      return headers;
    },
    fetchFn: (url, options) => fetch(url, options),
  }),
  tagTypes: ['Kurikulum', 'Materi', 'Semester', 'Statistics', 'TemplateAdoption', 'KelasCustom', 'MataPelajaranCustom', 'MasterDataDropdown', 'Jenjang'],
  endpoints: (builder) => ({
    // Kurikulum endpoints
    getKurikulumStruktur: builder.query({
      query: (kurikulumId) => ({
        url: '/kurikulum/struktur',
        params: kurikulumId ? { kurikulum_id: kurikulumId } : undefined,
      }),
      providesTags: ['Kurikulum'],
    }),

    getKurikulumList: builder.query({
      query: (params) => ({
        url: '/kurikulum',
        params,
      }),
      transformResponse: (response) => {
        if (Array.isArray(response)) {
          return { data: response };
        }

        if (Array.isArray(response?.data)) {
          return { ...response, data: response.data };
        }

        if (Array.isArray(response?.data?.data)) {
          return { ...response, data: response.data.data };
        }

        return response;
      },
      providesTags: (result) => {
        const list = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : [];

        if (list.length > 0) {
          return [
            ...list.map((item) => ({
              type: 'Kurikulum',
              id: item?.id_kurikulum ?? item?.id,
            })),
            { type: 'Kurikulum', id: 'LIST' },
          ];
        }

        return [{ type: 'Kurikulum', id: 'LIST' }];
      },
    }),

    createKurikulum: builder.mutation({
      query: (data) => ({
        url: '/kurikulum',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Kurikulum', id: 'LIST' }, 'Statistics'],
    }),

    setKurikulumActive: builder.mutation({
      query: ({ kurikulumId }) => ({
        url: `/kurikulum/${kurikulumId}/set-active`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { kurikulumId }) => [
        { type: 'Kurikulum', id: kurikulumId },
        { type: 'Kurikulum', id: 'LIST' },
      ],
    }),

    getMataPelajaran: builder.query({
      query: (params) => ({
        url: '/kurikulum/mata-pelajaran',
        params,
      }),
      providesTags: ['Kurikulum'],
    }),

    getKurikulumDropdownData: builder.query({
      query: () => '/kurikulum/dropdown-data',
      providesTags: ['Kurikulum'],
    }),

    getKelasByJenjang: builder.query({
      query: (jenjangId) => `/kurikulum/kelas/${jenjangId}`,
      providesTags: ['Kurikulum'],
    }),

    getKurikulumStatistics: builder.query({
      query: () => '/kurikulum/statistics',
      providesTags: ['Statistics'],
    }),

    // Materi endpoints
    getMateriList: builder.query({
      query: (params) => ({
        url: '/materi',
        params,
      }),
      transformResponse: (response) => response,
      providesTags: (result) => {
        const materiData = result?.data?.data;
        if (materiData && Array.isArray(materiData)) {
          return [
            ...materiData.map(({ id_materi }) => ({ type: 'Materi', id: id_materi })),
            { type: 'Materi', id: 'LIST' },
          ];
        }
        return [{ type: 'Materi', id: 'LIST' }];
      },
    }),

    getMateri: builder.query({
      query: (id) => `/materi/${id}`,
      providesTags: (result, error, id) => [{ type: 'Materi', id }],
    }),

    getKurikulumMateri: builder.query({
      query: ({ kurikulumId, mataPelajaranId, kelasId }) => {
        const params = {};

        if (mataPelajaranId) {
          params.mata_pelajaran = mataPelajaranId;
        }

        if (kelasId) {
          params.kelas = kelasId;
        }

        return {
          url: `/kurikulum/${kurikulumId}/materi`,
          params: Object.keys(params).length > 0 ? params : undefined,
        };
      },
      providesTags: ['Kurikulum'],
    }),

    addKurikulumMateri: builder.mutation({
      query: ({ kurikulumId, mataPelajaranId, materiId, urutan }) => {
        const body = {
          id_mata_pelajaran: mataPelajaranId,
          id_materi: materiId,
        };

        if (urutan !== undefined && urutan !== null) {
          body.urutan = urutan;
        }

        return {
          url: `/kurikulum/${kurikulumId}/materi`,
          method: 'POST',
          body,
        };
      },
      invalidatesTags: ['Kurikulum'],
    }),

    deleteKurikulumMateri: builder.mutation({
      query: ({ kurikulumId, materiId }) => ({
        url: `/kurikulum/${kurikulumId}/materi/${materiId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Kurikulum'],
    }),

    createMateri: builder.mutation({
      query: (data) => {
        const formData = new FormData();

        // Append all form fields
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
            if (key === 'file' && data[key]) {
              formData.append('file', data[key]);
            } else {
              formData.append(key, data[key]);
            }
          }
        });

        return {
          url: '/materi',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: [{ type: 'Materi', id: 'LIST' }, 'Statistics', 'Kurikulum'],
    }),

    updateMateri: builder.mutation({
      query: ({ id, ...data }) => {
        const formData = new FormData();
        
        // Append all form fields
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
            if (key === 'file' && data[key]) {
              formData.append('file', data[key]);
            } else {
              formData.append(key, data[key]);
            }
          }
        });

        return {
          url: `/materi/${id}`,
          method: 'PUT',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Materi', id },
        { type: 'Materi', id: 'LIST' },
        'Statistics',
        'Kurikulum',
      ],
    }),

    deleteMateri: builder.mutation({
      query: (id) => ({
        url: `/materi/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Materi', id },
        { type: 'Materi', id: 'LIST' },
        'Statistics',
        'Kurikulum',
      ],
    }),

    reorderMateri: builder.mutation({
      query: (materiIds) => ({
        url: '/materi/reorder',
        method: 'POST',
        body: { materi_ids: materiIds },
      }),
      invalidatesTags: [{ type: 'Materi', id: 'LIST' }, 'Statistics', 'Kurikulum'],
    }),

    // Template Adoption endpoints
    getTemplateAdoptions: builder.query({
      query: (params) => ({
        url: '/template-adoptions',
        params,
      }),
      transformResponse: (response) => {
        // Handle Laravel pagination structure
        if (response?.success && response?.data?.data) {
          return {
            ...response,
            data: response.data.data, // Extract nested data array
          };
        }
        return response;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id_adoption }) => ({ type: 'TemplateAdoption', id: id_adoption })),
              { type: 'TemplateAdoption', id: 'LIST' },
            ]
          : [{ type: 'TemplateAdoption', id: 'LIST' }],
    }),

    getTemplateAdoption: builder.query({
      query: (id) => `/template-adoptions/${id}`,
      providesTags: (result, error, id) => [{ type: 'TemplateAdoption', id }],
    }),

    adoptTemplate: builder.mutation({
      query: (adoptionId) => ({
        url: `/template-adoptions/${adoptionId}/adopt`,
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'TemplateAdoption', id: 'LIST' },
        { type: 'Materi', id: 'LIST' },
        'Statistics',
        'Kurikulum',
      ],
    }),

    customizeTemplate: builder.mutation({
      query: ({ adoptionId, customizationData }) => ({
        url: `/template-adoptions/${adoptionId}/customize`,
        method: 'POST',
        body: customizationData,
      }),
      invalidatesTags: [
        { type: 'TemplateAdoption', id: 'LIST' },
        { type: 'Materi', id: 'LIST' },
        'Statistics',
        'Kurikulum',
      ],
    }),

    skipTemplate: builder.mutation({
      query: (adoptionId) => ({
        url: `/template-adoptions/${adoptionId}/skip`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'TemplateAdoption', id: 'LIST' }],
    }),

    // Semester endpoints
    getSemesterList: builder.query({
      query: (params) => ({
        url: '/semester',
        params,
      }),
      transformResponse: (response) => {
        // Handle Laravel pagination structure
        if (response?.success && Array.isArray(response?.data?.data)) {
          return {
            ...response,
            data: response.data.data, // Extract nested data array from pagination
          };
        }
        return response;
      },
      providesTags: (result) => {
        const data = result?.data;
        if (Array.isArray(data)) {
          return [
            ...data.map(({ id_semester, id }) => ({ type: 'Semester', id: id_semester ?? id })),
            { type: 'Semester', id: 'LIST' },
          ];
        }
        return [{ type: 'Semester', id: 'LIST' }];
      },
    }),

    getSemester: builder.query({
      query: (id) => `/semester/${id}`,
      transformResponse: (response) => response,
      providesTags: (result, error, id) => [{ type: 'Semester', id }],
    }),

    getActiveSemester: builder.query({
      query: () => '/semester/active',
      transformResponse: (response) => response,
      providesTags: [{ type: 'Semester', id: 'ACTIVE' }],
    }),

    getSemesterStatistics: builder.query({
      query: () => '/semester/statistics',
      transformResponse: (response) => response,
      providesTags: ['Statistics'],
    }),

    createSemester: builder.mutation({
      query: (data) => ({
        url: '/semester',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Semester', id: 'LIST' }, 'Statistics'],
    }),

    updateSemester: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/semester/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Semester', id },
        { type: 'Semester', id: 'LIST' },
        { type: 'Semester', id: 'ACTIVE' },
        'Statistics',
      ],
    }),

    deleteSemester: builder.mutation({
      query: (id) => ({
        url: `/semester/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Semester', id },
        { type: 'Semester', id: 'LIST' },
        { type: 'Semester', id: 'ACTIVE' },
        'Statistics',
      ],
    }),

    setActiveSemester: builder.mutation({
      query: (id) => ({
        url: `/semester/${id}/set-active`,
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'Semester', id: 'LIST' },
        { type: 'Semester', id: 'ACTIVE' },
        'Statistics',
      ],
    }),

    // Master Data - Kelas Custom endpoints
    getKelasCustom: builder.query({
      query: (params) => ({
        url: '/kelas-custom',
        params,
      }),
      transformResponse: (response) => response,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id_kelas }) => ({ type: 'KelasCustom', id: id_kelas })),
              { type: 'KelasCustom', id: 'LIST' },
            ]
          : [{ type: 'KelasCustom', id: 'LIST' }],
    }),

    createKelasCustom: builder.mutation({
      query: (data) => ({
        url: '/kelas-custom',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'KelasCustom', id: 'LIST' },
        'Statistics',
        'Kurikulum',
      ],
    }),

    updateKelasCustom: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/kelas-custom/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'KelasCustom', id },
        { type: 'KelasCustom', id: 'LIST' },
        'Statistics',
        'Kurikulum',
      ],
    }),

    deleteKelasCustom: builder.mutation({
      query: (id) => ({
        url: `/kelas-custom/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'KelasCustom', id },
        { type: 'KelasCustom', id: 'LIST' },
        'Statistics',
        'Kurikulum',
      ],
    }),

    // Master Data - Mata Pelajaran Custom endpoints
    getMataPelajaranCustom: builder.query({
      query: (params) => ({
        url: '/mata-pelajaran-custom',
        params,
      }),
      transformResponse: (response) => response,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id_mata_pelajaran }) => ({ type: 'MataPelajaranCustom', id: id_mata_pelajaran })),
              { type: 'MataPelajaranCustom', id: 'LIST' },
            ]
          : [{ type: 'MataPelajaranCustom', id: 'LIST' }],
    }),

    createMataPelajaranCustom: builder.mutation({
      query: (data) => ({
        url: '/mata-pelajaran-custom',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [
        { type: 'MataPelajaranCustom', id: 'LIST' },
        'Statistics',
        'Kurikulum',
      ],
    }),

    updateMataPelajaranCustom: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/mata-pelajaran-custom/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'MataPelajaranCustom', id },
        { type: 'MataPelajaranCustom', id: 'LIST' },
        'Statistics',
        'Kurikulum',
      ],
    }),

    deleteMataPelajaranCustom: builder.mutation({
      query: (id) => ({
        url: `/mata-pelajaran-custom/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'MataPelajaranCustom', id },
        { type: 'MataPelajaranCustom', id: 'LIST' },
        'Statistics',
        'Kurikulum',
      ],
    }),

    // Master Data dropdown
    getMasterDataDropdown: builder.query({
      query: (params) => ({
        url: '/master-data/dropdown',
        params,
      }),
      transformResponse: (response) => response,
      providesTags: ['MasterDataDropdown'],
    }),

    // Jenjang endpoint for backward compatibility
    getJenjang: builder.query({
      query: () => '/master-data/dropdown?include_jenjang=1',
      transformResponse: (response) => ({
        ...response,
        data: response?.data?.jenjang || [],
      }),
      providesTags: ['Jenjang'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  // Kurikulum hooks
  useGetKurikulumStrukturQuery,
  useGetKurikulumListQuery,
  useCreateKurikulumMutation,
  useSetKurikulumActiveMutation,
  useGetMataPelajaranQuery,
  useGetKurikulumDropdownDataQuery,
  useGetKelasByJenjangQuery,
  useGetKurikulumStatisticsQuery,
  
  // Materi hooks
  useGetMateriListQuery,
  useLazyGetMateriListQuery,
  useGetMateriQuery,
  useGetKurikulumMateriQuery,
  useAddKurikulumMateriMutation,
  useDeleteKurikulumMateriMutation,
  useCreateMateriMutation,
  useUpdateMateriMutation,
  useDeleteMateriMutation,
  useReorderMateriMutation,
  
  // Template Adoption hooks
  useGetTemplateAdoptionsQuery,
  useGetTemplateAdoptionQuery,
  useAdoptTemplateMutation,
  useCustomizeTemplateMutation,
  useSkipTemplateMutation,
  
  // Semester hooks
  useGetSemesterListQuery,
  useGetSemesterQuery,
  useGetActiveSemesterQuery,
  useGetSemesterStatisticsQuery,
  useCreateSemesterMutation,
  useUpdateSemesterMutation,
  useDeleteSemesterMutation,
  useSetActiveSemesterMutation,
  
  // Master Data hooks
  useGetKelasCustomQuery,
  useCreateKelasCustomMutation,
  useUpdateKelasCustomMutation,
  useDeleteKelasCustomMutation,
  useGetMataPelajaranCustomQuery,
  useCreateMataPelajaranCustomMutation,
  useUpdateMataPelajaranCustomMutation,
  useDeleteMataPelajaranCustomMutation,
  useGetMasterDataDropdownQuery,
  useGetJenjangQuery,
} = kurikulumApi;

export default kurikulumApi;