import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';

const CPBStatusTabs = ({ activeTab, tabCounts, onTabChange }) => {
  const tabs = [
    { key: 'BCPB', label: 'BCPB', description: 'Bakal Calon Penerima Beasiswa' },
    { key: 'CPB', label: 'CPB', description: 'Calon Penerima Beasiswa' },
    { key: 'NPB', label: 'NPB', description: 'Non Penerima Beasiswa' },
    { key: 'PB', label: 'PB', description: 'Penerima Beasiswa' }
  ];

  const getTabColor = (tabKey) => {
    switch (tabKey) {
      case 'BCPB':
        return '#e67e22'; // Orange
      case 'CPB':
        return '#3498db'; // Blue
      case 'NPB':
        return '#95a5a6'; // Gray
      case 'PB':
        return '#27ae60'; // Green
      default:
        return '#9b59b6';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tabCounts[tab.key] || 0;
          const tabColor = getTabColor(tab.key);

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isActive && { 
                  backgroundColor: tabColor,
                  borderColor: tabColor 
                }
              ]}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <Text style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive
                ]}>
                  {tab.label}
                </Text>
                <View style={[
                  styles.countBadge,
                  isActive && styles.countBadgeActive
                ]}>
                  <Text style={[
                    styles.countText,
                    isActive && styles.countTextActive
                  ]}>
                    {count}
                  </Text>
                </View>
              </View>
              <Text style={[
                styles.tabDescription,
                isActive && styles.tabDescriptionActive
              ]}>
                {tab.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  tab: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center'
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8
  },
  tabLabelActive: {
    color: '#fff'
  },
  countBadge: {
    backgroundColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center'
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666'
  },
  countTextActive: {
    color: '#fff'
  },
  tabDescription: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: 12
  },
  tabDescriptionActive: {
    color: 'rgba(255, 255, 255, 0.8)'
  }
});

export default CPBStatusTabs;