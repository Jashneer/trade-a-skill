// src/pages/ChatTemp.jsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getSenderName = (user) => user?.firstName || 'You';

const useQuery = () => {
    return new URLSearchParams(useLocation().search);
};

const CONTEXTUAL_RESPONSES = {
    GREETING: [
        "Hello! I'm happy to chat about trading skills. What skill are you offering me?",
        "Hi there! Thanks for reaching out about the swap. Tell me a bit about your teaching experience.",
        "Welcome! How can I help you get started with the trade?",
    ],
    AVAILABILITY: [
        "Got it! Let me check my calendar now. Are you free in the evenings or mornings?",
        "That works for me. We can meet online via video call. Do you have a preferred platform?",
        "I'm flexible! What time works best for you on those days?",
        "Okay, I see that time is free. Can you confirm the day?",
    ],
    TEACHER_DETAILS_QUERY: [
        "I've been working with this skill for about five years, specializing in the fundamentals. How long have you been practicing the skill you're offering?",
        "I have significant experience in this area. Before we dive into scheduling, can you tell me more about the skill you can teach?",
    ],
    ASK_USER_SKILLS: [
        "Sounds interesting! What is your experience level with the skill you're offering to teach?",
        "Great! Can you tell me a little bit about your background in that field?",
    ],
    DEFAULT: [
        "I think this trade could work well. Tell me what your preferred method of teaching is (video, screen-share, or step-by-step exercises).",
        "Great — I usually teach via short demonstrations followed by practice. Does that teaching style work for you?",
        "Perfect. I'll prepare a concise plan for our first session focusing on fundamentals and hands-on practice.",
    ]
};

// Renamed component to match filename
const ChatTemp = () => {
    const { teacherId } = useParams(); 
    const navigate = useNavigate();
    const location = useLocation();
    const query = useQuery();

    const { user } = useAuth(); 
    const isLoggedIn = !!user?.isLoggedIn;
    const currentUserName = getSenderName(user);

    const skillTitle = useMemo(() => {
        return decodeURIComponent(query.get('skill') || 'the requested skill'); 
    }, [location.search, query]);

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState(''); 
    const [isInitialGreetingSent, setIsInitialGreetingSent] = useState(false); 
    const [isSchedulingConfirmed, setIsSchedulingConfirmed] = useState(false);
    const lastRepliedMessageId = useRef(null);

    useEffect(() => {
        setMessages([]);
        setIsInitialGreetingSent(false);
        setIsSchedulingConfirmed(false);
        lastRepliedMessageId.current = null;
    }, [teacherId, skillTitle]);

    useEffect(() => {
        const lastMessage = messages[messages.length - 1];

        if (lastMessage && lastMessage.sender === currentUserName && lastRepliedMessageId.current !== lastMessage.id) {
            const text = lastMessage.text.toLowerCase();
            let responsePool = CONTEXTUAL_RESPONSES.DEFAULT;

            const isSchedulingText = /available|when|time|schedule|pm|am|thursday|evening/.test(text);

            if (isSchedulingText) {
                if (!isSchedulingConfirmed) {
                    responsePool = CONTEXTUAL_RESPONSES.AVAILABILITY;
                    setIsSchedulingConfirmed(true);
                } else {
                    responsePool = CONTEXTUAL_RESPONSES.DEFAULT;
                }
            } else if (/experience|how much|years|detail/.test(text)) {
                responsePool = CONTEXTUAL_RESPONSES.TEACHER_DETAILS_QUERY;
            } else if (/skill|teach|offering|what you can/.test(text)) {
                responsePool = CONTEXTUAL_RESPONSES.ASK_USER_SKILLS;
            } else if (/hi|hello|hey/.test(text)) {
                responsePool = CONTEXTUAL_RESPONSES.GREETING;
            }

            let teacherReply = responsePool[Math.floor(Math.random() * responsePool.length)];

            if (!isInitialGreetingSent && messages.length > 0) {
                teacherReply = `Hi, I saw your swap request for ${skillTitle}. ${teacherReply}`;
                setIsInitialGreetingSent(true);
            }

            const replyMessage = {
                id: Date.now() + 1,
                sender: 'Teacher',
                text: teacherReply,
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            };

            const timer = setTimeout(() => {
                setMessages(prev => [...prev, replyMessage]);
                lastRepliedMessageId.current = lastMessage.id;
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [messages, currentUserName, skillTitle, isInitialGreetingSent, isSchedulingConfirmed]); 

    const handleSecureDeal = () => {
        if (!isLoggedIn || !user?.skillsToTeach || user.skillsToTeach.length === 0) {
            alert("Action required: Please ensure you are signed in and have at least one skill listed to offer.");
            return;
        }

        const offeredSkill = user.skillsToTeach[0]; 
        const isConfirmed = window.confirm(
            `CONFIRM MATCH: Are you sure you want to secure the swap?\n` +
            `You will learn: ${skillTitle}\n` +
            `You will teach: ${offeredSkill}`
        );

        if (isConfirmed) {
            alert("✅ DEAL SECURED! The swap is now active and added to your Swap History.");
            
            const securedMessage = {
                id: Date.now() + 2,
                sender: 'System',
                text: `***DEAL SECURED***: ${currentUserName} and ${teacherId} have agreed to swap ${offeredSkill} for ${skillTitle}.`,
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, securedMessage]);

            setTimeout(() => navigate('/dashboard'), 2000); 
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        const sentMessage = {
            id: Date.now(),
            sender: currentUserName, 
            text: newMessage.trim(),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, sentMessage]);
        setNewMessage(''); 
    };
    
    const canSecureDeal = isLoggedIn && user?.skillsToTeach && user.skillsToTeach.length > 0;

    return (
        <main className="container" style={{ marginTop: '100px', padding: '20px' }}>
            <Link to="/dashboard" className="btn btn-secondary btn-small">← Back to Dashboard</Link>
            
            <h1 style={{ marginTop: '20px', fontSize: '28px' }}>
                Chat with {teacherId}
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>
                You are: **{user?.firstName || 'Guest'} {user?.lastName || ''}** | Swapping to learn: **{skillTitle}**
            </p>
            
            <div style={{ 
                padding: '10px', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px', 
                marginTop: '5px', 
                minHeight: '400px', 
                backgroundColor: 'var(--bg-primary)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
            }}>
                <div style={{ flexGrow: 1, overflowY: 'auto', padding: '10px' }}>
                    {messages.map(msg => (
                        <div 
                            key={msg.id} 
                            style={{ 
                                marginBottom: '10px', 
                                textAlign: msg.sender === currentUserName || msg.sender === 'System' ? 'right' : 'left' 
                            }}
                        >
                            <span style={{ 
                                display: 'inline-block', 
                                padding: '8px 12px', 
                                borderRadius: '15px', 
                                maxWidth: '75%',
                                backgroundColor: msg.sender === currentUserName ? 'var(--primary-light)' : (msg.sender === 'System' ? '#e0f2fe' : 'var(--bg-accent)'),
                                color: msg.sender === currentUserName ? 'white' : 'var(--text-primary)',
                                fontSize: '14px'
                            }}>
                                {msg.text}
                            </span>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                {msg.time}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ 
                    padding: '10px', 
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => alert("Simulating Swap Cancellation...")}
                            style={{ padding: '8px 15px' }}
                            disabled={!canSecureDeal}
                        >
                            Cancel Swap
                        </button>
                        <button 
                            className="btn btn-primary" 
                            onClick={handleSecureDeal} 
                            style={{ padding: '8px 15px' }}
                            disabled={!canSecureDeal}
                        >
                            ✅ Secure Deal Now
                        </button>
                    </div>

                    <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            style={{ flexGrow: 1, padding: '10px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                            disabled={!isLoggedIn}
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }} disabled={!isLoggedIn}>
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default ChatTemp; // Renamed export