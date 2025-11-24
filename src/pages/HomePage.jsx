// src/pages/HomePage.jsx
import * as React from 'react'; // Use universal import
import { Link } from 'react-router-dom';
// Features will be fetched from JSON Server at runtime
// import { MOCK_DATA } from '../data/mockData';
import { useState, useEffect } from 'react';
import FeatureCard from '../components/FeatureCard';

const HomePage = () => {
    // Scroll function (replaces JS scrollIntoView)
    const handleLearnMoreClick = (e) => {
        e.preventDefault();
        const targetElement = document.getElementById('how-it-works');
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <main>
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-text">
                            <h2>Learn. Teach. Trade Skills.</h2>
                            <p>Connect with like-minded people to exchange knowledge and skills. Teach what you know, learn what you need.</p>
                            <div className="hero-actions">
                                <Link to="/signup" className="btn btn-primary btn-large">Get Started Free</Link>
                                <a href="#how-it-works" className="btn btn-secondary btn-large" onClick={handleLearnMoreClick}>Learn More</a>
                            </div>
                        </div>
                        <div className="hero-image">
                            <img src="https://images.pexels.com/photos/3184611/pexels-photo-3184611.jpeg?auto=compress&cs=tinysrgb&w=600"
                                alt="People collaborating and learning together"
                                loading="lazy" />
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="how-it-works">
                <div className="container">
                    <h2>How It Works</h2>
                    <div className="steps">
                        <div className="step">
                            <div className="step-number">1</div>
                            <h3>Create Your Profile</h3>
                            <p>List the skills you can teach and the skills you want to learn.</p>
                        </div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <h3>Find Your Match</h3>
                            <p>Browse through available skills or get matched with compatible learners.</p>
                        </div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <h3>Start Trading</h3>
                            <p>Connect with your match and start exchanging knowledge and skills.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features">
                <div className="container">
                    <h2>Why Choose TradeASkill?</h2>
                            <div className="features-grid">
                                {/** Load features from API */}
                                <FeatureList />
                            </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <div className="container">
                    <h2>Ready to Start Trading Skills?</h2>
                    <p>Join thousands of learners and teachers in our growing community.</p>
                    <Link to="/signup" className="btn btn-primary btn-large">Join TradeASkill Today</Link>
                </div>
            </section>
        </main>
    );
};

export default HomePage;

// Small inline component to fetch and render features from JSON Server
function FeatureList() {
    const [features, setFeatures] = useState([]);

    useEffect(() => {
        let mounted = true;
        const fetchFeatures = async () => {
            try {
                const res = await fetch('http://localhost:3000/features');
                if (!res.ok) throw new Error('Failed to fetch features');
                const data = await res.json();
                if (mounted) setFeatures(data || []);
            } catch (err) {
                console.error('Feature fetch error', err);
            }
        };
        fetchFeatures();
        return () => { mounted = false; };
    }, []);

    if (!features || features.length === 0) return <div>Loading features...</div>;

    return (
        <>
            {features.map(feature => <FeatureCard key={feature.id} feature={feature} />)}
        </>
    );
}