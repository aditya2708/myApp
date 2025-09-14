/**
 * Report utility functions
 * Contains helper functions for report data processing and formatting
 */

// Month names mapping
export const MONTH_NAMES = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
  5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
  9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
};

export const MONTH_NAMES_SHORT = {
  1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr',
  5: 'Mei', 6: 'Jun', 7: 'Jul', 8: 'Ags',
  9: 'Sep', 10: 'Okt', 11: 'Nov', 12: 'Des'
};

// Attendance percentage color coding
export const getPercentageColor = (percentage) => {
  if (percentage >= 80) return '#2ecc71'; // Green - Excellent
  if (percentage >= 60) return '#f39c12'; // Orange - Good
  if (percentage >= 40) return '#e67e22'; // Dark Orange - Fair
  return '#e74c3c'; // Red - Poor
};

// Attendance level text
export const getAttendanceLevel = (percentage) => {
  if (percentage >= 80) return 'Sangat Baik';
  if (percentage >= 60) return 'Baik';
  if (percentage >= 40) return 'Cukup';
  return 'Kurang';
};

// Format percentage with decimal places
export const formatPercentage = (value, decimals = 1) => {
  return Number(value).toFixed(decimals);
};

// Calculate attendance percentage
export const calculateAttendancePercentage = (attended, total) => {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100 * 10) / 10; // Round to 1 decimal
};

// Format month name
export const getMonthName = (monthNumber, short = false) => {
  const months = short ? MONTH_NAMES_SHORT : MONTH_NAMES;
  return months[monthNumber] || '';
};

// Get current month and year
export const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
};

// Generate year range for filters
export const generateYearRange = (startYear, endYear = null) => {
  const currentYear = new Date().getFullYear();
  const end = endYear || currentYear;
  const years = [];
  
  for (let year = end; year >= startYear; year--) {
    years.push(year);
  }
  
  return years;
};

// Sort children by attendance percentage
export const sortChildrenByAttendance = (children, order = 'desc') => {
  return [...children].sort((a, b) => {
    const comparison = a.overall_percentage - b.overall_percentage;
    return order === 'desc' ? -comparison : comparison;
  });
};

// Filter children by attendance level
export const filterChildrenByLevel = (children, minPercentage = 0, maxPercentage = 100) => {
  return children.filter(child => 
    child.overall_percentage >= minPercentage && 
    child.overall_percentage <= maxPercentage
  );
};

// Calculate summary statistics
export const calculateSummaryStats = (children) => {
  if (!children || children.length === 0) {
    return {
      total: 0,
      average: 0,
      highest: 0,
      lowest: 0,
      totalActivities: 0,
      totalAttended: 0
    };
  }

  const percentages = children.map(child => child.overall_percentage);
  const totalActivities = children.reduce((sum, child) => sum + child.total_activities, 0);
  const totalAttended = children.reduce((sum, child) => sum + child.total_attended, 0);

  return {
    total: children.length,
    average: Math.round((percentages.reduce((sum, p) => sum + p, 0) / children.length) * 10) / 10,
    highest: Math.max(...percentages),
    lowest: Math.min(...percentages),
    totalActivities,
    totalAttended
  };
};

// Group children by attendance level
export const groupChildrenByLevel = (children) => {
  return {
    excellent: children.filter(child => child.overall_percentage >= 80),
    good: children.filter(child => child.overall_percentage >= 60 && child.overall_percentage < 80),
    fair: children.filter(child => child.overall_percentage >= 40 && child.overall_percentage < 60),
    poor: children.filter(child => child.overall_percentage < 40)
  };
};

// Format attendance stats text
export const formatAttendanceStats = (attended, total) => {
  return `${attended}/${total} (${calculateAttendancePercentage(attended, total)}%)`;
};

// Get monthly data for chart
export const getChartData = (monthlyData) => {
  return Object.values(monthlyData)
    .slice(0, 12)
    .map(month => ({
      month: getMonthName(month.month_number, true),
      percentage: month.percentage,
      attended: month.attended_count,
      total: month.activities_count,
      color: getPercentageColor(month.percentage)
    }));
};

// Calculate trend (improvement/decline)
export const calculateTrend = (monthlyData) => {
  const months = Object.values(monthlyData).slice(0, 12);
  if (months.length < 2) return { trend: 'stable', change: 0 };

  const recentMonths = months.slice(-3); // Last 3 months
  const earlierMonths = months.slice(0, 3); // First 3 months

  const recentAvg = recentMonths.reduce((sum, m) => sum + m.percentage, 0) / recentMonths.length;
  const earlierAvg = earlierMonths.reduce((sum, m) => sum + m.percentage, 0) / earlierMonths.length;

  const change = recentAvg - earlierAvg;

  return {
    trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
    change: Math.round(change * 10) / 10
  };
};

// Export data for sharing/download
export const prepareExportData = (children, filters) => {
  return {
    exportDate: new Date().toISOString(),
    filters,
    summary: calculateSummaryStats(children),
    children: children.map(child => ({
      nama: child.full_name,
      nickname: child.nick_name,
      totalAktivitas: child.total_activities,
      totalHadir: child.total_attended,
      persentaseKehadiran: child.overall_percentage,
      level: getAttendanceLevel(child.overall_percentage),
      monthlyData: Object.values(child.monthly_data).map(month => ({
        bulan: getMonthName(month.month_number),
        aktivitas: month.activities_count,
        hadir: month.attended_count,
        persentase: month.percentage
      }))
    }))
  };
};

// Search/filter children by name
export const searchChildren = (children, searchTerm) => {
  if (!searchTerm) return children;
  
  const term = searchTerm.toLowerCase();
  return children.filter(child => 
    child.full_name.toLowerCase().includes(term) ||
    (child.nick_name && child.nick_name.toLowerCase().includes(term))
  );
};

// Validate filter parameters
export const validateFilters = (filters) => {
  const currentYear = new Date().getFullYear();
  const errors = [];

  if (filters.year && (filters.year < 2020 || filters.year > currentYear + 1)) {
    errors.push('Invalid year selected');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Format date for display
export const formatDate = (dateString, format = 'dd/MM/yyyy') => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  switch (format) {
    case 'dd/MM/yyyy':
      return `${day}/${month}/${year}`;
    case 'dd MMM yyyy':
      return `${day} ${getMonthName(date.getMonth() + 1, true)} ${year}`;
    case 'MMMM yyyy':
      return `${getMonthName(date.getMonth() + 1)} ${year}`;
    default:
      return date.toLocaleDateString('id-ID');
  }
};

// Debounce function for search
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};