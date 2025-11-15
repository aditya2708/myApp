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
import ReportQuickLinkTile from '../../components/reports/ReportQuickLinkTile';
import ReportQuickActionTile from '../../components/reports/ReportQuickActionTile';
import { adminCabangReportApi } from '../../api/adminCabangReportApi';

const DEPRECATED_REPORT_KEYS = new Set([
  'attendance',
  'attendance-weekly',
  'attendance_weekly',
  'attendance-shelter',
  'attendance_shelter',
  'attendance_group',
  'attendance-group',
]);

const DEPRECATED_REPORT_ROUTES = new Set([
  'AdminCabangAttendanceReport',
  'AdminCabangAttendanceWeekly',
  'AdminCabangAttendanceShelterDetail',
  'AdminCabangAttendanceGroup',
]);

const DEFAULT_LINKS = [
  {
    key: 'children',
    title: 'Laporan Anak Binaan',
    description: 'Pantau perkembangan dan kebutuhan anak binaan di cabang Anda.',
    icon: 'school',
    color: '#2980b9',
    route: 'AdminCabangChildReport',
  },
  {
    key: 'tutors',
    title: 'Laporan Tutor',
    description: 'Tinjau performa dan aktivitas tutor shelter di wilayah Anda.',
    icon: 'people-circle',
    color: '#9b59b6',
    route: 'AdminCabangTutorReport',
  },
  {
    key: 'achievement',
    title: 'Laporan Pencapaian Anak',
    description: 'Pantau pencapaian dan perkembangan anak binaan.',
    icon: 'trophy',
    color: '#27ae60',
    route: 'AdminCabangAchievementReport',
  },
  {
    key: 'activities',
    title: 'Laporan Kegiatan',
    description: 'Lihat ringkasan kegiatan yang telah dilaksanakan.',
    icon: 'calendar',
    color: '#e67e22',
    route: 'AdminCabangActivityReport',
  },
];

const DEFAULT_ACTIONS = [];

const AdminCabangReportHomeScreen = () => {
  const navigation = useNavigation();
  const [quickLinks, setQuickLinks] = useState(DEFAULT_LINKS);
  const [quickActions, setQuickActions] = useState(DEFAULT_ACTIONS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const routeMap = useMemo(
    () => ({
      children: 'AdminCabangChildReport',
      tutors: 'AdminCabangTutorReport',
      achievement: 'AdminCabangAchievementReport',
      activities: 'AdminCabangActivityReport',
    }),
    []
  );

  const createSignature = useCallback((item = {}) => {
    const title = (item.title || item.label || '').trim().toLowerCase();
    const route = (item.route || '').toString().trim();

    if (!title && !route) {
      return null;
    }

    return `${title}::${route}`;
  }, []);

  const dedupeByRouteAndTitle = useCallback(
    (items = [], seenSignatures = []) => {
      const seen = new Set(seenSignatures);

      return items.filter((item) => {
        const signature = createSignature(item);

        if (!signature) {
          return true;
        }

        if (seen.has(signature)) {
          return false;
        }

        seen.add(signature);
        return true;
      });
    },
    [createSignature]
  );

  const parseQuickLinks = useCallback(
    (payload) => {
      if (!payload || !Array.isArray(payload) || payload.length === 0) {
        return dedupeByRouteAndTitle([...DEFAULT_LINKS]);
      }

      const mappedLinks = payload
        .filter((link) => {
          const key = (link?.key || '').toString().trim().toLowerCase();
          const route = (link?.route || '').toString().trim();
          return !DEPRECATED_REPORT_KEYS.has(key) && !DEPRECATED_REPORT_ROUTES.has(route);
        })
        .map((link, index) => {
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

      if (mappedLinks.length === 0) {
        return dedupeByRouteAndTitle([...DEFAULT_LINKS]);
      }

      return dedupeByRouteAndTitle(mappedLinks);
    },
    [dedupeByRouteAndTitle, routeMap]
  );

  const parseQuickActions = useCallback(
    (payload, existingLinks = []) => {
      const source = Array.isArray(payload) && payload.length > 0 ? payload : DEFAULT_ACTIONS;

      const existingSignatures = existingLinks
        .map((link) => createSignature(link))
        .filter(Boolean);

      const mappedActions = source
        .filter((action) => {
          const key = (action?.key || '').toString().trim().toLowerCase();
          const route = (action?.route || '').toString().trim();
          return !DEPRECATED_REPORT_KEYS.has(key) && !DEPRECATED_REPORT_ROUTES.has(route);
        })
        .map((action, index) => {
          const key = action.key || `action-${index}`;
          const mappedRoute = action.route || routeMap[key] || 'AdminCabangReportHome';

          return {
            key,
            title: action.title || action.label || 'Aksi',
            description: action.description || action.subtitle || '',
            icon: action.icon || 'flash',
            color: action.color || '#2980b9',
            route: mappedRoute,
            params: action.params || {},
            disabled: action.disabled || false,
            badge: action.badge ?? action.count ?? null,
          };
        });

      if (mappedActions.length === 0) {
        return dedupeByRouteAndTitle([...DEFAULT_ACTIONS], existingSignatures);
      }

      return dedupeByRouteAndTitle(mappedActions, existingSignatures);
    },
    [createSignature, dedupeByRouteAndTitle, routeMap]
  );

  const fetchSummary = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      setError(null);
      const response = await adminCabangReportApi.getSummary();
      const responseData = response?.data?.data || response?.data || {};
      const parsedLinks = parseQuickLinks(responseData.quick_links || responseData.links || []);
      setQuickLinks(parsedLinks);

      setQuickActions(
        parseQuickActions(responseData.quick_actions || responseData.actions || [], parsedLinks)
      );
    } catch (err) {
      console.error('Failed to fetch report summary:', err);
      setError('Gagal memuat ringkasan laporan. Silakan coba lagi.');

      const fallbackLinks = parseQuickLinks();
      setQuickLinks(fallbackLinks);
      setQuickActions(parseQuickActions(undefined, fallbackLinks));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [parseQuickActions, parseQuickLinks]);

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

  const handleActionPress = useCallback((action) => {
    if (!action.route || action.disabled) return;
    navigation.navigate(action.route, action.params);
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
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <ReportQuickActionTile
              key={action.key}
              title={action.title}
              description={action.description}
              icon={action.icon}
              color={action.color}
              badge={action.badge}
              disabled={action.disabled}
              onPress={() => handleActionPress(action)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>List Laporan</Text>
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
    rowGap: 12,
    columnGap: 12,
  },
});

export default AdminCabangReportHomeScreen;
