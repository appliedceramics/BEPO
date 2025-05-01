import { useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { apiRequest } from '@/lib/queryClient';

type SubscriptionStatus = 'unsupported' | 'denied' | 'granted' | 'pending' | 'unsubscribed';

export function usePushNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('pending');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setSubscriptionStatus('unsupported');
        return;
      }

      // Check if permission is already granted
      if (Notification.permission === 'granted') {
        setSubscriptionStatus('granted');
      } else if (Notification.permission === 'denied') {
        setSubscriptionStatus('denied');
      } else {
        setSubscriptionStatus('unsubscribed');
      }

      // Get existing subscription if any
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        setSubscription(existingSubscription);
        
        if (existingSubscription) {
          setSubscriptionStatus('granted');
        }
      } catch (error) {
        console.error('Error checking for existing subscription:', error);
      }
    };

    checkSupport();
  }, []);

  // Fetch VAPID public key when needed
  useEffect(() => {
    const fetchVapidKey = async () => {
      if (!user || subscriptionStatus === 'unsupported' || subscriptionStatus === 'denied') {
        return;
      }

      try {
        const response = await apiRequest('GET', '/api/vapid-public-key');
        const data = await response.json();
        if (data.publicKey) {
          setVapidPublicKey(data.publicKey);
        }
      } catch (error) {
        console.error('Error fetching VAPID public key:', error);
      }
    };

    fetchVapidKey();
  }, [user, subscriptionStatus]);

  // Convert base64 string to Uint8Array for push subscription
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };

  // Subscribe to push notifications
  const subscribe = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to enable push notifications.',
        variant: 'destructive',
      });
      return false;
    }

    if (!vapidPublicKey) {
      toast({
        title: 'Configuration error',
        description: 'Push notification configuration is not available.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setSubscriptionStatus('denied');
        toast({
          title: 'Permission denied',
          description: 'Please allow notifications in your browser settings.',
          variant: 'destructive',
        });
        return false;
      }

      setSubscriptionStatus('granted');

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Create subscription
      const subscriptionOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      };
      
      const newSubscription = await registration.pushManager.subscribe(subscriptionOptions);
      setSubscription(newSubscription);
      
      // Send subscription to server
      await apiRequest('POST', '/api/push-subscription', {
        subscription: newSubscription.toJSON(),
      });

      toast({
        title: 'Notifications enabled',
        description: 'You will now receive push notifications.',
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast({
        title: 'Subscription failed',
        description: 'Unable to subscribe to push notifications.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    if (!subscription) {
      return true;
    }

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      setSubscriptionStatus('unsubscribed');
      
      toast({
        title: 'Notifications disabled',
        description: 'You will no longer receive push notifications.',
      });
      
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast({
        title: 'Unsubscribe failed',
        description: 'Unable to disable push notifications.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Send a test notification
  const sendTestNotification = async () => {
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'You must be logged in to send test notifications.',
        variant: 'destructive',
      });
      return false;
    }
    
    if (!subscription) {
      toast({
        title: 'Not subscribed',
        description: 'You must be subscribed to push notifications first.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      // We'll only send the subscription in the request if it's not already stored on the server
      // The server will try to use its stored subscription first, then fall back to this one
      await apiRequest('POST', '/api/send-test-notification', {
        subscription: subscription.toJSON()
      });
      
      toast({
        title: 'Test sent',
        description: 'Test notification has been sent.',
      });
      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: 'Test failed',
        description: 'Unable to send test notification.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    isSupported: subscriptionStatus !== 'unsupported',
    isDenied: subscriptionStatus === 'denied',
    isSubscribed: subscriptionStatus === 'granted' && subscription !== null,
    subscriptionStatus,
    subscription,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
