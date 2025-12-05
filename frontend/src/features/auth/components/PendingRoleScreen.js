import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../../common/components/Button';

const PendingRoleScreen = ({ onRefresh, onLogout, message }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name="shield-outline" size={64} color="#9b59b6" />
      </View>
      <Text style={styles.title}>Menunggu Role Lokal</Text>
      <Text style={styles.description}>
        {message ||
          'Akun SSO Anda valid, namun belum mempunyai level di aplikasi bimbel. Hubungi Super Admin atau coba muat ulang setelah role ditetapkan.'}
      </Text>
      <View style={styles.actions}>
        <Button
          title="Coba Muat Ulang"
          onPress={onRefresh}
          fullWidth
          style={styles.actionButton}
        />
        <Button
          title="Keluar"
          type="secondary"
          onPress={onLogout}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9fb',
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f3e5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: '#5d6d7e',
    textAlign: 'center',
    marginBottom: 32,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    marginBottom: 12,
  },
});

export default PendingRoleScreen;
