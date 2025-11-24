import React, { useState, useEffect } from 'react';

const Star = ({ filled, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '22px',
            color: filled ? '#f59e0b' : '#d1d5db'
        }}
        aria-label={filled ? 'Star selected' : 'Star'}
    >
        ★
    </button>
);

const ReviewModal = ({ isOpen, onClose, onSubmit, swapInfo }) => {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        if (isOpen) {
            setRating(0);
            setFeedback('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!rating || rating < 1) {
            alert('Please provide a rating of 1-5 stars.');
            return;
        }
        onSubmit({ rating, feedback });
    };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)'
                }}
                onClick={onClose}
            />

            <div
                role="dialog"
                aria-modal="true"
                style={{
                    position: 'relative',
                    maxWidth: '540px',
                    margin: '8vh auto',
                    background: 'white',
                    borderRadius: '8px',
                    padding: '18px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}
            >
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Leave a Review</h3>
                    <button className="btn btn-ghost" onClick={onClose}>✖</button>
                </header>

                <div style={{ marginTop: '12px' }}>
                    <div style={{ marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        {swapInfo?.teacherName ? (
                            <>
                                For: <strong>{swapInfo.teacherName}</strong> — <em>{swapInfo.skillRequested}</em>
                            </>
                        ) : (
                            <em>Swap details</em>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '10px' }}>
                        {[1,2,3,4,5].map((n) => (
                            <Star key={n} filled={n <= rating} onClick={() => setRating(n)} />
                        ))}
                        <span style={{ marginLeft: '8px', color: 'var(--text-secondary)' }}>{rating} / 5</span>
                    </div>

                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Write a short review or feedback for the teacher (optional)"
                        rows={5}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', resize: 'vertical' }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit}>Submit Review</button>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;

