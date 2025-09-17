import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/redux/authSlice';
import tutorReducer from '../features/adminShelter/redux/tutorSlice';
import tutorCompetencyReducer from '../features/adminShelter/redux/tutorCompetencySlice';
import tutorHonorReducer from '../features/adminShelter/redux/tutorHonorSlice';
import tutorHonorSettingsReducer from '../features/adminPusat/redux/tutorHonorSettingsSlice';
import templateHierarchyReducer from '../features/adminPusat/redux/templateHierarchySlice';
import templateReducer from '../features/adminPusat/redux/templateSlice';
import distributionReducer from '../features/adminPusat/redux/distributionSlice';
import monitoringReducer from '../features/adminPusat/redux/monitoringSlice';
import qrTokenReducer from '../features/adminShelter/redux/qrTokenSlice';
import attendanceReducer from '../features/adminShelter/redux/attendanceSlice';
import aktivitasReducer from '../features/adminShelter/redux/aktivitasSlice';
import penilaianReducer from '../features/adminShelter/redux/penilaianSlice';
import semesterReducer from '../features/adminShelter/redux/semesterSlice';
import kurikulumShelterReducer from '../features/adminShelter/redux/kurikulumShelterSlice';
import tutorAttendaceReducer from '../features/adminShelter/redux/tutorAttendanceSlice';
import laporanReducer from '../features/adminShelter/redux/laporanSlice';
import tutorLaporanReducer from '../features/adminShelter/redux/tutorLaporanSlice';
import cpbLaporanReducer from '../features/adminShelter/redux/cpbLaporanSlice';
import raportLaporanReducer from '../features/adminShelter/redux/raportLaporanSlice';
import laporanSuratReducer from '../features/adminShelter/redux/laporanSuratSlice';
import laporanAktivitasReducer from '../features/adminShelter/redux/laporanAktivitasSlice';
import historiLaporanReducer from '../features/adminShelter/redux/historiLaporanSlice';

// Admin Cabang reducers
import kurikulumReducer from '../features/adminCabang/redux/kurikulumSlice';
import materiReducer from '../features/adminCabang/redux/materiSlice';
import semesterCabangReducer from '../features/adminCabang/redux/semesterCabangSlice';
import templateAdoptionReducer from '../features/adminCabang/redux/templateAdoptionSlice';
import kurikulumHierarchyReducer from '../features/adminCabang/redux/kurikulumHierarchySlice';
import { kurikulumApi } from '../features/adminCabang/api/kurikulumApi';

// Admin Shelter Kurikulum Consumer (NEW - Phase 3)
import kurikulumConsumerReducer from '../features/adminShelter/redux/kurikulumConsumerSlice';


const appReducer = combineReducers({
  auth: authReducer,
  tutor: tutorReducer,
  tutorCompetency: tutorCompetencyReducer,
  tutorHonor: tutorHonorReducer,
  tutorHonorSettings: tutorHonorSettingsReducer,
  templateHierarchy: templateHierarchyReducer,
  template: templateReducer,
  distribution: distributionReducer,
  monitoring: monitoringReducer,
  qrToken: qrTokenReducer,
  attendance: attendanceReducer,
  aktivitas: aktivitasReducer,
  penilaian: penilaianReducer,
  semester: semesterReducer,
  kurikulumShelter: kurikulumShelterReducer,
  tutorAttendance: tutorAttendaceReducer,
  laporan: laporanReducer,
  tutorLaporan: tutorLaporanReducer,
  cpbLaporan: cpbLaporanReducer,
  raportLaporan: raportLaporanReducer,
  laporanSurat: laporanSuratReducer,
  laporanAktivitas: laporanAktivitasReducer,
  historiLaporan: historiLaporanReducer,
  
  // Admin Cabang reducers
  kurikulum: kurikulumReducer,
  materi: materiReducer,
  semesterCabang: semesterCabangReducer,
  templateAdoption: templateAdoptionReducer,
  kurikulumHierarchy: kurikulumHierarchyReducer,
  
  // Admin Shelter Kurikulum Consumer (NEW - Phase 3)
  kurikulumConsumer: kurikulumConsumerReducer,
  
  // RTK Query API reducers
  [kurikulumApi.reducerPath]: kurikulumApi.reducer,
});

const rootReducer = (state, action) => {
  if (action.type === 'auth/logout/fulfilled') {
    return appReducer(undefined, action);
  }
  
  return appReducer(state, action);
};

export default rootReducer;