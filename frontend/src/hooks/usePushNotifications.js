import { useEffect, useState } from 'react';

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');

  const subscribeToPush = async () => {
    try {
      // 1. طلب الإذن
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') {
        console.log('Permission not granted');
        return;
      }
      
      // 2. تسجيل Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      // 3. الحصول على VAPID Public Key
      const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
      
      // 4. الاشتراك في الإشعارات
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });
      
      // 5. إرسال الاشتراك إلى الخادم
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(subscription)
      });
      
      setIsSubscribed(true);
      console.log('Push subscription successful');
      
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  };

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // التحقق من الاشتراك الحالي
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          setIsSubscribed(!!subscription);
        });
      });
    }
  }, []);

  return { isSubscribed, permission, subscribeToPush };
};