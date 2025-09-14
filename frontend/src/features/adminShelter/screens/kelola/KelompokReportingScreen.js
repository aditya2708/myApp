import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  Share
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';

// Import components
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import Button from '../../../../common/components/Button';

import { useAuth } from '../../../../common/hooks/useAuth';

const { width } = Dimensions.get('window');

const KelompokReportingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { profile } = useAuth();
  
  // Get params - can be single kelompok or multiple kelompok for comparison
  const { kelompok, kelompokIds, reportType = 'single' } = route.params || {};
  
  // Local state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('semester'); // month, semester, year
  const [reportFormat, setReportFormat] = useState('overview'); // overview, detailed, analytics
  
  // Mock comprehensive report data
  const mockReportData = {
    report_info: {
      generated_date: new Date().toISOString(),
      period: 'Semester 1 2024/2025',
      shelter_name: 'Shelter Jakarta Selatan',
      report_type: reportType
    },
    kelompok_summary: [
      {
        id_kelompok: 1,
        nama_kelompok: 'Kelompok Belajar A',
        kelas_gabungan: [
          { jenjang: 'SD', kelas: '4' },
          { jenjang: 'SD', kelas: '5' }
        ],
        total_anggota: 12,
        kurikulum_assigned: 2,
        overall_progress: 68,
        avg_score: 82,
        attendance_rate: 85,
        total_activities: 45,
        completed_activities: 31
      }
    ],
    performance_metrics: {
      overall_completion: 68,
      average_score: 82,
      attendance_rate: 85,
      improvement_trend: '+5%',
      total_study_hours: 240,
      materials_covered: 85,
      assessments_completed: 23
    },
    kelas_gabungan_analysis: {
      most_effective_combination: 'SD Kelas 4-5',
      effectiveness_score: 87,
      compatibility_analysis: {
        'SD 4-5': { score: 87, materials: 45, activities: 23 },
        'SMP 7-8': { score: 82, materials: 38, activities: 20 }
      },
      recommendations: [
        'Kombinasi SD 4-5 menunjukkan performa terbaik',
        'Pertimbangkan menambah materi khusus untuk SMP 7-8',
        'Tingkatkan aktivitas interaktif untuk meningkatkan engagement'
      ]
    },
    progress_timeline: [
      { month: 'Jan', progress: 15, score: 78 },
      { month: 'Feb', progress: 35, score: 80 },
      { month: 'Mar', progress: 52, score: 84 },
      { month: 'Apr', progress: 68, score: 82 }
    ],
    subject_breakdown: [
      { subject: 'Matematika', progress: 75, score: 85, materials: 20 },
      { subject: 'Bahasa Indonesia', progress: 60, score: 80, materials: 15 },
      { subject: 'IPA', progress: 70, score: 82, materials: 18 }
    ],
    tutor_performance: [
      { name: 'Bu Sari', subjects: ['Matematika'], avg_score: 85, sessions: 20 },
      { name: 'Pak Joko', subjects: ['IPA'], avg_score: 82, sessions: 18 }
    ],
    challenges_identified: [
      {
        category: 'Attendance',
        description: 'Beberapa anak sering tidak hadir di hari Jumat',
        severity: 'medium',
        suggested_action: 'Pertimbangkan penjadwalan ulang aktivitas Jumat'
      },
      {
        category: 'Material Difficulty',
        description: 'Materi Matematika tingkat lanjut terlalu sulit untuk SD 4',
        severity: 'high',
        suggested_action: 'Buat adaptasi khusus untuk kelas yang lebih rendah'
      }
    ],
    achievements: [
      '68% completion rate - melampaui target 60%',
      'Peningkatan 5% dari bulan sebelumnya',
      '85% attendance rate - sangat baik',
      'Tidak ada siswa yang tertinggal lebih dari 2 materi'
    ]
  };

  useEffect(() => {
    fetchReportData();
    navigation.setOptions({
      headerTitle: reportType === 'comparison' ? 'Report Comparison' : 
                  kelompok ? `Report - ${kelompok.nama_kelompok}` : 'Kelompok Report'
    });
  }, [selectedPeriod, reportFormat]);

  const fetchReportData = async () => {
    try {
      setError(null);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setReportData(mockReportData);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Gagal memuat data laporan. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReportData();
  };

  const handleExportReport = async () => {
    Alert.alert(
      'Export Report',
      'Pilih format export:',
      [
        { text: 'PDF', onPress: () => exportToPDF() },
        { text: 'Excel', onPress: () => exportToExcel() },
        { text: 'Share', onPress: () => shareReport() },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const exportToPDF = () => {
    Alert.alert('Export PDF', 'Fitur export PDF akan segera tersedia');
  };

  const exportToExcel = () => {
    Alert.alert('Export Excel', 'Fitur export Excel akan segera tersedia');
  };

  const shareReport = async () => {
    try {
      const result = await Share.share({
        message: `Report Kelompok - ${reportData?.kelompok_summary[0]?.nama_kelompok}\n\nOverall Progress: ${reportData?.performance_metrics?.overall_completion}%\nAverage Score: ${reportData?.performance_metrics?.average_score}%\nAttendance Rate: ${reportData?.performance_metrics?.attendance_rate}%`,
        title: 'Kelompok Report'
      });
    } catch (error) {
      console.error('Error sharing report:', error);
    }
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      <Text style={styles.selectorTitle}>Periode Laporan:</Text>
      <View style={styles.periodButtons}>
        {[
          { key: 'month', label: 'Bulan' },
          { key: 'semester', label: 'Semester' },
          { key: 'year', label: 'Tahun' }
        ].map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period.key && styles.periodButtonTextActive
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFormatSelector = () => (
    <View style={styles.formatSelector}>
      <Text style={styles.selectorTitle}>Format Laporan:</Text>
      <View style={styles.formatButtons}>
        {[
          { key: 'overview', label: 'Overview', icon: 'eye' },
          { key: 'detailed', label: 'Detail', icon: 'list' },
          { key: 'analytics', label: 'Analytics', icon: 'analytics' }
        ].map((format) => (
          <TouchableOpacity
            key={format.key}
            style={[
              styles.formatButton,
              reportFormat === format.key && styles.formatButtonActive
            ]}
            onPress={() => setReportFormat(format.key)}
          >
            <Ionicons 
              name={format.icon} 
              size={16} 
              color={reportFormat === format.key ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.formatButtonText,
              reportFormat === format.key && styles.formatButtonTextActive
            ]}>
              {format.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderReportHeader = () => {
    if (!reportData) return null;
    
    return (
      <View style={styles.reportHeader}>
        <View style={styles.headerTitle}>
          <Ionicons name="document-text" size={24} color="#2c3e50" />
          <Text style={styles.headerTitleText}>Laporan Kelompok</Text>
        </View>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerInfoText}>
            {reportData.report_info.shelter_name}
          </Text>
          <Text style={styles.headerInfoText}>
            Periode: {reportData.report_info.period}
          </Text>
          <Text style={styles.headerInfoText}>
            Generated: {new Date(reportData.report_info.generated_date).toLocaleDateString('id-ID')}
          </Text>
        </View>
      </View>
    );
  };

  const renderPerformanceMetrics = () => {
    if (!reportData) return null;
    
    const metrics = reportData.performance_metrics;
    
    return (
      <View style={styles.metricsCard}>
        <Text style={styles.cardTitle}>Performance Metrics</Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.overall_completion}%</Text>
            <Text style={styles.metricLabel}>Completion</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.average_score}%</Text>
            <Text style={styles.metricLabel}>Avg Score</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.attendance_rate}%</Text>
            <Text style={styles.metricLabel}>Attendance</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: '#2ecc71' }]}>
              {metrics.improvement_trend}
            </Text>
            <Text style={styles.metricLabel}>Trend</Text>
          </View>
        </View>

        <View style={styles.additionalMetrics}>
          <View style={styles.additionalMetricRow}>
            <Text style={styles.additionalMetricLabel}>Total Study Hours:</Text>
            <Text style={styles.additionalMetricValue}>{metrics.total_study_hours}h</Text>
          </View>
          <View style={styles.additionalMetricRow}>
            <Text style={styles.additionalMetricLabel}>Materials Covered:</Text>
            <Text style={styles.additionalMetricValue}>{metrics.materials_covered}</Text>
          </View>
          <View style={styles.additionalMetricRow}>
            <Text style={styles.additionalMetricLabel}>Assessments Completed:</Text>
            <Text style={styles.additionalMetricValue}>{metrics.assessments_completed}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderKelasGabunganAnalysis = () => {
    if (!reportData) return null;
    
    const analysis = reportData.kelas_gabungan_analysis;
    
    return (
      <View style={styles.analysisCard}>
        <Text style={styles.cardTitle}>Analisis Kelas Gabungan</Text>
        
        <View style={styles.bestCombination}>
          <Text style={styles.bestCombinationTitle}>Kombinasi Terbaik:</Text>
          <View style={styles.combinationBadge}>
            <Text style={styles.combinationText}>{analysis.most_effective_combination}</Text>
            <Text style={styles.combinationScore}>{analysis.effectiveness_score}%</Text>
          </View>
        </View>

        <View style={styles.compatibilityBreakdown}>
          <Text style={styles.breakdownTitle}>Breakdown Kompatibilitas:</Text>
          {Object.entries(analysis.compatibility_analysis).map(([combination, data]) => (
            <View key={combination} style={styles.compatibilityItem}>
              <Text style={styles.compatibilityName}>{combination}</Text>
              <View style={styles.compatibilityStats}>
                <Text style={styles.compatibilityScore}>{data.score}%</Text>
                <Text style={styles.compatibilityDetails}>
                  {data.materials}M • {data.activities}A
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.recommendations}>
          <Text style={styles.recommendationsTitle}>Rekomendasi:</Text>
          {analysis.recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="checkmark-circle" size={16} color="#2ecc71" />
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderSubjectBreakdown = () => {
    if (!reportData) return null;
    
    return (
      <View style={styles.subjectCard}>
        <Text style={styles.cardTitle}>Breakdown per Mata Pelajaran</Text>
        
        {reportData.subject_breakdown.map((subject, index) => (
          <View key={index} style={styles.subjectItem}>
            <View style={styles.subjectHeader}>
              <Text style={styles.subjectName}>{subject.subject}</Text>
              <Text style={styles.subjectScore}>{subject.score}%</Text>
            </View>
            
            <View style={styles.subjectProgressContainer}>
              <View style={styles.subjectProgressBar}>
                <View 
                  style={[
                    styles.subjectProgressFill,
                    { width: `${subject.progress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.subjectProgressText}>{subject.progress}%</Text>
            </View>
            
            <Text style={styles.subjectMaterials}>
              {subject.materials} materi tersedia
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderChallengesAndAchievements = () => {
    if (!reportData) return null;
    
    return (
      <View style={styles.challengesCard}>
        <Text style={styles.cardTitle}>Tantangan & Pencapaian</Text>
        
        {/* Challenges */}
        <View style={styles.challengesSection}>
          <Text style={styles.sectionTitle}>Tantangan Teridentifikasi:</Text>
          {reportData.challenges_identified.map((challenge, index) => (
            <View key={index} style={styles.challengeItem}>
              <View style={styles.challengeHeader}>
                <Text style={styles.challengeCategory}>{challenge.category}</Text>
                <View style={[
                  styles.severityBadge,
                  { backgroundColor: challenge.severity === 'high' ? '#e74c3c' : '#f39c12' }
                ]}>
                  <Text style={styles.severityText}>
                    {challenge.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.challengeDescription}>{challenge.description}</Text>
              <Text style={styles.suggestedAction}>
                {challenge.suggested_action}
              </Text>
            </View>
          ))}
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Pencapaian:</Text>
          {reportData.achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementItem}>
              <Ionicons name="trophy" size={16} color="#f39c12" />
              <Text style={styles.achievementText}>{achievement}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Generating report..." />;
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

      {/* Period & Format Selectors */}
      {renderPeriodSelector()}
      {renderFormatSelector()}

      {/* Report Header */}
      {renderReportHeader()}

      {/* Performance Metrics */}
      {renderPerformanceMetrics()}

      {/* Kelas Gabungan Analysis */}
      {renderKelasGabunganAnalysis()}

      {/* Subject Breakdown */}
      {reportFormat !== 'overview' && renderSubjectBreakdown()}

      {/* Challenges & Achievements */}
      {renderChallengesAndAchievements()}

      {/* Export Actions */}
      <View style={styles.exportActions}>
        <Button
          title="Export Report"
          onPress={handleExportReport}
          type="primary"
          style={styles.exportButton}
          leftIcon={<Ionicons name="download" size={16} color="#fff" />}
        />
        
        <Button
          title="Share Report"
          onPress={shareReport}
          type="outline"
          style={styles.shareButton}
          leftIcon={<Ionicons name="share" size={16} color="#9b59b6" />}
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

  // Selectors
  periodSelector: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  formatSelector: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  selectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#9b59b6',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#9b59b6',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#9b59b6',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  formatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  formatButtonActive: {
    backgroundColor: '#9b59b6',
    borderColor: '#9b59b6',
  },
  formatButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  formatButtonTextActive: {
    color: '#fff',
  },

  // Report Header
  reportHeader: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 8,
  },
  headerInfo: {
    gap: 4,
  },
  headerInfoText: {
    fontSize: 14,
    color: '#7f8c8d',
  },

  // Cards
  metricsCard: {
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
  analysisCard: {
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
  subjectCard: {
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
  challengesCard: {
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

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  metricLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  additionalMetrics: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
    gap: 8,
  },
  additionalMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  additionalMetricLabel: {
    fontSize: 14,
    color: '#666',
  },
  additionalMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },

  // Analysis
  bestCombination: {
    marginBottom: 16,
  },
  bestCombinationTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  combinationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
    padding: 12,
    borderRadius: 6,
  },
  combinationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  combinationScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  compatibilityBreakdown: {
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  compatibilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  compatibilityName: {
    fontSize: 14,
    color: '#2c3e50',
  },
  compatibilityStats: {
    alignItems: 'flex-end',
  },
  compatibilityScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
  },
  compatibilityDetails: {
    fontSize: 12,
    color: '#666',
  },
  recommendations: {
    gap: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },

  // Subject Breakdown
  subjectItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  subjectScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  subjectProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  subjectProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    marginRight: 8,
  },
  subjectProgressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 3,
  },
  subjectProgressText: {
    fontSize: 12,
    color: '#666',
    minWidth: 35,
  },
  subjectMaterials: {
    fontSize: 12,
    color: '#7f8c8d',
  },

  // Challenges & Achievements
  challengesSection: {
    marginBottom: 20,
  },
  achievementsSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  challengeItem: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  challengeCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  suggestedAction: {
    fontSize: 13,
    color: '#856404',
    fontStyle: 'italic',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  achievementText: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
  },

  // Export Actions
  exportActions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 32,
    gap: 12,
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#2ecc71',
  },
  shareButton: {
    flex: 1,
    borderColor: '#9b59b6',
  },
});

export default KelompokReportingScreen;