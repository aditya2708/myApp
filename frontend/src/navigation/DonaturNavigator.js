import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import DonaturDashboardScreen from '../features/donatur/screen/DonaturDashboardScreen';
import DonaturProfileScreen from '../features/donatur/screen/DonaturProfileScreen';
import ChildListScreen from '../features/donatur/screen/ChildListScreen';
import ChildProfileScreen from '../features/donatur/screen/ChildProfileScreen';
import SuratListScreen from '../features/donatur/screen/SuratListScreen';
import SuratDetailScreen from '../features/donatur/screen/SuratDetailScreen';
import SuratFormScreen from '../features/donatur/screen/SuratFormScreen';
import ChildPrestasiListScreen from '../features/donatur/screen/ChildPrestasiListScreen';
import ChildPrestasiDetailScreen from '../features/donatur/screen/ChildPrestasiDetailScreen';
import ChildRaportListScreen from '../features/donatur/screen/ChildRaportListScreen';
import ChildRaportDetailScreen from '../features/donatur/screen/ChildRaportDetailScreen';
import ChildAktivitasListScreen from '../features/donatur/screen/ChildAktivitasListScreen';
import ChildAktivitasDetailScreen from '../features/donatur/screen/ChildAktivitasDetailScreen';
import BeritaListScreen from '../features/donatur/screen/BeritaListScreen';
import BeritaDetailScreen from '../features/donatur/screen/BeritaDetailScreen';
import AvailableChildrenMarketplaceScreen from '../features/donatur/screen/AvailableChildrenMarketplaceScreen';
import ChildMarketplaceDetailScreen from '../features/donatur/screen/ChildMarketplaceDetailScreen';
import SponsorshipConfirmationScreen from '../features/donatur/screen/SponsorshipConfirmationScreen';
import SponsorshipSuccessScreen from '../features/donatur/screen/SponsorshipSuccessScreen';
import ChildBillingScreen from '../features/donatur/screen/ChildBillingScreen';
import BillingHistoryScreen from '../features/donatur/screen/BillingHistoryScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const ChildrenStack = createStackNavigator();
const MarketplaceStack = createStackNavigator();
const BillingStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="Dashboard" 
        component={DonaturDashboardScreen} 
        options={{ headerTitle: 'Donatur Dashboard' }}
      />
      <HomeStack.Screen 
        name="BeritaList" 
        component={BeritaListScreen} 
        options={{ headerTitle: 'Berita' }}
      />
      <HomeStack.Screen 
        name="BeritaDetail" 
        component={BeritaDetailScreen} 
        options={{ headerTitle: 'Berita Detail' }}
      />
    </HomeStack.Navigator>
  );
};

const ChildrenStackNavigator = () => {
  return (
    <ChildrenStack.Navigator>
      <ChildrenStack.Screen 
        name="ChildList" 
        component={ChildListScreen} 
        options={{ headerTitle: 'Anak Asuh' }}
      />
      <ChildrenStack.Screen 
        name="ChildProfile" 
        component={ChildProfileScreen} 
        options={({ route }) => ({ 
          headerTitle: route.params?.childName || 'Child Profile' 
        })}
      />
      <ChildrenStack.Screen 
        name="SuratList" 
        component={SuratListScreen} 
        options={{ headerTitle: 'Messages' }}
      />
      <ChildrenStack.Screen 
        name="SuratDetail" 
        component={SuratDetailScreen} 
        options={{ headerTitle: 'Message Detail' }}
      />
      <ChildrenStack.Screen 
        name="SuratForm" 
        component={SuratFormScreen} 
        options={{ headerTitle: 'Compose Message' }}
      />
      <ChildrenStack.Screen 
        name="ChildPrestasiList" 
        component={ChildPrestasiListScreen} 
        options={{ headerTitle: 'Achievements' }}
      />
      <ChildrenStack.Screen 
        name="ChildPrestasiDetail" 
        component={ChildPrestasiDetailScreen} 
        options={{ headerTitle: 'Achievement Detail' }}
      />
      <ChildrenStack.Screen 
        name="ChildRaportList" 
        component={ChildRaportListScreen} 
        options={{ headerTitle: 'Report Cards' }}
      />
      <ChildrenStack.Screen 
        name="ChildRaportDetail" 
        component={ChildRaportDetailScreen} 
        options={{ headerTitle: 'Report Card Detail' }}
      />
      <ChildrenStack.Screen 
        name="ChildAktivitasList" 
        component={ChildAktivitasListScreen} 
        options={{ headerTitle: 'Activities' }}
      />
      <ChildrenStack.Screen 
        name="ChildAktivitasDetail" 
        component={ChildAktivitasDetailScreen} 
        options={{ headerTitle: 'Activity Detail' }}
      />
      <ChildrenStack.Screen 
        name="ChildBilling" 
        component={ChildBillingScreen} 
        options={({ route }) => ({ 
          headerTitle: `Tagihan ${route.params?.childName || 'Anak'}` 
        })}
      />
    </ChildrenStack.Navigator>
  );
};

const MarketplaceStackNavigator = () => {
  return (
    <MarketplaceStack.Navigator>
      <MarketplaceStack.Screen 
        name="MarketplaceList" 
        component={AvailableChildrenMarketplaceScreen} 
        options={{ headerTitle: 'Cari Anak Asuh' }}
      />
      <MarketplaceStack.Screen 
        name="ChildMarketplaceDetail" 
        component={ChildMarketplaceDetailScreen} 
        options={({ route }) => ({ 
          headerTitle: route.params?.childName || 'Profile Anak' 
        })}
      />
      <MarketplaceStack.Screen 
        name="SponsorshipConfirmation" 
        component={SponsorshipConfirmationScreen} 
        options={{ headerTitle: 'Konfirmasi Sponsorship' }}
      />
      <MarketplaceStack.Screen 
        name="SponsorshipSuccess" 
        component={SponsorshipSuccessScreen} 
        options={{ headerTitle: 'Sponsorship Berhasil', headerLeft: null }}
      />
    </MarketplaceStack.Navigator>
  );
};

const BillingStackNavigator = () => {
  return (
    <BillingStack.Navigator>
      <BillingStack.Screen 
        name="BillingHistory" 
        component={BillingHistoryScreen} 
        options={{ headerTitle: 'Riwayat Tagihan' }}
      />
      <BillingStack.Screen 
        name="ChildBilling" 
        component={ChildBillingScreen} 
        options={({ route }) => ({ 
          headerTitle: `Tagihan ${route.params?.childName || 'Anak'}` 
        })}
      />
    </BillingStack.Navigator>
  );
};

const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen 
        name="Profile" 
        component={DonaturProfileScreen} 
        options={{ headerTitle: 'My Profile' }}
      />
    </ProfileStack.Navigator>
  );
};

const DonaturNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Children') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Marketplace') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Billing') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#9b59b6',
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
        name="Children" 
        component={ChildrenStackNavigator} 
        options={{ tabBarLabel: 'Anak Asuh Saya' }}
      />
      <Tab.Screen 
        name="Marketplace" 
        component={MarketplaceStackNavigator} 
        options={{ tabBarLabel: 'Cari Anak Asuh' }}
      />
      <Tab.Screen 
        name="Billing" 
        component={BillingStackNavigator} 
        options={{ tabBarLabel: 'Tagihan' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStackNavigator} 
        options={{ tabBarLabel: 'Profil Saya' }}
      />
    </Tab.Navigator>
  );
};

export default DonaturNavigator;