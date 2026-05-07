// frontend/src/socket-client.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

// Get JWT token stored after login
const getToken = () => localStorage.getItem('jwtToken') || '';

const socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    withCredentials: true,
    auth: {
        token: getToken(),  // ← THIS IS THE KEY FIX
    },
});

socket.on('connect', () => {
    console.log(`[Socket.io] Connected — ID: ${socket.id}`);
});

socket.on('disconnect', (reason) => {
    console.log(`[Socket.io] Disconnected — reason: ${reason}`);
});

socket.on('connect_error', (err) => {
    console.warn(`[Socket.io] Connection error: ${err.message}`);
    if (err.message.includes('Authentication')) {
        console.error('[Socket.io] Authentication failed. Please log in again.');
        // Optionally disconnect and clear invalid token
        localStorage.removeItem('jwtToken');
        window.location.href = '/login';
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
export const connectSocket = () => {
    const token = getToken();
    if (!token) {
        console.warn('[Socket.io] Socket connect aborted: missing auth token.');
        return;
    }
    socket.auth = { token };
    // Force disconnect before reconnecting to ensure fresh auth
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
    socket.emit('swap_request_sent', data);
};

// Join a chat room
export const joinChatRoom = (roomId) => {
    console.log(`[socket-client] Emitting join_chat_room: ${roomId}`);
    socket.emit('join_chat_room', { roomId });
};

// Send a chat message
export const sendChatMessage = ({ roomId, message, senderName, messageId }) => {
    console.log(`[socket-client] Emitting chat_message to room ${roomId}:`, { message, senderName });
    socket.emit('chat_message', { roomId, message, senderName, messageId });
};

export default socket;