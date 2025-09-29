import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AdminShelterSettingsScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Pengaturan</Text>
    <Text style={styles.description}>
      Fitur pengaturan akan segera hadir. Silakan kembali ke halaman profil untuk melanjutkan.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    color: '#2c3e50',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22,
    textAlign: 'center',
  },
});

export default AdminShelterSettingsScreen;
