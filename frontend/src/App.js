import React from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import Redux store
import store from './redux/store';

// Import main navigator
import AppNavigator from './navigation/AppNavigator';

// Ignore specific LogBox warnings
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested', // Ignore a common issue with nested ScrollViews
  'Require cycle:', // Ignore require cycles
  'Setting a timer', // Ignore timer warnings from Firestore
]);

// Main App component
export default function App() {
  const [queryClient] = React.useState(() => new QueryClient());

  // Main app with Redux Provider
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <View style={styles.container}>
            <AppNavigator />
          </View>
        </SafeAreaProvider>
      </QueryClientProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
