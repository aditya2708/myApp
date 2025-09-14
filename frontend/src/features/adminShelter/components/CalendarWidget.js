import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths
} from 'date-fns';
import { id } from 'date-fns/locale';

// Redux
import {
  fetchActivitiesForCalendar,
  fetchActivitiesByDate,
  selectCalendarActivities,
  selectCalendarActivitiesLoading,
  selectCalendarActivitiesError,
  resetCalendarActivitiesError
} from '../redux/aktivitasSlice';

// Components
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';

const CalendarWidget = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  
  // Redux state
  const calendarActivities = useSelector(selectCalendarActivities);
  const loading = useSelector(selectCalendarActivitiesLoading);
  const error = useSelector(selectCalendarActivitiesError);
  
  // Local state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  
  useEffect(() => {
    const monthStr = format(currentMonth, 'yyyy-MM');
    dispatch(fetchActivitiesForCalendar(monthStr));
    
    return () => {
      dispatch(resetCalendarActivitiesError());
    };
  }, [dispatch, currentMonth]);
  
  // Get activities count for a specific date
  const getActivitiesCountForDate = (date) => {
    if (!calendarActivities.length) return 0;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    return calendarActivities.filter(activity => {
      const activityDate = activity.tanggal;
      return activityDate === dateStr;
    }).length;
  };
  
  // Check if date has activities
  const hasActivities = (date) => {
    return getActivitiesCountForDate(date) > 0;
  };
  
  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedDate(null);
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedDate(null);
  };
  
  // Handle date press
  const handleDatePress = (date) => {
    if (!isSameMonth(date, currentMonth)) return;
    
    setSelectedDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Navigate to activities list filtered by date
    navigation.navigate('Attendance', {
      screen: 'ActivitiesList',
      params: { 
        filterDate: dateStr,
        filterType: 'date'
      }
    });
  };
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Get all days in the month
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add padding days from previous month to start on Sunday
    const startDay = monthStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const paddingDays = [];
    
    for (let i = startDay - 1; i >= 0; i--) {
      const paddingDate = new Date(monthStart);
      paddingDate.setDate(paddingDate.getDate() - (i + 1));
      paddingDays.push(paddingDate);
    }
    
    // Add padding days from next month to complete the week
    const endDay = monthEnd.getDay();
    const endPaddingDays = [];
    
    for (let i = 1; i <= 6 - endDay; i++) {
      const paddingDate = new Date(monthEnd);
      paddingDate.setDate(paddingDate.getDate() + i);
      endPaddingDays.push(paddingDate);
    }
    
    return [...paddingDays, ...monthDays, ...endPaddingDays];
  };
  
  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
        <Ionicons name="chevron-back" size={20} color="#3498db" />
      </TouchableOpacity>
      
      <Text style={styles.monthText}>
        {format(currentMonth, 'MMMM yyyy', { locale: id })}
      </Text>
      
      <TouchableOpacity 
        onPress={goToNextMonth} 
        style={styles.navButton}
        disabled={currentMonth >= new Date()}
      >
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={currentMonth >= new Date() ? '#bdc3c7' : '#3498db'} 
        />
      </TouchableOpacity>
    </View>
  );
  
  const renderDayHeaders = () => (
    <View style={styles.dayHeadersContainer}>
      {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, index) => (
        <View key={index} style={styles.dayHeader}>
          <Text style={styles.dayHeaderText}>{day}</Text>
        </View>
      ))}
    </View>
  );
  
  const renderCalendarDays = () => {
    const days = generateCalendarDays();
    const rows = [];
    
    for (let i = 0; i < days.length; i += 7) {
      const week = days.slice(i, i + 7);
      rows.push(
        <View key={i} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const activitiesCount = isCurrentMonth ? getActivitiesCountForDate(day) : 0;
            const hasActivitiesOnDay = activitiesCount > 0;
            
            return (
              <TouchableOpacity
                key={dayIndex}
                style={[
                  styles.dayCell,
                  !isCurrentMonth && styles.dayCellDisabled,
                  isSelected && styles.dayCellSelected,
                  isTodayDate && styles.dayCellToday,
                ]}
                onPress={() => handleDatePress(day)}
                disabled={!isCurrentMonth}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayText,
                  !isCurrentMonth && styles.dayTextDisabled,
                  isSelected && styles.dayTextSelected,
                  isTodayDate && styles.dayTextToday,
                ]}>
                  {format(day, 'd')}
                </Text>
                {hasActivitiesOnDay && (
                  <View style={styles.activityIndicatorContainer}>
                    {activitiesCount <= 3 ? (
                      // Show individual dots for 1-3 activities
                      Array.from({ length: activitiesCount }).map((_, index) => (
                        <View key={index} style={styles.activityDot} />
                      ))
                    ) : (
                      // Show count for 4+ activities
                      <Text style={styles.activityCountText}>{activitiesCount}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }
    
    return rows;
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Kalender Aktivitas</Text>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="small" />
          <Text style={styles.loadingText}>Memuat kalender...</Text>
        </View>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Kalender Aktivitas</Text>
        </View>
        <ErrorMessage 
          message={error}
          onRetry={() => dispatch(fetchActivitiesForCalendar(format(currentMonth, 'yyyy-MM')))}
          compact
        />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kalender Aktivitas</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Attendance', { screen: 'ActivitiesList' })}
        >
          <Text style={styles.viewAllText}>Lihat Semua</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.calendarContainer}>
        {renderCalendarHeader()}
        {renderDayHeaders()}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          style={styles.daysContainer}
        >
          {renderCalendarDays()}
        </ScrollView>
      </View>
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>Ada Aktivitas</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendTodayIndicator} />
          <Text style={styles.legendText}>Hari Ini</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 40,
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7f8c8d',
  },
  calendarContainer: {
    marginBottom: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  dayHeadersContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  daysContainer: {
    maxHeight: 240, // Limit height for better UX
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
    borderRadius: 8,
    position: 'relative',
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayCellSelected: {
    backgroundColor: '#3498db',
  },
  dayCellToday: {
    backgroundColor: '#e8f4f8',
  },
  dayText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  dayTextDisabled: {
    color: '#bdc3c7',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  dayTextToday: {
    color: '#3498db',
    fontWeight: '600',
  },
  activityIndicatorContainer: {
    position: 'absolute',
    bottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e74c3c',
    marginHorizontal: 1,
  },
  activityCountText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#e74c3c',
    backgroundColor: '#fff',
    borderRadius: 6,
    minWidth: 12,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e74c3c',
    marginRight: 6,
  },
  legendTodayIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#e8f4f8',
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
});

export default CalendarWidget;