import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

// Core screens
import AdminShelterDashboardScreen from '../features/adminShelter/screens/AdminShelterDashboardScreen';
import AdminShelterProfileScreen from '../features/adminShelter/screens/AdminShelterProfileScreen';
import AdminShelterSettingsScreen from '../features/adminShelter/screens/AdminShelterSettingsScreen';
import ShelterGpsSettingScreen from '../features/adminShelter/screens/ShelterGpsSettingScreen';
import NotificationsScreen from '../features/adminShelter/screens/NotificationsScreen';
import { selectUnreadNotificationCount } from '../features/adminShelter/redux/notificationSlice';

// Primary feature screens  
import QrScannerScreen from '../features/adminShelter/screens/attendance/QrScannerScreen';
import ViewReportScreen from '../features/adminShelter/screens/attendance/ViewReportScreen';
import QrTokenGenerationScreen from '../features/adminShelter/screens/attendance/QrTokenGenerationScreen';
import RaportGenerateScreen from '../features/adminShelter/screens/RaportGenerateScreen';
import RaportViewScreen from '../features/adminShelter/screens/RaportViewScreen';
import KurikulumHomeScreen from '../features/adminShelter/screens/kelola/KurikulumHomeScreen';
import KurikulumBrowserScreen from '../features/adminShelter/screens/kelola/KurikulumBrowserScreen';
import ProgressTrackingScreen from '../features/adminShelter/screens/kelola/ProgressTrackingScreen';

// Anak Management screens
import AnakManagementScreen from '../features/adminShelter/screens/AnakManagementScreen';
import AnakDetailScreen from '../features/adminShelter/screens/AnakDetailScreen';
import AnakFormScreen from '../features/adminShelter/screens/AnakFormScreen';

// Attendance screens
import AttendanceDetailScreen from '../features/adminShelter/screens/attendance/AttendanceDetailScreen';
import ManualAttendanceScreen from '../features/adminShelter/screens/attendance/ManualAttendanceScreen';
import ActivitiesListScreen from '../features/adminShelter/screens/attendance/ActivitiesListScreen';
import ActivityFormScreen from '../features/adminShelter/screens/attendance/ActivityFormScreen';
import ActivityDetailScreen from '../features/adminShelter/screens/attendance/ActivityDetailScreen';
import ActivityReportScreen from '../features/adminShelter/screens/attendance/ActivityReportScreen';
import AttendanceManagementScreen from '../features/adminShelter/screens/attendance/AttendanceManagementScreen';

// AnakDetail module screens
import InformasiAnakScreen from '../features/adminShelter/screens/anakDetail/InformasiAnakScreen';
import PrestasiScreen from '../features/adminShelter/screens/anakDetail/PrestasiScreen';
import PrestasiDetailScreen from '../features/adminShelter/screens/anakDetail/PrestasiDetailScreen';
import PrestasiFormScreen from '../features/adminShelter/screens/anakDetail/PrestasiFormScreen';
import SuratScreen from '../features/adminShelter/screens/anakDetail/SuratScreen';
import SuratListScreen from '../features/adminShelter/screens/anakDetail/SuratListScreen';
import SuratDetailScreen from '../features/adminShelter/screens/anakDetail/SuratDetailScreen';
import SuratFormScreen from '../features/adminShelter/screens/anakDetail/SuratFormScreen';
import RiwayatScreen from '../features/adminShelter/screens/anakDetail/RiwayatScreen';
import RiwayatDetailScreen from '../features/adminShelter/screens/anakDetail/RiwayatDetailScreen';
import RiwayatFormScreen from '../features/adminShelter/screens/anakDetail/RiwayatFormScreen';
import RiwayatKehadiranScreen from '../features/adminShelter/screens/anakDetail/RiwayatKehadiranScreen';
import NilaiAnakScreen from '../features/adminShelter/screens/anakDetail/NilaiAnakScreen';
import RaporShelterScreen from '../features/adminShelter/screens/anakDetail/RaporShelterScreen';
import RaportFormalScreen from '../features/adminShelter/screens/anakDetail/RaportFormalScreen';
import RaportFormalDetailScreen from '../features/adminShelter/screens/anakDetail/RaportFormalDetailScreen';
import RaportFormalFormScreen from '../features/adminShelter/screens/anakDetail/RaportFormalFormScreen';

// Tutor module screens
import TutorManagementScreen from '../features/adminShelter/screens/TutorManagementScreen';
import TutorDetailScreen from '../features/adminShelter/screens/TutorDetailScreen';
import TutorFormScreen from '../features/adminShelter/screens/TutorFormScreen';
import TutorActivityHistoryScreen from '../features/adminShelter/screens/TutorActivityHistoryScreen';
import TutorCompetencyDetailScreen from '../features/adminShelter/screens/TutorCompetencyDetailScreen';
import TutorCompetencyFormScreen from '../features/adminShelter/screens/TutorCompetencyFormScreen';
import TutorCompetencyListScreen from '../features/adminShelter/screens/TutorCompetencyListScreen';
import TutorHonorScreen from '../features/adminShelter/screens/TutorHonorScreen';
import TutorHonorDetailScreen from '../features/adminShelter/screens/TutorHonorDetailScreen';
import TutorHonorHistoryScreen from '../features/adminShelter/screens/TutorHonorHistoryScreen';

// Kelompok & Activity module screens
import KelompokManagementScreen from '../features/adminShelter/screens/KelompokManagementScreen';
import KelompokDetailScreen from '../features/adminShelter/screens/KelompokDetailScreen';
import KelompokFormScreen from '../features/adminShelter/screens/KelompokFormScreen';
import AddChildrenToKelompokScreen from '../features/adminShelter/screens/AddChildrenToKelompokScreen';
import KelompokReportingScreen from '../features/adminShelter/screens/kelola/KelompokReportingScreen';
import PenilaianListScreen from '../features/adminShelter/screens/PenilaianListScreen';
import PenilaianFormScreen from '../features/adminShelter/screens/PenilaianFormScreen';
import SemesterManagementScreen from '../features/adminShelter/screens/SemesterManagementScreen';
import NilaiSikapScreen from '../features/adminShelter/screens/NilaiSikapScreen';
import NilaiSikapFormScreen from '../features/adminShelter/screens/NilaiSikapFormScreen';

// Management & Utility screens
import PengajuanAnakSearchScreen from '../features/adminShelter/screens/PengajuanAnakSearchScreen';
import PengajuanAnakFormScreen from '../features/adminShelter/screens/PengajuanAnakFormScreen';
import KeuanganDetailScreen from '../features/adminShelter/screens/KeuanganDetailScreen';
import KeuanganListScreen from '../features/adminShelter/screens/KeuanganListScreen';
import KeuanganFormScreen from '../features/adminShelter/screens/KeuanganFormScreen';
import KeluargaDetailScreen from '../features/adminShelter/screens/KeluargaDetailScreen';
import KeluargaFormScreen from '../features/adminShelter/screens/KeluargaFormScreen';
import KeluargaManagementScreen from '../features/adminShelter/screens/KeluargaManagementScreen';
import KurikulumAssignmentScreen from '../features/adminShelter/screens/kelola/KurikulumAssignmentScreen';
import KurikulumSelectionScreen from '../features/adminShelter/screens/KurikulumSelectionScreen';
import HonorCalculationScreen from '../features/adminShelter/screens/HonorCalculationScreen';
import LaporanKegiatanMainScreen from '../features/adminShelter/screens/reports/LaporanKegiatanMainScreen';
import TutorAttendanceReportScreen from '../features/adminShelter/screens/reports/TutorAttendanceReportScreen';



const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const ManagementStack = createStackNavigator();

const headerStyles = StyleSheet.create({
  headerButton: {
    marginRight: 12,
    padding: 4,
  },
  headerRightContainer: {
    marginRight: 12,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e53935',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});

const NotificationBell = ({ onPress, unreadCount }) => (
  <TouchableOpacity
    onPress={onPress}
    style={headerStyles.headerButton}
    accessibilityRole="button"
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  >
    <View>
      <Ionicons name="notifications-outline" size={24} color="#1f2933" />
      {unreadCount > 0 && (
        <View style={headerStyles.badgeContainer}>
          <Text style={headerStyles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

const HomeStackNavigator = () => {
  const unreadCount = useSelector(selectUnreadNotificationCount);

  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Dashboard"
        component={AdminShelterDashboardScreen}
        options={({ navigation }) => ({
          headerTitle: 'Dashboard Admin Shelter',
          headerRight: () => (
            <NotificationBell
              onPress={() => navigation.navigate('Notifications')}
              unreadCount={unreadCount}
            />
          ),
          headerRightContainerStyle: headerStyles.headerRightContainer,
        })}
      />
      <HomeStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerTitle: 'Notifikasi', headerBackTitleVisible: false }}
      />

    {/* Core feature screens */}
    <HomeStack.Screen name="QrScanner" component={QrScannerScreen} options={{ headerTitle: 'Scan QR Code' }} />
    <HomeStack.Screen name="ViewReportScreen" component={ViewReportScreen} options={{ headerTitle: 'View Report' }} />
    <HomeStack.Screen name="QrTokenGeneration" component={QrTokenGenerationScreen} options={{ headerTitle: 'Generate QR Token' }} />
    <HomeStack.Screen name="RaportGenerate" component={RaportGenerateScreen} options={{ headerTitle: 'Generate Raport' }} />
    <HomeStack.Screen name="RaportView" component={RaportViewScreen} options={{ headerTitle: 'View Raport' }} />
    <HomeStack.Screen name="KurikulumHome" component={KurikulumHomeScreen} options={{ headerTitle: 'Kelola Kurikulum' }} />
    <HomeStack.Screen name="KurikulumBrowser" component={KurikulumBrowserScreen} options={{ headerTitle: 'Browser Kurikulum' }} />
    <HomeStack.Screen name="ProgressTracking" component={ProgressTrackingScreen} options={{ headerTitle: 'Progress Tracking' }} />
    
    
    {/* Attendance screens */}
    <HomeStack.Screen name="AttendanceDetail" component={AttendanceDetailScreen} options={{ headerTitle: 'Detail Kehadiran' }} />
    <HomeStack.Screen name="ManualAttendance" component={ManualAttendanceScreen} options={{ headerTitle: 'Absen Manual' }} />
    <HomeStack.Screen name="ActivitiesList" component={ActivitiesListScreen} options={{ headerTitle: 'Daftar Aktivitas' }} />
    <HomeStack.Screen name="ActivityForm" component={ActivityFormScreen} options={{ headerTitle: 'Form Aktivitas' }} />
    <HomeStack.Screen name="ActivityDetail" component={ActivityDetailScreen} options={{ headerTitle: 'Detail Aktivitas' }} />
    <HomeStack.Screen name="ActivityReport" component={ActivityReportScreen} options={{ headerTitle: 'Laporan Aktivitas' }} />
    <HomeStack.Screen name="AttendanceManagement" component={AttendanceManagementScreen} options={{ headerTitle: 'Kelola Presensi' }} />
    
    
    {/* Kelompok & Activity module */}
    <HomeStack.Screen name="KelompokManagement" component={KelompokManagementScreen} options={{ headerTitle: 'Kelompok Management' }} />
    <HomeStack.Screen name="KelompokDetail" component={KelompokDetailScreen} options={{ headerTitle: 'Detail Kelompok' }} />
    <HomeStack.Screen name="KelompokForm" component={KelompokFormScreen} options={{ headerTitle: 'Form Kelompok' }} />
    <HomeStack.Screen name="AddChildrenToKelompok" component={AddChildrenToKelompokScreen} options={{ headerTitle: 'Tambah Anak ke Kelompok' }} />
    <HomeStack.Screen name="KelompokReporting" component={KelompokReportingScreen} options={{ headerTitle: 'Laporan Kelompok' }} />
    <HomeStack.Screen name="SemesterManagement" component={SemesterManagementScreen} options={{ headerTitle: 'Kelola Semester' }} />
    
    {/* Management & Utility screens */}
    <HomeStack.Screen name="PengajuanAnakSearch" component={PengajuanAnakSearchScreen} options={{ headerTitle: 'Cari Pengajuan Anak' }} />
    <HomeStack.Screen name="PengajuanAnakForm" component={PengajuanAnakFormScreen} options={{ headerTitle: 'Form Pengajuan Anak' }} />
    <HomeStack.Screen name="KurikulumAssignment" component={KurikulumAssignmentScreen} options={{ headerTitle: 'Assignment Kurikulum' }} />
    <HomeStack.Screen name="KurikulumSelection" component={KurikulumSelectionScreen} options={{ headerTitle: 'Pilih Kurikulum' }} />
    <HomeStack.Screen name="HonorCalculation" component={HonorCalculationScreen} options={{ headerTitle: 'Kalkulasi Honor' }} />
    
   
  </HomeStack.Navigator>
);
};

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen
      name="ProfileHome"
      component={AdminShelterProfileScreen}
      options={{ headerTitle: 'Profil Admin Shelter' }}
    />
    <ProfileStack.Screen
      name="ShelterGpsSetting"
      component={ShelterGpsSettingScreen}
      options={{ headerTitle: 'Setting GPS Shelter' }}
    />
    <ProfileStack.Screen
      name="AdminShelterSettings"
      component={AdminShelterSettingsScreen}
      options={{ headerTitle: 'Pengaturan' }}
    />
  </ProfileStack.Navigator>
);

const ManagementStackNavigator = () => (
  <ManagementStack.Navigator>
    <ManagementStack.Screen name="KeluargaManagement" component={KeluargaManagementScreen} options={{ headerTitle: 'Kelola Keluarga' }} />
    <ManagementStack.Screen name="AnakManagement" component={AnakManagementScreen} options={{ headerTitle: 'Kelola Anak Binaan' }} />
    <ManagementStack.Screen name="TutorManagement" component={TutorManagementScreen} options={{ headerTitle: 'Tutor Management' }} />
    <ManagementStack.Screen name="KeuanganList" component={KeuanganListScreen} options={{ headerTitle: 'Daftar Keuangan' }} />
    <ManagementStack.Screen name="LaporanKegiatanMain" component={LaporanKegiatanMainScreen} options={{ headerTitle: 'Laporan Kegiatan' }} />
    <ManagementStack.Screen
      name="TutorAttendanceReport"
      component={TutorAttendanceReportScreen}
      options={{ headerTitle: 'Laporan Kehadiran Tutor' }}
    />
    <ManagementStack.Screen name="RaportGenerate" component={RaportGenerateScreen} options={{ headerTitle: 'Generate Raport' }} />
    <ManagementStack.Screen name="RaportView" component={RaportViewScreen} options={{ headerTitle: 'View Raport' }} />

    {/* Keluarga related screens */}
    <ManagementStack.Screen name="KeluargaDetail" component={KeluargaDetailScreen} options={{ headerTitle: 'Detail Keluarga' }} />
    <ManagementStack.Screen name="KeluargaForm" component={KeluargaFormScreen} options={{ headerTitle: 'Form Keluarga' }} />
    
  {/* Anak Management related screens */}
  <ManagementStack.Screen name="AnakDetail" component={AnakDetailScreen} options={{ headerTitle: 'Detail Anak' }} />
  <ManagementStack.Screen name="AnakForm" component={AnakFormScreen} options={{ headerTitle: 'Form Anak' }} />
  <ManagementStack.Screen
    name="PengajuanAnakSearch"
    component={PengajuanAnakSearchScreen}
    options={{ headerTitle: 'Cari Pengajuan Anak' }}
  />
  <ManagementStack.Screen
    name="PengajuanAnakForm"
    component={PengajuanAnakFormScreen}
    options={{ headerTitle: 'Form Pengajuan Anak' }}
  />

  {/* AnakDetail module */}
  <ManagementStack.Screen name="InformasiAnak" component={InformasiAnakScreen} options={{ headerTitle: 'Informasi Anak' }} />
  <ManagementStack.Screen name="Prestasi" component={PrestasiScreen} options={{ headerTitle: 'Prestasi' }} />
  <ManagementStack.Screen name="PrestasiDetail" component={PrestasiDetailScreen} options={{ headerTitle: 'Detail Prestasi' }} />
  <ManagementStack.Screen name="PrestasiForm" component={PrestasiFormScreen} options={{ headerTitle: 'Form Prestasi' }} />
  <ManagementStack.Screen name="Surat" component={SuratScreen} options={{ headerTitle: 'Surat' }} />
  <ManagementStack.Screen name="SuratList" component={SuratListScreen} options={{ headerTitle: 'Daftar Surat' }} />
  <ManagementStack.Screen name="SuratDetail" component={SuratDetailScreen} options={{ headerTitle: 'Detail Surat' }} />
  <ManagementStack.Screen name="SuratForm" component={SuratFormScreen} options={{ headerTitle: 'Form Surat' }} />
  <ManagementStack.Screen name="Riwayat" component={RiwayatScreen} options={{ headerTitle: 'Riwayat' }} />
  <ManagementStack.Screen name="RiwayatDetail" component={RiwayatDetailScreen} options={{ headerTitle: 'Detail Riwayat' }} />
  <ManagementStack.Screen name="RiwayatForm" component={RiwayatFormScreen} options={{ headerTitle: 'Form Riwayat' }} />
  <ManagementStack.Screen
    name="RiwayatKehadiran"
    component={RiwayatKehadiranScreen}
    options={{ headerTitle: 'Riwayat Kehadiran' }}
  />
  <ManagementStack.Screen name="NilaiAnak" component={NilaiAnakScreen} options={{ headerTitle: 'Nilai Anak' }} />
  <ManagementStack.Screen name="NilaiSikap" component={NilaiSikapScreen} options={{ headerTitle: 'Nilai Sikap' }} />
  <ManagementStack.Screen name="NilaiSikapForm" component={NilaiSikapFormScreen} options={{ headerTitle: 'Form Nilai Sikap' }} />
  <ManagementStack.Screen name="RaporShelter" component={RaporShelterScreen} options={{ headerTitle: 'Rapor Shelter' }} />
  <ManagementStack.Screen name="RaportFormal" component={RaportFormalScreen} options={{ headerTitle: 'Raport Formal' }} />
  <ManagementStack.Screen name="RaportFormalDetail" component={RaportFormalDetailScreen} options={{ headerTitle: 'Detail Raport Formal' }} />
  <ManagementStack.Screen name="RaportFormalForm" component={RaportFormalFormScreen} options={{ headerTitle: 'Form Raport Formal' }} />
  <ManagementStack.Screen name="PenilaianList" component={PenilaianListScreen} options={{ headerTitle: 'Daftar Penilaian' }} />
  <ManagementStack.Screen name="PenilaianForm" component={PenilaianFormScreen} options={{ headerTitle: 'Form Penilaian' }} />

    {/* Tutor related screens */}
    <ManagementStack.Screen name="TutorDetail" component={TutorDetailScreen} options={{ headerTitle: 'Detail Tutor' }} />
    <ManagementStack.Screen name="TutorForm" component={TutorFormScreen} options={{ headerTitle: 'Form Tutor' }} />
    <ManagementStack.Screen name="TutorActivityHistory" component={TutorActivityHistoryScreen} options={{ headerTitle: 'Riwayat Aktivitas Tutor' }} />
    <ManagementStack.Screen name="TutorCompetencyDetail" component={TutorCompetencyDetailScreen} options={{ headerTitle: 'Detail Kompetensi Tutor' }} />
    <ManagementStack.Screen name="TutorCompetencyForm" component={TutorCompetencyFormScreen} options={{ headerTitle: 'Form Kompetensi Tutor' }} />
    <ManagementStack.Screen name="TutorCompetencyList" component={TutorCompetencyListScreen} options={{ headerTitle: 'Daftar Kompetensi Tutor' }} />
    <ManagementStack.Screen name="TutorHonor" component={TutorHonorScreen} options={{ headerTitle: 'Honor Tutor' }} />
    <ManagementStack.Screen name="TutorHonorDetail" component={TutorHonorDetailScreen} options={{ headerTitle: 'Detail Honor Tutor' }} />
    <ManagementStack.Screen name="TutorHonorHistory" component={TutorHonorHistoryScreen} options={{ headerTitle: 'Riwayat Honor Tutor' }} />
    
    {/* Keuangan related screens */}
    <ManagementStack.Screen name="KeuanganDetail" component={KeuanganDetailScreen} options={{ headerTitle: 'Detail Keuangan' }} />
    <ManagementStack.Screen name="KeuanganForm" component={KeuanganFormScreen} options={{ headerTitle: 'Form Keuangan' }} />
  </ManagementStack.Navigator>
);

const AdminShelterNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Home') {
          iconName = focused ? 'home' : 'home-outline';
        } else if (route.name === 'Management') {
          iconName = focused ? 'settings' : 'settings-outline';
        } else if (route.name === 'ProfileTab') {
          iconName = focused ? 'person' : 'person-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#e74c3c',
      tabBarInactiveTintColor: 'gray',
      headerShown: false
    })}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeStackNavigator}
      options={{ tabBarLabel: 'Home' }}
    />
    <Tab.Screen 
      name="Management" 
      component={ManagementStackNavigator}
      options={{ tabBarLabel: 'Management' }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStackNavigator}
      options={{ tabBarLabel: 'Profile' }}
    />
  </Tab.Navigator>
);

export default AdminShelterNavigator;
