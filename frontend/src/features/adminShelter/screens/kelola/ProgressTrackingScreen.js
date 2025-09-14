import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';

// Import components
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import Button from '../../../../common/components/Button';

// Import Redux (would be implemented)
import { useAuth } from '../../../../common/hooks/useAuth';

const { width } = Dimensions.get('window');

const ProgressTrackingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { profile } = useAuth();
  
  // Get kelompok and kurikulum from route params
  const { kelompok, kurikulumId } = route.params || {};
  
  // Local state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week'); // week, month, semester
  
  // Mock progress data
  const mockProgressData = {
    kurikulum: {
      id_kurikulum: 1,
      nama_kurikulum: 'Matematika Dasar SD-SMP',
      total_materi: 45,
      total_aktivitas: 23,
      assigned_date: '2024-01-15',
      target_completion: '2024-06-15'
    },
    overall_progress: {
      completion_percentage: 68,
      completed_materi: 31,
      completed_aktivitas: 16,
      current_streak: 5,
      average_score: 82
    },
    weekly_progress: [
      { week: 'W1', materi: 3, aktivitas: 2, score: 85 },
      { week: 'W2', materi: 4, aktivitas: 2, score: 78 },
      { week: 'W3', materi: 2, aktivitas: 3, score: 88 },
      { week: 'W4', materi: 5, aktivitas: 1, score: 82 }
    ],
    recent_activities: [
      {
        id: 1,
        type: 'materi',
        title: 'Perkalian Dasar',
        completed_date: '2024-02-01',
        score: 85,
        participants: 12
      },
      {
        id: 2,
        type: 'aktivitas',
        title: 'Kuis Matematika Bab 3',
        completed_date: '2024-01-30',
        score: 78,
        participants: 10
      },
      {
        id: 3,
        type: 'materi',
        title: 'Pembagian Sederhana',
        completed_date: '2024-01-28',
        score: 90,
        participants: 12
      }
    ],
    upcoming_milestones: [
      {
        id: 1,
        title: 'Mid-Semester Assessment',
        due_date: '2024-02-15',
        progress: 45,
        priority: 'high'
      },
      {
        id: 2,
        title: 'Chapter 4 Completion',
        due_date: '2024-02-20',
        progress: 20,
        priority: 'medium'
      }
    ],
    performance_by_kelas: [
      { jenjang: 'SD', kelas: '4', progress: 72, avg_score: 85 },
      { jenjang: 'SD', kelas: '5', progress: 65, avg_score: 80 },
      { jenjang: 'SMP', kelas: '7', progress: 70, avg_score: 78 }
    ]
  };

  useEffect(() => {
    if (kelompok) {
      fetchProgressData();
      navigation.setOptions({
        headerTitle: `Progress - ${kelompok.nama_kelompok}`
      });
    }
  }, [kelompok]);

  const fetchProgressData = async () => {
    try {
      setError(null);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgressData(mockProgressData);
    } catch (err) {
      console.error('Error fetching progress data:', err);
      setError('Gagal memuat data progress. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProgressData();
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#2ecc71';
    if (percentage >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const renderOverallProgress = () => {
    if (!progressData) return null;
    
    const { overall_progress, kurikulum } = progressData;
    
    return (
      <View style={styles.overallProgressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.kurikulumTitle}>{kurikulum.nama_kurikulum}</Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressPercentage}>
              {overall_progress.completion_percentage}%
            </Text>
          </View>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill,
                { 
                  width: `${overall_progress.completion_percentage}%`,
                  backgroundColor: getProgressColor(overall_progress.completion_percentage)
                }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.progressStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{overall_progress.completed_materi}</Text>
            <Text style={styles.statLabel}>/{kurikulum.total_materi} Materi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{overall_progress.completed_aktivitas}</Text>
            <Text style={styles.statLabel}>/{kurikulum.total_aktivitas} Aktivitas</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{overall_progress.average_score}</Text>
            <Text style={styles.statLabel}>Rata-rata Nilai</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{overall_progress.current_streak}</Text>
            <Text style={styles.statLabel}>Hari Berturut</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTimeframeSelector = () => (
    <View style={styles.timeframeSelector}>
      {[
        { key: 'week', label: 'Minggu' },
        { key: 'month', label: 'Bulan' },
        { key: 'semester', label: 'Semester' }
      ].map((timeframe) => (
        <TouchableOpacity
          key={timeframe.key}
          style={[
            styles.timeframeButton,
            selectedTimeframe === timeframe.key && styles.timeframeButtonActive
          ]}
          onPress={() => setSelectedTimeframe(timeframe.key)}
        >
          <Text style={[
            styles.timeframeButtonText,
            selectedTimeframe === timeframe.key && styles.timeframeButtonTextActive
          ]}>
            {timeframe.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderWeeklyProgress = () => {
    if (!progressData) return null;
    
    return (
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Progress Mingguan</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chartContainer}>
            {progressData.weekly_progress.map((week, index) => (
              <View key={index} style={styles.weekColumn}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.materiBar,
                      { height: (week.materi / 5) * 60 }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.aktivitasBar,
                      { height: (week.aktivitas / 3) * 60 }
                    ]} 
                  />
                </View>
                <Text style={styles.weekLabel}>{week.week}</Text>
                <Text style={styles.scoreLabel}>{week.score}%</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#3498db' }]} />
            <Text style={styles.legendText}>Materi</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#e74c3c' }]} />
            <Text style={styles.legendText}>Aktivitas</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecentActivities = () => {
    if (!progressData) return null;
    
    return (
      <View style={styles.activitiesCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Aktivitas Terkini</Text>
          <TouchableOpacity onPress={() => Alert.alert('Info', 'View all activities')}>
            <Text style={styles.viewAllText}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>
        
        {progressData.recent_activities.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={[
              styles.activityIcon,
              { backgroundColor: activity.type === 'materi' ? '#3498db' : '#e74c3c' }
            ]}>
              <Ionicons 
                name={activity.type === 'materi' ? 'book' : 'checkbox'} 
                size={16} 
                color="#fff" 
              />
            </View>
            
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityDate}>
                {new Date(activity.completed_date).toLocaleDateString('id-ID')} • 
                {activity.participants} peserta
              </Text>
            </View>
            
            <View style={styles.activityScore}>
              <Text style={styles.scoreValue}>{activity.score}%</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderUpcomingMilestones = () => {
    if (!progressData) return null;
    
    return (
      <View style={styles.milestonesCard}>
        <Text style={styles.cardTitle}>Milestone Mendatang</Text>
        
        {progressData.upcoming_milestones.map((milestone) => (
          <View key={milestone.id} style={styles.milestoneItem}>
            <View style={styles.milestoneHeader}>
              <Text style={styles.milestoneTitle}>{milestone.title}</Text>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(milestone.priority) }
              ]}>
                <Text style={styles.priorityText}>
                  {milestone.priority.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <Text style={styles.milestoneDate}>
              Due: {new Date(milestone.due_date).toLocaleDateString('id-ID')}
            </Text>
            
            <View style={styles.milestoneProgressContainer}>
              <View style={styles.milestoneProgressBar}>
                <View 
                  style={[
                    styles.milestoneProgressFill,
                    { width: `${milestone.progress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.milestoneProgressText}>{milestone.progress}%</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPerformanceByKelas = () => {
    if (!progressData) return null;
    
    return (
      <View style={styles.performanceCard}>
        <Text style={styles.cardTitle}>Performa per Kelas</Text>
        
        {progressData.performance_by_kelas.map((kelas, index) => (
          <View key={index} style={styles.kelasPerformanceItem}>
            <View style={styles.kelasHeader}>
              <Text style={styles.kelasName}>{kelas.jenjang} Kelas {kelas.kelas}</Text>
              <Text style={styles.kelasScore}>{kelas.avg_score}%</Text>
            </View>
            
            <View style={styles.kelasProgressContainer}>
              <View style={styles.kelasProgressBar}>
                <View 
                  style={[
                    styles.kelasProgressFill,
                    { 
                      width: `${kelas.progress}%`,
                      backgroundColor: getProgressColor(kelas.progress)
                    }
                  ]} 
                />
              </View>
              <Text style={styles.kelasProgressText}>{kelas.progress}%</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat data progress..." />;
  }

  if (!kelompok) {
    return (
      <View style={styles.errorContainer}>
        <ErrorMessage
          message="Kelompok tidak ditemukan"
          onRetry={() => navigation.goBack()}
          retryText="Kembali"
        />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {error && (
        <ErrorMessage
          message={error}
          onRetry={handleRefresh}
          retryText="Coba Lagi"
        />
      )}

      {/* Overall Progress */}
      {renderOverallProgress()}

      {/* Timeframe Selector */}
      {renderTimeframeSelector()}

      {/* Weekly Progress Chart */}
      {renderWeeklyProgress()}

      {/* Recent Activities */}
      {renderRecentActivities()}

      {/* Upcoming Milestones */}
      {renderUpcomingMilestones()}

      {/* Performance by Kelas */}
      {renderPerformanceByKelas()}

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <Button
          title="Update Progress"
          onPress={() => Alert.alert('Info', 'Manual progress update')}
          type="primary"
          style={styles.updateButton}
          leftIcon={<Ionicons name="refresh" size={16} color="#fff" />}
        />
        
        <Button
          title="Generate Report"
          onPress={() => navigation.navigate('KelompokReporting', { 
            kelompok, 
            reportType: 'single' 
          })}
          type="outline"
          style={styles.reportButton}
          leftIcon={<Ionicons name="document-text" size={16} color="#9b59b6" />}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Overall Progress Card
  overallProgressCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  kurikulumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  progressBadge: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  progressPercentage: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 4,
  },

  // Timeframe Selector
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeframeButtonActive: {
    backgroundColor: '#9b59b6',
  },
  timeframeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeframeButtonTextActive: {
    color: '#fff',
  },

  // Chart Card
  chartCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    height: 100,
  },
  weekColumn: {
    alignItems: 'center',
    marginHorizontal: 15,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    marginBottom: 8,
  },
  materiBar: {
    width: 12,
    backgroundColor: '#3498db',
    marginRight: 4,
    borderRadius: 2,
  },
  aktivitasBar: {
    width: 12,
    backgroundColor: '#e74c3c',
    borderRadius: 2,
  },
  weekLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },

  // Activities Card
  activitiesCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#9b59b6',
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  activityScore: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ecc71',
  },

  // Milestones Card
  milestonesCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  milestoneItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  milestoneDate: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  milestoneProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#ecf0f1',
    borderRadius: 2,
    marginRight: 8,
  },
  milestoneProgressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 2,
  },
  milestoneProgressText: {
    fontSize: 12,
    color: '#666',
    minWidth: 35,
  },

  // Performance Card
  performanceCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  kelasPerformanceItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  kelasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kelasName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  kelasScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  kelasProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kelasProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    marginRight: 8,
  },
  kelasProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  kelasProgressText: {
    fontSize: 12,
    color: '#666',
    minWidth: 35,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 32,
    gap: 12,
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#2ecc71',
  },
  reportButton: {
    flex: 1,
    borderColor: '#9b59b6',
  },

  // Error Container
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});

export default ProgressTrackingScreen;