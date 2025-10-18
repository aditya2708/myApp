import React from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';

const LaporanKegiatanMainScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Fitur ini sedang dikembangkan</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  text: {
    fontSize: 16,
    color: '#333333'
  }
});

export default LaporanKegiatanMainScreen;
