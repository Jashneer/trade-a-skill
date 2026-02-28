import React from 'react';

const SwapConfirmationModal = ({ isOpen, onClose, onConfirm, skillToLearn, skillToOffer, teacherName }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="modal-content">
                <h3 style={{ marginTop: 0 }}>Confirm Swap</h3>
                <p style={{ marginTop: 8, marginBottom: 16 }}>
                    Confirm Swap: Learn <strong>{skillToLearn}</strong> by offering <strong>{skillToOffer}</strong> to <strong>{teacherName}</strong>.
                </p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={onConfirm}>Confirm</button>
                </div>
            </div>
        </div>
    );
};

export default SwapConfirmationModal;
