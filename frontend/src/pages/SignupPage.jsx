import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
const SignupPage = () => {
    const navigate = useNavigate();
    const { user, login } = useAuth();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        bio: '',
        skillsToTeach: '',
        skillsToLearn: '',
        terms: false
    });

    // Member 3: Profile picture state
    const [profilePic, setProfilePic] = useState(null);
    const [profilePicPreview, setProfilePicPreview] = useState(null);

    const handleProfilePicChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please select a valid image (JPEG, PNG, GIF, or WebP)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be under 5MB');
            return;
        }
        setProfilePic(file);
        setProfilePicPreview(URL.createObjectURL(file));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Redirect if already logged in
    useEffect(() => {
        if (user?.isLoggedIn) {
            navigate('/profile');
        }
    }, [user, navigate]);

    // After successful signup
    const handleLoginSuccess = (userData, token) => {
        login(userData, token);
        alert('Account created successfully!');
        window.location.replace('/profile');
    };

    // ✅ SIGNUP FUNCTION
    const handleSignup = async () => {
        try {
            const payload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                bio: formData.bio,
                skillsToTeach: formData.skillsToTeach
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                skillsToLearn: formData.skillsToLearn
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
            };

            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || `Signup failed (${res.status})`);
            }

            if (!data || !data.user) {
                throw new Error('Signup failed: invalid response from server');
            }

            // Member 3: Upload profile picture if selected
            if (profilePic && data.token) {
                try {
                    const uploadForm = new FormData();
                    uploadForm.append('profileImage', profilePic);
                    const uploadRes = await fetch('/api/upload/profile-image', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + data.token },
                        body: uploadForm,
                    });
                    const uploadData = await uploadRes.json();
                    if (uploadRes.ok && uploadData.success) {
                        data.user.profileImage = uploadData.data.imageUrl;
                    }
                } catch (uploadErr) {
                    console.warn('Profile pic upload failed, continuing signup:', uploadErr);
                }
            }

            // ✅ LOGIN USER
            handleLoginSuccess(data.user, data.token);
        } catch (err) {
            console.error('Signup error:', err);
            alert(`Signup failed: ${err.message}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (user?.isLoggedIn) {
            navigate('/profile');
            return;
        }

        const { password, confirmPassword, terms } = formData;

        if (password.length < 8) {
            alert("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (!terms) {
            alert("You must accept terms.");
            return;
        }

        await handleSignup();
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
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name</label>
                                <input
                                    name="firstName"
                                    required
                                    value={formData.firstName}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    name="lastName"
                                    required
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Member 3: Profile Picture Upload */}
                        <div className="form-group">
                            <label>Profile Picture (optional)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                                <div style={{
                                    width: '72px', height: '72px', borderRadius: '50%',
                                    background: profilePicPreview ? 'none' : 'var(--bg-secondary, #f0f0f0)',
                                    border: '2px dashed var(--border-color, #ccc)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden', cursor: 'pointer', flexShrink: 0
                                }} onClick={() => document.getElementById('signup-pfp-input').click()}>
                                    {profilePicPreview ? (
                                        <img src={profilePicPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '24px' }}>📷</span>
                                    )}
                                </div>
                                <div>
                                    <button type="button" className="btn btn-secondary btn-small" onClick={() => document.getElementById('signup-pfp-input').click()}>
                                        {profilePic ? 'Change Photo' : 'Choose Photo'}
                                    </button>
                                    {profilePic && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{profilePic.name}</p>}
                                </div>
                                <input type="file" id="signup-pfp-input" accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} onChange={handleProfilePicChange} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Bio</label>
                            <textarea
                                name="bio"
                                rows="3"
                                value={formData.bio}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Skills You Can Teach</label>
                            <input
                                name="skillsToTeach"
                                placeholder="e.g. JavaScript, Guitar"
                                value={formData.skillsToTeach}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Skills You Want to Learn</label>
                            <input
                                name="skillsToLearn"
                                placeholder="e.g. Python, Cooking"
                                value={formData.skillsToLearn}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="terms"
                                    checked={formData.terms}
                                    onChange={handleChange}
                                />
                                I agree to Terms & Conditions
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary btn-full">
                            Create Account
                        </button>

                        <div className="signup-footer">
                            <p>
                                Already have an account? <Link to="/login">Sign In</Link>
                            </p>
                        </div>

                    </form>
                </div>
            </div>
        </main>
    );
};

export default SignupPage;