import React from 'react';
import { getApiUrl } from '../lib/api';

const ExportButton = () => {
    const handleExport = () => {
        // Member 4: Direct streaming link trigger
        // Isse browser automatically TradeReport.json download kar lega
        window.location.href = getApiUrl('/api/export-history?format=json');
    };

    return (
        <button 
            className="btn btn-primary" 
            onClick={handleExport}
            style={{ 
                backgroundColor: '#28a745', 
                borderColor: '#28a745',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}
        >
            <span>📥</span> Export History
        </button>
    );
};

export default ExportButton;