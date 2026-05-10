
import { io } from 'socket.io-client';

// CRITICAL FIX: Use the Render Backend URL, not the Vercel Frontend origin
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Get JWT token - Ensure this key matches what Member 2 used in Login.jsx
const getToken = () => localStorage.getItem('token') || localStorage.getItem('jwtToken') || '';

const socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    withCredentials: true,
    transports: ['websocket', 'polling'], // Essential for reliable cloud connections
    auth: {
        token: getToken(),
    },
});

socket.on('connect', () => {
    console.log(`[Socket.io] Connected to Render — ID: ${socket.id}`);
});

socket.on('disconnect', (reason) => {
    console.log(`[Socket.io] Disconnected — reason: ${reason}`);
});

socket.on('connect_error', (err) => {
    console.warn(`[Socket.io] Connection error: ${err.message}`);
    if (err.message.includes('Authentication')) {
        console.error('[Socket.io] Auth failed. Token might be expired.');
        // Don't auto-redirect here to avoid infinite loops during dev
    }
});

// Normalize room ID to match backend logic
export const normalizeRoomId = (value) => {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/--+/g, '-')
        .replace(/(^-|-$)/g, '');
};

// Connect with fresh token (call this after login)
export const connectSocket = (providedToken = null) => {
    const token = providedToken || getToken();
    
    if (!token) {
        console.warn('[Socket.io] Socket connect aborted: missing auth token.');
        return;
    }

    // Update auth object with the fresh token
    socket.auth = { token };

    if (socket.connected) {
        socket.disconnect();
        setTimeout(() => socket.connect(), 100);
    } else {
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) socket.disconnect();
};

// Emit swap request to notify teacher in real time
export const emitSwapRequest = (data) => {
    if (!socket.connected) connectSocket();
    socket.emit('swap_request_sent', data);
};

// Join a chat room
export const joinChatRoom = (roomId) => {
    const normalized = normalizeRoomId(roomId);
    console.log(`[socket-client] Joining room: ${normalized}`);
    socket.emit('join_chat_room', { roomId: normalized });
};

// Send a chat message
export const sendChatMessage = ({ roomId, message, senderName, messageId }) => {
    const normalized = normalizeRoomId(roomId);
    socket.emit('chat_message', { 
        roomId: normalized, 
        message, 
        senderName, 
        messageId 
    });
};

export default socket;