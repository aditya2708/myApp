import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';

import KeluargaFormStepFamily from '../components/keluargaForm/KeluargaFormStepFamily';
import KeluargaFormStepParents from '../components/keluargaForm/KeluargaFormStepParents';
import KeluargaFormStepGuardian from '../components/keluargaForm/KeluargaFormStepGuardian';
import KeluargaFormStepChild from '../components/keluargaForm/KeluargaFormStepChild';
import KeluargaFormStepEducation from '../components/keluargaForm/KeluargaFormStepEducation';
import KeluargaFormStepSurveyBasic from '../components/keluargaForm/KeluargaFormStepSurveyBasic';
import KeluargaFormStepSurveyFinancial from '../components/keluargaForm/KeluargaFormStepSurveyFinancial';
import KeluargaFormStepSurveyAssets from '../components/keluargaForm/KeluargaFormStepSurveyAssets';
import KeluargaFormStepSurveyHealth from '../components/keluargaForm/KeluargaFormStepSurveyHealth';
import KeluargaFormStepSurveyReligious from '../components/keluargaForm/KeluargaFormStepSurveyReligious';
import KeluargaFormReview from '../components/keluargaForm/KeluargaFormReview';

import api from '../../../api/axiosConfig';
import { adminShelterKeluargaApi } from '../api/adminShelterKeluargaApi';
import { useEnhancedKeluargaForm } from '../utils/keluargaFormHooks';
import { STEPS } from '../utils/keluargaFormUtils';

const KeluargaFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const existingKeluarga = route.params?.keluarga;
  const isEditMode = !!existingKeluarga;

  const initialFormSnapshotRef = useRef(null);
  const skipConfirmationRef = useRef(false);

  const SHOW_STEP_INDICATOR = false;
  
  const {
    formData,
    setField,
    setFormData,
    loading,
    setLoading,
    error,
    setError,
    stepsValid,
    updateStepValidity,
    validateStepData,
    currentStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    submitting,
    handleSubmit,
  } = useEnhancedKeluargaForm(existingKeluarga, isEditMode);

  const [dropdownData, setDropdownData] = React.useState({
    kacab: [],
    wilbin: [],
    bank: [],
  });
  const [loadingDropdowns, setLoadingDropdowns] = React.useState(true);

  useEffect(() => {
    initialFormSnapshotRef.current = null;
    skipConfirmationRef.current = false;
  }, [existingKeluarga]);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setLoadingDropdowns(true);
        const response = await adminShelterKeluargaApi.getDropdownData();
        
        if (response.data.success) {
          setDropdownData({
            kacab: response.data.data.kacab || [],
            bank: response.data.data.bank || [],
            wilbin: [],
          });
        }
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
        setError('Gagal memuat data formulir. Silakan coba lagi.');
      } finally {
        setLoadingDropdowns(false);
      }
    };
    
    fetchDropdownData();
  }, []);

  // Enhanced function to fetch child education data
  const fetchChildEducationData = async (childId) => {
    try {
      const response = await api.get(`/admin-shelter/anak/${childId}`);
      if (response.data.success && response.data.data) {
        return response.data.data.anakPendidikan || {};
      }
      return {};
    } catch (err) {
      console.error('Error fetching child education data:', err);
      return {};
    }
  };

  // Load existing family data for edit mode
  useEffect(() => {
    if (isEditMode && existingKeluarga) {
      const fetchFamilyDetails = async () => {
        try {
          setLoading(true);
          const response = await adminShelterKeluargaApi.getKeluargaDetail(existingKeluarga.id_keluarga);
          
          if (response.data.success) {
            const familyData = response.data.data.keluarga;
            const ayah = familyData.ayah || {};
            const ibu = familyData.ibu || {};
            const wali = familyData.wali || {};
            const childData = response.data.data.anak?.[0] || {};
            const surveyData = familyData.surveys?.[0] || {};
            
            // Fetch education data separately if child exists
            let educationData = {};
            if (childData.id_anak) {
              educationData = await fetchChildEducationData(childData.id_anak);
            }
            
            const initialFormData = {
              // Family data
              no_kk: familyData.no_kk || '',
              kepala_keluarga: familyData.kepala_keluarga || '',
              status_ortu: familyData.status_ortu || '',
              id_bank: familyData.id_bank?.toString() || '',
              no_rek: familyData.no_rek || '',
              an_rek: familyData.an_rek || '',
              no_tlp: familyData.no_tlp || '',
              an_tlp: familyData.an_tlp || '',
              
              // Parent data
              nik_ayah: ayah.nik_ayah || '',
              nama_ayah: ayah.nama_ayah || '',
              agama_ayah: ayah.agama || '',
              tempat_lahir_ayah: ayah.tempat_lahir || '',
              tanggal_lahir_ayah: ayah.tanggal_lahir || '',
              alamat_ayah: ayah.alamat || '',
              id_prov_ayah: ayah.id_prov || '',
              id_kab_ayah: ayah.id_kab || '',
              id_kec_ayah: ayah.id_kec || '',
              id_kel_ayah: ayah.id_kel || '',
              penghasilan_ayah: ayah.penghasilan || '',
              tanggal_kematian_ayah: ayah.tanggal_kematian || '',
              penyebab_kematian_ayah: ayah.penyebab_kematian || '',
              
              nik_ibu: ibu.nik_ibu || '',
              nama_ibu: ibu.nama_ibu || '',
              agama_ibu: ibu.agama || '',
              tempat_lahir_ibu: ibu.tempat_lahir || '',
              tanggal_lahir_ibu: ibu.tanggal_lahir || '',
              alamat_ibu: ibu.alamat || '',
              id_prov_ibu: ibu.id_prov || '',
              id_kab_ibu: ibu.id_kab || '',
              id_kec_ibu: ibu.id_kec || '',
              id_kel_ibu: ibu.id_kel || '',
              penghasilan_ibu: ibu.penghasilan || '',
              tanggal_kematian_ibu: ibu.tanggal_kematian || '',
              penyebab_kematian_ibu: ibu.penyebab_kematian || '',
              
              // Guardian data
              nik_wali: wali.nik_wali || '',
              nama_wali: wali.nama_wali || '',
              agama_wali: wali.agama || '',
              tempat_lahir_wali: wali.tempat_lahir || '',
              tanggal_lahir_wali: wali.tanggal_lahir || '',
              alamat_wali: wali.alamat || '',
              penghasilan_wali: wali.penghasilan || '',
              hub_kerabat_wali: wali.hub_kerabat || '',
              
              // Child data
              nik_anak: childData.nik_anak || '',
              anak_ke: childData.anak_ke?.toString() || '',
              dari_bersaudara: childData.dari_bersaudara?.toString() || '',
              nick_name: childData.nick_name || '',
              full_name: childData.full_name || '',
              agama: childData.agama || '',
              tempat_lahir: childData.tempat_lahir || '',
              tanggal_lahir: childData.tanggal_lahir || '',
              jenis_kelamin: childData.jenis_kelamin || '',
              tinggal_bersama: childData.tinggal_bersama || '',
              hafalan: childData.hafalan || '',
              pelajaran_favorit: childData.pelajaran_favorit || '',
              hobi: childData.hobi || '',
              prestasi: childData.prestasi || '',
              jarak_rumah: childData.jarak_rumah?.toString() || '',
              transportasi: childData.transportasi || '',
              
              // Education data from separate API call
              jenjang: educationData.jenjang || '',
              kelas: educationData.kelas || '',
              nama_sekolah: educationData.nama_sekolah || '',
              alamat_sekolah: educationData.alamat_sekolah || '',
              jurusan: educationData.jurusan || '',
              semester: educationData.semester?.toString() || '',
              nama_pt: educationData.nama_pt || '',
              alamat_pt: educationData.alamat_pt || '',

              // Survey data
              pekerjaan_kepala_keluarga: surveyData.pekerjaan_kepala_keluarga || '',
              pendidikan_kepala_keluarga: surveyData.pendidikan_kepala_keluarga || '',
              jumlah_tanggungan: surveyData.jumlah_tanggungan?.toString() || '',
              kepemilikan_tabungan: surveyData.kepemilikan_tabungan || '',
              jumlah_makan: surveyData.jumlah_makan?.toString() || '',
              kepemilikan_tanah: surveyData.kepemilikan_tanah || '',
              kepemilikan_rumah: surveyData.kepemilikan_rumah || '',
              kondisi_rumah_dinding: surveyData.kondisi_rumah_dinding || '',
              kondisi_rumah_lantai: surveyData.kondisi_rumah_lantai || '',
              kepemilikan_kendaraan: surveyData.kepemilikan_kendaraan || '',
              kepemilikan_elektronik: surveyData.kepemilikan_elektronik || '',
              sumber_air_bersih: surveyData.sumber_air_bersih || '',
              jamban_limbah: surveyData.jamban_limbah || '',
              tempat_sampah: surveyData.tempat_sampah || '',
              perokok: surveyData.perokok || '',
              konsumen_miras: surveyData.konsumen_miras || '',
              persediaan_p3k: surveyData.persediaan_p3k || '',
              makan_buah_sayur: surveyData.makan_buah_sayur || '',
              solat_lima_waktu: surveyData.solat_lima_waktu || '',
              membaca_alquran: surveyData.membaca_alquran || '',
              majelis_taklim: surveyData.majelis_taklim || '',
              membaca_koran: surveyData.membaca_koran || '',
              pengurus_organisasi: surveyData.pengurus_organisasi || '',
              pengurus_organisasi_sebagai: surveyData.pengurus_organisasi_sebagai || '',
              kepribadian_anak: surveyData.kepribadian_anak || '',
              kondisi_fisik_anak: surveyData.kondisi_fisik_anak || '',
              keterangan_disabilitas: surveyData.keterangan_disabilitas || '',
              biaya_pendidikan_perbulan: surveyData.biaya_pendidikan_perbulan?.toString() || '',
              bantuan_lembaga_formal_lain: surveyData.bantuan_lembaga_formal_lain || '',
              bantuan_lembaga_formal_lain_sebesar: surveyData.bantuan_lembaga_formal_lain_sebesar?.toString() || '',
              kondisi_penerima_manfaat: surveyData.kondisi_penerima_manfaat || '',
            };
            
            setFormData(initialFormData);
          }
        } catch (err) {
          console.error('Error fetching family details:', err);
          setError('Gagal memuat detail keluarga. Silakan coba lagi.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchFamilyDetails();
    }
  }, [isEditMode, existingKeluarga]);

  useEffect(() => {
    if (!loading && initialFormSnapshotRef.current === null) {
      initialFormSnapshotRef.current = JSON.parse(JSON.stringify(formData || {}));
    }
  }, [loading, formData]);

  const hasUnsavedChanges = useMemo(() => {
    if (!initialFormSnapshotRef.current) {
      return false;
    }

    return (
      JSON.stringify(initialFormSnapshotRef.current) !==
      JSON.stringify(formData || {})
    );
  }, [formData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!hasUnsavedChanges || submitting || skipConfirmationRef.current) {
        return;
      }

      event.preventDefault();

      Alert.alert(
        'Keluar tanpa menyimpan?',
        'Perubahan yang belum disimpan akan hilang. Apakah Anda ingin keluar?',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Keluar',
            style: 'destructive',
            onPress: () => navigation.dispatch(event.data.action),
          },
        ],
        { cancelable: true }
      );
    });

    return () => {
      unsubscribe();
    };
  }, [navigation, hasUnsavedChanges, submitting]);

  // Set screen title
  useEffect(() => {
    navigation.setOptions({
      headerTitle: isEditMode ? 'Edit Keluarga' : 'Tambahkan Keluarga Baru'
    });
  }, [navigation, isEditMode]);

  // Enhanced submit handler
  const onSubmit = async () => {
    const result = await handleSubmit();
    if (result.success) {
      skipConfirmationRef.current = true;
      navigation.goBack();
    }
  };

  const renderCurrentStep = () => {
    const stepProps = {
      formData,
      onChange: setField,
      setStepValid: (isValid) => updateStepValidity(currentStep, isValid),
      validateStep: () => validateStepData(currentStep),
    };

    switch (currentStep) {
      case STEPS.FAMILY:
        return (
          <KeluargaFormStepFamily
            {...stepProps}
            dropdownData={dropdownData}
            isLoadingDropdowns={loadingDropdowns}
          />
        );
      case STEPS.PARENTS:
        return <KeluargaFormStepParents {...stepProps} />;
      case STEPS.GUARDIAN:
        return <KeluargaFormStepGuardian {...stepProps} />;
      case STEPS.CHILD:
        return <KeluargaFormStepChild {...stepProps} />;
      case STEPS.EDUCATION:
        return <KeluargaFormStepEducation {...stepProps} />;
      case STEPS.SURVEY_BASIC:
        return <KeluargaFormStepSurveyBasic {...stepProps} />;
      case STEPS.SURVEY_FINANCIAL:
        return <KeluargaFormStepSurveyFinancial {...stepProps} />;
      case STEPS.SURVEY_ASSETS:
        return <KeluargaFormStepSurveyAssets {...stepProps} />;
      case STEPS.SURVEY_HEALTH:
        return <KeluargaFormStepSurveyHealth {...stepProps} />;
      case STEPS.SURVEY_RELIGIOUS:
        return <KeluargaFormStepSurveyReligious {...stepProps} />;
      case STEPS.REVIEW:
        return (
          <KeluargaFormReview
            formData={formData}
            dropdownData={dropdownData}
            isEditMode={isEditMode}
          />
        );
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    const titles = {
      [STEPS.FAMILY]: 'Data Keluarga',
      [STEPS.PARENTS]: 'Data Orang tua',
      [STEPS.GUARDIAN]: 'Data Wali',
      [STEPS.CHILD]: 'Data Anak',
      [STEPS.EDUCATION]: 'Data Pendidikan',
      [STEPS.SURVEY_BASIC]: 'Data Dasar Survei',
      [STEPS.SURVEY_FINANCIAL]: 'Data Keuangan',
      [STEPS.SURVEY_ASSETS]: 'Data Aset',
      [STEPS.SURVEY_HEALTH]: 'Data Kesehatan',
      [STEPS.SURVEY_RELIGIOUS]: 'Data Keagamaan',
      [STEPS.REVIEW]: 'Review',
    };
    return titles[currentStep] || '';
  };

  if (loading && !loadingDropdowns) {
    return <LoadingSpinner fullScreen message="Loading form..." />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
        
        {SHOW_STEP_INDICATOR && (
          <View style={styles.stepsContainer}>
            {Object.values(STEPS).map((step) => {
              if (step === STEPS.GUARDIAN && formData.status_ortu !== 'yatim piatu') {
                return null;
              }
              
              return (
                <TouchableOpacity
                  key={step}
                  style={[
                    styles.stepIndicator,
                    currentStep === step && styles.currentStep,
                    stepsValid[step] && styles.validStep,
                  ]}
                  onPress={() => goToStep(step)}
                  disabled={submitting}
                >
                  <Text style={[
                    styles.stepNumber,
                    (currentStep === step || stepsValid[step]) && styles.activeStepText
                  ]}>
                    {step + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        
        {SHOW_STEP_INDICATOR && (
          <Text style={styles.stepTitle}>{getStepTitle()}</Text>
        )}
        
        <View style={styles.formContainer}>
          {renderCurrentStep()}
        </View>
        
        <View style={styles.buttonsContainer}>
          {currentStep > 0 && (
            <Button
              title="Kembali"
              onPress={goToPreviousStep}
              type="outline"
              style={styles.navigationButton}
              disabled={submitting}
            />
          )}
          
          {currentStep < STEPS.REVIEW ? (
            <Button
              title="Selanjutnya"
              onPress={goToNextStep}
              type="primary"
              style={[styles.navigationButton, currentStep === 0 && styles.fullWidthButton]}
              disabled={submitting}
            />
          ) : (
            <Button
              title={isEditMode ? "Edit" : "Simpan"}
              onPress={onSubmit}
              type="primary"
              style={styles.navigationButton}
              loading={submitting}
              disabled={submitting}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  stepIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  currentStep: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  validStep: {
    backgroundColor: '#2ecc71',
    borderColor: '#2ecc71',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#777',
  },
  activeStepText: {
    color: '#fff',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navigationButton: {
    flex: 1,
    margin: 5,
  },
  fullWidthButton: {
    flex: 1,
  },
});

export default KeluargaFormScreen;