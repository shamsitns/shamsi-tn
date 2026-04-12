import React, { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import api from '../services/api';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const previousUnreadCount = useRef(0);
    const audioRef = useRef(null);
    const [audioInitialized, setAudioInitialized] = useState(false);

    const initAudio = () => {
        if (!audioInitialized) {
            const audio = new Audio();
            audio.src = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3';
            audio.load();
            audioRef.current = audio;
            setAudioInitialized(true);
            console.log('🔊 Audio initialized');
        }
    };

    const playSound = () => {
        if (audioRef.current && audioInitialized) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => console.log('Audio play failed:', err));
        }
    };

    const fetchNotifications = async () => {
        try {
            console.log('🔍 Fetching notifications...');
            const response = await api.get('/notifications');
            console.log('📬 Notifications response:', response.data);
            
            const newNotifications = response.data.notifications || [];
            const newUnreadCount = response.data.unreadCount || 0;
            
            console.log(`Previous: ${previousUnreadCount.current}, New: ${newUnreadCount}`);
            
            if (newUnreadCount > previousUnreadCount.current && audioInitialized) {
                console.log('🔔 New notification! Playing sound...');
                playSound();
            }
            
            previousUnreadCount.current = newUnreadCount;
            setNotifications(newNotifications);
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

    // جلب الإشعارات كل 5 ثوانٍ (للاختبار)
    useEffect(() => {
        if (localStorage.getItem('token')) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 5000);
            return () => clearInterval(interval);
        }
    }, [audioInitialized]);

    const getTypeColor = (type) => {
        switch(type) {
            case 'success': return 'bg-green-100 border-green-500';
            case 'warning': return 'bg-yellow-100 border-yellow-500';
            case 'error': return 'bg-red-100 border-red-500';
            default: return 'bg-blue-100 border-blue-500';
        }
    };

    if (!localStorage.getItem('token')) {
        return null;
    }

    return (
        <div className="relative">
            <button
                onClick={() => {
                    initAudio();
                    setShowDropdown(!showDropdown);
                }}
                className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
            >
                <FaBell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                    <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50">
                        <div className="p-3 border-b flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800">الإشعارات</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="text-xs text-blue-500 hover:text-blue-700">
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
                                        className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notif.is_read ? 'bg-blue-50' : ''}`}
                                        onClick={() => markAsRead(notif.id)}
                                    >
                                        <div className={`border-r-4 pl-3 ${getTypeColor(notif.type)}`}>
                                            <p className="font-semibold text-sm text-gray-800">{notif.title}</p>
                                            <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notif.created_at).toLocaleString('ar-TN')}
                                            </p>
                                        </div>
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