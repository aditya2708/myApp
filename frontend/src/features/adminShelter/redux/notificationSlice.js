import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { shelterOperationsApi } from '../api/shelterOperationsApi';

const normalizeNotification = (notification) => {
  if (!notification) {
    return notification;
  }

  const idValue =
    notification.id ??
    notification.notification_id ??
    notification.uuid ??
    notification.id_notification ??
    notification.id_notifikasi;

  const id = idValue !== undefined && idValue !== null ? String(idValue) : undefined;

  const rawIsRead =
    notification.is_read ??
    notification.isRead ??
    notification.status_read ??
    notification.read_status;

  const isRead = typeof rawIsRead === 'boolean'
    ? rawIsRead
    : rawIsRead === 1 || rawIsRead === '1' || rawIsRead === 'true' || !!notification.read_at;

  return {
    ...notification,
    id,
    is_read: isRead,
  };
};

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await shelterOperationsApi.getKurikulumNotifications();
      return response.data?.data ?? [];
    } catch (error) {
      const message = error.response?.data?.message || 'Gagal memuat notifikasi';
      return rejectWithValue(message);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notification/markNotificationAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await shelterOperationsApi.markNotificationAsRead(notificationId);
      return response.data?.data ?? null;
    } catch (error) {
      const message = error.response?.data?.message || 'Gagal memperbarui notifikasi';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  markingIds: [],
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = (action.payload ?? []).map(normalizeNotification);
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Gagal memuat notifikasi';
      })
      .addCase(markNotificationAsRead.pending, (state, action) => {
        const notificationId = action.meta.arg != null ? String(action.meta.arg) : action.meta.arg;
        if (!state.markingIds.includes(notificationId)) {
          state.markingIds.push(notificationId);
        }
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notificationId = action.meta.arg != null ? String(action.meta.arg) : action.meta.arg;
        state.markingIds = state.markingIds.filter((id) => id !== notificationId);

        const updatedNotification = action.payload ? normalizeNotification(action.payload) : null;

        state.items = state.items.map((notification) => {
          if (notification.id === notificationId) {
            if (updatedNotification) {
              return {
                ...notification,
                ...updatedNotification,
                is_read: true,
              };
            }

            return {
              ...notification,
              is_read: true,
            };
          }

          return notification;
        });
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        const notificationId = action.meta.arg != null ? String(action.meta.arg) : action.meta.arg;
        state.markingIds = state.markingIds.filter((id) => id !== notificationId);
        state.error = action.payload || 'Gagal memperbarui notifikasi';
      });
  },
});

export const selectNotifications = (state) => state.notification.items;
export const selectNotificationStatus = (state) => state.notification.status;
export const selectNotificationError = (state) => state.notification.error;
export const selectMarkingNotificationIds = (state) => state.notification.markingIds;

export const selectUnreadNotificationCount = createSelector(
  selectNotifications,
  (notifications) => notifications.filter((notification) => !notification.is_read).length
);

export const { clearNotificationError } = notificationSlice.actions;

export default notificationSlice.reducer;
