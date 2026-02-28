// src/components/SkillCard.jsx
import * as React from 'react'; // Universal import fix for stability
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Used for login status check

// Utility Functions (MUST BE EXPORTED for use in other files like ProfilePage.jsx)
export const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);
export const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();


const SkillCard = ({ skill, currentView }) => {
    const navigate = useNavigate();
    const { user } = useAuth(); 
    
    // Check if the current user is logged in
    const isLoggedIn = user?.isLoggedIn; 
    const teacherInitials = getInitials(skill.teacher.name);

    // 1. View Button: Navigates to Skill Detail Page
    const handleView = () => {
        navigate(`/skill/${skill.id}`);
    };

    // 2. Message Button: Initiates Chat (Requires Authentication)
    const handleMessage = () => {
        if (!isLoggedIn) {
            alert("You must be signed in to message a teacher. Redirecting to Sign Up.");
            navigate('/signup');
            return;
        }
        
        const teacherName = skill.teacher.name;
        const skillTitle = skill.title; // Get the specific skill title for chat context
        
        alert(`Starting chat with ${teacherName} about ${skillTitle}.`);
        
        // Final Action: Navigate to the Chat Page, passing the teacher name AND the skill title
        // The skill title is passed as a query parameter for dynamic chat context.
        navigate(`/chat/${teacherName}?skill=${encodeURIComponent(skillTitle)}`); 
    };

    return (
        <article className={`skill-card ${currentView === 'list' ? 'list-view' : ''}`} data-skill-id={skill.id}>
            <div className="skill-content">
                <div className="card-header">
                    <h3 className="skill-title">{skill.title}</h3>
                    <span className={`tag ${skill.category}`}>{capitalizeFirst(skill.category)}</span>
                </div>

                <p className="skill-description">{skill.description}</p>

                <div className="card-meta">
                    <span className={`level ${skill.level}`}>{capitalizeFirst(skill.level)}</span>
                    <span>{skill.duration}</span>
                </div>
            </div>

            <div className="instructor">
                <div className="avatar">{teacherInitials}</div>
                <div className="teacher-info">
                    <h4>{skill.teacher.name}</h4>
                    <p>{skill.teacher.rating} ⭐ • {skill.teacher.completedTrades} trades</p>
                </div>
            </div>

            <div className="card-actions">
                <button className="btn-primary" onClick={handleView}>
                    View
                </button>
                <button 
                    className="btn-outline contact-btn" 
                    onClick={handleMessage}
                >
                    Message
                </button>
            </div>
        </article>
    );
};

export default SkillCard;