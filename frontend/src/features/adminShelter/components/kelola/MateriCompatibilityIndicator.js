import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MateriCompatibilityIndicator = ({
  kelasGabungan = [],
  materiCompatibility = {},
  onPress,
  showDetails = true,
  size = 'medium', // small, medium, large
  style
}) => {
  // Calculate total available materi for selected kelas combination
  const getTotalMateriCount = () => {
    return kelasGabungan.reduce((total, item) => {
      const count = materiCompatibility[item.jenjang]?.[item.kelas] || 0;
      return total + count;
    }, 0);
  };

  // Calculate average materi per kelas
  const getAverageMateriPerKelas = () => {
    if (kelasGabungan.length === 0) return 0;
    const totalMateri = getTotalMateriCount();
    return Math.round(totalMateri / kelasGabungan.length);
  };

  // Calculate compatibility score (0-100%)
  const getCompatibilityScore = () => {
    if (kelasGabungan.length === 0) return 0;
    
    const avgMateri = getAverageMateriPerKelas();
    // Assume 10+ materi per kelas is optimal (100%)
    const optimalMateriPerKelas = 10;
    const score = Math.min(Math.round((avgMateri / optimalMateriPerKelas) * 100), 100);
    
    return score;
  };

  // Get compatibility level and color
  const getCompatibilityInfo = () => {
    const score = getCompatibilityScore();
    
    if (score >= 80) {
      return {
        level: 'Sangat Baik',
        color: '#2ecc71',
        icon: 'checkmark-circle',
        description: 'Banyak materi tersedia untuk kombinasi ini'
      };
    } else if (score >= 60) {
      return {
        level: 'Baik',
        color: '#27ae60',
        icon: 'checkmark-circle-outline',
        description: 'Cukup materi tersedia untuk kombinasi ini'
      };
    } else if (score >= 40) {
      return {
        level: 'Cukup',
        color: '#f39c12',
        icon: 'warning-outline',
        description: 'Materi terbatas untuk beberapa kelas'
      };
    } else if (score >= 20) {
      return {
        level: 'Kurang',
        color: '#e67e22',
        icon: 'alert-circle-outline',
        description: 'Sedikit materi untuk kombinasi ini'
      };
    } else {
      return {
        level: 'Sangat Kurang',
        color: '#e74c3c',
        icon: 'close-circle',
        description: 'Sangat sedikit atau tidak ada materi'
      };
    }
  };

  // Get materi breakdown by jenjang
  const getMateriBreakdown = () => {
    const breakdown = {};
    kelasGabungan.forEach(item => {
      if (!breakdown[item.jenjang]) {
        breakdown[item.jenjang] = {
          total: 0,
          kelas: []
        };
      }
      const materiCount = materiCompatibility[item.jenjang]?.[item.kelas] || 0;
      breakdown[item.jenjang].total += materiCount;
      breakdown[item.jenjang].kelas.push({
        kelas: item.kelas,
        count: materiCount
      });
    });
    return breakdown;
  };

  // Size configurations
  const sizeConfig = {
    small: {
      containerHeight: 40,
      scoreSize: 14,
      titleSize: 12,
      iconSize: 16,
      padding: 8
    },
    medium: {
      containerHeight: 60,
      scoreSize: 18,
      titleSize: 14,
      iconSize: 20,
      padding: 12
    },
    large: {
      containerHeight: 80,
      scoreSize: 24,
      titleSize: 16,
      iconSize: 24,
      padding: 16
    }
  };

  const config = sizeConfig[size];
  const compatibilityInfo = getCompatibilityInfo();
  const totalMateri = getTotalMateriCount();
  const score = getCompatibilityScore();

  if (kelasGabungan.length === 0) {
    return (
      <View style={[styles.container, { height: config.containerHeight }, style]}>
        <View style={styles.emptyState}>
          <Ionicons name="help-circle-outline" size={config.iconSize} color="#bdc3c7" />
          <Text style={[styles.emptyText, { fontSize: config.titleSize }]}>
            Pilih kelas untuk melihat kompatibilitas materi
          </Text>
        </View>
      </View>
    );
  }

  const renderBasicIndicator = () => (
    <TouchableOpacity
      style={[
        styles.container,
        { height: config.containerHeight, backgroundColor: compatibilityInfo.color + '15', borderColor: compatibilityInfo.color },
        style
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.basicContent}>
        <View style={styles.scoreSection}>
          <View style={[styles.scoreCircle, { backgroundColor: compatibilityInfo.color }]}>
            <Text style={[styles.scoreText, { fontSize: config.scoreSize }]}>
              {score}%
            </Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={[styles.levelText, { fontSize: config.titleSize, color: compatibilityInfo.color }]}>
              {compatibilityInfo.level}
            </Text>
            <Text style={[styles.materiCountText, { fontSize: config.titleSize - 2 }]}>
              {totalMateri} materi tersedia
            </Text>
          </View>
        </View>
        
        <Ionicons 
          name={compatibilityInfo.icon} 
          size={config.iconSize} 
          color={compatibilityInfo.color} 
        />
      </View>
    </TouchableOpacity>
  );

  const renderDetailedIndicator = () => {
    const breakdown = getMateriBreakdown();
    
    return (
      <TouchableOpacity
        style={[styles.container, styles.detailedContainer, style]}
        onPress={onPress}
        disabled={!onPress}
      >
        {/* Header */}
        <View style={styles.detailedHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.scoreCircle, { backgroundColor: compatibilityInfo.color }]}>
              <Text style={[styles.scoreText, { fontSize: config.scoreSize }]}>
                {score}%
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.levelText, { fontSize: config.titleSize, color: compatibilityInfo.color }]}>
                Kompatibilitas {compatibilityInfo.level}
              </Text>
              <Text style={[styles.descriptionText, { fontSize: config.titleSize - 2 }]}>
                {compatibilityInfo.description}
              </Text>
            </View>
          </View>
          <Ionicons 
            name={compatibilityInfo.icon} 
            size={config.iconSize} 
            color={compatibilityInfo.color} 
          />
        </View>

        {/* Summary Stats */}
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalMateri}</Text>
            <Text style={styles.statLabel}>Total Materi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{kelasGabungan.length}</Text>
            <Text style={styles.statLabel}>Kelas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{getAverageMateriPerKelas()}</Text>
            <Text style={styles.statLabel}>Rata-rata/Kelas</Text>
          </View>
        </View>

        {/* Breakdown by Jenjang */}
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownTitle}>Breakdown Materi:</Text>
          <View style={styles.breakdownList}>
            {Object.entries(breakdown).map(([jenjang, data]) => (
              <View key={jenjang} style={styles.breakdownItem}>
                <Text style={styles.jenjangName}>{jenjang}:</Text>
                <Text style={styles.jenjangCount}>{data.total} materi</Text>
                <Text style={styles.kelasDetail}>
                  ({data.kelas.map(k => `${k.kelas}(${k.count})`).join(', ')})
                </Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return showDetails ? renderDetailedIndicator() : renderBasicIndicator();
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginVertical: 4,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  emptyText: {
    color: '#7f8c8d',
    marginLeft: 8,
    textAlign: 'center',
  },

  // Basic Indicator
  basicContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scoreCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scoreText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scoreInfo: {
    flex: 1,
  },
  levelText: {
    fontWeight: '600',
    marginBottom: 2,
  },
  materiCountText: {
    color: '#666',
  },

  // Detailed Indicator
  detailedContainer: {
    padding: 16,
    minHeight: 140,
  },
  detailedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerInfo: {
    flex: 1,
  },
  descriptionText: {
    color: '#666',
    lineHeight: 18,
  },

  // Summary Stats
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginVertical: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },

  // Breakdown Section
  breakdownSection: {
    marginTop: 8,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  breakdownList: {
    gap: 4,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  jenjangName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#34495e',
    minWidth: 40,
  },
  jenjangCount: {
    fontSize: 13,
    color: '#27ae60',
    fontWeight: '500',
    marginLeft: 8,
    minWidth: 70,
  },
  kelasDetail: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 8,
    flex: 1,
  },
});

export default MateriCompatibilityIndicator;