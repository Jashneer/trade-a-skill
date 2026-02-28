// src/components/Layout/Header.jsx
import * as React from 'react'; // Universal import fix
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout } = useAuth(); 
    const isLoggedIn = user.isLoggedIn;

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleAuthClick = (e) => {
        if (isLoggedIn) {
            e.preventDefault();
            if (window.confirm("Are you sure you want to sign out?")) {
                logout(); 
            }
        }
        toggleMenu(); 
    };

    return (
        <header className="header">
            <nav className="nav container">
                <div className="nav-brand">
                    <Link to="/" aria-label="TradeASkill Home">
                        <h1>TradeASkill</h1>
                    </Link>
                </div>

                <button
                    className={`nav-toggle ${isMenuOpen ? 'nav-toggle-active' : ''}`}
                    aria-label="Toggle navigation menu"
                    onClick={toggleMenu}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <ul className={`nav-links ${isMenuOpen ? 'nav-links-active' : ''}`}>
                    <li><Link to="/" onClick={toggleMenu}>Home</Link></li>
                    <li><Link to="/dashboard" onClick={toggleMenu}>Browse Skills</Link></li>
                    <li><Link to="/profile" onClick={toggleMenu}>My Profile</Link></li>
                    <li>
                        <Link 
                            to={isLoggedIn ? "#" : "/signup"} 
                            className="btn btn-primary" 
                            onClick={handleAuthClick}
                        >
                            {isLoggedIn ? 'Sign Out' : 'Sign Up'}
                        </Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;