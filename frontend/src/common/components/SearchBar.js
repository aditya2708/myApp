import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchBar = ({ 
  value, 
  onChangeText, 
  placeholder = "Cari...", 
  style,
  showSearchButton = false,
  onSearch,
  loading = false,
  disabled = false
}) => {
  const handleSearchPress = () => {
    if (onSearch && !loading && !disabled) {
      onSearch();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search-outline" size={20} color="#666" style={styles.icon} />
      <TextInput
        style={[styles.input, showSearchButton && styles.inputWithButton]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        editable={!disabled}
      />
      {showSearchButton && (
        <TouchableOpacity 
          style={[styles.searchButton, disabled && styles.searchButtonDisabled]} 
          onPress={handleSearchPress}
          disabled={loading || disabled}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="search" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  inputWithButton: {
    paddingRight: 8,
  },
  searchButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  searchButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
});

export default SearchBar;