// src/components/Layout/Footer.jsx
import * as React from 'react'; 
import { useState } from 'react'; // Re-import hooks directly
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-brand">
                        <h3>TradeASkill</h3>
                        <p>Connecting learners and teachers worldwide.</p>
                    </div>
                    <div className="footer-links">
                        <div className="footer-column">
                            <h4>Platform</h4>
                            <ul>
                                <li><Link to="/dashboard">Browse Skills</Link></li>
                                <li><Link to="/signup">Sign Up</Link></li>
                                <li><Link to="/profile">Profile</Link></li>
                            </ul>
                        </div>
                        <div className="footer-column">
                            <h4>Support</h4>
                            <ul>
                                <li><Link to="/help">Help Center</Link></li>
                                <li><Link to="/contact">Contact Us</Link></li>
                                <li><Link to="/guidelines">Community Guidelines</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2025 TradeASkill. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;