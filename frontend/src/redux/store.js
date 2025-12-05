import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import rootReducer from './rootReducer';
import { kurikulumApi } from '../features/adminCabang/api/kurikulumApi';
import { bindTokenRefresherDispatch } from '../api/tokenRefresher';
import { QUICK_FLOW_STORAGE_KEY } from '../features/adminShelter/redux/quickFlowSlice';

const quickFlowPersistenceMiddleware = (storeAPI) => (next) => (action) => {
  const result = next(action);

  const persistActions = new Set([
    'quickFlow/startQuickFlow',
    'quickFlow/updateQuickFlowStep',
    'quickFlow/setQuickFlowActivity',
    'quickFlow/completeQuickFlow',
    'quickFlow/resetQuickFlow',
    'quickFlow/hydrateQuickFlowState',
  ]);

  if (persistActions.has(action.type)) {
    const state = storeAPI.getState()?.quickFlow;
    if (!state) {
      return result;
    }

    const payload = JSON.stringify(state);
    if (!state.isActive) {
      AsyncStorage.removeItem(QUICK_FLOW_STORAGE_KEY).catch((err) =>
        console.warn('Failed to clear quick flow storage:', err)
      );
    } else {
      AsyncStorage.setItem(QUICK_FLOW_STORAGE_KEY, payload).catch((err) =>
        console.warn('Failed to persist quick flow state:', err)
      );
    }
  }

  return result;
};

/**
 * Redux store configuration
 * - Configures the Redux store with combined reducers
 * - Sets up middleware with defaults plus any custom middleware
 * - Disables serializable check to allow non-serializable values in state
 */
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable serializable check for non-serializable values
    }).concat(kurikulumApi.middleware, quickFlowPersistenceMiddleware),
  devTools: __DEV__, // Only enable Redux DevTools in development
});

// Wire dispatch to token refresher without creating a require cycle
bindTokenRefresherDispatch(store.dispatch);

// Hot reloading for reducers in development
if (__DEV__ && module.hot) {
  module.hot.accept('./rootReducer', () => {
    const newRootReducer = require('./rootReducer').default;
    store.replaceReducer(newRootReducer);
  });
}

export default store;
