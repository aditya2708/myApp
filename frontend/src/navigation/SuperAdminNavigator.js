import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SuperAdminUserListScreen from '../features/superAdmin/screens/SuperAdminUserListScreen';
import SuperAdminUserFormScreen from '../features/superAdmin/screens/SuperAdminUserFormScreen';

const Stack = createStackNavigator();

const SuperAdminNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SuperAdminUserList"
        component={SuperAdminUserListScreen}
        options={{ headerTitle: 'Super Admin — User SSO' }}
      />
      <Stack.Screen
        name="SuperAdminUserForm"
        component={SuperAdminUserFormScreen}
        options={{ headerTitle: 'Atur Role Pengguna' }}
      />
    </Stack.Navigator>
  );
};

export default SuperAdminNavigator;
