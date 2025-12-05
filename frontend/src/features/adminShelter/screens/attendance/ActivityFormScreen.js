import React from 'react';
import { ScrollView, View } from 'react-native';
import { useDispatch } from 'react-redux';

import Button from '../../../../common/components/Button';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import useActivityForm from './hooks/useActivityForm';
import ConflictWarning from './components/activityForm/ConflictWarning';
import KegiatanPickerSection from './components/activityForm/KegiatanPickerSection';
import KelompokMateriSection from './components/activityForm/KelompokMateriSection';
import LateThresholdSection from './components/activityForm/LateThresholdSection';
import ScheduleSection from './components/activityForm/ScheduleSection';
import TutorPickerSection from './components/activityForm/TutorPickerSection';
import styles from './styles/activityFormStyles';
import { MIN_ACTIVITY_DURATION } from './utils/activityFormUtils';
import { setQuickFlowActivity, updateQuickFlowStep } from '../../redux/quickFlowSlice';

const ActivityFormScreen = ({ navigation, route }) => {
  const { activity } = route.params || {};
  const dispatch = useDispatch();
  const isQuickFlow = route?.params?.quickFlow || false;

  const handleFormSuccess = (createdActivity) => {
    if (isQuickFlow) {
      const newActivityId =
        createdActivity?.id_aktivitas ||
        createdActivity?.id ||
        activity?.id_aktivitas ||
        null;
      const resolvedStatus = createdActivity?.status || activity?.status || null;

      if (!newActivityId) {
        dispatch(updateQuickFlowStep('activitiesList'));
        navigation.navigate('ActivitiesList', {
          quickFlow: true,
        });
        return;
      }

      const rawKelompokIds = Array.isArray(createdActivity?.kelompok_ids)
        ? createdActivity.kelompok_ids.filter(Boolean)
        : [];
      const fallbackKelompokIds = Array.isArray(createdActivity?.selectedKelompokIds)
        ? createdActivity.selectedKelompokIds.filter(Boolean)
        : [];
      const resolvedKelompokIds = rawKelompokIds.length ? rawKelompokIds : fallbackKelompokIds;
      const resolvedKelompokId =
        createdActivity?.kelompok_id ||
        createdActivity?.selectedKelompokId ||
        resolvedKelompokIds[0] ||
        null;

      if (newActivityId) {
        dispatch(setQuickFlowActivity({ activityId: newActivityId, status: resolvedStatus }));
      }

      dispatch(updateQuickFlowStep('manualAttendance'));
      navigation.navigate('ManualAttendance', {
        id_aktivitas: newActivityId,
        activityName: createdActivity?.jenis_kegiatan || activity?.jenis_kegiatan,
        activityDateRaw: createdActivity?.tanggal || null,
        activityType: createdActivity?.jenis_kegiatan || activity?.jenis_kegiatan,
        kelompokId: resolvedKelompokId,
        kelompokIds: resolvedKelompokIds,
        kelompokName: createdActivity?.nama_kelompok || null,
        activityStatus: resolvedStatus,
        quickFlow: true,
      });
      return;
    }

    navigation.goBack();
  };

  const {
    isEditing,
    loading,
    error,
    materiCache,
    materiCacheLoading,
    selectedMateriFromStore,
    kegiatanOptions,
    kegiatanOptionsLoading,
    kegiatanOptionsError,
    kelompokList,
    tutorList,
    loadingStates,
    errors,
    formData,
    uiState,
    conflictWarning,
    durationMinutes,
    hasSelectedKegiatan,
    setUIState,
    handleChange,
    handleKegiatanChange,
    handleKelompokChange,
    toggleManualMateri,
    handleMateriSelect,
    handleTimeChange,
    toggleCustomLateThreshold,
    fetchTutorData,
    fetchKelompokData,
    refetchKegiatanOptions,
    handleSubmit,
  } = useActivityForm({
    activity,
    onSuccess: handleFormSuccess,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error && <ErrorMessage message={error} />}

      <KegiatanPickerSection
        options={kegiatanOptions}
        loading={kegiatanOptionsLoading}
        error={kegiatanOptionsError}
        onRetry={refetchKegiatanOptions}
        selectedValue={formData.id_kegiatan}
        onChange={handleKegiatanChange}
      />

      <TutorPickerSection
        tutors={tutorList}
        loading={loadingStates.tutor}
        error={errors.tutor}
        onRetry={fetchTutorData}
        selectedValue={formData.id_tutor}
        onChange={(value) => handleChange('id_tutor', value)}
      />

      {hasSelectedKegiatan && (
        <KelompokMateriSection
          formData={formData}
          kelompokList={kelompokList}
          loadingStates={loadingStates}
          errors={errors}
          onRetryKelompok={fetchKelompokData}
          onKelompokChange={handleKelompokChange}
          onFieldChange={handleChange}
          onToggleManualMateri={toggleManualMateri}
          materiCache={materiCache}
          materiCacheLoading={materiCacheLoading}
          selectedMateri={selectedMateriFromStore}
          onMateriSelect={handleMateriSelect}
        />
      )}

      <ScheduleSection
        formData={formData}
        uiState={uiState}
        setUIState={setUIState}
        onFieldChange={handleChange}
        onTimeChange={handleTimeChange}
        durationMinutes={durationMinutes}
        minDuration={MIN_ACTIVITY_DURATION}
      />

      <LateThresholdSection
        formData={formData}
        uiState={uiState}
        setUIState={setUIState}
        onToggleCustomLateThreshold={toggleCustomLateThreshold}
        onTimeChange={handleTimeChange}
        onFieldChange={handleChange}
      />

      <ConflictWarning message={conflictWarning} />

      <View style={styles.buttonContainer}>
        <Button
          title={isEditing ? 'Perbarui Aktivitas' : 'Buat Aktivitas'}
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          fullWidth
        />

        <Button
          title="Batal"
          onPress={() => navigation.goBack()}
          type="outline"
          disabled={loading}
          fullWidth
          style={styles.cancelButton}
        />
      </View>

      {loading && (
        <LoadingSpinner
          fullScreen
          message={isEditing ? 'Memperbarui aktivitas...' : 'Membuat aktivitas...'}
        />
      )}
    </ScrollView>
  );
};

export default ActivityFormScreen;
