import { useEffect, useState } from 'react';

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    try {
      // 1. طلب الإذن
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') {
        console.log('Permission not granted');
        return false;
      }
      
      // 2. انتظار Service Worker
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker ready:', registration);
      
      // 3. استخدام المفاتيح الجديدة
      const vapidPublicKey = 'BLYYBKOnF8app7BWGvTnDOKFatYSKRRM5jCsgBkE5Zd8J1lWvGZhEHUFvRuq0mm95uJYJzZ34hu6r4bJvmbEjCY';
      
      // 4. الاشتراك
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      console.log('Push subscription:', subscription);
      
      // 5. إرسال إلى الخادم
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscription)
      });
      
      if (response.ok) {
        setIsSubscribed(true);
        console.log('✅ Push subscription successful');
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return false;
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        const token = localStorage.getItem('token');
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        setIsSubscribed(false);
        console.log('✅ Unsubscribed from push');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  };

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      console.log('Current subscription:', !!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // تسجيل Service Worker
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('✅ Service Worker registered:', reg);
          checkSubscription();
        })
        .catch(err => {
          console.error('❌ Service Worker registration failed:', err);
        });
    }
  }, []);

  return {
    isSubscribed,
    permission,
    subscribeToPush,
    unsubscribeFromPush,
    isSupported: 'serviceWorker' in navigator && 'PushManager' in window
  };
};