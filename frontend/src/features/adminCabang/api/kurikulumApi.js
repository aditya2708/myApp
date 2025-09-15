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
      console.log('=== RTK QUERY NETWORK DEBUG ===');
      console.log('- Preparing headers for request');
      console.log('- Token exists:', !!token);
      console.log('- Token length:', token ? token.length : 'No token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
        console.log('- Authorization header set');
      }
      headers.set('Accept', 'application/json');
      console.log('- Accept header set to application/json');
      return headers;
    },
    fetchFn: async (url, options) => {
      console.log('=== RTK QUERY FETCH DEBUG ===');
      console.log('- URL:', url);
      console.log('- Method:', options?.method || 'GET');
      console.log('- Headers:', options?.headers ? Object.fromEntries(options.headers.entries()) : 'No headers');
      
      try {
        const response = await fetch(url, options);
        console.log('- Response status:', response.status);
        console.log('- Response ok:', response.ok);
        console.log('- Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Always read response body for debugging
        try {
          const responseText = await response.clone().text();
          console.log('- Response body length:', responseText.length);
          console.log('- Response body (first 500 chars):', responseText.substring(0, 500));
          
          // Try to parse as JSON
          const responseJson = JSON.parse(responseText);
          console.log('- Parsed JSON success:', !!responseJson);
          console.log('- JSON keys:', Object.keys(responseJson));
        } catch (parseError) {
          console.log('- JSON parse error:', parseError.message);
          console.log('- Response body (first 200 chars):', responseText?.substring(0, 200));
        }
        
        if (!response.ok) {
          console.log('- Response not ok');
        }
        
        return response;
      } catch (error) {
        console.log('- Fetch error:', error.message);
        console.log('- Error details:', error);
        throw error;
      }
    },
  }),
  tagTypes: ['Kurikulum', 'Materi', 'Semester', 'Statistics', 'TemplateAdoption', 'KelasCustom', 'MataPelajaranCustom', 'MasterDataDropdown', 'Jenjang'],
  endpoints: (builder) => ({
    // Kurikulum endpoints
    getKurikulumStruktur: builder.query({
      query: () => '/kurikulum/struktur',
      providesTags: ['Kurikulum'],
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
      transformResponse: (response) => {
        console.log('=== RTK QUERY TRANSFORM RESPONSE ===');
        console.log('- Raw response:', response);
        console.log('- Response type:', typeof response);
        console.log('- Response keys:', response ? Object.keys(response) : 'No keys');
        
        if (response && response.success && response.data) {
          console.log('- Success response detected');
          console.log('- Data type:', typeof response.data);
          console.log('- Data keys:', Object.keys(response.data));
          console.log('- Items array length:', response.data.data ? response.data.data.length : 'No data array');
          return response;
        } else {
          console.log('- Unexpected response structure');
          return response;
        }
      },
      providesTags: (result) => {
        console.log('=== RTK QUERY PROVIDE TAGS ===');
        console.log('- Result for tags:', result);
        console.log('- Result.data exists:', !!result?.data);
        console.log('- Result.data.data exists:', !!result?.data?.data);
        
        const materiData = result?.data?.data;
        if (materiData && Array.isArray(materiData)) {
          console.log('- Creating tags for', materiData.length, 'items');
          return [
            ...materiData.map(({ id_materi }) => ({ type: 'Materi', id: id_materi })),
            { type: 'Materi', id: 'LIST' },
          ];
        } else {
          console.log('- No valid data array, returning default tags');
          return [{ type: 'Materi', id: 'LIST' }];
        }
      },
    }),

    getMateri: builder.query({
      query: (id) => `/materi/${id}`,
      providesTags: (result, error, id) => [{ type: 'Materi', id }],
    }),

    getKurikulumMateri: builder.query({
      query: ({ kurikulumId, mataPelajaranId }) => ({
        url: `/kurikulum/${kurikulumId}/materi`,
        params: mataPelajaranId ? { mata_pelajaran: mataPelajaranId } : undefined,
      }),
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
        console.log('=== TEMPLATE ADOPTIONS TRANSFORM ===');
        console.log('- Raw response:', response);
        
        // Handle Laravel pagination structure
        if (response?.success && response?.data?.data) {
          console.log('- Transformed data:', response.data.data);
          return {
            ...response,
            data: response.data.data, // Extract nested data array
          };
        }
        
        console.log('- Fallback response:', response);
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
        console.log('=== SEMESTER LIST TRANSFORM ===');
        console.log('- Raw response:', response);
        
        // Handle Laravel pagination structure
        if (response?.success && response?.data) {
          console.log('- Response data exists');
          
          // Check if it's paginated (has pagination structure)
          if (response.data.data && Array.isArray(response.data.data)) {
            console.log('- Paginated data found, items:', response.data.data.length);
            console.log('- Transformed data:', response.data.data);
            return {
              ...response,
              data: response.data.data, // Extract nested data array from pagination
            };
          }
          // Check if it's direct array
          else if (Array.isArray(response.data)) {
            console.log('- Direct array data found, items:', response.data.length);
            console.log('- Transformed data:', response.data);
            return response; // Return as is for direct array
          }
          // Single item or object
          else {
            console.log('- Single item or object data');
            return response;
          }
        }
        
        console.log('- Fallback response:', response);
        return response;
      },
      providesTags: (result) => {
        const data = result?.data;
        if (Array.isArray(data)) {
          return [
            ...data.map(({ id_semester }) => ({ type: 'Semester', id: id_semester })),
            { type: 'Semester', id: 'LIST' },
          ];
        }
        return [{ type: 'Semester', id: 'LIST' }];
      },
    }),

    getSemester: builder.query({
      query: (id) => `/semester/${id}`,
      transformResponse: (response) => {
        console.log('=== SEMESTER DETAIL TRANSFORM ===');
        console.log('- Raw response:', response);
        
        // Handle single semester response
        if (response?.success && response?.data) {
          console.log('- Transformed data:', response.data);
          return response;
        }
        
        console.log('- Fallback response:', response);
        return response;
      },
      providesTags: (result, error, id) => [{ type: 'Semester', id }],
    }),

    getActiveSemester: builder.query({
      query: () => '/semester/active',
      transformResponse: (response) => {
        console.log('=== ACTIVE SEMESTER TRANSFORM ===');
        console.log('- Raw response:', response);
        
        // Handle active semester response
        if (response?.success && response?.data) {
          console.log('- Transformed data:', response.data);
          return response;
        }
        
        console.log('- Fallback response:', response);
        return response;
      },
      providesTags: [{ type: 'Semester', id: 'ACTIVE' }],
    }),

    getSemesterStatistics: builder.query({
      query: () => '/semester/statistics',
      transformResponse: (response) => {
        console.log('=== SEMESTER STATISTICS TRANSFORM ===');
        console.log('- Raw response:', response);
        
        // Handle statistics response
        if (response?.success && response?.data) {
          console.log('- Transformed data:', response.data);
          return response;
        }
        
        console.log('- Fallback response:', response);
        return response;
      },
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
      transformResponse: (response) => {
        console.log('=== KELAS CUSTOM TRANSFORM ===');
        console.log('- Raw response:', response);
        return response;
      },
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
      transformResponse: (response) => {
        console.log('=== MATA PELAJARAN CUSTOM TRANSFORM ===');
        console.log('- Raw response:', response);
        return response;
      },
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
      transformResponse: (response) => {
        console.log('=== MASTER DATA DROPDOWN TRANSFORM ===');
        console.log('- Raw response:', response);
        return response;
      },
      providesTags: ['MasterDataDropdown'],
    }),

    // Jenjang endpoint for backward compatibility
    getJenjang: builder.query({
      query: () => '/master-data/dropdown?include_jenjang=1',
      transformResponse: (response) => {
        console.log('=== JENJANG TRANSFORM ===');
        console.log('- Raw response:', response);
        // Extract jenjang from dropdown response
        return {
          ...response,
          data: response?.data?.jenjang || []
        };
      },
      providesTags: ['Jenjang'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  // Kurikulum hooks
  useGetKurikulumStrukturQuery,
  useGetMataPelajaranQuery,
  useGetKurikulumDropdownDataQuery,
  useGetKelasByJenjangQuery,
  useGetKurikulumStatisticsQuery,
  
  // Materi hooks
  useGetMateriListQuery,
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