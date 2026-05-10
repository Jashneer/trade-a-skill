
import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SwapConfirmationModal from '../components/UI/SwapConfirmationModal';
import { connectSocket, emitSwapRequest } from '../socket-client';

const SkillDetailPage = () => {
    const { skillId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // --- State for Live Data ---
    const [liveSkill, setLiveSkill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedOfferSkill, setSelectedOfferSkill] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Fetch Live Skill Data from Render ---
    useEffect(() => {
        const fetchSkillDetails = async () => {
            try {
                // Uses the environment variable you set in Vercel
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const response = await fetch(`${apiUrl}/api/skills/${skillId}`);
                
                if (response.ok) {
                    const result = await response.json();
                    setLiveSkill(result.data);
                } else {
                    console.error("Backend returned an error:", response.status);
                }
            } catch (err) {
                console.error("Failed to fetch live skill data from Render", err);
            } finally {
                setLoading(false);
            }
        };

        if (skillId) fetchSkillDetails();
    }, [skillId]);

    // --- Fallback Data Lookup (Keep as backup for static data) ---
    const fallbackSkill = useMemo(() => {
        const idToFind = String(skillId);
        try {
            const users = JSON.parse(localStorage.getItem('tradeASkillUsers') || '[]');
            for (const userObj of users) {
                const teach = Array.isArray(userObj.skillsToTeach) ? userObj.skillsToTeach : [];
                for (let i = 0; i < teach.length; i++) {
                    const listingId = `${userObj.email}-${i}`;
                    if (String(listingId) === idToFind) {
                        return {
                            id: listingId,
                            title: String(teach[i]),
                            description: userObj.bio || `Learn ${teach[i]} from ${userObj.firstName}`,
                            teacher: { 
                                name: `${userObj.firstName} ${userObj.lastName}`.trim(), 
                                email: userObj.email, 
                                rating: userObj.rating || 'N/A', 
                                completedTrades: userObj.trades || 0 
                            },
                            level: 'Flexible',
                            duration: 'Flexible'
                        };
                    }
                }
            }
        } catch (err) { console.error('Fallback lookup failed', err); }
        return null;
    }, [skillId]);

    // Use live data if available, otherwise fallback
    const skill = liveSkill || fallbackSkill || {
        title: "Loading Skill...",
        description: "Please wait while we fetch the details.",
        teacher: { name: "Teacher", rating: "N/A", completedTrades: 0 },
        level: "Unknown",
        duration: "Flexible"
    };

    const isUserPresent = !!user?.email && user.email !== 'guest@example.com';
    const isLoggedIn = isUserPresent;
    const userTeachableSkills = user?.skillsToTeach || [];

    const handleSwapRequest = () => {
        if (!isLoggedIn) {
            navigate('/signup');
            return;
        }
        if (userTeachableSkills.length === 0) {
            alert('You must list a skill on your profile before requesting a swap!');
            navigate('/profile');
            return;
        }
        if (!selectedOfferSkill) {
            alert('Please select one of your skills to offer.');
            return;
        }
        setIsModalOpen(true);
    };

    const confirmSwapAndSendRequest = () => {
        try {
            const token = localStorage.getItem('token'); // Get JWT for Socket Auth
            
            // Connect socket with token as required by server.js middleware
            connectSocket(token); 

            emitSwapRequest({
                teacherEmail: skill.teacher.email || null,
                senderName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                message: `${user.firstName || 'A learner'} requested a swap for ${skill.title}.`,
            });

            alert('✅ Swap Request Sent via Real-time Socket!');
            setIsModalOpen(false);
            navigate('/profile');
        } catch (err) {
            console.error('Swap request failed', err);
            alert('Problem sending request. Check your connection.');
        }
    };

    const handleStartNegotiation = () => {
        if (!isLoggedIn) {
            navigate('/signup');
            return;
        }
        navigate(`/chat/${encodeURIComponent(skill.teacher.name)}?skill=${encodeURIComponent(skill.title)}`);
    };

    // Button Logic
    let buttonText = 'Sign In to Request';
    let buttonDisabled = !isLoggedIn;
    if (isLoggedIn) {
        buttonText = userTeachableSkills.length === 0 ? 'Add Skill to Profile' : 'Send Swap Request';
        buttonDisabled = userTeachableSkills.length === 0 && !selectedOfferSkill;
    }

    if (loading) return <div className="container">Loading skill details...</div>;

    return (
        <main className="container skill-detail-main">
            <Link to="/dashboard" className="btn btn-secondary btn-small skill-detail-back">← Back to Dashboard</Link>

            <h1 className="skill-detail-title">{skill.title}</h1>
            <p className="skill-detail-sub">{skill.teacher.name} • {skill.teacher.rating} ⭐</p>

            <div className="skill-detail-grid">
                <section className="skill-card-large">
                    <h2 className="skill-section-heading">About this Skill</h2>
                    <p className="skill-detail-desc">{skill.description}</p>

                    <div className="skill-meta">
                        <div className="skill-meta-item">
                            <strong>Level</strong>
                            <div className="meta-item-value">{skill.level}</div>
                        </div>
                        <div className="skill-meta-item">
                            <strong>Duration</strong>
                            <div className="meta-item-value">{skill.duration}</div>
                        </div>
                    </div>

                    <div className="trade-offer">
                        <h3 className="trade-offer-title">Trade Offer</h3>
                        <p className="trade-offer-desc">Choose one of your skills to offer in exchange.</p>

                        <div className="trade-offer-pills">
                            {userTeachableSkills.map((skillItem, index) => (
                                <button
                                    key={index}
                                    className={`skill-pill ${selectedOfferSkill === skillItem ? 'selected' : ''}`}
                                    onClick={() => setSelectedOfferSkill(skillItem)}
                                >
                                    {skillItem}
                                </button>
                            ))}
                        </div>

                        <div className="trade-offer-actions">
                            <button className="btn btn-primary btn-large" onClick={handleSwapRequest} disabled={buttonDisabled}>
                                {buttonText}
                            </button>
                        </div>
                    </div>
                </section>

                <aside>
                    <div className="teacher-card">
                        <h4>Teacher</h4>
                        <p className="teacher-name"><strong>{skill.teacher.name}</strong></p>
                        <p className="teacher-meta">{skill.teacher.completedTrades} trades • {skill.teacher.rating} ⭐</p>
                        <button className="btn btn-outline" onClick={handleStartNegotiation}>Start Negotiation</button>
                    </div>
                </aside>
            </div>

            <SwapConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={confirmSwapAndSendRequest}
                skillToLearn={skill.title}
                skillToOffer={selectedOfferSkill}
                teacherName={skill.teacher.name}
            />
        </main>
    );
};

export default SkillDetailPage;