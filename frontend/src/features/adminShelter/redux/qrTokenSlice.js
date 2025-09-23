import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { qrTokenApi } from '../api/qrTokenApi';

export const generateToken = createAsyncThunk(
  'qrToken/generate',
  async ({ id_anak, validDays, expiryStrategy } = {}, { rejectWithValue }) => {
    try {
      const response = await qrTokenApi.generateToken(id_anak, {
        validDays,
        expiryStrategy
      });
      return { ...response.data, id_anak };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const generateBatchTokens = createAsyncThunk(
  'qrToken/generateBatch',
  async ({ studentIds, validDays, expiryStrategy } = {}, { rejectWithValue }) => {
    try {
      const response = await qrTokenApi.generateBatchTokens(studentIds, {
        validDays,
        expiryStrategy
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const validateToken = createAsyncThunk(
  'qrToken/validate',
  async (token, { rejectWithValue }) => {
    try {
      const response = await qrTokenApi.validateToken(token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getActiveToken = createAsyncThunk(
  'qrToken/getActive',
  async (id_anak, { rejectWithValue }) => {
    try {
      const response = await qrTokenApi.getActiveToken(id_anak);
      return { ...response.data, id_anak };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const invalidateToken = createAsyncThunk(
  'qrToken/invalidate',
  async (token, { rejectWithValue }) => {
    try {
      const response = await qrTokenApi.invalidateToken(token);
      return { ...response.data, token };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const initialState = {
  tokens: {},
  studentTokens: {},
  currentToken: null,
  validationResult: null,
  loading: false,
  error: null,
  lastUpdated: null
};

const qrTokenSlice = createSlice({
  name: 'qrToken',
  initialState,
  reducers: {
    resetQrTokenError: (state) => {
      state.error = null;
    },
    resetValidationResult: (state) => {
      state.validationResult = null;
    },
    setCurrentToken: (state, action) => {
      state.currentToken = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateToken.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          const token = action.payload.data;
          const id_anak = action.payload.id_anak;
          
          state.tokens[token.token] = token;
          state.studentTokens[id_anak] = token;
          state.currentToken = token;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(generateToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to generate token';
      })
      .addCase(generateBatchTokens.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateBatchTokens.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data && Array.isArray(action.payload.data)) {
          action.payload.data.forEach(token => {
            state.tokens[token.token] = token;
            state.studentTokens[token.id_anak] = token;
          });
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(generateBatchTokens.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to generate batch tokens';
      })
      .addCase(validateToken.pending, (state) => {
        console.log('VALIDATE TOKEN PENDING...');
        state.loading = true;
        state.error = null;
        state.validationResult = null;
      })
      .addCase(validateToken.fulfilled, (state, action) => {
        console.log('VALIDATE TOKEN SUCCESS:', action.payload);
        state.loading = false;
        state.validationResult = {
          valid: true,
          token: action.payload.data.token,
          anak: action.payload.data.anak
        };
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(validateToken.rejected, (state, action) => {
        console.log('VALIDATE TOKEN FAILED:', action.payload);
        state.loading = false;
        state.validationResult = {
          valid: false,
          message: action.payload?.message || 'Invalid token'
        };
        state.error = action.payload?.message || 'Failed to validate token';
      })
      .addCase(getActiveToken.pending, (state) => {
        state.loading = true;
        // Keep existing error if it's not about "no active token"
        if (state.error && 
            (state.error.toLowerCase().includes('no active token') || 
             state.error.toLowerCase().includes('tidak ada token aktif'))) {
          state.error = null;
        }
      })
      .addCase(getActiveToken.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          const token = action.payload.data;
          const id_anak = action.payload.id_anak;
          
          state.tokens[token.token] = token;
          state.studentTokens[id_anak] = token;
          state.currentToken = token;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(getActiveToken.rejected, (state, action) => {
        state.loading = false;
        const id_anak = action.meta.arg;
        state.studentTokens[id_anak] = null;
        // Don't set error for "no active token" as it's expected behavior
        // Only set error for actual failures
        const errorMessage = action.payload?.message || '';
        if (!errorMessage.toLowerCase().includes('no active token') && 
            !errorMessage.toLowerCase().includes('tidak ada token aktif')) {
          state.error = errorMessage || 'Failed to get active token';
        }
      })
      .addCase(invalidateToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(invalidateToken.fulfilled, (state, action) => {
        state.loading = false;
        const { token } = action.payload;
        
        if (state.tokens[token]) {
          state.tokens[token].is_active = false;
          
          const id_anak = state.tokens[token].id_anak;
          if (state.studentTokens[id_anak] && state.studentTokens[id_anak].token === token) {
            state.studentTokens[id_anak] = null;
          }
          
          if (state.currentToken && state.currentToken.token === token) {
            state.currentToken = null;
          }
        }
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(invalidateToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to invalidate token';
      });
  }
});

export const { resetQrTokenError, resetValidationResult, setCurrentToken } = qrTokenSlice.actions;

export const selectQrTokenLoading = (state) => state.qrToken.loading;
export const selectQrTokenError = (state) => state.qrToken.error;
export const selectAllTokens = (state) => state.qrToken.tokens;
export const selectStudentToken = (state, id_anak) => state.qrToken.studentTokens[id_anak];
export const selectCurrentToken = (state) => state.qrToken.currentToken;
export const selectValidationResult = (state) => state.qrToken.validationResult;

export default qrTokenSlice.reducer;