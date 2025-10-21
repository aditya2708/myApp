// Constants and Options
export const STEPS = {
  FAMILY: 0,
  PARENTS: 1,
  GUARDIAN: 2,
  CHILD: 3,
  EDUCATION: 4,
  SURVEY_BASIC: 5,
  SURVEY_FINANCIAL: 6,
  SURVEY_ASSETS: 7,
  SURVEY_HEALTH: 8,
  SURVEY_RELIGIOUS: 9,
  REVIEW: 10,
};

export const STATUS_OPTIONS = [
  { label: '-- Pilih Status --', value: '' },
  { label: 'Yatim', value: 'yatim' },
  { label: 'Piatu', value: 'piatu' },
  { label: 'Yatim Piatu', value: 'yatim piatu' },
  { label: 'Dhuafa', value: 'dhuafa' },
  { label: 'Non Dhuafa', value: 'non dhuafa' },
];

export const RELIGION_OPTIONS = [
  { label: '-- Pilih Agama --', value: '' },
  { label: 'Islam', value: 'Islam' },
  { label: 'Kristen', value: 'Kristen' },
  { label: 'Katolik', value: 'Katolik' },
  { label: 'Hindu', value: 'Hindu' },
  { label: 'Buddha', value: 'Buddha' },
  { label: 'Konghucu', value: 'Konghucu' },
];

export const GENDER_OPTIONS = [
  { label: '-- Pilih Jenis Kelamin --', value: '' },
  { label: 'Laki-laki', value: 'Laki-laki' },
  { label: 'Perempuan', value: 'Perempuan' },
];

export const INCOME_OPTIONS = [
  { label: '-- Pilih Penghasilan --', value: '' },
  { label: 'Kurang dari Rp 1.000.000', value: 'Kurang dari Rp 1.000.000' },
  { label: 'Rp 1.000.000 - Rp 3.000.000', value: 'Rp 1.000.000 - Rp 3.000.000' },
  { label: 'Rp 3.000.001 - Rp 5.000.000', value: 'Rp 3.000.001 - Rp 5.000.000' },
  { label: 'Rp 5.000.001 - Rp 10.000.000', value: 'Rp 5.000.001 - Rp 10.000.000' },
  { label: 'Lebih dari Rp 10.000.000', value: 'Lebih dari Rp 10.000.000' },
];

export const LIVING_WITH_OPTIONS = [
  { label: '-- Pilih Tinggal Bersama --', value: '' },
  { label: 'Ayah', value: 'Ayah' },
  { label: 'Ibu', value: 'Ibu' },
  { label: 'Ayah dan Ibu', value: 'Ayah dan Ibu' },
  { label: 'Wali', value: 'Wali' },
];

export const HAFALAN_OPTIONS = [
  { label: '-- Pilih Jenis Pembinaan --', value: '' },
  { label: 'Tahfidz', value: 'Tahfidz' },
  { label: 'Non-Tahfidz', value: 'Non-Tahfidz' },
];

export const TRANSPORTATION_OPTIONS = [
  { label: '-- Pilih transportasi --', value: '' },
  { label: 'Jalan Kaki', value: 'Jalan Kaki' },
  { label: 'Sepeda', value: 'Sepeda' },
  { label: 'Sepeda Motor', value: 'Sepeda Motor' },
  { label: 'Angkutan Umum', value: 'Angkutan Umum' },
  { label: 'Mobil', value: 'Mobil' },
  { label: 'Lainnya', value: 'Lainnya' },
];

export const EDUCATION_LEVEL_OPTIONS = [
  { label: '-- Pilih Tingkat Pendidikan --', value: '' },
  { label: 'Belum Sekolah', value: 'belum_sd' },
  { label: 'SD / Sederajat', value: 'sd' },
  { label: 'SMP / Sederajat', value: 'smp' },
  { label: 'SMA / Sederajat', value: 'sma' },
  { label: 'Perguruan Tinggi', value: 'perguruan_tinggi' },
];

export const SD_GRADE_OPTIONS = [
  { label: '-- Pilih Kelas --', value: '' },
  { label: 'Kelas 1', value: 'Kelas 1' },
  { label: 'Kelas 2', value: 'Kelas 2' },
  { label: 'Kelas 3', value: 'Kelas 3' },
  { label: 'Kelas 4', value: 'Kelas 4' },
  { label: 'Kelas 5', value: 'Kelas 5' },
  { label: 'Kelas 6', value: 'Kelas 6' },
];

export const SMP_GRADE_OPTIONS = [
  { label: '-- Pilih Kelas --', value: '' },
  { label: 'Kelas 7', value: 'Kelas 7' },
  { label: 'Kelas 8', value: 'Kelas 8' },
  { label: 'Kelas 9', value: 'Kelas 9' },
];

export const SMA_GRADE_OPTIONS = [
  { label: '-- Pilih Kelas --', value: '' },
  { label: 'Kelas 10', value: 'Kelas 10' },
  { label: 'Kelas 11', value: 'Kelas 11' },
  { label: 'Kelas 12', value: 'Kelas 12' },
];

export const SMA_MAJOR_OPTIONS = [
  { label: '-- Pilih Jurusan --', value: '' },
  { label: 'IPA', value: 'IPA' },
  { label: 'IPS', value: 'IPS' },
  { label: 'Bahasa', value: 'Bahasa' },
  { label: 'Agama', value: 'Agama' },
  { label: 'Kejuruan', value: 'Kejuruan' },
];

export const SEMESTER_OPTIONS = [
  { label: '-- Pilih Semester --', value: '' },
  { label: 'Semester 1', value: '1' },
  { label: 'Semester 2', value: '2' },
  { label: 'Semester 3', value: '3' },
  { label: 'Semester 4', value: '4' },
  { label: 'Semester 5', value: '5' },
  { label: 'Semester 6', value: '6' },
  { label: 'Semester 7', value: '7' },
  { label: 'Semester 8', value: '8' },
  { label: '> Semester 8', value: '9' },
];

export const RELATION_OPTIONS = [
  { label: '-- Pilih Hubungan --', value: '' },
  { label: 'Kakek/Nenek', value: 'Kakek/Nenek' },
  { label: 'Paman/Bibi', value: 'Paman/Bibi' },
  { label: 'Saudara Kandung', value: 'Saudara Kandung' },
  { label: 'Sepupu', value: 'Sepupu' },
  { label: 'Tetangga', value: 'Tetangga' },
  { label: 'Lainnya', value: 'Lainnya' },
];

// Survey Options
export const JOB_OPTIONS = [
  { label: '-- Pilih Pekerjaan --', value: '' },
  { label: 'Tidak Bekerja', value: 'Tidak Bekerja' },
  { label: 'Petani', value: 'Petani' },
  { label: 'Pedagang', value: 'Pedagang' },
  { label: 'Buruh', value: 'Buruh' },
  { label: 'Karyawan Swasta', value: 'Karyawan Swasta' },
  { label: 'PNS', value: 'PNS' },
  { label: 'Wiraswasta', value: 'Wiraswasta' },
  { label: 'Nelayan', value: 'Nelayan' },
  { label: 'Supir', value: 'Supir' },
  { label: 'Tukang', value: 'Tukang' },
  { label: 'Lainnya', value: 'Lainnya' },
];

export const EDUCATION_OPTIONS = [
  { label: '-- Pilih Pendidikan --', value: '' },
  { label: 'Tidak Sekolah', value: 'Tidak Sekolah' },
  { label: 'SD/Sederajat', value: 'SD/Sederajat' },
  { label: 'SMP/Sederajat', value: 'SMP/Sederajat' },
  { label: 'SMA/Sederajat', value: 'SMA/Sederajat' },
  { label: 'Diploma', value: 'Diploma' },
  { label: 'Sarjana', value: 'Sarjana' },
  { label: 'Pascasarjana', value: 'Pascasarjana' },
];

export const FINANCIAL_INCOME_OPTIONS = [
  { label: '-- Pilih Penghasilan --', value: '' },
  { label: 'Kurang dari Rp 500.000', value: 'Kurang dari Rp 500.000' },
  { label: 'Rp 500.000 - Rp 1.000.000', value: 'Rp 500.000 - Rp 1.000.000' },
  { label: 'Rp 1.000.000 - Rp 2.000.000', value: 'Rp 1.000.000 - Rp 2.000.000' },
  { label: 'Rp 2.000.000 - Rp 3.000.000', value: 'Rp 2.000.000 - Rp 3.000.000' },
  { label: 'Rp 3.000.000 - Rp 5.000.000', value: 'Rp 3.000.000 - Rp 5.000.000' },
  { label: 'Lebih dari Rp 5.000.000', value: 'Lebih dari Rp 5.000.000' },
];

export const SAVINGS_OPTIONS = [
  { label: '-- Pilih Kepemilikan Tabungan --', value: '' },
  { label: 'Ada', value: 'Ada' },
  { label: 'Tidak Ada', value: 'Tidak Ada' },
];

export const LAND_OWNERSHIP_OPTIONS = [
  { label: '-- Pilih Kepemilikan Tanah --', value: '' },
  { label: 'Milik Sendiri', value: 'Milik Sendiri' },
  { label: 'Kontrak', value: 'Kontrak' },
  { label: 'Menumpang', value: 'Menumpang' },
  { label: 'Lainnya', value: 'Lainnya' },
];

export const HOUSE_OWNERSHIP_OPTIONS = [
  { label: '-- Pilih Kepemilikan Rumah --', value: '' },
  { label: 'Milik Sendiri', value: 'Milik Sendiri' },
  { label: 'Kontrak', value: 'Kontrak' },
  { label: 'Menumpang', value: 'Menumpang' },
  { label: 'Lainnya', value: 'Lainnya' },
];

export const WALL_CONDITION_OPTIONS = [
  { label: '-- Pilih Kondisi Dinding --', value: '' },
  { label: 'Tembok', value: 'Tembok' },
  { label: 'Semi Tembok', value: 'Semi Tembok' },
  { label: 'Kayu', value: 'Kayu' },
  { label: 'Bambu', value: 'Bambu' },
  { label: 'Lainnya', value: 'Lainnya' },
];

export const FLOOR_CONDITION_OPTIONS = [
  { label: '-- Pilih Kondisi Lantai --', value: '' },
  { label: 'Keramik', value: 'Keramik' },
  { label: 'Semen', value: 'Semen' },
  { label: 'Tanah', value: 'Tanah' },
  { label: 'Kayu', value: 'Kayu' },
  { label: 'Lainnya', value: 'Lainnya' },
];

export const VEHICLE_OPTIONS = [
  { label: '-- Pilih Kepemilikan Kendaraan --', value: '' },
  { label: 'Tidak Ada', value: 'Tidak Ada' },
  { label: 'Sepeda', value: 'Sepeda' },
  { label: 'Sepeda Motor', value: 'Sepeda Motor' },
  { label: 'Mobil', value: 'Mobil' },
  { label: 'Sepeda Motor dan Mobil', value: 'Sepeda Motor dan Mobil' },
];

export const ELECTRONIC_OPTIONS = [
  { label: '-- Pilih Kepemilikan Elektronik --', value: '' },
  { label: 'Tidak Ada', value: 'Tidak Ada' },
  { label: 'TV', value: 'TV' },
  { label: 'Kulkas', value: 'Kulkas' },
  { label: 'Mesin Cuci', value: 'Mesin Cuci' },
  { label: 'TV dan Kulkas', value: 'TV dan Kulkas' },
  { label: 'Lengkap', value: 'Lengkap' },
];

export const MEAL_OPTIONS = [
  { label: '-- Pilih Jumlah Makan --', value: '' },
  { label: '1 Kali', value: '1' },
  { label: '2 Kali', value: '2' },
  { label: '3 Kali', value: '3' },
  { label: 'Lebih dari 3 Kali', value: '4' },
];

export const WATER_SOURCE_OPTIONS = [
  { label: '-- Pilih Sumber Air --', value: '' },
  { label: 'PDAM', value: 'PDAM' },
  { label: 'Sumur', value: 'Sumur' },
  { label: 'Sungai', value: 'Sungai' },
  { label: 'Air Hujan', value: 'Air Hujan' },
  { label: 'Lainnya', value: 'Lainnya' },
];

export const TOILET_OPTIONS = [
  { label: '-- Pilih Jenis Jamban --', value: '' },
  { label: 'Sendiri', value: 'Sendiri' },
  { label: 'Umum', value: 'Umum' },
  { label: 'Tidak Ada', value: 'Tidak Ada' },
];

export const TRASH_OPTIONS = [
  { label: '-- Pilih Tempat Sampah --', value: '' },
  { label: 'Ada', value: 'Ada' },
  { label: 'Tidak Ada', value: 'Tidak Ada' },
];

export const YES_NO_OPTIONS = [
  { label: '-- Pilih --', value: '' },
  { label: 'Ya', value: 'Ya' },
  { label: 'Tidak', value: 'Tidak' },
];

export const AVAILABILITY_OPTIONS = [
  { label: '-- Pilih --', value: '' },
  { label: 'Ada', value: 'Ada' },
  { label: 'Tidak Ada', value: 'Tidak Ada' },
];

export const FREQUENCY_OPTIONS = [
  { label: '-- Pilih Frekuensi --', value: '' },
  { label: 'Selalu', value: 'Selalu' },
  { label: 'Kadang-kadang', value: 'Kadang-kadang' },
  { label: 'Tidak Pernah', value: 'Tidak Pernah' },
];

export const ACTIVITY_OPTIONS = [
  { label: '-- Pilih Status --', value: '' },
  { label: 'Aktif', value: 'Aktif' },
  { label: 'Tidak Aktif', value: 'Tidak Aktif' },
];

export const ASSISTANCE_OPTIONS = [
  { label: '-- Pilih Bantuan Lembaga --', value: '' },
  { label: 'Ya', value: 'Ya' },
  { label: 'Tidak', value: 'Tidak' },
];

export const BENEFICIARY_CONDITION_OPTIONS = [
  { label: '-- Pilih Kondisi --', value: '' },
  { label: 'Sangat Membutuhkan', value: 'Sangat Membutuhkan' },
  { label: 'Membutuhkan', value: 'Membutuhkan' },
  { label: 'Cukup', value: 'Cukup' },
  { label: 'Baik', value: 'Baik' },
];

export const PHYSICAL_CONDITION_OPTIONS = [
  { label: '-- Pilih Kondisi Fisik --', value: '' },
  { label: 'Normal', value: 'Normal' },
  { label: 'Disabilitas', value: 'Disabilitas' },
];

// Helper Functions
export const getGradeOptions = (jenjang) => {
  switch (jenjang) {
    case 'sd':
      return SD_GRADE_OPTIONS;
    case 'smp':
      return SMP_GRADE_OPTIONS;
    case 'sma':
      return SMA_GRADE_OPTIONS;
    default:
      return [];
  }
};

export const formatEducationLevel = (level) => {
  const levelMap = {
    'belum_sd': 'Belum Sekolah',
    'sd': 'SD / Sederajat',
    'smp': 'SMP / Sederajat',
    'sma': 'SMA / Sederajat',
    'perguruan_tinggi': 'Perguruan Tinggi'
  };
  return levelMap[level] || level;
};

export const getParentStatusDescription = (status) => {
  switch (status) {
    case 'yatim':
      return 'Yatim (Ayah Meninggal)';
    case 'piatu':
      return 'Piatu (Ibu Meninggal)';
    case 'yatim piatu':
      return 'Yatim Piatu (Kedua Orang Tua Meninggal)';
    case 'dhuafa':
      return 'Dhuafa (Keluarga Kurang Mampu)';
    case 'non dhuafa':
      return 'Non Dhuafa (Keluarga Mampu)';
    default:
      return status;
  }
};

// Form Data Formatters
export const formatDateForSubmission = (dateString) => {
  if (!dateString) return '';
  // Convert DD-MM-YYYY to YYYY-MM-DD for API
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString;
};

export const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  // Convert YYYY-MM-DD to DD-MM-YYYY for display
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString;
};

// Validation Functions
export const validateStep = (step, formData) => {
  switch (step) {
    case STEPS.FAMILY:
      return validateFamilyStep(formData);
    case STEPS.PARENTS:
      return validateParentsStep(formData);
    case STEPS.GUARDIAN:
      return validateGuardianStep(formData);
    case STEPS.CHILD:
      return validateChildStep(formData);
    case STEPS.EDUCATION:
      return validateEducationStep(formData);
    case STEPS.SURVEY_BASIC:
      return validateSurveyBasicStep(formData);
    case STEPS.SURVEY_FINANCIAL:
      return validateSurveyFinancialStep(formData);
    case STEPS.SURVEY_ASSETS:
      return validateSurveyAssetsStep(formData);
    case STEPS.SURVEY_HEALTH:
      return validateSurveyHealthStep(formData);
    case STEPS.SURVEY_RELIGIOUS:
      return validateSurveyReligiousStep(formData);
    case STEPS.REVIEW:
      return true;
    default:
      return false;
  }
};

const validateFamilyStep = (data) => {
  const hasValidFamilyData = !!(
    data.no_kk &&
    data.no_kk.length === 16 &&
    data.kepala_keluarga &&
    data.status_ortu
  );

  const hasContact = !!(data.no_tlp && data.an_tlp);

  const requiresBankVerification = !!data.id_bank;
  const hasValidBankData = !requiresBankVerification || !!(data.no_rek && data.an_rek);

  return hasValidFamilyData && hasContact && hasValidBankData;
};

const validateParentsStep = (data) => {
  const status = data.status_ortu;
  const isFatherDeceased = status === 'yatim' || status === 'yatim piatu';
  const isMotherDeceased = status === 'piatu' || status === 'yatim piatu';

  // Father validation
  let fatherValid = true;
  if (isFatherDeceased) {
    // For deceased father, require: name, death date, death cause
    fatherValid = !!(
      data.nama_ayah &&
      data.tanggal_kematian_ayah &&
      data.penyebab_kematian_ayah
    );
  } else {
    // For living father, require: name, NIK, and optional fields for dhuafa status
    const basicFatherFields = !!(
      data.nama_ayah &&
      data.nik_ayah &&
      data.nik_ayah.length === 16
    );
    
    // For dhuafa families, also require additional fields including birth date
    if (status === 'dhuafa') {
      fatherValid = basicFatherFields && !!(
        data.agama_ayah &&
        data.tempat_lahir_ayah &&
        data.tanggal_lahir_ayah &&
        data.alamat_ayah &&
        data.penghasilan_ayah
      );
    } else {
      fatherValid = basicFatherFields;
    }
  }

  // Mother validation
  let motherValid = true;
  if (isMotherDeceased) {
    // For deceased mother, require: name, death date, death cause
    motherValid = !!(
      data.nama_ibu &&
      data.tanggal_kematian_ibu &&
      data.penyebab_kematian_ibu
    );
  } else {
    // For living mother, require: name, NIK, and optional fields for dhuafa status
    const basicMotherFields = !!(
      data.nama_ibu &&
      data.nik_ibu &&
      data.nik_ibu.length === 16
    );
    
    // For dhuafa families, also require additional fields including birth date
    if (status === 'dhuafa') {
      motherValid = basicMotherFields && !!(
        data.agama_ibu &&
        data.tempat_lahir_ibu &&
        data.tanggal_lahir_ibu &&
        data.alamat_ibu &&
        data.penghasilan_ibu
      );
    } else {
      motherValid = basicMotherFields;
    }
  }

  return fatherValid && motherValid;
};

const validateGuardianStep = (data) => {
  if (data.status_ortu === 'yatim piatu') {
    return !!(
      data.nama_wali &&
      data.nik_wali &&
      data.nik_wali.length === 16 &&
      data.agama_wali &&
      data.tempat_lahir_wali &&
      data.tanggal_lahir_wali &&
      data.alamat_wali &&
      data.penghasilan_wali &&
      data.hub_kerabat_wali
    );
  }
  return true;
};

const validateChildStep = (data) => {
  return !!(
    data.nik_anak &&
    data.nik_anak.length === 16 &&
    data.anak_ke &&
    data.dari_bersaudara &&
    data.nick_name &&
    data.full_name &&
    data.agama &&
    data.tempat_lahir &&
    data.tanggal_lahir &&
    data.jenis_kelamin &&
    data.tinggal_bersama &&
    data.hafalan &&
    data.pelajaran_favorit &&
    data.hobi &&
    data.prestasi &&
    data.jarak_rumah &&
    data.transportasi
  );
};

const validateEducationStep = (data) => {
  if (!data.jenjang) return false;

  switch (data.jenjang) {
    case 'belum_sd':
      return true;
    case 'sd':
    case 'smp':
      return !!(data.kelas && data.nama_sekolah && data.alamat_sekolah);
    case 'sma':
      return !!(data.kelas && data.nama_sekolah && data.alamat_sekolah && data.jurusan);
    case 'perguruan_tinggi':
      return !!(data.semester && data.jurusan && data.nama_pt && data.alamat_pt);
    default:
      return true;
  }
};

const validateSurveyBasicStep = (data) => {
  const basicRequired = !!(
    data.pekerjaan_kepala_keluarga &&
    data.pendidikan_kepala_keluarga &&
    data.jumlah_tanggungan &&
    data.kondisi_fisik_anak &&
    data.kepribadian_anak
  );

  if (data.kondisi_fisik_anak === 'Disabilitas') {
    return basicRequired && !!data.keterangan_disabilitas;
  }

  return basicRequired;
};

const validateSurveyFinancialStep = (data) => {
  const financialRequired = !!(
    data.penghasilan &&
    data.kepemilikan_tabungan &&
    data.biaya_pendidikan_perbulan &&
    data.bantuan_lembaga_formal_lain
  );

  if (data.bantuan_lembaga_formal_lain === 'Ya') {
    return financialRequired && !!data.bantuan_lembaga_formal_lain_sebesar;
  }

  return financialRequired;
};

const validateSurveyAssetsStep = (data) => {
  return !!(
    data.kepemilikan_tanah &&
    data.kepemilikan_rumah &&
    data.kondisi_rumah_dinding &&
    data.kondisi_rumah_lantai &&
    data.kepemilikan_kendaraan &&
    data.kepemilikan_elektronik
  );
};

const validateSurveyHealthStep = (data) => {
  return !!(
    data.jumlah_makan &&
    data.sumber_air_bersih &&
    data.jamban_limbah &&
    data.tempat_sampah &&
    data.perokok &&
    data.konsumen_miras &&
    data.persediaan_p3k &&
    data.makan_buah_sayur
  );
};

const validateSurveyReligiousStep = (data) => {
  const religiousRequired = !!(
    data.solat_lima_waktu &&
    data.membaca_alquran &&
    data.majelis_taklim &&
    data.membaca_koran &&
    data.pengurus_organisasi &&
    data.kondisi_penerima_manfaat
  );

  if (data.pengurus_organisasi === 'Ya') {
    return religiousRequired && !!data.pengurus_organisasi_sebagai;
  }

  return religiousRequired;
};

// Field validation helpers
export const validateNIK = (nik) => {
  if (!nik) return 'NIK wajib diisi';
  if (nik.length !== 16) return 'NIK harus 16 digit';
  return null;
};

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} wajib diisi`;
  }
  return null;
};

export const validateDate = (date, fieldName) => {
  if (!date) return `${fieldName} wajib dipilih`;
  return null;
};

// Initial form data
export const getInitialFormData = () => ({
  no_kk: '',
  kepala_keluarga: '',
  status_ortu: '',
  id_bank: '',
  no_rek: '',
  an_rek: '',
  no_tlp: '',
  an_tlp: '',
  
  nik_ayah: '',
  nama_ayah: '',
  agama_ayah: '',
  tempat_lahir_ayah: '',
  tanggal_lahir_ayah: '',
  alamat_ayah: '',
  id_prov_ayah: '1',
  id_kab_ayah: '1',
  id_kec_ayah: '1',
  id_kel_ayah: '1',
  penghasilan_ayah: '',
  tanggal_kematian_ayah: '',
  penyebab_kematian_ayah: '',
  
  nik_ibu: '',
  nama_ibu: '',
  agama_ibu: '',
  tempat_lahir_ibu: '',
  tanggal_lahir_ibu: '',
  alamat_ibu: '',
  id_prov_ibu: '1',
  id_kab_ibu: '1',
  id_kec_ibu: '1',
  id_kel_ibu: '1',
  penghasilan_ibu: '',
  tanggal_kematian_ibu: '',
  penyebab_kematian_ibu: '',
  
  nik_wali: '',
  nama_wali: '',
  agama_wali: '',
  tempat_lahir_wali: '',
  tanggal_lahir_wali: '',
  alamat_wali: '',
  id_prov_wali: '',
  id_kab_wali: '',
  id_kec_wali: '',
  id_kel_wali: '',
  penghasilan_wali: '',
  hub_kerabat_wali: '',
  
  nik_anak: '',
  anak_ke: '',
  dari_bersaudara: '',
  nick_name: '',
  full_name: '',
  agama: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  jenis_kelamin: '',
  tinggal_bersama: '',
  hafalan: '',
  pelajaran_favorit: '',
  hobi: '',
  prestasi: '',
  jarak_rumah: '',
  transportasi: '',
  foto: null,
  
  jenjang: '',
  kelas: '',
  nama_sekolah: '',
  alamat_sekolah: '',
  jurusan: '',
  semester: '',
  nama_pt: '',
  alamat_pt: '',

  pekerjaan_kepala_keluarga: '',
  penghasilan: '',
  pendidikan_kepala_keluarga: '',
  jumlah_tanggungan: '',
  kepemilikan_tabungan: '',
  jumlah_makan: '',
  kepemilikan_tanah: '',
  kepemilikan_rumah: '',
  kondisi_rumah_dinding: '',
  kondisi_rumah_lantai: '',
  kepemilikan_kendaraan: '',
  kepemilikan_elektronik: '',
  sumber_air_bersih: '',
  jamban_limbah: '',
  tempat_sampah: '',
  perokok: '',
  konsumen_miras: '',
  persediaan_p3k: '',
  makan_buah_sayur: '',
  solat_lima_waktu: '',
  membaca_alquran: '',
  majelis_taklim: '',
  membaca_koran: '',
  pengurus_organisasi: '',
  pengurus_organisasi_sebagai: '',
  status_anak: '',
  kepribadian_anak: '',
  kondisi_fisik_anak: '',
  keterangan_disabilitas: '',
  biaya_pendidikan_perbulan: '',
  bantuan_lembaga_formal_lain: '',
  bantuan_lembaga_formal_lain_sebesar: '',
  kondisi_penerima_manfaat: '',
});