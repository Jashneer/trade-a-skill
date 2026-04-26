// frontend/src/socket-client.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

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
});

// Connect with fresh token (call this after login)
export const connectSocket = () => {
    socket.auth = { token: getToken() };
    if (!socket.connected) socket.connect();
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
    socket.emit('join_chat_room', { roomId });
};

// Send a chat message
export const sendChatMessage = ({ roomId, message, senderName }) => {
    socket.emit('chat_message', { roomId, message, senderName });
};

export default socket;