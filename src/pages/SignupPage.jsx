// src/pages/SignupPage.jsx (FINAL STABLE VERSION - All GraphQL Removed)
import * as React from 'react'; 
import { useState, useEffect } from 'react'; 
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
// REMOVED: import { useMutation, gql } from '@apollo/client';
// REMOVED: import { SIGNUP_USER_MUTATION } from '../graphql/userMutations';

const SignupPage = () => {
    const navigate = useNavigate(); 
    const { user, login } = useAuth(); 
    
    // State remains the same
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
        bio: '', skillsToTeach: '', skillsToLearn: '', terms: false
    });
    
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Redirect user if already signed in
    useEffect(() => {
        if (user.isLoggedIn) {
            alert("You are already signed in. Redirecting to your profile.");
            navigate('/profile');
        }
    }, [user.isLoggedIn, navigate]);


    // Success handler that forces a full page refresh to stabilize AuthContext
    const handleLoginSuccess = (user) => {
        login(user); 
        alert("Account Created Successfully! Reloading to your profile.");
        setTimeout(() => {
            window.location.replace("/profile");
        }, 500); 
    }
    
    // Local storage logic (The ONLY remaining data persistence logic)
    const handleLocalSignup = async () => {
        const { firstName, lastName, email, password, bio, skillsToTeach, skillsToLearn } = formData;

        const normalize = (s) => s.split(",").map(skill => skill.trim().toLowerCase()).filter(Boolean);
        const newUser = {
            id: String(Date.now()),
            firstName, lastName, email, password, bio,
            skillsToTeach: normalize(skillsToTeach),
            skillsToLearn: normalize(skillsToLearn),
            dateJoined: new Date().toLocaleDateString(),
            rating: 0,
            trades: 0,
        };

        try {
            // Check if user exists
            const checkRes = await fetch(`http://localhost:3000/users?email=${encodeURIComponent(email)}`);
            if (!checkRes.ok) throw new Error('Failed to check existing users');
            const existing = await checkRes.json();
            if (existing && existing.length > 0) {
                alert('This email is already registered. Please use another email.');
                return;
            }

            // POST new user
            const postRes = await fetch('http://localhost:3000/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            if (!postRes.ok) throw new Error('Failed to create user');
            const created = await postRes.json();
            handleLoginSuccess(created);
        } catch (err) {
            console.error('Signup error', err);
            alert('Unable to reach server. Please try again later.');
        }
    }


    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (user.isLoggedIn) {
            navigate('/profile');
            return;
        }

        const { password, confirmPassword, terms } = formData;

        // Validation 
        if (password.length < 8 || password !== confirmPassword || !terms) {
             alert("Validation failed. Check password length (min 8), match, and terms.");
             return;
        }
        
        // Execute Signup using API-backed method
        await handleLocalSignup();
    };

    return (
        <main className="signup-main">
            <div className="container">
                <div className="signup-container">
                    <div className="signup-header">
                        <h2>Join TradeASkill</h2>
                        <p>Start your skill trading journey today</p>
                    </div>

                    <form className="signup-form" onSubmit={handleSubmit}>
                        {/* Form fields remain the same */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="firstName">First Name</label>
                                <input type="text" id="firstName" name="firstName" required minLength="2" placeholder="Enter your first name" value={formData.firstName} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="lastName">Last Name</label>
                                <input type="text" id="lastName" name="lastName" required minLength="2" placeholder="Enter your last name" value={formData.lastName} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input type="email" id="email" name="email" required placeholder="Enter your email address" value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input type="password" id="password" name="password" required minLength="8" placeholder="Create a strong password" value={formData.password} onChange={handleChange} />
                            <div className="password-requirements"><small>Password must be at least 8 characters long</small></div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input type="password" id="confirmPassword" name="confirmPassword" required minLength="8" placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} />
                        </div>

                        <div className="form-group">
                            <label htmlFor="bio">Tell us about yourself</label>
                            <textarea id="bio" name="bio" rows="4" placeholder="Share a bit about your background..." value={formData.bio} onChange={handleChange}></textarea>
                        </div>

                        <div className="form-group">
                            <label htmlFor="skillsToTeach">Skills You Can Teach</label>
                            <input type="text" id="skillsToTeach" name="skillsToTeach" required placeholder="e.g., JavaScript, Guitar (separate with commas)" value={formData.skillsToTeach} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="skillsToLearn">Skills You Want to Learn</label>
                            <input type="text" id="skillsToLearn" name="skillsToLearn" required placeholder="e.g., Python, Cooking (separate with commas)" value={formData.skillsToLearn} onChange={handleChange} />
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input type="checkbox" id="terms" name="terms" checked={formData.terms} onChange={handleChange} required />
                                <span className="checkmark"></span>
                                I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary btn-large btn-full">
                            Create Account
                        </button>

                        <div className="signup-footer">
                            <p>Already have an account? <Link to="/login">Sign In</Link></p>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default SignupPage;