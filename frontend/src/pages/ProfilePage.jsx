// src/pages/ProfilePage.jsx (FINAL VERSION with Functional Editing and Swap History)
import * as React from 'react';
import { useMemo, useState, useCallback, useEffect } from 'react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { getInitials } from '../components/SkillCard'; 
import ReviewModal from '../components/UI/ReviewModal';

// --- Helper Functions (Must be defined outside the component) ---

// Function to safely load swap requests from local storage
const loadSwapHistory = (userEmail) => {
    const allRequests = JSON.parse(localStorage.getItem('userSwapRequests') || '[]');
    
    if (!userEmail || userEmail === 'guest@example.com') return [];

    // Filter to show only requests sent by the current user (case-insensitive email check)
    return allRequests.filter(req => 
        req.learnerId && req.learnerId.toLowerCase() === userEmail.toLowerCase()
    );
};

// Handler to delete a swap request from localStorage
const handleDeleteRequest = (requestId, userEmail, handleRefresh) => {
    if (!window.confirm('Are you sure you want to cancel this swap request?')) return;

    try {
        const allRequests = JSON.parse(localStorage.getItem('userSwapRequests') || '[]');
        const filtered = allRequests.filter(r => String(r.id) !== String(requestId));
        localStorage.setItem('userSwapRequests', JSON.stringify(filtered));

        // Trigger parent refresh
        if (typeof handleRefresh === 'function') handleRefresh();
    } catch (err) {
        console.error('Failed to delete swap request', err);
        alert('There was a problem cancelling the request. Please try again.');
    }
};

// Component to display a single swap request item
    const SwapRequestItem = ({ request, userEmail, handleRefresh, handleUpdateStatus, handleCompleteAndRate }) => {
    let statusClass = 'pending';
    if (request.status === 'APPROVED') statusClass = 'approved';
    if (request.status === 'REJECTED') statusClass = 'rejected';

    return (
        <div 
            style={{ 
                padding: '12px 16px', 
                border: '1px solid var(--border-color)', 
                borderRadius: '6px', 
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-secondary)',
                boxShadow: 'var(--shadow)'
            }}
        >
            <div>
                <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    Learning: {request.skillRequested} (from {request.teacherName})
                </p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Offering: {request.skillOffered}
                </p>
            </div>
            <div style={{ textAlign: 'right' }}>
                <span className={`swap-status ${statusClass}`} 
                      style={{ 
                          fontWeight: 'bold', 
                          color: statusClass === 'pending' ? '#f59e0b' : (statusClass === 'approved' ? '#10b981' : '#dc2626') 
                      }}>
                    Status: {request.status}
                </span>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                    Requested: {request.dateRequested}
                </p>
            </div>
            <div style={{ marginLeft: '12px', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* PENDING: Cancel + Accept Trade (teacher action simulated) */}
                {request.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            className="btn btn-secondary btn-small"
                            onClick={() => handleDeleteRequest(request.id, userEmail, handleRefresh)}
                        >
                            Cancel
                        </button>
                        <button className="btn btn-primary btn-small" onClick={() => handleUpdateStatus(request.id, 'APPROVED')}>
                            Accept Trade
                        </button>
                    </div>
                )}

                {/* APPROVED: allow marking trade complete */}
                {request.status === 'APPROVED' && (
                    <button className="btn btn-primary btn-small" onClick={() => handleUpdateStatus(request.id, 'COMPLETED')}>
                        Mark Trade Complete
                    </button>
                )}

                {/* COMPLETED: allow leaving a review (opens modal) */}
                {request.status === 'COMPLETED' && (
                    <button className="btn btn-primary btn-small" onClick={() => handleCompleteAndRate(request)}>
                        Leave Review
                    </button>
                )}

                {/* REVIEWED: static indicator */}
                {request.status === 'REVIEWED' && (
                    <div style={{ fontWeight: '700', color: '#10b981' }}>Review Left</div>
                )}
            </div>
        </div>
    );
};


const ProfilePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, updateProfile } = useAuth();
    const isLoggedIn = user.isLoggedIn;
    
    // State to force data reload when Refresh button is clicked
    const [refreshTrigger, setRefreshTrigger] = useState(0); 
    // Review modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSwapToRate, setCurrentSwapToRate] = useState(null);
    
    // Destructure user properties
    const { 
        firstName, lastName, email, bio, 
        rating = 0, trades = 0, dateJoined = 'N/A', 
        skillsToTeach = [], skillsToLearn = [] 
    } = user;

    // --- SWAP HISTORY LOGIC ---
    const swapRequests = useMemo(() => {
        if (email && email !== 'guest@example.com') {
            return loadSwapHistory(email);
        }
        return [];
    }, [email, refreshTrigger]); 

    // --- HANDLER FUNCTIONS ---

    // 1. Edit Profile Logic (Now includes Email change)
    const handleEditProfile = () => {
        if (!isLoggedIn) {
            alert("Please sign up or log in to edit your profile.");
            return navigate('/signup');
        }

        const currentBio = bio || '';
        const currentFirstName = firstName || '';
        const currentLastName = lastName || '';
        const currentEmail = email || ''; 

        // --- Data Prompts ---
        const newFirstName = prompt("Enter your first name:", currentFirstName);
        if (newFirstName === null) return;

        const newLastName = prompt("Enter your last name:", currentLastName);
        if (newLastName === null) return;

        const newEmail = prompt("Enter your email:", currentEmail);
        if (newEmail === null) return;

        const newBio = prompt("Enter your bio:", currentBio);
        if (newBio === null) return;
        // --- End Prompts ---

        // Construct the update object
        const updatedFields = {};
        let changesMade = false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (newFirstName.trim() !== currentFirstName) { updatedFields.firstName = newFirstName.trim(); changesMade = true; }
        if (newLastName.trim() !== currentLastName) { updatedFields.lastName = newLastName.trim(); changesMade = true; }
        if (newBio.trim() !== currentBio) { updatedFields.bio = newBio.trim(); changesMade = true; }
        
        // Check and update email
        if (newEmail.trim().toLowerCase() !== currentEmail.toLowerCase()) {
            if (!emailRegex.test(newEmail.trim())) {
                alert("Invalid email format. Please try again.");
                return;
            }
            updatedFields.email = newEmail.trim();
            changesMade = true;
            alert("Warning: Email address has been changed. You will use the new email for future logins.");
        }

        if (changesMade) {
            updateProfile(updatedFields); // Update global state and localStorage
            alert("Profile updated successfully!");
        } else {
            alert("No changes were made.");
        }
    };

    // 2. Add Skill Logic
    const handleAddSkill = (type) => {
        if (!isLoggedIn) {
            alert("Please sign up or log in to add skills.");
            return navigate('/signup');
        }

        const skill = prompt(`Enter a skill you want to ${type}:`);
        if (skill && skill.trim() !== "") {
            const skillName = skill.trim().toLowerCase();
            const skillListKey = type === 'teach' ? 'skillsToTeach' : 'skillsToLearn';
            // Ensure case-insensitive uniqueness
            const existing = (user[skillListKey] || []).map(s => String(s).toLowerCase());
            if (existing.includes(skillName)) {
                alert(`${skillName} is already on your list.`);
                return;
            }

            const updatedList = [...existing, skillName];
            updateProfile({ [skillListKey]: updatedList });
        }
    };

    // 3. Remove Skill Logic
    const handleRemoveSkill = (skillToRemove, type) => {
        const skillListKey = type === 'teach' ? 'skillsToTeach' : 'skillsToLearn';
        const target = String(skillToRemove).toLowerCase();
        const updatedList = (user[skillListKey] || []).filter(s => String(s).toLowerCase() !== target);
        updateProfile({ [skillListKey]: updatedList });
    };
    
    // 4. Authentication Logic
    const handleAuth = (isLoggingOut) => {
        if (isLoggingOut) {
            if (window.confirm("Are you sure you want to sign out?")) {
                logout();
                navigate('/');
            }
        } else {
            navigate('/signup');
        }
    };

    // 5. Refresh Button Handler
    const handleRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1); // Forces useMemo to re-run loadSwapHistory
        alert('Refreshing swap history...');
    }, []);

    // Update status of a swap request and refresh list
    const handleUpdateStatus = (requestId, newStatus) => {
        try {
            const allRequests = JSON.parse(localStorage.getItem('userSwapRequests') || '[]');
            const updated = allRequests.map(r => {
                if (String(r.id) === String(requestId)) return { ...r, status: newStatus };
                return r;
            });
            localStorage.setItem('userSwapRequests', JSON.stringify(updated));
            // trigger the same refresh used elsewhere
            handleRefresh();
        } catch (err) {
            console.error('Failed to update swap status', err);
            alert('There was a problem updating the request status.');
        }
    };

    // Accept trade (simulate teacher accepting learner's request)
    const handleAcceptTrade = (request) => {
        if (!request) return;
        handleUpdateStatus(request.id, 'APPROVED');
        alert('Trade accepted — status set to APPROVED.');
    };

    // Mark trade complete (simulate finishing exchange)
    const handleMarkComplete = (request) => {
        if (!request) return;
        handleUpdateStatus(request.id, 'COMPLETED');
        alert('Trade marked as COMPLETED. You may now leave a review.');
    };

    // When a swap is completed, open review modal (only for COMPLETED)
    const handleCompleteAndRate = (request) => {
        if (!request) return;
        if (request.status !== 'COMPLETED') {
            alert('You can only leave a review after the trade is marked COMPLETED.');
            return;
        }
        setCurrentSwapToRate(request);
        setIsModalOpen(true);
    };

    // Submit review from modal
    const handleSubmitReview = ({ rating, feedback }) => {
        try {
            const reviews = JSON.parse(localStorage.getItem('swapReviews') || '[]');
            const review = {
                swapId: currentSwapToRate?.id,
                teacherName: currentSwapToRate?.teacherName,
                rating,
                feedback,
                date: new Date().toISOString()
            };
            reviews.push(review);
            localStorage.setItem('swapReviews', JSON.stringify(reviews));

            // mark the original swap as REVIEWED
            if (currentSwapToRate) handleUpdateStatus(currentSwapToRate.id, 'REVIEWED');

            setIsModalOpen(false);
            setCurrentSwapToRate(null);
            alert('Thank you for your review!');
        } catch (err) {
            console.error('Failed to submit review', err);
            alert('Failed to submit review. Please try again.');
        }
    };

    // If navigated to profile with a refreshKey in state, ensure we refresh once
    useEffect(() => {
        try {
            const stateKey = location?.state?.refreshKey;
            if (stateKey) {
                setRefreshTrigger(prev => prev + 1);
                // Clear navigation state to avoid repeated triggers
                if (window && window.history && window.history.replaceState) {
                    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
                }
            }
        } catch (err) {
            // ignore
        }
    }, [location]);

    // Listen for other tabs or same-tab storage changes and refresh when userSwapRequests changes
    useEffect(() => {
        const onStorage = (e) => {
            if (!e) return;
            if (e.key === 'userSwapRequests') {
                setRefreshTrigger(prev => prev + 1);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);


    // --- Skill Tag Sub-Component ---
    const SkillTag = ({ skill, type }) => (
        <span className="skill-tag">
            {skill}
            {isLoggedIn && (
                <button className="remove-btn" onClick={() => handleRemoveSkill(skill, type)}> ✖</button>
            )}
        </span>
    );


    return (
        <main className="profile-main">
            <div className="container">
                <div className="profile-container">
                    {/* Profile Header */}
                    <section className="profile-header">
                        <div className="profile-avatar">
                            <div className="avatar-circle">
                                {getInitials(`${firstName} ${lastName}`)}
                            </div>
                        </div>

                        <div className="profile-info">
                            <h2>{firstName} {lastName}</h2>
                            <p className="user-email">{email}</p>
                            <p className="user-bio">{bio}</p>

                            <div className="profile-stats">
                                <div className="stat">
                                    <span className="stat-number">{rating}</span>
                                    <span className="stat-label">Rating</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-number">{trades}</span>
                                    <span className="stat-label">Trades</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-number">{dateJoined}</span>
                                    <span className="stat-label">Member Since</span>
                                </div>
                            </div>
                        </div>

                        <div className="profile-actions">
                            <button className="btn btn-primary" onClick={handleEditProfile} disabled={!isLoggedIn}>
                                Edit Profile
                            </button>
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => handleAuth(isLoggedIn)}
                            >
                                {isLoggedIn ? 'Sign Out' : 'Sign In'}
                            </button>
                        </div>
                    </section>

                    {/* Profile Content */}
                    <div className="profile-content">
                        {/* Teach Skills */}
                        <section className="skills-section">
                            <header className="section-header">
                                <h3>Skills I Can Teach</h3>
                                <button className="btn btn-secondary btn-small" onClick={() => handleAddSkill('teach')} disabled={!isLoggedIn}>
                                    + Add Skill
                                </button>
                            </header>
                            <div id="teach-skills" className="skills-grid">
                                {skillsToTeach.map((skill, index) => (
                                    <SkillTag key={index} skill={skill} type="teach" />
                                ))}
                            </div>
                        </section>

                        {/* Learn Skills */}
                        <section className="skills-section">
                            <header className="section-header">
                                <h3>Skills I Want to Learn</h3>
                                <button className="btn btn-secondary btn-small" onClick={() => handleAddSkill('learn')} disabled={!isLoggedIn}>
                                    + Add Skill
                                </button>
                            </header>
                            <div id="learn-skills" className="skills-grid">
                                {skillsToLearn.map((skill, index) => (
                                    <SkillTag key={index} skill={skill} type="learn" />
                                ))}
                            </div>
                        </section>

                        {/* --- SWAP HISTORY SECTION --- */}
                        <section className="skills-section">
                            <header className="section-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}>Swap History ({swapRequests.length})</h3>
                                <button 
                                    className="btn btn-primary btn-small" 
                                    onClick={handleRefresh}
                                    style={{ padding: '6px 12px', fontSize: '13px' }}
                                    disabled={!isLoggedIn}
                                >
                                    Refresh
                                </button>
                            </header>
                            <div>
                                {swapRequests.length === 0 ? (
                                    <div style={{ padding: '15px', border: '1px solid var(--border-color)', borderRadius: '4px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                        You have no active or pending swap requests yet. Start browsing skills and send a swap request!
                                    </div>
                                ) : (
                                    swapRequests.map(req => (
                                        <SwapRequestItem
                                            key={req.id}
                                            request={req}
                                            userEmail={email}
                                            handleRefresh={handleRefresh}
                                            handleUpdateStatus={handleUpdateStatus}
                                            handleCompleteAndRate={handleCompleteAndRate}
                                        />
                                    ))
                                )}
                            </div>
                        </section>
                        {/* ---------------------------------- */}
                    </div>
                </div>
            </div>
            {/* Review modal rendered at page level */}
            <ReviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmitReview} swapInfo={currentSwapToRate} />
        </main>
    );
};

export default ProfilePage;