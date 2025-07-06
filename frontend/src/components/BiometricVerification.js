import React, { useState } from 'react';
import './BiometricVerification.css';

// BiometricVerification.js
// Only ZK proofs and commitments are sent to the backend. Raw biometric vectors are never transmitted or stored.
// See docs/ARCHITECTURE.md for privacy details.

const BiometricVerification = () => {
    const [userId, setUserId] = useState('');
    const [biometricVector, setBiometricVector] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // Generate random biometric vector for demo
    const generateRandomVector = () => {
        const vector = Array(4).fill(0).map(() => 
            Math.floor(Math.random() * 1000 - 500)
        );
        setBiometricVector(vector.join(', '));
    };

    const handleVerification = async (e) => {
        e.preventDefault();
        
        if (!userId.trim()) {
            setError('User ID is required');
            return;
        }
        
        if (!biometricVector.trim()) {
            setError('Biometric vector is required');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Parse biometric vector
            const vectorArray = biometricVector
                .split(',')
                .map(v => parseInt(v.trim()))
                .filter(v => !isNaN(v));

            if (vectorArray.length !== 4) {
                throw new Error('Vector must have exactly 4 dimensions');
            }

            // Send verification request
            const response = await fetch('/api/biometric/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId.trim(),
                    biometricVector: vectorArray
                })
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    success: true,
                    verified: data.verified,
                    message: data.message,
                    userId: data.userId,
                    proof: data.proof
                });
            } else {
                setResult({
                    success: false,
                    message: data.error || 'Verification failed'
                });
            }

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const validateVector = (vectorStr) => {
        try {
            const vector = vectorStr.split(',').map(v => parseInt(v.trim()));
            return {
                valid: vector.length === 4 && vector.every(v => !isNaN(v)),
                length: vector.length
            };
        } catch {
            return { valid: false, length: 0 };
        }
    };

    const vectorValidation = validateVector(biometricVector);

    return (
        <div className="biometric-verification">
            <div className="verification-container">
                <h2>🔍 Biometric Verification</h2>
                <p className="description">
                    Verify your identity using your biometric data. The system will generate 
                    a Zero-Knowledge proof to confirm your identity without revealing your biometric.
                </p>

                <form onSubmit={handleVerification} className="verification-form">
                    <div className="form-group">
                        <label htmlFor="userId">User ID</label>
                        <input
                            type="text"
                            id="userId"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="Enter your user ID"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="biometricVector">
                            Biometric Vector (4 dimensions)
                            <span className="vector-info">
                                {biometricVector && (
                                    <span className={vectorValidation.valid ? 'valid' : 'invalid'}>
                                        {vectorValidation.length}/4 dimensions
                                        {vectorValidation.valid ? ' ✅' : ' ❌'}
                                    </span>
                                )}
                            </span>
                        </label>
                        <textarea
                            id="biometricVector"
                            value={biometricVector}
                            onChange={(e) => setBiometricVector(e.target.value)}
                            placeholder="Enter your biometric vector (4 comma-separated numbers)"
                            rows="4"
                            required
                            disabled={loading}
                        />
                        <div className="vector-helpers">
                            <button
                                type="button"
                                onClick={generateRandomVector}
                                className="helper-btn"
                                disabled={loading}
                            >
                                🎲 Generate Test Vector
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="verify-btn"
                        disabled={loading || !vectorValidation.valid}
                    >
                        {/* TODO: Add a spinner or progress indicator during verification/proof generation for better UX */}
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Generating ZK Proof...
                            </>
                        ) : (
                            '🔐 Verify Identity'
                        )}
                    </button>
                </form>

                {error && (
                    <div className="alert alert-error">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {result && (
                    <div className={`alert ${result.success && result.verified ? 'alert-success' : 'alert-error'}`}>
                        <h3>
                            {result.success && result.verified ? '✅ Verification Successful' : '❌ Verification Failed'}
                        </h3>
                        <p><strong>Message:</strong> {result.message}</p>
                        {result.success && result.verified && (
                            <>
                                <p><strong>User ID:</strong> {result.userId}</p>
                                <div className="success-info">
                                    <p>🔒 Identity verified using Zero-Knowledge proof</p>
                                    <p>🛡️ Your biometric data remains private</p>
                                </div>
                                {result.proof && (
                                    <details className="proof-details">
                                        <summary>View ZK Proof Details</summary>
                                        <pre className="proof-data">
                                            {JSON.stringify(result.proof, null, 2)}
                                        </pre>
                                    </details>
                                )}
                            </>
                        )}
                    </div>
                )}

                <div className="info-section">
                    <h3>🔍 Verification Process</h3>
                    <div className="info-steps">
                        <div className="step">
                            <span className="step-number">1</span>
                            <div className="step-content">
                                <strong>Vector Input:</strong> Enter your biometric vector
                            </div>
                        </div>
                        <div className="step">
                            <span className="step-number">2</span>
                            <div className="step-content">
                                <strong>Commitment Generation:</strong> Create cryptographic commitment
                            </div>
                        </div>
                        <div className="step">
                            <span className="step-number">3</span>
                            <div className="step-content">
                                <strong>ZK Proof:</strong> Generate proof of similarity with stored commitment
                            </div>
                        </div>
                        <div className="step">
                            <span className="step-number">4</span>
                            <div className="step-content">
                                <strong>Verification:</strong> Confirm identity without revealing biometric
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BiometricVerification;