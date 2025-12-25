// src/App.jsx
import * as React from 'react'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layout Components
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';

// Page Components
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import SkillDetailPage from './pages/SkillDetailPage'; 
import ChatPage from './pages/ChatPage';
import LoginPage from './pages/LoginPage'; // Added for complete Auth flow

// Styles
import './styles/main.css'; 

const App = () => {
    return (
        <Router>
            <Header />
            <Routes>
                {/* Core application routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/login" element={<LoginPage />} /> {/* Login Page */}
                <Route path="/profile" element={<ProfilePage />} />
                
                {/* Dynamic Routes */}
                <Route path="/skill/:skillId" element={<SkillDetailPage />} />
                <Route path="/chat/:teacherId" element={<ChatPage />} /> 

                {/* 404 Catch-all route */}
                <Route path="*" element={<main className="container" style={{padding: '100px', textAlign: 'center'}}><h2>404: Page Not Found</h2><p>The page you requested does not exist.</p></main>} />
            </Routes>
            <Footer />
        </Router>
    );
};

export default App;