import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../../common/components/Button';
import { useAuth } from '../../../common/hooks/useAuth';

const RoleItem = ({ role, onSelect }) => {
  const scopeLabel = role.scope_type
    ? `${role.scope_type}${role.scope_id ? ` #${role.scope_id}` : ''}`
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrapper}>
          <Ionicons name="briefcase-outline" size={22} color="#4a5568" />
        </View>
        <View style={styles.cardTitle}>
          <Text style={styles.roleName}>{role.name || role.slug}</Text>
          <Text style={styles.roleSlug}>{role.slug}</Text>
        </View>
      </View>
      {scopeLabel && <Text style={styles.scopeText}>{scopeLabel}</Text>}
      <Button title="Pilih Peran Ini" onPress={() => onSelect(role)} fullWidth />
    </View>
  );
};

const RolePickerScreen = ({ roles = [], onLogout, onRefresh }) => {
  const { selectRole, loading } = useAuth();

  const handleSelect = async (role) => {
    await selectRole(role);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="key-outline" size={36} color="#2f855a" />
        <Text style={styles.title}>Pilih Peran Aktif</Text>
        <Text style={styles.subtitle}>
          Akun ini memiliki beberapa peran. Pilih peran yang ingin dipakai untuk sesi ini.
        </Text>
      </View>

      <FlatList
        data={roles}
        keyExtractor={(item, index) => `${item.slug}-${item.scope_type || 'global'}-${item.scope_id || index}`}
        renderItem={({ item }) => <RoleItem role={item} onSelect={handleSelect} />}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <Button
          title="Muat Ulang"
          type="secondary"
          onPress={onRefresh}
          disabled={loading}
          style={styles.footerButton}
        />
        <Button
          title="Keluar"
          type="ghost"
          onPress={onLogout}
          disabled={loading}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a202c',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4a5568',
    textAlign: 'center',
    marginTop: 6,
  },
  listContent: {
    paddingVertical: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ebf8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    flex: 1,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
  },
  roleSlug: {
    fontSize: 13,
    color: '#718096',
  },
  scopeText: {
    fontSize: 13,
    color: '#4a5568',
    marginBottom: 12,
  },
  footer: {
    marginTop: 8,
    gap: 8,
  },
  footerButton: {
    marginBottom: 6,
  },
});

export default RolePickerScreen;
