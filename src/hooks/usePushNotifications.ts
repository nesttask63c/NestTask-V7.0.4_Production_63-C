import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { 
  requestNotificationPermission, 
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications
} from '../utils/pushNotifications';

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsSubscribed(false);
      setLoading(false);
      return;
    }

    checkSubscriptionStatus();
  }, [user]);

  const checkSubscriptionStatus = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setError('Push notifications are not supported in this browser');
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error: any) {
      console.error('Error checking subscription status:', error);
      setError(getNotificationErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async () => {
    if (!user) return false;

    try {
      setError(null);
      setLoading(true);

      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) {
        setError('Please allow notifications in your browser settings to receive updates');
        return false;
      }

      const subscription = await subscribeToPushNotifications(user.id);
      if (!subscription) {
        setError('Failed to subscribe to notifications. Please try again.');
        return false;
      }

      setIsSubscribed(true);
      return true;
    } catch (error: any) {
      console.error('Error subscribing to notifications:', error);
      setError(getNotificationErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!user) return false;

    try {
      setError(null);
      setLoading(true);

      const success = await unsubscribeFromPushNotifications(user.id);
      setIsSubscribed(!success);
      return success;
    } catch (error: any) {
      console.error('Error unsubscribing from notifications:', error);
      setError(getNotificationErrorMessage(error));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getNotificationErrorMessage = (error: any): string => {
    if (error.name === 'NotAllowedError') {
      return 'Notification permission denied. Please enable notifications in your browser settings.';
    }
    if (error.name === 'InvalidStateError') {
      return 'Push notification subscription is in an invalid state. Please try again.';
    }
    return error.message || 'An error occurred with push notifications. Please try again.';
  };

  return {
    isSubscribed,
    loading,
    error,
    subscribe,
    unsubscribe
  };
}