import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Circle, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const NilaiChart = ({ 
  data,
  type = 'bar', // 'bar', 'line', 'radar'
  height = 200,
  showLegend = true,
  title = ''
}) => {
  const chartWidth = width - 32;
  const chartHeight = height;
  const padding = 20;
  const graphWidth = chartWidth - padding * 2;
  const graphHeight = chartHeight - padding * 2;

  const getColor = (nilai) => {
    if (nilai >= 90) return '#2ecc71';
    if (nilai >= 80) return '#3498db';
    if (nilai >= 70) return '#f39c12';
    if (nilai >= 60) return '#e67e22';
    return '#e74c3c';
  };

  const maxValue = 100;
  const minValue = 0;

  const renderBarChart = () => {
    if (!data || data.length === 0) return null;

    const barWidth = graphWidth / data.length * 0.6;
    const barSpacing = graphWidth / data.length * 0.4;

    return (
      <Svg width={chartWidth} height={chartHeight}>
        {/* Y-axis */}
        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={chartHeight - padding}
          stroke="#bdc3c7"
          strokeWidth="1"
        />
        
        {/* X-axis */}
        <Line
          x1={padding}
          y1={chartHeight - padding}
          x2={chartWidth - padding}
          y2={chartHeight - padding}
          stroke="#bdc3c7"
          strokeWidth="1"
        />

        {/* Y-axis labels */}
        {[0, 25, 50, 75, 100].map((value, index) => {
          const y = chartHeight - padding - (value / maxValue) * graphHeight;
          return (
            <SvgText
              key={index}
              x={padding - 10}
              y={y + 5}
              fontSize="10"
              fill="#7f8c8d"
              textAnchor="end"
            >
              {value}
            </SvgText>
          );
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = (item.nilai / maxValue) * graphHeight;
          const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
          const y = chartHeight - padding - barHeight;
          
          return (
            <React.Fragment key={index}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={getColor(item.nilai)}
                rx="4"
                ry="4"
              />
              
              {/* Value label */}
              <SvgText
                x={x + barWidth / 2}
                y={y - 5}
                fontSize="12"
                fill="#2c3e50"
                textAnchor="middle"
                fontWeight="bold"
              >
                {item.nilai}
              </SvgText>
              
              {/* X-axis label */}
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight - 5}
                fontSize="10"
                fill="#7f8c8d"
                textAnchor="middle"
              >
                {item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    );
  };

  const renderLineChart = () => {
    if (!data || data.length === 0) return null;

    const points = data.map((item, index) => {
      const x = padding + (index / (data.length - 1)) * graphWidth;
      const y = chartHeight - padding - (item.nilai / maxValue) * graphHeight;
      return { x, y, nilai: item.nilai };
    });

    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    return (
      <Svg width={chartWidth} height={chartHeight}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((value, index) => {
          const y = chartHeight - padding - (value / maxValue) * graphHeight;
          return (
            <Line
              key={index}
              x1={padding}
              y1={y}
              x2={chartWidth - padding}
              y2={y}
              stroke="#ecf0f1"
              strokeWidth="1"
            />
          );
        })}

        {/* Y-axis */}
        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={chartHeight - padding}
          stroke="#bdc3c7"
          strokeWidth="1"
        />
        
        {/* X-axis */}
        <Line
          x1={padding}
          y1={chartHeight - padding}
          x2={chartWidth - padding}
          y2={chartHeight - padding}
          stroke="#bdc3c7"
          strokeWidth="1"
        />

        {/* Y-axis labels */}
        {[0, 25, 50, 75, 100].map((value, index) => {
          const y = chartHeight - padding - (value / maxValue) * graphHeight;
          return (
            <SvgText
              key={index}
              x={padding - 10}
              y={y + 5}
              fontSize="10"
              fill="#7f8c8d"
              textAnchor="end"
            >
              {value}
            </SvgText>
          );
        })}

        {/* Line */}
        <Path
          d={pathData}
          stroke="#3498db"
          strokeWidth="2"
          fill="none"
        />

        {/* Points */}
        {points.map((point, index) => (
          <React.Fragment key={index}>
            <Circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill={getColor(point.nilai)}
              stroke="#ffffff"
              strokeWidth="2"
            />
            
            {/* Value label */}
            <SvgText
              x={point.x}
              y={point.y - 10}
              fontSize="10"
              fill="#2c3e50"
              textAnchor="middle"
              fontWeight="bold"
            >
              {point.nilai}
            </SvgText>
            
            {/* X-axis label */}
            <SvgText
              x={point.x}
              y={chartHeight - 5}
              fontSize="9"
              fill="#7f8c8d"
              textAnchor="middle"
            >
              {data[index].label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    );
  };

  const renderRadarChart = () => {
    if (!data || data.length === 0) return null;

    const centerX = chartWidth / 2;
    const centerY = chartHeight / 2;
    const radius = Math.min(graphWidth, graphHeight) / 2 - 20;
    const angleStep = (2 * Math.PI) / data.length;

    const points = data.map((item, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const r = (item.nilai / maxValue) * radius;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      return { x, y };
    });

    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ') + ' Z';

    return (
      <Svg width={chartWidth} height={chartHeight}>
        {/* Grid circles */}
        {[20, 40, 60, 80, 100].map((value, index) => {
          const r = (value / maxValue) * radius;
          return (
            <Circle
              key={index}
              cx={centerX}
              cy={centerY}
              r={r}
              stroke="#ecf0f1"
              strokeWidth="1"
              fill="none"
            />
          );
        })}

        {/* Axes */}
        {data.map((item, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          return (
            <Line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="#ecf0f1"
              strokeWidth="1"
            />
          );
        })}

        {/* Polygon */}
        <Path
          d={pathData}
          stroke="#3498db"
          strokeWidth="2"
          fill="#3498db"
          fillOpacity="0.3"
        />

        {/* Points and labels */}
        {data.map((item, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const r = (item.nilai / maxValue) * radius;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          const labelX = centerX + (radius + 20) * Math.cos(angle);
          const labelY = centerY + (radius + 20) * Math.sin(angle);
          
          return (
            <React.Fragment key={index}>
              <Circle
                cx={x}
                cy={y}
                r="4"
                fill={getColor(item.nilai)}
                stroke="#ffffff"
                strokeWidth="2"
              />
              
              <SvgText
                x={labelX}
                y={labelY}
                fontSize="10"
                fill="#2c3e50"
                textAnchor="middle"
              >
                {item.label}
              </SvgText>
              
              <SvgText
                x={labelX}
                y={labelY + 12}
                fontSize="10"
                fill="#7f8c8d"
                textAnchor="middle"
                fontWeight="bold"
              >
                {item.nilai}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return renderLineChart();
      case 'radar':
        return renderRadarChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      {renderChart()}
      
      {showLegend && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#2ecc71' }]} />
            <Text style={styles.legendText}>A (90-100)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#3498db' }]} />
            <Text style={styles.legendText}>B (80-89)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#f39c12' }]} />
            <Text style={styles.legendText}>C (70-79)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#e67e22' }]} />
            <Text style={styles.legendText}>D (60-69)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#e74c3c' }]} />
            <Text style={styles.legendText}>E (&lt;60)</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#7f8c8d',
  },
});

export default NilaiChart;