import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Dashboard screens
import AdminCabangDashboardScreen from '../features/adminCabang/screens/AdminCabangDashboardScreen';
import AdminCabangProfileScreen from '../features/adminCabang/screens/AdminCabangProfileScreen';
import SurveyStatusFilterScreen from '../features/adminCabang/screens/SurveyStatusFilterScreen';
import SurveyApprovalDetailScreen from '../features/adminCabang/screens/SurveyApprovalDetailScreen';
import AdminCabangPengajuanDonaturScreen from '../features/adminCabang/screens/AdminCabangPengajuanDonaturScreen';
import DonaturSelectionScreen from '../features/adminCabang/screens/DonaturSelectionScreen';
import ChildDetailScreen from '../features/adminCabang/screens/ChildDetailScreen';
import AdminCabangDonaturListScreen from '../features/adminCabang/screens/AdminCabangDonaturListScreen';
import AdminCabangDonaturFormScreen from '../features/adminCabang/screens/AdminCabangDonaturFormScreen';
import AdminCabangDonaturDetailScreen from '../features/adminCabang/screens/AdminCabangDonaturDetailScreen';
import DonaturFilterScreen from '../features/adminCabang/screens/DonaturFilterScreen';
import GpsApprovalScreen from '../features/adminCabang/screens/GpsApprovalScreen';
import GpsApprovalDetailScreen from '../features/adminCabang/screens/GpsApprovalDetailScreen';
import AdminCabangUserManagementScreen from '../features/adminCabang/screens/user/UserManagementScreen';
import AdminCabangUserFormScreen from '../features/adminCabang/screens/user/UserFormScreen';
import AdminCabangUserDetailScreen from '../features/adminCabang/screens/user/UserDetailScreen';
import AdminCabangReportHomeScreen from '../features/adminCabang/screens/reports/AdminCabangReportHomeScreen';
import AdminCabangChildReportScreen from '../features/adminCabang/screens/reports/AdminCabangChildReportScreen';
import AdminCabangChildDetailScreen from '../features/adminCabang/screens/reports/AdminCabangChildDetailScreen';
import AdminCabangTutorReportScreen from '../features/adminCabang/screens/reports/AdminCabangTutorReportScreen';
import AdminCabangAttendanceReportScreen from '../features/adminCabang/screens/reports/attendance/AdminCabangAttendanceReportScreen';
import AdminCabangAttendanceWeeklyScreen from '../features/adminCabang/screens/reports/attendance/AdminCabangAttendanceWeeklyScreen';
import AdminCabangAttendanceShelterScreen from '../features/adminCabang/screens/reports/attendance/AdminCabangAttendanceShelterScreen';
import AdminCabangAttendanceGroupScreen from '../features/adminCabang/screens/reports/attendance/AdminCabangAttendanceGroupScreen';
import ChartFullScreenScreen from '../features/adminCabang/components/reports/ChartFullScreenScreen';

// Kurikulum screens
import KurikulumHomeScreen from '../features/adminCabang/screens/kurikulum/KurikulumHomeScreen';
import JenjangSelectionScreen from '../features/adminCabang/screens/kurikulum/JenjangSelectionScreen';
import KelasSelectionScreen from '../features/adminCabang/screens/kurikulum/KelasSelectionScreen';
import MataPelajaranListScreen from '../features/adminCabang/screens/kurikulum/MataPelajaranListScreen';
import MateriManagementScreen from '../features/adminCabang/screens/kurikulum/MateriManagementScreen';
import MateriFormScreen from '../features/adminCabang/screens/kurikulum/MateriFormScreen';
import SelectKurikulumScreen from '../features/adminCabang/screens/kurikulum/SelectKurikulumScreen';
import CreateKurikulumScreen from '../features/adminCabang/screens/kurikulum/CreateKurikulumScreen';
import SemesterManagementScreen from '../features/adminCabang/screens/kurikulum/SemesterManagementScreen';
import SemesterFormScreen from '../features/adminCabang/screens/kurikulum/SemesterFormScreen';
import TemplateAdoptionScreen from '../features/adminCabang/screens/kurikulum/TemplateAdoptionScreen';
import MasterDataScreen from '../features/adminCabang/screens/kurikulum/MasterDataScreen';


const Tab = createBottomTabNavigator();
const DashboardStack = createStackNavigator();
const KurikulumStack = createStackNavigator();
const ReportsStack = createStackNavigator();
const ProfileStack = createStackNavigator();

// Dashboard Stack Navigator
const DashboardStackNavigator = () => (
  <DashboardStack.Navigator>
    <DashboardStack.Screen
      name="DashboardHome"
      component={AdminCabangDashboardScreen}
      options={{ headerTitle: 'Dashboard' }}
    />
    <DashboardStack.Screen
      name="SurveyStatusFilter"
      component={SurveyStatusFilterScreen}
      options={{ headerTitle: 'Status Survey' }}
    />
    <DashboardStack.Screen
      name="SurveyApprovalDetail"
      component={SurveyApprovalDetailScreen}
      options={{ headerTitle: 'Detail Persetujuan Survey' }}
    />
    <DashboardStack.Screen
      name="PengajuanDonatur"
      component={AdminCabangPengajuanDonaturScreen}
      options={{ headerTitle: 'Pengajuan Donatur' }}
    />
    <DashboardStack.Screen
      name="DonaturSelection"
      component={DonaturSelectionScreen}
      options={{ headerTitle: 'Pilih Donatur' }}
    />
    <DashboardStack.Screen
      name="ChildDetail"
      component={ChildDetailScreen}
      options={{ headerTitle: 'Detail Anak' }}
    />
    <DashboardStack.Screen
      name="DonaturList"
      component={AdminCabangDonaturListScreen}
      options={{ headerTitle: 'Daftar Donatur' }}
    />
    <DashboardStack.Screen
      name="DonaturForm"
      component={AdminCabangDonaturFormScreen}
      options={{ headerTitle: 'Form Donatur' }}
    />
    <DashboardStack.Screen
      name="DonaturDetail"
      component={AdminCabangDonaturDetailScreen}
      options={{ headerTitle: 'Detail Donatur' }}
    />
    <DashboardStack.Screen
      name="DonaturFilter"
      component={DonaturFilterScreen}
      options={{ headerTitle: 'Filter Donatur' }}
    />
    <DashboardStack.Screen
      name="GpsApprovalScreen"
      component={GpsApprovalScreen}
      options={{ headerTitle: 'Persetujuan GPS' }}
    />
    <DashboardStack.Screen
      name="GpsApprovalDetailScreen"
      component={GpsApprovalDetailScreen}
      options={{ headerTitle: 'Detail Persetujuan GPS' }}
    />
    <DashboardStack.Screen
      name="AdminCabangUserManagement"
      component={AdminCabangUserManagementScreen}
      options={{ headerTitle: 'Manajemen User Cabang' }}
    />
    <DashboardStack.Screen
      name="AdminCabangUserForm"
      component={AdminCabangUserFormScreen}
      options={{ headerTitle: 'Form User Cabang' }}
    />
    <DashboardStack.Screen
      name="AdminCabangUserDetail"
      component={AdminCabangUserDetailScreen}
      options={{ headerTitle: 'Detail User Cabang' }}
    />
  </DashboardStack.Navigator>
);

// Kurikulum Stack Navigator
const KurikulumStackNavigator = () => (
  <KurikulumStack.Navigator>
    <KurikulumStack.Screen
      name="KurikulumHome"
      component={KurikulumHomeScreen}
      options={{ headerTitle: 'Kurikulum' }}
    />
    <KurikulumStack.Screen
      name="SelectKurikulum"
      component={SelectKurikulumScreen}
      options={{ headerTitle: 'Pilih Kurikulum' }}
    />
    <KurikulumStack.Screen
      name="CreateKurikulum"
      component={CreateKurikulumScreen}
      options={{ headerTitle: 'Buat Kurikulum' }}
    />
    <KurikulumStack.Screen
      name="JenjangSelection"
      component={JenjangSelectionScreen}
      options={{ headerTitle: 'Pilih Jenjang' }}
    />
    <KurikulumStack.Screen
      name="KelasSelection"
      component={KelasSelectionScreen}
      options={{ headerTitle: 'Pilih Kelas' }}
    />
    <KurikulumStack.Screen
      name="MataPelajaranList"
      component={MataPelajaranListScreen}
      options={{ headerTitle: 'Mata Pelajaran' }}
    />
    <KurikulumStack.Screen
      name="MateriManagement"
      component={MateriManagementScreen}
      options={{ headerTitle: 'Kelola Materi' }}
    />
    <KurikulumStack.Screen
      name="MateriForm"
      component={MateriFormScreen}
      options={({ route }) => ({
        headerTitle: route.params?.isEdit ? 'Edit Materi' : 'Tambah Materi'
      })}
    />
    <KurikulumStack.Screen
      name="SemesterManagement"
      component={SemesterManagementScreen}
      options={{ headerTitle: 'Kelola Semester' }}
    />
    <KurikulumStack.Screen
      name="SemesterForm"
      component={SemesterFormScreen}
      options={({ route }) => ({
        headerTitle: route.params?.mode === 'edit' ? 'Edit Semester' : 'Tambah Semester'
      })}
    />
    <KurikulumStack.Screen
      name="TemplateAdoption"
      component={TemplateAdoptionScreen}
      options={{ headerTitle: 'Adopsi Template' }}
    />
    <KurikulumStack.Screen
      name="MasterData"
      component={MasterDataScreen}
      options={{ headerTitle: 'Master Data' }}
    />
  </KurikulumStack.Navigator>
);

// Reports Stack Navigator
const ReportsStackNavigator = () => (
  <ReportsStack.Navigator>
    <ReportsStack.Screen
      name="AdminCabangReportHome"
      component={AdminCabangReportHomeScreen}
      options={{ headerTitle: 'Laporan' }}
    />
    <ReportsStack.Screen
      name="AdminCabangChildReport"
      component={AdminCabangChildReportScreen}
      options={{ headerTitle: 'Laporan Anak Binaan' }}
    />
    <ReportsStack.Screen
      name="AdminCabangAttendanceReport"
      component={AdminCabangAttendanceReportScreen}
      options={{ headerTitle: 'Laporan Kehadiran' }}
    />
    <ReportsStack.Screen
      name="AdminCabangAttendanceWeekly"
      component={AdminCabangAttendanceWeeklyScreen}
      options={{ headerTitle: 'Rekap Kehadiran Mingguan' }}
    />
    <ReportsStack.Screen
      name="AdminCabangAttendanceShelterDetail"
      component={AdminCabangAttendanceShelterScreen}
      options={{ headerTitle: 'Detail Kehadiran Shelter' }}
    />
    <ReportsStack.Screen
      name="AdminCabangAttendanceGroup"
      component={AdminCabangAttendanceGroupScreen}
      options={{ headerTitle: 'Detail Kehadiran Kelompok' }}
    />
    <ReportsStack.Screen
      name="AdminCabangChildDetail"
      component={AdminCabangChildDetailScreen}
      options={{ headerTitle: 'Detail Anak' }}
    />
    <ReportsStack.Screen
      name="AdminCabangTutorReport"
      component={AdminCabangTutorReportScreen}
      options={{ headerTitle: 'Laporan Tutor' }}
    />
    <ReportsStack.Screen
      name="ChartFullScreen"
      component={ChartFullScreenScreen}
      options={{ headerShown: false }}
    />
  </ReportsStack.Navigator>
);

// Profile Stack Navigator
const ProfileStackNavigator = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen
      name="ProfileHome"
      component={AdminCabangProfileScreen}
      options={{ headerTitle: 'Profil' }}
    />
  </ProfileStack.Navigator>
);

const AdminCabangNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Home') iconName = focused ? 'grid' : 'grid-outline';
        else if (route.name === 'Kurikulum') iconName = focused ? 'library' : 'library-outline';
        else if (route.name === 'Reports') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
        else if (route.name === 'Profile') iconName = focused ? 'person-circle' : 'person-circle-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007bff',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen
      name="Home"
      component={DashboardStackNavigator}
      options={{ tabBarLabel: 'Dashboard' }}
    />
    <Tab.Screen
      name="Kurikulum"
      component={KurikulumStackNavigator}
      options={{ tabBarLabel: 'Kurikulum' }}
    />
    <Tab.Screen
      name="Reports"
      component={ReportsStackNavigator}
      options={{ tabBarLabel: 'Laporan' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileStackNavigator}
      options={{ tabBarLabel: 'Profil' }}
    />
  </Tab.Navigator>
);

export default AdminCabangNavigator;