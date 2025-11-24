// src/context/AuthContext.jsx (FINAL CORRECTED VERSION)
import * as React from 'react';
import { createContext, useState, useContext } from 'react';

// 1. Create the Context
const AuthContext = createContext(null);

// Utility to load user from localStorage
// src/context/AuthContext.jsx (Focus on getInitialUser)

const getInitialUser = () => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    
    // CRITICAL FIX: Assume logged in if a valid user profile exists AND is not the 'Guest' placeholder structure.
    const hasValidUser = user && user.email !== 'guest@example.com';
    const isLoggedIn = hasValidUser; 
    
    if (hasValidUser) {
        // Ensure skills are arrays
        return { 
            ...user, 
            isLoggedIn: true,
            skillsToTeach: Array.isArray(user.skillsToTeach) ? user.skillsToTeach : [],
            skillsToLearn: Array.isArray(user.skillsToLearn) ? user.skillsToLearn : [],
        };
    }
    // Return default Guest user object
    return {
        firstName: "Guest", lastName: "User", email: "guest@example.com",
        isLoggedIn: false, skillsToTeach: [], skillsToLearn: [],
        rating: 0, trades: 0, dateJoined: "N/A"
    };
};


// 2. Create the Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getInitialUser());
    
    const login = (userData) => {
        // Ensure new user data is saved with validated array properties during login
        const fullUser = { 
            ...userData, 
            isLoggedIn: true,
            skillsToTeach: Array.isArray(userData.skillsToTeach) ? userData.skillsToTeach : [],
            skillsToLearn: Array.isArray(userData.skillsToLearn) ? userData.skillsToLearn : [],
        };
        
        setUser(fullUser);
        localStorage.setItem("currentUser", JSON.stringify(fullUser));
        localStorage.setItem("isLoggedIn", "true");
    };

    const logout = () => {
        setUser(getInitialUser());
        localStorage.removeItem("currentUser");
        localStorage.setItem("isLoggedIn", "false");
    };

    const updateProfile = (newProfileData) => {
        setUser(prev => {
            // Merge new data while ensuring existing skills remain arrays
            const merged = {
                ...prev,
                ...newProfileData,
            };

            // Normalize skills to lowercase arrays for data integrity
            const normalize = (arr) => Array.isArray(arr) ? arr.map(s => String(s).trim().toLowerCase()).filter(Boolean) : [];

            const updatedUser = {
                ...merged,
                skillsToTeach: Array.isArray(newProfileData.skillsToTeach) ? normalize(newProfileData.skillsToTeach) : (prev.skillsToTeach || []).map(s => String(s).toLowerCase()),
                skillsToLearn: Array.isArray(newProfileData.skillsToLearn) ? normalize(newProfileData.skillsToLearn) : (prev.skillsToLearn || []).map(s => String(s).toLowerCase()),
            };

            localStorage.setItem("currentUser", JSON.stringify(updatedUser));

            // Update local users cache
            if (updatedUser.isLoggedIn) {
                let allUsers = JSON.parse(localStorage.getItem('tradeASkillUsers') || '[]');
                const index = allUsers.findIndex(u => u.email && u.email.toLowerCase() === updatedUser.email.toLowerCase());
                if (index !== -1) {
                    allUsers[index] = updatedUser;
                    localStorage.setItem('tradeASkillUsers', JSON.stringify(allUsers));
                }

                // Persist skills change to JSON Server asynchronously if user has an id
                (async () => {
                    try {
                        if (updatedUser.id) {
                            const patchBody = {
                                skillsToTeach: updatedUser.skillsToTeach,
                                skillsToLearn: updatedUser.skillsToLearn
                            };
                            await fetch(`http://localhost:3000/users/${encodeURIComponent(updatedUser.id)}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(patchBody)
                            });
                        }
                    } catch (err) {
                        console.error('Failed to persist profile changes to server', err);
                    }
                })();
            }

            return updatedUser;
        });
    };

    const value = { user, login, logout, updateProfile, isLoading: false };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Custom hook for consuming the context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};