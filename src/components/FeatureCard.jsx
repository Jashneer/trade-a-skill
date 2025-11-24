// src/components/FeatureCard.jsx (MUST BE IN THIS FILE ONLY)
import * as React from 'react'; 
import { useState } from 'react'; // Re-import hooks directly

const FeatureCard = ({ feature }) => (
    <div className="feature">
        <div className="feature-icon" role="img" aria-label={`${feature.title} emoji`}>{feature.icon}</div>
        <h3>{feature.title}</h3>
        <p>{feature.description}</p>
    </div>
);

export default FeatureCard;