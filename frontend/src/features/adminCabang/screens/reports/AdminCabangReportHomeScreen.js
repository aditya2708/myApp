import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import ReportSummaryCard from '../../components/reports/ReportSummaryCard';
import ReportQuickLinkTile from '../../components/reports/ReportQuickLinkTile';
import { adminCabangReportsApi } from '../../api/adminCabangReportsApi';

const DEFAULT_LINKS = [
  {
    key: 'children',
    title: 'Laporan Anak Binaan',
    description: 'Pantau perkembangan dan kebutuhan anak binaan di cabang Anda.',
    icon: 'school',
    color: '#2980b9',
    route: 'AdminCabangChildrenReport',
  },
  {
    key: 'tutors',
    title: 'Laporan Tutor',
    description: 'Tinjau performa dan aktivitas tutor shelter di wilayah Anda.',
    icon: 'people-circle',
    color: '#9b59b6',
    route: 'AdminCabangTutorReport',
  },
];

const DEFAULT_SUMMARY = [
  {
    key: 'childrenTotal',
    label: 'Total Anak Binaan',
    value: 0,
    icon: 'people',
    color: '#27ae60',
    description: 'Jumlah keseluruhan anak binaan aktif.',
  },
  {
    key: 'shelterTotal',
    label: 'Total Shelter',
    value: 0,
    icon: 'home',
    color: '#e67e22',
    description: 'Jumlah shelter aktif di cabang Anda.',
  },
  {
    key: 'tutorTotal',
    label: 'Total Tutor',
    value: 0,
    icon: 'person',
    color: '#8e44ad',
    description: 'Tutor aktif yang terdaftar dalam cabang.',
  },
];

const AdminCabangReportHomeScreen = () => {
  const navigation = useNavigation();
  const [summaryCards, setSummaryCards] = useState(DEFAULT_SUMMARY);
  const [quickLinks, setQuickLinks] = useState(DEFAULT_LINKS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const routeMap = useMemo(
    () => ({
      children: 'AdminCabangChildrenReport',
      tutors: 'AdminCabangTutorReport',
    }),
    []
  );

  const parseSummaryCards = useCallback((payload) => {
    if (!payload) return DEFAULT_SUMMARY;

    if (Array.isArray(payload) && payload.length > 0) {
      return payload.map((item, index) => ({
        key: item.key || `${item.label || 'summary'}-${index}`,
        label: item.label || item.title || 'Ringkasan',
        value: item.value ?? item.total ?? 0,
        icon: item.icon || 'stats-chart',
        color: item.color || '#2ecc71',
        description: item.description || item.subtitle || null,
      }));
    }

    const cards = [];
    if (payload.children) {
      cards.push({
        key: 'children',
        label: payload.children.label || 'Total Anak Binaan',
        value: payload.children.total ?? payload.children.value ?? 0,
        icon: payload.children.icon || 'people',
        color: payload.children.color || '#27ae60',
        description: payload.children.description || payload.children.active_text,
      });
    } else if (payload.total_children || payload.children_total) {
      cards.push({
        key: 'children',
        label: 'Total Anak Binaan',
        value: payload.total_children ?? payload.children_total ?? 0,
        icon: 'people',
        color: '#27ae60',
        description: payload.active_children
          ? `${payload.active_children.toLocaleString('id-ID')} aktif`
          : undefined,
      });
    }

    if (payload.shelters) {
      cards.push({
        key: 'shelters',
        label: payload.shelters.label || 'Total Shelter',
        value: payload.shelters.total ?? payload.shelters.value ?? 0,
        icon: payload.shelters.icon || 'home',
        color: payload.shelters.color || '#e67e22',
        description: payload.shelters.description || null,
      });
    } else if (payload.total_shelter || payload.shelter_total) {
      cards.push({
        key: 'shelters',
        label: 'Total Shelter',
        value: payload.total_shelter ?? payload.shelter_total ?? 0,
        icon: 'home',
        color: '#e67e22',
        description: null,
      });
    }

    if (payload.tutors) {
      cards.push({
        key: 'tutors',
        label: payload.tutors.label || 'Total Tutor',
        value: payload.tutors.total ?? payload.tutors.value ?? 0,
        icon: payload.tutors.icon || 'people-circle',
        color: payload.tutors.color || '#8e44ad',
        description: payload.tutors.description || null,
      });
    } else if (payload.total_tutors || payload.tutor_total) {
      cards.push({
        key: 'tutors',
        label: 'Total Tutor',
        value: payload.total_tutors ?? payload.tutor_total ?? 0,
        icon: 'people-circle',
        color: '#8e44ad',
        description: null,
      });
    }

    if (payload.attendance_rate || payload.average_attendance) {
      cards.push({
        key: 'attendance',
        label: 'Rata-rata Kehadiran',
        value: `${Math.round((payload.attendance_rate ?? payload.average_attendance) * 100) / 100}%`,
        icon: 'calendar',
        color: '#16a085',
        description: 'Rerata kehadiran seluruh kegiatan.',
      });
    }

    return cards.length > 0 ? cards : DEFAULT_SUMMARY;
  }, []);

  const parseQuickLinks = useCallback((payload) => {
    if (!payload || !Array.isArray(payload) || payload.length === 0) {
      return DEFAULT_LINKS;
    }

    return payload.map((link, index) => {
      const key = link.key || `link-${index}`;
      return {
        key,
        title: link.title || link.label || 'Laporan',
        description: link.description || link.subtitle || '',
        icon: link.icon || 'document-text',
        color: link.color || '#3498db',
        route: link.route || routeMap[key] || 'AdminCabangReportHome',
        params: link.params || {},
        disabled: link.disabled || false,
      };
    });
  }, [routeMap]);

  const fetchSummary = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      setError(null);
      const response = await adminCabangReportsApi.getSummary();
      const responseData = response?.data?.data || response?.data || {};
      setSummaryCards(parseSummaryCards(responseData.summary || responseData.cards || responseData));
      setQuickLinks(parseQuickLinks(responseData.quick_links || responseData.links || []));
    } catch (err) {
      console.error('Failed to fetch report summary:', err);
      setError('Gagal memuat ringkasan laporan. Silakan coba lagi.');
      setSummaryCards(DEFAULT_SUMMARY);
      setQuickLinks(DEFAULT_LINKS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [parseQuickLinks, parseSummaryCards]);

  useEffect(() => {
    fetchSummary({ showLoading: true });
  }, [fetchSummary]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSummary();
  }, [fetchSummary]);

  const handleLinkPress = useCallback((link) => {
    if (!link.route) return;
    navigation.navigate(link.route, link.params);
  }, [navigation]);

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat laporan..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={(
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      )}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Laporan Cabang</Text>
        <Text style={styles.subtitle}>
          Ringkasan metrik utama dan pintasan menuju laporan terperinci.
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <ErrorMessage message={error} onRetry={() => fetchSummary({ showLoading: true })} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ringkasan</Text>
        {summaryCards.map((card) => (
          <ReportSummaryCard key={card.key} {...card} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Laporan Detail</Text>
        {quickLinks.map((link) => (
          <ReportQuickLinkTile
            key={link.key}
            title={link.title}
            description={link.description}
            icon={link.icon}
            color={link.color}
            onPress={() => handleLinkPress(link)}
            disabled={link.disabled}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d3436',
  },
  subtitle: {
    fontSize: 14,
    color: '#636e72',
    marginTop: 6,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 12,
  },
  errorContainer: {
    marginBottom: 16,
  },
});

export default AdminCabangReportHomeScreen;
