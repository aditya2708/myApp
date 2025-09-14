import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const RaportChart = ({ raportData }) => {
  if (!raportData || raportData.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>Tidak ada data untuk ditampilkan</Text>
      </View>
    );
  }

  const getGradeColor = (grade) => {
    if (grade >= 85) return '#2ecc71';
    if (grade >= 75) return '#f39c12';
    if (grade >= 65) return '#e67e22';
    return '#e74c3c';
  };

  const maxGrade = Math.max(...raportData.map(r => r.average_grade || 0));
  const minGrade = Math.min(...raportData.map(r => r.average_grade || 0));
  const range = maxGrade - minGrade || 1;

  const chartWidth = width - 64; // 32px padding on each side
  const chartHeight = 120;
  const barWidth = Math.max(20, (chartWidth - (raportData.length - 1) * 8) / raportData.length);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grafik Nilai Rata-rata</Text>
      
      <View style={styles.chartContainer}>
        <View style={styles.yAxisLabels}>
          <Text style={styles.axisLabel}>{maxGrade.toFixed(0)}</Text>
          <Text style={styles.axisLabel}>{((maxGrade + minGrade) / 2).toFixed(0)}</Text>
          <Text style={styles.axisLabel}>{minGrade.toFixed(0)}</Text>
        </View>
        
        <View style={styles.chartArea}>
          <View style={[styles.chart, { height: chartHeight }]}>
            {raportData.map((raport, index) => {
              const grade = raport.average_grade || 0;
              const barHeight = range > 0 ? ((grade - minGrade) / range) * chartHeight : chartHeight / 2;
              
              return (
                <View
                  key={raport.id_raport || index}
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, 5),
                      width: barWidth,
                      backgroundColor: getGradeColor(grade),
                      marginRight: index < raportData.length - 1 ? 8 : 0
                    }
                  ]}
                >
                  <Text style={styles.barValue}>{grade.toFixed(1)}</Text>
                </View>
              );
            })}
          </View>
          
          <View style={styles.xAxisLabels}>
            {raportData.map((raport, index) => (
              <View
                key={raport.id_raport || index}
                style={[
                  styles.xAxisLabel,
                  {
                    width: barWidth,
                    marginRight: index < raportData.length - 1 ? 8 : 0
                  }
                ]}
              >
                <Text style={styles.semesterLabel} numberOfLines={1}>
                  {raport.semester?.split(' ')[0] || `S${index + 1}`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#2ecc71' }]} />
          <Text style={styles.legendText}>85+ (A)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#f39c12' }]} />
          <Text style={styles.legendText}>75-84 (B)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#e67e22' }]} />
          <Text style={styles.legendText}>65-74 (C)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#e74c3c' }]} />
          <Text style={styles.legendText}>&lt;65 (D)</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center'
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12
  },
  yAxisLabels: {
    width: 30,
    height: 120,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8
  },
  axisLabel: {
    fontSize: 10,
    color: '#666'
  },
  chartArea: {
    flex: 1
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  bar: {
    borderRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
    minHeight: 20
  },
  barValue: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '600'
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8
  },
  xAxisLabel: {
    alignItems: 'center'
  },
  semesterLabel: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center'
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4
  },
  legendText: {
    fontSize: 10,
    color: '#666'
  },
  emptyChart: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic'
  }
});

export default RaportChart;