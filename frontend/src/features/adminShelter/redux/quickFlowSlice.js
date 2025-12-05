import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export const QUICK_FLOW_STORAGE_KEY = '@quickFlowState';
export const QUICK_FLOW_TTL_MS = 4 * 60 * 60 * 1000; // 4 jam

const isStale = (isoDate) => {
  if (!isoDate) return true;
  const ts = new Date(isoDate).getTime();
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > QUICK_FLOW_TTL_MS;
};

const initialState = {
  isActive: false,
  currentStep: null,
  activityId: null,
  resumeEnabled: false,
  lastActionAt: null,
  hydrated: false,
  lastKnownStatus: null,
};

export const loadQuickFlowFromStorage = createAsyncThunk(
  'quickFlow/loadFromStorage',
  async () => {
    try {
      const raw = await AsyncStorage.getItem(QUICK_FLOW_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!parsed?.lastActionAt || isStale(parsed.lastActionAt)) {
        await AsyncStorage.removeItem(QUICK_FLOW_STORAGE_KEY);
        return null;
      }

      return parsed;
    } catch (error) {
      console.warn('Failed to load quick flow state:', error);
      return null;
    }
  }
);

const quickFlowSlice = createSlice({
  name: 'quickFlow',
  initialState,
  reducers: {
    hydrateQuickFlowState: (state, action) => {
      const payload = action.payload || {};
      if (!payload.isActive || isStale(payload.lastActionAt)) {
        return;
      }
      state.isActive = !!payload.isActive;
      state.currentStep = payload.currentStep || 'activityForm';
      state.activityId = payload.activityId || null;
      state.resumeEnabled = payload.resumeEnabled ?? true;
      state.lastActionAt = payload.lastActionAt || new Date().toISOString();
      state.lastKnownStatus = payload.lastKnownStatus || null;
    },
    startQuickFlow: (state, action) => {
      const { activityId = null, step = 'activityForm' } = action.payload || {};
      state.isActive = true;
      state.activityId = activityId;
      state.currentStep = step;
      state.resumeEnabled = true;
      state.lastActionAt = new Date().toISOString();
    },
    updateQuickFlowStep: (state, action) => {
      if (!state.isActive) {
        return;
      }
      state.currentStep = action.payload ?? state.currentStep;
      state.lastActionAt = new Date().toISOString();
    },
    setQuickFlowActivity: (state, action) => {
      const payload = action.payload;
      let activityId = null;
      let status = null;

      if (payload && typeof payload === 'object') {
        activityId = payload.activityId ?? null;
        status = payload.status ?? null;
      } else {
        activityId = payload ?? null;
      }

      state.activityId = activityId;
      state.lastKnownStatus = status;
      state.lastActionAt = new Date().toISOString();
    },
    completeQuickFlow: (state) => {
      state.isActive = false;
      state.currentStep = null;
      state.activityId = null;
      state.resumeEnabled = false;
      state.lastActionAt = new Date().toISOString();
      state.lastKnownStatus = null;
    },
    resetQuickFlow: (state) => {
      state.isActive = false;
      state.currentStep = null;
      state.activityId = null;
      state.resumeEnabled = false;
      state.lastActionAt = null;
      state.hydrated = true;
      state.lastKnownStatus = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadQuickFlowFromStorage.fulfilled, (state, action) => {
        state.hydrated = true;
        const payload = action.payload;
        if (payload && payload.isActive && !isStale(payload.lastActionAt)) {
          state.isActive = !!payload.isActive;
          state.currentStep = payload.currentStep || 'activityForm';
          state.activityId = payload.activityId || null;
          state.resumeEnabled = payload.resumeEnabled ?? true;
          state.lastActionAt = payload.lastActionAt || new Date().toISOString();
          state.lastKnownStatus = payload.lastKnownStatus || null;
        }
      })
      .addCase(loadQuickFlowFromStorage.rejected, (state) => {
        state.hydrated = true;
      });
  },
});

export const {
  startQuickFlow,
  updateQuickFlowStep,
  setQuickFlowActivity,
  completeQuickFlow,
  resetQuickFlow,
  hydrateQuickFlowState,
} = quickFlowSlice.actions;

const selectQuickFlowState = (state) => state.quickFlow;

export const selectIsQuickFlowActive = (state) => selectQuickFlowState(state).isActive;
export const selectQuickFlowStep = (state) => selectQuickFlowState(state).currentStep;
export const selectQuickFlowActivityId = (state) => selectQuickFlowState(state).activityId;
export const selectQuickFlowResumeEnabled = (state) => selectQuickFlowState(state).resumeEnabled;
export const selectQuickFlowLastActionAt = (state) => selectQuickFlowState(state).lastActionAt;
export const selectQuickFlowHydrated = (state) => selectQuickFlowState(state).hydrated;
export const selectQuickFlowStatus = (state) => selectQuickFlowState(state).lastKnownStatus;

export default quickFlowSlice.reducer;
