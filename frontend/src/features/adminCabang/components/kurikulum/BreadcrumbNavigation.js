import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BreadcrumbNavigation = ({ path = [], onNavigate }) => {
  const handleNavigate = (index) => {
    if (onNavigate && index < path.length - 1) {
      onNavigate(index);
    }
  };

  if (!path.length) return null;

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {path.map((item, index) => (
          <View key={index} style={styles.breadcrumbItem}>
            <TouchableOpacity
              style={[
                styles.breadcrumbText,
                index === path.length - 1 && styles.currentBreadcrumb
              ]}
              onPress={() => handleNavigate(index)}
              disabled={index === path.length - 1}
            >
              <Text
                style={[
                  styles.breadcrumbLabel,
                  index === path.length - 1 && styles.currentLabel
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
            
            {index < path.length - 1 && (
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color="#666" 
                style={styles.chevron}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  scrollContent: {
    alignItems: 'center',
    paddingRight: 16,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentBreadcrumb: {
    backgroundColor: '#e3f2fd',
  },
  breadcrumbLabel: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
    maxWidth: 120,
  },
  currentLabel: {
    color: '#0d47a1',
    fontWeight: '600',
  },
  chevron: {
    marginHorizontal: 4,
  },
});

export default BreadcrumbNavigation;