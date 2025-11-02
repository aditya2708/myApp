import React from 'react';
import { ScrollView, View } from 'react-native';

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

const ActivityFormScreen = ({ navigation, route }) => {
  const { activity } = route.params || {};

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
    onSuccess: () => navigation.goBack(),
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
