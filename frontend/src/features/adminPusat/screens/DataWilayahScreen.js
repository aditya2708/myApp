import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const menuItems = [
  {
    id: 'kantor-cabang',
    label: 'Kantor Cabang',
    description: 'Kelola informasi kantor cabang',
    icon: 'business',
    color: '#3498db',
  },
  {
    id: 'wilayah-binaan',
    label: 'Wilayah Binaan',
    description: 'Lihat daftar wilayah binaan',
    icon: 'map',
    color: '#2ecc71',
  },
  {
    id: 'shelter',
    label: 'Shelter',
    description: 'Data shelter dan fasilitas',
    icon: 'home',
    color: '#e67e22',
  },
];

const DataWilayahScreen = () => {
  const navigation = useNavigation();

  const handlePress = (itemId) => {
    if (itemId === 'kantor-cabang') {
      navigation.navigate('KacabList');
      return;
    }

    Alert.alert('Segera Hadir', 'Fitur ini akan tersedia pada pembaruan berikutnya.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Data Wilayah</Text>
      <Text style={styles.subtitle}>
        Pilih menu di bawah untuk melihat informasi wilayah yang tersedia.
      </Text>

      <View style={styles.menuList}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuCard}
            activeOpacity={0.8}
            onPress={() => handlePress(item.id)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={28} color="#fff" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  menuList: {
    gap: 12,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 13,
    color: '#777',
  },
});

export default DataWilayahScreen;
