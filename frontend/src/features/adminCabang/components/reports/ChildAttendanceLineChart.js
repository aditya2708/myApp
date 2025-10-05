import React, { memo, useMemo } from 'react';
import { LineChart, Grid } from 'react-native-svg-charts';
import { Defs, LinearGradient, Stop } from 'react-native-svg';

const DEFAULT_DATA = [50, 80, 45, 60, 70, 90, 100];
const DEFAULT_CONTENT_INSET = { top: 20, bottom: 20 };
const DEFAULT_STYLE = { height: 180 };

const ChildAttendanceLineChart = ({
  data = DEFAULT_DATA,
  style,
  contentInset = DEFAULT_CONTENT_INSET,
  svgProps,
  gridProps,
  gradientId = 'childAttendanceGradient',
  children,
  ...rest
}) => {
  const lineSvg = useMemo(
    () => ({ stroke: '#4a90e2', strokeWidth: 3, fill: `url(#${gradientId})`, ...(svgProps || {}) }),
    [gradientId, svgProps]
  );

  return (
    <LineChart
      style={[DEFAULT_STYLE, style]}
      data={data}
      svg={lineSvg}
      contentInset={contentInset}
      {...rest}
    >
      <Defs key="gradient">
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#4a90e2" stopOpacity={0.2} />
          <Stop offset="100%" stopColor="#4a90e2" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Grid {...gridProps} />
      {children}
    </LineChart>
  );
};

export default memo(ChildAttendanceLineChart);
export { DEFAULT_DATA };
