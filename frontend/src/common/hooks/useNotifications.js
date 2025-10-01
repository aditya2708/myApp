import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

const removeSubscription = (subscriptionRef) => {
  if (subscriptionRef.current) {
    Notifications.removeNotificationSubscription(subscriptionRef.current);
    subscriptionRef.current = null;
  }
};

export const useNotifications = ({ enabled = false, onReceive, onRespond } = {}) => {
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    if (!enabled) {
      removeSubscription(notificationListener);
      removeSubscription(responseListener);
      return undefined;
    }

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      if (typeof onReceive === 'function') {
        onReceive(notification);
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      if (typeof onRespond === 'function') {
        onRespond(response);
      }
    });

    return () => {
      removeSubscription(notificationListener);
      removeSubscription(responseListener);
    };
  }, [enabled, onReceive, onRespond]);
};

