import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../../common/components/ErrorMessage';

import {
  getAttendanceByActivity,
  manualVerify,
  rejectVerification,
  selectActivityAttendance,
  selectAttendanceLoading,
  selectAttendanceError,
  resetAttendanceError,
  fetchActivityMembersWithAttendance,
  selectActivityMembers,
  selectActivityAttendanceSummary,
  selectActivityMembersLoading
} from '../../../redux/attendanceSlice';
import {
  updateAktivitasStatus,
  selectAktivitasDetail,
  selectAktivitasStatusUpdating,
  selectAktivitasAttendanceSummary as selectAktivitasDetailSummary
} from '../../../redux/aktivitasSlice';

const AttendanceListTab = ({
  navigation,
  id_aktivitas,
  activityName,
  activityDate,
  activityType,
  kelompokId,
  kelompokName,
  activityStatus: routeActivityStatus,
  attendanceSummary: routeAttendanceSummary,
}) => {
  const dispatch = useDispatch();

  const attendanceRecords = useSelector(state => selectActivityAttendance(state, id_aktivitas));
  const loading = useSelector(selectAttendanceLoading);
  const error = useSelector(selectAttendanceError);
  const activityMembers = useSelector(state => selectActivityMembers(state, id_aktivitas));
  const membersSummary = useSelector(state => selectActivityAttendanceSummary(state, id_aktivitas));
  const membersLoading = useSelector(state => selectActivityMembersLoading(state, id_aktivitas));
  const aktivitasDetail = useSelector(selectAktivitasDetail);
  const statusUpdating = useSelector(selectAktivitasStatusUpdating);
  const aktivitasSummary = useSelector(selectAktivitasDetailSummary);
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const detailMatches = aktivitasDetail?.id_aktivitas === id_aktivitas;
  const derivedActivityStatus = detailMatches ? aktivitasDetail?.status : null;
  const derivedSummary = detailMatches ? aktivitasSummary : null;

  const effectiveActivityStatus = derivedActivityStatus ?? routeActivityStatus ?? null;
  const effectiveRawSummary = useMemo(() => {
    if (membersSummary) {
      return membersSummary;
    }

    if (derivedSummary) {
      return derivedSummary;
    }

    return routeAttendanceSummary || null;
  }, [membersSummary, derivedSummary, routeAttendanceSummary]);

  // Ref untuk prevent multiple simultaneous requests
  const fetchingRef = useRef(false);
  const lastFetchTime = useRef(0);

  const getStudentIdFromRecord = useCallback((record) => {
    if (!record) return null;

    return (
      record.absen_user?.anak?.id_anak ??
      record.id_anak ??
      record.student_id ??
      record.id_student ??
      null
    );
  }, []);

  const getStudentIdFromMember = useCallback((member) => {
    if (!member) return null;

    return (
      member.id_anak ??
      member.student_id ??
      member.id_student ??
      member.id ??
      null
    );
  }, []);

  const normalizeAttendanceSummary = useCallback((rawSummary) => {
    if (!rawSummary || typeof rawSummary !== 'object') {
      return null;
    }

    const total =
      rawSummary.total_members ??
      rawSummary.total ??
      rawSummary.total_students ??
      rawSummary.total_member ??
      rawSummary.total_count ??
      rawSummary.totalParticipants ??
      rawSummary.totalMembers ??
      0;

    const present =
      rawSummary.present_count ??
      rawSummary.present ??
      rawSummary.hadir ??
      rawSummary.presentMembers ??
      rawSummary.hadir_count ??
      0;

    const late =
      rawSummary.late_count ??
      rawSummary.late ??
      rawSummary.terlambat ??
      rawSummary.lateMembers ??
      0;

    const absent =
      rawSummary.absent_count ??
      rawSummary.absent ??
      rawSummary.tidak_hadir ??
      rawSummary.absentMembers ??
      0;

    const unrecorded =
      rawSummary.no_record_count ??
      rawSummary.unrecorded ??
      rawSummary.belum_tercatat ??
      rawSummary.not_recorded ??
      rawSummary.pending ??
      (total - (present + late + absent));

    return {
      total,
      present,
      late,
      absent,
      unrecorded
    };
  }, []);

  const normalizedSummary = useMemo(() => {
    if (!effectiveRawSummary || effectiveRawSummary?.success === false) {
      return null;
    }

    return normalizeAttendanceSummary(effectiveRawSummary);
  }, [effectiveRawSummary, normalizeAttendanceSummary]);

  const fallbackSummary = useMemo(() => {
    if (!activityMembers || activityMembers.length === 0) {
      return null;
    }

    const total = activityMembers.length;
    const present = activityMembers.filter(member => member.attendance_status === 'Ya').length;
    const late = activityMembers.filter(member => member.attendance_status === 'Terlambat').length;
    const absent = activityMembers.filter(member => member.attendance_status === 'Tidak').length;
    const unrecorded = total - present - late - absent;

    return { total, present, late, absent, unrecorded };
  }, [activityMembers]);

  const summaryDataForDisplay = useMemo(() => {
    if (effectiveRawSummary?.success === false) {
      return null;
    }

    return normalizedSummary || fallbackSummary;
  }, [effectiveRawSummary, normalizedSummary, fallbackSummary]);

  const summaryErrorMessage = useMemo(() => {
    if (effectiveRawSummary?.success === false) {
      return (
        effectiveRawSummary?.message ||
        'Ringkasan kehadiran tidak tersedia. Silakan coba lagi nanti.'
      );
    }

    return null;
  }, [effectiveRawSummary]);

  const attendanceStatusCounts = useMemo(() => {
    const records = attendanceRecords || [];
    const present = records.filter(r => r.absen === 'Ya').length;
    const late = records.filter(r => r.absen === 'Terlambat').length;
    const absent = records.filter(r => r.absen === 'Tidak').length;

    return { present, late, absent };
  }, [attendanceRecords]);

  
  const refreshData = useCallback(async ({ force = false } = {}) => {
    if (!id_aktivitas) {
      return { membersResult: null, attendanceResult: null };
    }

    if (fetchingRef.current) {
      return { membersResult: null, attendanceResult: null };
    }

    const now = Date.now();
    if (!force && now - lastFetchTime.current < 1000) {
      return { membersResult: null, attendanceResult: null };
    }

    fetchingRef.current = true;
    lastFetchTime.current = now;

    try {
      const membersPromise = dispatch(fetchActivityMembersWithAttendance(id_aktivitas)).unwrap();
      const attendancePromise = dispatch(getAttendanceByActivity({ id_aktivitas, type: 'student' })).unwrap();

      const [membersResult, attendanceResult] = await Promise.allSettled([
        membersPromise,
        attendancePromise
      ]);

      if (membersResult.status === 'rejected') {
        console.error('Gagal mengambil anggota aktivitas:', membersResult.reason);
      }

      if (attendanceResult.status === 'rejected') {
        console.error('Gagal mengambil kehadiran:', attendanceResult.reason);
      }

      return {
        membersResult: membersResult.status === 'fulfilled' ? membersResult.value : null,
        attendanceResult: attendanceResult.status === 'fulfilled' ? attendanceResult.value : null
      };
    } catch (err) {
      console.error('Gagal memuat data kehadiran:', err);
      return { membersResult: null, attendanceResult: null };
    } finally {
      fetchingRef.current = false;
    }
  }, [dispatch, id_aktivitas]);

  useEffect(() => {
    if (!id_aktivitas) {
      return () => dispatch(resetAttendanceError());
    }

    const timeoutId = setTimeout(() => {
      refreshData();
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      dispatch(resetAttendanceError());
    };
  }, [id_aktivitas, refreshData, dispatch]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refreshData({ force: true }).finally(() => setRefreshing(false));
  }, [refreshData]);
  
  const attendanceRecordMap = useMemo(() => {
    const map = new Map();

    (attendanceRecords || []).forEach(record => {
      const studentId = getStudentIdFromRecord(record);
      if (studentId !== null && studentId !== undefined) {
        map.set(studentId, record);
      }
    });

    return map;
  }, [attendanceRecords, getStudentIdFromRecord]);

  const combinedRoster = useMemo(() => {
    const roster = [];
    const matchedRecordIds = new Set();

    if (activityMembers && activityMembers.length > 0) {
      activityMembers.forEach((member, index) => {
        const studentId = getStudentIdFromMember(member);
        const attendanceRecord =
          studentId !== null && studentId !== undefined
            ? attendanceRecordMap.get(studentId)
            : null;

        if (attendanceRecord) {
          matchedRecordIds.add(attendanceRecord.id_absen);
        }

        const keyBase =
          studentId ??
          member.nis ??
          member.full_name ??
          member.name ??
          index;

        roster.push({
          key: attendanceRecord ? `record-${attendanceRecord.id_absen}` : `member-${keyBase}`,
          type: 'student',
          member,
          record: attendanceRecord || null
        });
      });
    }

    const additionalRecords = (attendanceRecords || [])
      .filter(record => !matchedRecordIds.has(record.id_absen))
      .map(record => ({
        key: `record-${record.id_absen}`,
        type: record.absen_user?.tutor || record.tutor_name ? 'tutor' : 'record',
        member: null,
        record
      }));

    return [...roster, ...additionalRecords];
  }, [activityMembers, attendanceRecords, attendanceRecordMap, getStudentIdFromMember]);

  const summaryForMessage = useMemo(() => {
    if (summaryDataForDisplay) {
      return summaryDataForDisplay;
    }

    const total = combinedRoster.length;
    const present = attendanceStatusCounts.present;
    const late = attendanceStatusCounts.late;
    const absent = attendanceStatusCounts.absent;
    const unrecorded = Math.max(total - (present + late + absent), 0);

    return { total, present, late, absent, unrecorded };
  }, [summaryDataForDisplay, combinedRoster, attendanceStatusCounts]);

  const extractSummaryFromUpdate = useCallback((result) => {
    if (!result) {
      return null;
    }

    const payload = result?.data?.data ?? result?.data ?? result;

    return (
      payload?.attendance_summary ??
      payload?.summary ??
      payload?.aktivitas?.attendance_summary ??
      null
    );
  }, []);

  const formatSummaryMessage = useCallback(
    (rawSummaryData, fallbackSummaryData) => {
      if (rawSummaryData?.success === false) {
        return (
          rawSummaryData.message ||
          'Ringkasan kehadiran tidak tersedia. Silakan coba lagi nanti.'
        );
      }

      const normalizedData =
        normalizeAttendanceSummary(rawSummaryData) ||
        fallbackSummaryData ||
        null;

      if (!normalizedData) {
        return 'Aktivitas berhasil ditandai selesai.';
      }

      const {
        total = 0,
        present = 0,
        late = 0,
        absent = 0,
        unrecorded = 0
      } = normalizedData;

      return [
        `Total Peserta: ${total}`,
        `Hadir: ${present}`,
        `Terlambat: ${late}`,
        `Tidak Hadir: ${absent}`,
        `Belum Tercatat: ${unrecorded}`
      ].join('\n');
    },
    [normalizeAttendanceSummary]
  );

  const summaryItems = useMemo(() => {
    if (!summaryDataForDisplay) {
      return [];
    }

    return [
      { label: 'Total', value: summaryDataForDisplay.total ?? 0, color: '#2c3e50' },
      { label: 'Hadir', value: summaryDataForDisplay.present ?? 0, color: '#27ae60' },
      { label: 'Terlambat', value: summaryDataForDisplay.late ?? 0, color: '#f39c12' },
      { label: 'Tidak Hadir', value: summaryDataForDisplay.absent ?? 0, color: '#e74c3c' },
      { label: 'Belum Tercatat', value: summaryDataForDisplay.unrecorded ?? 0, color: '#7f8c8d' }
    ];
  }, [summaryDataForDisplay]);

  const normalizedStatus = (effectiveActivityStatus || '').toLowerCase();
  const completionDisabled =
    statusUpdating || normalizedStatus === 'completed' || normalizedStatus === 'reported';
  const showLoadingOverlay = (loading || membersLoading) && !refreshing;

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return combinedRoster.filter(item => {
      const { record, member } = item;
      const name = (
        member?.full_name ||
        member?.name ||
        record?.absen_user?.anak?.name ||
        record?.student_name ||
        record?.full_name ||
        record?.tutor_name ||
        ''
      ).toString();

      const nis = (
        member?.nis ||
        record?.absen_user?.anak?.nis ||
        record?.nis ||
        ''
      ).toString();

      const matchesSearch =
        query.length === 0 ||
        name.toLowerCase().includes(query) ||
        nis.toLowerCase().includes(query);

      let matchesFilter = true;

      if (filterStatus === 'pending') {
        matchesFilter = record?.verification_status === 'pending';
      } else if (filterStatus === 'verified') {
        matchesFilter = record?.verification_status === 'verified';
      } else if (filterStatus === 'rejected') {
        matchesFilter = record?.verification_status === 'rejected';
      }

      if (filterStatus !== 'all' && !record) {
        matchesFilter = false;
      }

      return matchesSearch && matchesFilter;
    });
  }, [combinedRoster, searchQuery, filterStatus]);

  const counts = useMemo(() => {
    const records = attendanceRecords || [];
    const pending = records.filter(r => r.verification_status === 'pending').length;
    const verified = records.filter(r => r.verification_status === 'verified').length;
    const rejected = records.filter(r => r.verification_status === 'rejected').length;

    return { pending, verified, rejected, all: records.length };
  }, [attendanceRecords]);

  const handleCompleteSession = useCallback(() => {
    if (!id_aktivitas || completionDisabled) {
      return;
    }

    Alert.alert(
      'Selesaikan Sesi',
      'Pastikan seluruh kehadiran sudah tercatat. Tandai aktivitas ini sebagai selesai?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Selesaikan',
          style: 'default',
          onPress: async () => {
            try {
              const result = await dispatch(
                updateAktivitasStatus({ id: id_aktivitas, status: 'completed' })
              ).unwrap();

              const rawSummaryFromUpdate = extractSummaryFromUpdate(result);

              if (rawSummaryFromUpdate?.success === false) {
                const failureMessage =
                  rawSummaryFromUpdate.message ||
                  'Ringkasan kehadiran tidak tersedia. Silakan coba lagi nanti.';
                Alert.alert('Ringkasan Kehadiran', failureMessage);
                return;
              }

              Alert.alert(
                'Aktivitas Diselesaikan',
                formatSummaryMessage(rawSummaryFromUpdate, summaryForMessage)
              );

              await refreshData({ force: true });
            } catch (err) {
              const errorMessage =
                (typeof err === 'string' ? err : err?.message) ||
                'Gagal menyelesaikan sesi';
              Alert.alert('Gagal', errorMessage);
            }
          }
        }
      ]
    );
  }, [
    completionDisabled,
    dispatch,
    id_aktivitas,
    extractSummaryFromUpdate,
    formatSummaryMessage,
    summaryForMessage,
    refreshData
  ]);
  
  const handleVerify = (id_absen) => {
    Alert.prompt(
      'Verifikasi Manual',
      'Masukkan catatan verifikasi:',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Verifikasi',
          onPress: (notes) => {
            if (!notes) {
              Alert.alert('Error', 'Catatan verifikasi diperlukan');
              return;
            }
            
            dispatch(manualVerify({ id_absen, notes }))
              .unwrap()
              .then(() => Alert.alert('Berhasil', 'Kehadiran berhasil diverifikasi'))
              .catch((err) => Alert.alert('Error', err.message || 'Gagal memverifikasi kehadiran'));
          }
        }
      ],
      'plain-text'
    );
  };
  
  const handleReject = (id_absen) => {
    Alert.prompt(
      'Tolak Verifikasi',
      'Masukkan alasan penolakan:',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tolak',
          onPress: (reason) => {
            if (!reason) {
              Alert.alert('Error', 'Alasan penolakan diperlukan');
              return;
            }
            
            dispatch(rejectVerification({ id_absen, reason }))
              .unwrap()
              .then(() => Alert.alert('Berhasil', 'Verifikasi kehadiran ditolak'))
              .catch((err) => Alert.alert('Error', err.message || 'Gagal menolak verifikasi'));
          }
        }
      ],
      'plain-text'
    );
  };
  
  const navigateToManualEntry = () => {
    navigation.navigate('ManualAttendance', {
      id_aktivitas,
      activityName,
      activityDate,
      activityType,
      kelompokId,
      kelompokName,
      activityStatus: effectiveActivityStatus,
    });
  };

  const getStatusColor = (absen) => ({
    'Ya': '#2ecc71',
    'Terlambat': '#f39c12',
    'Tidak': '#e74c3c'
  }[absen] || '#e74c3c');

  const getStatusText = (absen) => ({
    'Ya': 'Hadir',
    'Terlambat': 'Terlambat',
    'Tidak': 'Tidak Hadir'
  }[absen] || 'Tidak Hadir');

  const getVerificationColor = (record) => {
    if (!record) return '#95a5a6';
    if (record.is_verified) return '#27ae60';
    return record.verification_status === 'rejected' ? '#e74c3c' : '#f39c12';
  };

  const getVerificationText = (record) => {
    if (!record) return 'Belum Diverifikasi';
    if (record.is_verified) return 'Terverifikasi';
    return record.verification_status === 'rejected' ? 'Ditolak' : 'Menunggu';
  };

  const getPersonName = (record, member) => (
    member?.full_name ||
    member?.name ||
    record?.absen_user?.anak?.name ||
    record?.student_name ||
    record?.full_name ||
    record?.tutor_name ||
    'Tidak diketahui'
  );

  const getPersonType = (record, member, type) => {
    if (type === 'tutor' || record?.absen_user?.tutor || record?.tutor_name) return 'Tutor';
    if (member) return 'Siswa';
    if (record?.absen_user?.anak || record?.student_name || record?.full_name) return 'Siswa';
    return 'Peserta';
  };


  const renderAttendanceCard = ({ item }) => {
    const { record, member, key, type } = item;
    const hasRecord = Boolean(record);
    const cardId = record?.id_absen ?? key;
    const attendanceStatus = record?.absen ?? member?.attendance_status ?? null;
    const statusColor = attendanceStatus ? getStatusColor(attendanceStatus) : '#95a5a6';
    const statusText = attendanceStatus ? getStatusText(attendanceStatus) : 'Belum Tercatat';
    const verificationColor = getVerificationColor(record);
    const verificationText = getVerificationText(record);

    return (
      <View style={styles.attendanceCard}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setExpandedCardId(expandedCardId === cardId ? null : cardId)}
        >
          <View style={styles.personInfo}>
            <View style={styles.personDetails}>
              <Text style={styles.personName}>{getPersonName(record, member)}</Text>
              <Text style={styles.personType}>{getPersonType(record, member, type)}</Text>
            </View>

            <View style={styles.statusContainer}>
              <View style={[styles.attendanceStatus, { backgroundColor: statusColor }]}>
                <Text style={styles.attendanceStatusText}>{statusText}</Text>
              </View>

              <View style={[styles.verificationStatus, { backgroundColor: verificationColor }]}>
                <Text style={styles.verificationStatusText}>{verificationText}</Text>
              </View>
            </View>
          </View>

          <Ionicons
            name={expandedCardId === cardId ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#7f8c8d"
          />
        </TouchableOpacity>

        {expandedCardId === cardId && (
          <View style={styles.cardContent}>
            {hasRecord ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Waktu Absen:</Text>
                  <Text style={styles.detailValue}>
                    {record.created_at
                      ? new Date(record.created_at).toLocaleString('id-ID')
                      : 'Tidak tercatat'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[styles.detailValue, { color: statusColor }]}>
                    {statusText}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Verifikasi:</Text>
                  <Text style={[styles.detailValue, { color: verificationColor }]}>
                    {verificationText}
                  </Text>
                </View>

                {record.latest_verification?.verification_notes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Catatan:</Text>
                    <Text style={styles.detailValue}>
                      {record.latest_verification.verification_notes}
                    </Text>
                  </View>
                )}

                {!record.is_verified && record.verification_status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.verifyButton]}
                      onPress={() => handleVerify(record.id_absen)}
                    >
                      <Text style={styles.actionButtonText}>Verifikasi</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleReject(record.id_absen)}
                    >
                      <Text style={styles.actionButtonText}>Tolak</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noRecordNote}>
                <Ionicons name="information-circle-outline" size={16} color="#7f8c8d" />
                <Text style={styles.noRecordText}>
                  Kehadiran belum tercatat untuk peserta ini.
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };
  
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={searchQuery ? 'search-outline' : 'people-outline'}
        size={64}
        color="#bdc3c7"
      />
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'Tidak ada peserta yang cocok dengan pencarian'
          : 'Belum ada anggota atau catatan kehadiran untuk aktivitas ini'}
      </Text>
      <Text style={styles.emptySubText}>
        {searchQuery
          ? 'Coba ubah pencarian atau filter Anda'
          : 'Ketuk tombol + untuk mencatat kehadiran'}
      </Text>
    </View>
  );

  const FilterTab = ({ status, label, count, active, onPress }) => (
    <TouchableOpacity
      style={[styles.filterTab, active && styles.activeFilterTab]}
      onPress={onPress}
    >
      <Text style={[styles.filterTabText, active && styles.activeFilterTabText]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );
  
  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error} onRetry={() => refreshData({ force: true })} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityName}>{activityName || 'Aktivitas'}</Text>
        <Text style={styles.activityDate}>{activityDate || 'Tanggal tidak ditentukan'}</Text>
      </View>

      {summaryErrorMessage ? (
        <View style={styles.summaryErrorContainer}>
          <Ionicons
            name="warning-outline"
            size={20}
            color="#e74c3c"
            style={styles.summaryErrorIcon}
          />
          <Text style={styles.summaryErrorText}>{summaryErrorMessage}</Text>
        </View>
      ) : (
        summaryItems.length > 0 && (
          <View style={styles.summaryContainer}>
            {summaryItems.map(item => (
              <View key={item.label} style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        )
      )}

      <View style={styles.completeSection}>
        <TouchableOpacity
          style={[
            styles.completeButton,
            completionDisabled && styles.completeButtonDisabled
          ]}
          onPress={handleCompleteSession}
          disabled={completionDisabled}
        >
          {statusUpdating && (
            <ActivityIndicator size="small" color="#fff" style={styles.completeButtonSpinner} />
          )}
          <Text style={styles.completeButtonText}>Selesaikan Sesi</Text>
        </TouchableOpacity>
        <Text style={styles.statusHelperText}>
          Status saat ini: {effectiveActivityStatus ? effectiveActivityStatus.replace(/_/g, ' ') : 'Belum ditentukan'}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#7f8c8d" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari berdasarkan nama..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>
      
      <View style={styles.filterTabs}>
        <FilterTab
          status="all"
          label="Semua"
          count={counts.all}
          active={filterStatus === 'all'}
          onPress={() => setFilterStatus('all')}
        />
        <FilterTab
          status="pending"
          label="Menunggu"
          count={counts.pending}
          active={filterStatus === 'pending'}
          onPress={() => setFilterStatus('pending')}
        />
        <FilterTab
          status="verified"
          label="Terverifikasi"
          count={counts.verified}
          active={filterStatus === 'verified'}
          onPress={() => setFilterStatus('verified')}
        />
        <FilterTab
          status="rejected"
          label="Ditolak"
          count={counts.rejected}
          active={filterStatus === 'rejected'}
          onPress={() => setFilterStatus('rejected')}
        />
      </View>
      
      <FlatList
        data={filteredRecords}
        renderItem={renderAttendanceCard}
        keyExtractor={item => item.key.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3498db']}
          />
        }
      />
      
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={navigateToManualEntry}>
          <Ionicons name="create" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {showLoadingOverlay && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  activityHeader: { backgroundColor: '#3498db', padding: 16, alignItems: 'center' },
  activityName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  activityDate: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1'
  },
  summaryErrorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1'
  },
  summaryErrorIcon: { marginRight: 12, marginTop: 2 },
  summaryErrorText: { flex: 1, color: '#c0392b', fontSize: 14, lineHeight: 20 },
  summaryCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  summaryValue: { fontSize: 18, fontWeight: '600' },
  summaryLabel: { fontSize: 12, color: '#7f8c8d', marginTop: 4 },
  completeSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1'
  },
  completeButton: {
    backgroundColor: '#16a085',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  completeButtonDisabled: { backgroundColor: '#95a5a6' },
  completeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  completeButtonSpinner: { marginRight: 8 },
  statusHelperText: { marginTop: 8, fontSize: 12, color: '#7f8c8d', textAlign: 'center' },
  searchContainer: {
    padding: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e1e1e1'
  },
  searchInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f2f2',
    borderRadius: 8, paddingHorizontal: 12
  },
  searchInput: { flex: 1, paddingVertical: 8, paddingHorizontal: 8, fontSize: 16 },
  filterTabs: {
    flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#e1e1e1'
  },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  activeFilterTab: { borderBottomWidth: 2, borderBottomColor: '#3498db' },
  filterTabText: { fontSize: 12, color: '#7f8c8d' },
  activeFilterTabText: { color: '#3498db', fontWeight: '500' },
  listContainer: { padding: 12, paddingBottom: 80 },
  attendanceCard: {
    backgroundColor: '#fff', borderRadius: 8, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2
  },
  memberCard: {
    backgroundColor: '#fff', borderRadius: 8, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  personInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  personDetails: { flex: 1 },
  personName: { fontSize: 16, fontWeight: '500', color: '#2c3e50' },
  personType: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  statusContainer: { alignItems: 'flex-end' },
  attendanceStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 4 },
  attendanceStatusText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  verificationStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  verificationStatusText: { color: '#fff', fontSize: 10, fontWeight: '500' },
  cardContent: {
    padding: 16, paddingTop: 0,
    borderTopWidth: 1, borderTopColor: '#f0f0f0'
  },
  detailRow: { flexDirection: 'row', marginBottom: 8 },
  detailLabel: { width: 120, fontSize: 14, color: '#7f8c8d' },
  detailValue: { flex: 1, fontSize: 14, color: '#2c3e50' },
  actionButtons: { flexDirection: 'row', marginTop: 12 },
  actionButton: {
    flex: 1, paddingVertical: 8, borderRadius: 6,
    alignItems: 'center', marginHorizontal: 4
  },
  verifyButton: { backgroundColor: '#27ae60' },
  rejectButton: { backgroundColor: '#e74c3c' },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, color: '#7f8c8d', marginTop: 12 },
  emptySubText: { fontSize: 14, color: '#95a5a6', marginTop: 8, textAlign: 'center' },
  fabContainer: { position: 'absolute', bottom: 20, right: 20 },
  fab: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#9b59b6',
    justifyContent: 'center', alignItems: 'center', elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 3.84
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center', alignItems: 'center'
  },
  cardLeft: { flex: 1 },
  cardRight: { flexDirection: 'row', alignItems: 'center' },
  studentName: { fontSize: 16, fontWeight: '500', color: '#2c3e50' },
  studentNis: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12, marginRight: 12
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '500', marginLeft: 4 },
  cardDetails: {
    padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#f0f0f0'
  },
  noRecordNote: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa',
    padding: 12, borderRadius: 6, marginTop: 8
  },
  noRecordText: { flex: 1, fontSize: 12, color: '#6c757d', marginLeft: 8 }
});

export default AttendanceListTab;