// src/pages/SkillDetailPage.jsx (FINAL STABLE VERSION)
import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SwapConfirmationModal from '../components/UI/SwapConfirmationModal';

const SkillDetailPage = () => {
    const { skillId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth(); // CRITICAL: Auth context

    // --- Data Lookup (derive listing from localStorage tradeASkillUsers) ---
    const skill = useMemo(() => {
        const idToFind = String(skillId);

        try {
            const users = JSON.parse(localStorage.getItem('tradeASkillUsers') || '[]');
            for (const userObj of users) {
                const teach = Array.isArray(userObj.skillsToTeach) ? userObj.skillsToTeach : [];
                for (let i = 0; i < teach.length; i++) {
                    const listingId = `${userObj.email}-${i}`;
                    if (String(listingId) === idToFind) {
                        const title = String(teach[i]);
                        return {
                            id: listingId,
                            title,
                            description: userObj.bio || `Learn ${title} from ${userObj.firstName || ''}`,
                            teacher: { name: `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim(), email: userObj.email || '', rating: userObj.rating || 'N/A', completedTrades: userObj.trades || 0 },
                            level: 'Flexible',
                            duration: 'Flexible'
                        };
                    }
                }
            }
        } catch (err) {
            console.error('Error reading tradeASkillUsers for skill lookup', err);
        }

        return {
            title: `Skill Details for ID: ${skillId}`,
            description: 'Full description not available.',
            teacher: { name: `Teacher for ${skillId}`, rating: 'N/A', completedTrades: 0 },
            level: 'Unknown',
            duration: 'Flexible'
        };
    }, [skillId]);

    const skillTitle = skill.title;
    const teacherName = skill.teacher.name;
    const userTeachableSkills = user?.skillsToTeach || [];

    // Lookup full teacher profile from localStorage tradeASkillUsers
    const teacherProfile = useMemo(() => {
        try {
            const allUsers = JSON.parse(localStorage.getItem('tradeASkillUsers') || '[]');
            if (!allUsers || allUsers.length === 0) return null;

            const identifier = (skill.teacher && (skill.teacher.email || skill.teacher.name)) || '';
            const idLower = String(identifier).toLowerCase();

            const found = allUsers.find(u => {
                if (!u) return false;
                const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().trim();
                const email = (u.email || '').toLowerCase();
                return email === idLower || fullName === idLower;
            });

            return found || null;
        } catch (err) {
            console.error('Failed to lookup teacher profile', err);
            return null;
        }
    }, [skill]);

    const isUserPresent = !!user?.email && user.email !== 'guest@example.com';
    const isLoggedIn = isUserPresent;

    // Selection & Modal state
    const [selectedOfferSkill, setSelectedOfferSkill] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Open modal after validation
    const handleSwapRequest = () => {
        if (!isLoggedIn) {
            navigate('/signup');
            return;
        }

        if (userTeachableSkills.length === 0) {
            alert('You must list a skill you can teach on your profile before requesting a swap!');
            navigate('/profile');
            return;
        }

        if (!selectedOfferSkill) {
            alert('Please select one of your skills to offer.');
            return;
        }

        // Open the confirmation modal instead of window.confirm
        setIsModalOpen(true);
    };

    // Final confirmation: save to storage and navigate
    const confirmSwapAndSendRequest = () => {
        try {
            const stored = JSON.parse(localStorage.getItem('userSwapRequests') || '[]');
            const newReq = {
                id: String(Date.now()),
                learnerId: user.email || 'unknown',
                skillRequested: skillTitle,
                teacherName: teacherName,
                skillOffered: selectedOfferSkill,
                status: 'PENDING',
                dateRequested: new Date().toISOString()
            };
            stored.push(newReq);
            localStorage.setItem('userSwapRequests', JSON.stringify(stored));

            // Show simple success feedback and navigate to profile
            alert('✅ Swap Request Sent!');
            setIsModalOpen(false);
            navigate('/profile', { state: { refreshKey: Date.now() } });
        } catch (err) {
            console.error('Failed to save swap request', err);
            alert('There was a problem saving your swap request. Please try again.');
        }
    };

    // Mirror Dashboard messaging behavior
    const handleStartNegotiation = () => {
        if (!isLoggedIn) {
            alert('You must be signed in to message a teacher. Redirecting to Sign Up.');
            navigate('/signup');
            return;
        }

        const teacherNameParam = skill.teacher.name;
        const skillTitleParam = skill.title;
        alert(`Starting chat with ${teacherNameParam} about ${skillTitleParam}.`);
        navigate(`/chat/${encodeURIComponent(teacherNameParam)}?skill=${encodeURIComponent(skillTitleParam)}`);
    };

    // Button state
    let buttonText = 'Sign In to Request';
    let buttonDisabled = !isUserPresent;
    if (isUserPresent) {
        if (userTeachableSkills.length === 0) {
            buttonText = 'Add Skill on Profile to Request';
            buttonDisabled = true;
        } else {
            buttonText = 'Send Swap Request';
            buttonDisabled = false;
        }
    }

    return (
        <main className="container skill-detail-main">
            <Link to="/dashboard" className="btn btn-secondary btn-small skill-detail-back">← Back to Skills</Link>

            <h1 className="skill-detail-title">{skillTitle}</h1>
            <p className="skill-detail-sub">{teacherName} • {skill.teacher.rating} ⭐</p>

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
                            {userTeachableSkills.length > 0 ? (
                                userTeachableSkills.map((skillItem, index) => (
                                    <button
                                        key={index}
                                        className={`skill-pill ${selectedOfferSkill === skillItem ? 'selected' : ''}`}
                                        onClick={() => setSelectedOfferSkill(skillItem)}
                                        type="button"
                                    >
                                        {skillItem}
                                    </button>
                                ))
                            ) : (
                                isUserPresent ? (
                                    <div className="no-skills-warning">No skills listed. Please update your profile to offer a trade.</div>
                                ) : (
                                    <div className="signin-note">Sign in to offer a trade.</div>
                                )
                            )}
                        </div>

                        <div className="trade-offer-actions">
                            <button className="btn btn-primary btn-large" onClick={handleSwapRequest} disabled={buttonDisabled}>{buttonText}</button>
                        </div>
                    </div>
                </section>

                <aside>
                    <div className="teacher-card">
                        <h4>Teacher</h4>
                        <p className="teacher-name"><strong>{teacherName}</strong></p>
                        <p className="teacher-meta">{skill.teacher.completedTrades} trades • {skill.teacher.rating} ⭐</p>

                        <div className="teacher-card-actions">
                            <button className="btn btn-outline" onClick={handleStartNegotiation}>Start Negotiation</button>
                            <div className="teacher-note">Message the teacher to discuss timing, content and expectations before sending a swap request.</div>
                        </div>
                    </div>
                    {/* Teacher's desired skills (transparency) */}
                    <div className="teacher-wants" style={{ marginTop: '12px' }}>
                        <h5 style={{ margin: '8px 0' }}>Teacher Wants To Learn</h5>
                        {teacherProfile && Array.isArray(teacherProfile.skillsToLearn) && teacherProfile.skillsToLearn.length > 0 ? (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {teacherProfile.skillsToLearn.map((s, i) => (
                                    <span key={i} className="skill-tag" style={{ textTransform: 'lowercase' }}>{s}</span>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-secondary)' }}>No preferences listed.</div>
                        )}
                    </div>
                </aside>
            </div>
            {/* Swap Confirmation Modal */}
            <SwapConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={confirmSwapAndSendRequest}
                skillToLearn={skillTitle}
                skillToOffer={selectedOfferSkill}
                teacherName={teacherName}
            />
        </main>
    );
};

        export default SkillDetailPage;