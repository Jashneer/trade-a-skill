import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket-client'; // ✅ FIXED PATH
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const unreadCount = notifications.filter((n) => !n.read).length;

    // 🔔 Listen for real-time notifications
    useEffect(() => {
        if (!user?.isLoggedIn) return;

        // connect socket if not connected
        if (!socket.connected) {
            socket.connect();
        }

        const handleNotification = (data) => {
            const isForMe =
                !data.targetEmail ||
                (user.email && data.targetEmail.toLowerCase() === user.email.toLowerCase());

            if (!isForMe) return;

            setNotifications((prev) => [
                {
                    id: Date.now(),
                    message: data.message,
                    type: data.type || 'INFO',
                    timestamp: data.timestamp || new Date().toISOString(),
                    read: false,
                },
                ...prev.slice(0, 19),
            ]);
        };

        // ✅ FIXED EVENT NAME
        socket.on('notification', handleNotification);

        return () => {
            socket.off('notification', handleNotification);
        };
    }, [user]);

    // 🖱️ Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const clearAll = () => setNotifications([]);

    const iconColor = (type) => {
        if (type === 'SWAP_REQUEST') return '#f59e0b';
        if (type === 'SWAP_APPROVED') return '#10b981';
        if (type === 'SWAP_REJECTED') return '#ef4444';
        return '#6b7280';
    };

    if (!user?.isLoggedIn) return null;

    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            
            {/* 🔔 Bell */}
            <button
                onClick={() => {
                    setIsOpen((v) => !v);
                    if (!isOpen) markAllRead();
                }}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '22px',
                    position: 'relative',
                    padding: '4px 8px',
                }}
            >
                🔔
                {unreadCount > 0 && (
                    <span
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            backgroundColor: '#ef4444',
                            color: 'white',
                            borderRadius: '50%',
                            fontSize: '10px',
                            fontWeight: 700,
                            width: 16,
                            height: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* 📩 Dropdown */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        right: 0,
                        top: '110%',
                        width: 320,
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        zIndex: 9999,
                        maxHeight: 400,
                        overflowY: 'auto',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}
                    >
                        <strong>Notifications</strong>
                        {notifications.length > 0 && (
                            <button
                                onClick={clearAll}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                }}
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* List */}
                    {notifications.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
                            No notifications
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n.id}
                                style={{
                                    padding: 12,
                                    borderBottom: '1px solid #eee',
                                    backgroundColor: n.read ? '#fff' : '#eef6ff',
                                    display: 'flex',
                                    gap: 10,
                                }}
                            >
                                <span style={{ fontSize: 18, color: iconColor(n.type) }}>
                                    {n.type === 'SWAP_REQUEST' ? '🔄'
                                        : n.type === 'SWAP_APPROVED' ? '✅'
                                        : n.type === 'SWAP_REJECTED' ? '❌'
                                        : 'ℹ️'}
                                </span>
                                <div>
                                    <p style={{ margin: 0, fontSize: 13 }}>{n.message}</p>
                                    <small style={{ color: '#888' }}>
                                        {new Date(n.timestamp).toLocaleTimeString()}
                                    </small>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;