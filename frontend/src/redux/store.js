import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import { kurikulumApi } from '../features/adminCabang/api/kurikulumApi';

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
    }).concat(kurikulumApi.middleware),
  devTools: __DEV__, // Only enable Redux DevTools in development
});

// Hot reloading for reducers in development
if (__DEV__ && module.hot) {
  module.hot.accept('./rootReducer', () => {
    const newRootReducer = require('./rootReducer').default;
    store.replaceReducer(newRootReducer);
  });
}

export default store;