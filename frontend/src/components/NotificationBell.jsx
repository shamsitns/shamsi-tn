import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import api from '../services/api';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const previousUnreadCount = React.useRef(0);

    const playSound = () => {
    // استخدام رابط صوت مضمون 100% من W3Schools
    const audio = new Audio('https://www.w3schools.com/html/horse.ogg');
    audio.volume = 0.5;
    audio.play().catch(err => {
        console.log('Audio play failed:', err);
        // محاولة بديلة
        const audio2 = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
        audio2.play().catch(e => console.log('Fallback failed:', e));
    });
};

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            console.log('📬 Notifications response:', response.data);
            
            const newUnreadCount = response.data.unreadCount || 0;
            
            if (newUnreadCount > previousUnreadCount.current) {
                console.log('🔔 New notification! Playing sound...');
                playSound();
            }
            
            previousUnreadCount.current = newUnreadCount;
            setNotifications(response.data.notifications || []);
            setUnreadCount(newUnreadCount);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    useEffect(() => {
        if (localStorage.getItem('token')) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 5000);
            return () => clearInterval(interval);
        }
    }, []);

    if (!localStorage.getItem('token')) {
        return null;
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
            >
                <FaBell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                    <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50">
                        <div className="p-3 border-b flex justify-between items-center">
                            <h3 className="font-semibold">الإشعارات</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="text-xs text-blue-500">
                                    تحديد الكل كمقروء
                                </button>
                            )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">لا توجد إشعارات</div>
                            ) : (
                                notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={`p-3 border-b cursor-pointer ${!notif.is_read ? 'bg-blue-50' : ''}`}
                                        onClick={() => markAsRead(notif.id)}
                                    >
                                        <p className="font-semibold text-sm">{notif.title}</p>
                                        <p className="text-xs text-gray-600">{notif.message}</p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(notif.created_at).toLocaleString('ar-TN')}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;