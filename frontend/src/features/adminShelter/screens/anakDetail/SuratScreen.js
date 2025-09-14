import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const SuratScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { childId, childName } = route.params || {};

  useEffect(() => {
    if (childId) {
      // Navigate directly to SuratList screen
      navigation.replace('SuratList', { childId, childName: childName || 'Anak' });
    }
  }, [navigation, childId, childName]);

  if (!childId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error: Child ID not provided</Text>
      </View>
    );
  }

  return null;
};

export default SuratScreen;