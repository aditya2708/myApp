import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AdminCabangChildReportScreen = () => (
  <View style={styles.container}>
    <Text style={styles.message}>Fitur ini sedang dikembangkan.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#1F2933',
  },
});

export default AdminCabangChildReportScreen;
