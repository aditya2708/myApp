import React from 'react';
import { Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import Screens
import AdminPusatDashboardScreen from '../features/adminPusat/screens/AdminPusatDashboardScreen';
import AdminPusatProfileScreen from '../features/adminPusat/screens/AdminPusatProfileScreen';
import TutorHonorSettingsScreen from '../features/adminPusat/screens/TutorHonorSettingsScreen';
import DataWilayahScreen from '../features/adminPusat/screens/DataWilayahScreen';
import KacabListScreen from '../features/adminPusat/screens/kacab/KacabListScreen';
import KacabDetailScreen from '../features/adminPusat/screens/kacab/KacabDetailScreen';
import KacabFormScreen from '../features/adminPusat/screens/kacab/KacabFormScreen';
import WilbinListScreen from '../features/adminPusat/screens/wilbin/WilbinListScreen';
import WilbinDetailScreen from '../features/adminPusat/screens/wilbin/WilbinDetailScreen';
import WilbinFormScreen from '../features/adminPusat/screens/wilbin/WilbinFormScreen';
import ShelterListScreen from '../features/adminPusat/screens/shelter/ShelterListScreen';
import ShelterDetailScreen from '../features/adminPusat/screens/shelter/ShelterDetailScreen';
import ShelterFormScreen from '../features/adminPusat/screens/shelter/ShelterFormScreen';

// User Management Screens
import AdminPusatUserManagementScreen from '../features/adminPusat/screens/user/AdminPusatUserManagementScreen';
import AdminPusatUserFormScreen from '../features/adminPusat/screens/user/AdminPusatUserFormScreen';
import AdminPusatUserDetailScreen from '../features/adminPusat/screens/user/AdminPusatUserDetailScreen'; // NEW

// Template Screens
import TemplateHomeScreen from '../features/adminPusat/screens/template/TemplateHomeScreen';
import JenjangSelectionScreen from '../features/adminPusat/screens/template/JenjangSelectionScreen';
import KelasSelectionScreen from '../features/adminPusat/screens/template/KelasSelectionScreen';
import MataPelajaranListScreen from '../features/adminPusat/screens/template/MataPelajaranListScreen';
import TemplateMateriManagementScreen from '../features/adminPusat/screens/template/TemplateMateriManagementScreen';
import TemplateMateriFormScreen from '../features/adminPusat/screens/template/TemplateMateriFormScreen';

// Distribution Screens
import DistributionScreen from '../features/adminPusat/screens/distribution/DistributionScreen';
import DistributionHistoryScreen from '../features/adminPusat/screens/distribution/DistributionHistoryScreen';

// Monitoring Screens
import MonitoringScreen from '../features/adminPusat/screens/monitoring/MonitoringScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack Navigator
const HomeStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Dashboard"
        component={AdminPusatDashboardScreen}
        options={{ headerTitle: 'Admin Pusat Dashboard' }}
      />
      <Stack.Screen
        name="DataWilayah"
        component={DataWilayahScreen}
        options={{ headerTitle: 'Data Wilayah' }}
      />
      <Stack.Screen
        name="KacabList"
        component={KacabListScreen}
        options={{ headerTitle: 'Kantor Cabang' }}
      />
      <Stack.Screen
        name="KacabDetail"
        component={KacabDetailScreen}
        options={{ headerTitle: 'Detail Kantor Cabang' }}
      />
      <Stack.Screen
        name="KacabForm"
        component={KacabFormScreen}
        options={({ route }) => ({
          headerTitle: route?.params?.mode === 'edit' ? 'Edit Kantor Cabang' : 'Tambah Kantor Cabang',
        })}
      />
      <Stack.Screen
        name="WilbinList"
        component={WilbinListScreen}
        options={{ headerTitle: 'Wilayah Binaan' }}
      />
      <Stack.Screen
        name="WilbinDetail"
        component={WilbinDetailScreen}
        options={{ headerTitle: 'Detail Wilayah Binaan' }}
      />
      <Stack.Screen
        name="WilbinForm"
        component={WilbinFormScreen}
        options={({ route }) => ({
          headerTitle: route?.params?.mode === 'edit' ? 'Edit Wilayah Binaan' : 'Tambah Wilayah Binaan',
        })}
      />
      <Stack.Screen
        name="ShelterList"
        component={ShelterListScreen}
        options={{ headerTitle: 'Shelter' }}
      />
      <Stack.Screen
        name="ShelterDetail"
        component={ShelterDetailScreen}
        options={{ headerTitle: 'Detail Shelter' }}
      />
      <Stack.Screen
        name="ShelterForm"
        component={ShelterFormScreen}
        options={({ route }) => ({
          headerTitle: route?.params?.mode === 'edit' ? 'Edit Shelter' : 'Tambah Shelter',
        })}
      />
      <Stack.Screen
        name="TutorHonorSettings"
        component={TutorHonorSettingsScreen}
        options={{ headerTitle: 'Setting Honor Tutor' }}
      />

      {/* User Management */}
      <Stack.Screen
        name="UserManagement"
        component={AdminPusatUserManagementScreen}
        options={{ headerTitle: 'Manajemen User' }}
      />
      <Stack.Screen
        name="UserForm"
        component={AdminPusatUserFormScreen}
        options={{ headerTitle: 'Form User' }}
      />
      <Stack.Screen
        name="UserDetail"
        component={AdminPusatUserDetailScreen}
        options={({ route }) => ({
          headerTitle: route?.params?.title ?? 'Detail User',
        })}
      />
    </Stack.Navigator>
  );
};

// Template Stack Navigator
const TemplateStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="TemplateHome" 
        component={TemplateHomeScreen} 
        options={{ headerTitle: 'Template Kurikulum' }}
      />
      <Stack.Screen 
        name="JenjangSelection" 
        component={JenjangSelectionScreen} 
        options={{ headerTitle: 'Pilih Jenjang' }}
      />
      <Stack.Screen 
        name="KelasSelection" 
        component={KelasSelectionScreen} 
        options={{ headerTitle: 'Pilih Kelas' }}
      />
      <Stack.Screen 
        name="MataPelajaranList" 
        component={MataPelajaranListScreen} 
        options={{ headerTitle: 'Mata Pelajaran' }}
      />
      <Stack.Screen 
        name="TemplateMateriManagement" 
        component={TemplateMateriManagementScreen} 
        options={{ headerTitle: 'Template Materi' }}
      />
      <Stack.Screen 
        name="TemplateMateriForm" 
        component={TemplateMateriFormScreen} 
        options={({ route }) => ({ 
          headerTitle: route.params?.mode === 'edit' ? 'Edit Template' : 
                      route.params?.mode === 'duplicate' ? 'Duplikasi Template' : 
                      'Buat Template Baru'
        })}
      />
      <Stack.Screen 
        name="Distribution" 
        component={DistributionScreen} 
        options={{ headerTitle: 'Distribusi Template' }}
      />
      <Stack.Screen 
        name="DistributionHistory" 
        component={DistributionHistoryScreen} 
        options={{ headerTitle: 'Riwayat Distribusi' }}
      />
      <Stack.Screen 
        name="MonitoringDashboard" 
        component={MonitoringScreen} 
        options={{ headerTitle: 'Monitoring & Analytics' }}
      />
    </Stack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Profile" 
        component={AdminPusatProfileScreen} 
        options={{ headerTitle: 'Profile Saya' }}
      />
    </Stack.Navigator>
  );
};

// Main Tab Navigator for Admin Pusat
const AdminPusatNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Template') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#e74c3c',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator} 
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Template"
        component={TemplateStackNavigator}
        options={{ tabBarLabel: 'Template' }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            Alert.alert(
              'Maintenance',
              'Fitur ini sedang dalam perbaikan / maintenance.'
            );
          },
        })}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStackNavigator} 
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default AdminPusatNavigator;
