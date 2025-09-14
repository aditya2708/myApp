import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const LaporanKegiatanMainScreen = () => {
  const navigation = useNavigation();

  const menuItems = [
    { title: 'Laporan Anak Binaan', icon: 'people', color: '#e74c3c', screen: 'LaporanAnakBinaan' },
    { title: 'Laporan Tutor', icon: 'school', color: '#2ecc71', screen: 'LaporanTutor' },
    { title: 'Shelter Report', icon: 'home', color: '#3498db', screen: 'ShelterReport' },
    { title: 'CPB Report', icon: 'document-text', color: '#9b59b6', screen: 'CPBReport' }
  ];

  const navigateTo = (screen) => navigation.navigate(screen);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.menuContainer}>
        {menuItems.map(({ title, icon, color, screen }, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={() => navigateTo(screen)}>
            <View style={[styles.menuIcon, { backgroundColor: color }]}>
              <Ionicons name={icon} size={32} color="#ffffff" />
            </View>
            <Text style={styles.menuText}>{title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  menuContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3
  },
  menuIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  menuText: { fontSize: 14, fontWeight: '600', color: '#333', textAlign: 'center' }
});

export default LaporanKegiatanMainScreen;