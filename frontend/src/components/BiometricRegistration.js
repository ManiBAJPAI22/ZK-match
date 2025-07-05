import React, { useState } from 'react';
import './BiometricRegistration.css';

const BiometricRegistration = () => {
    const [userId, setUserId] = useState('');
    const [biometricVector, setBiometricVector] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    // Generate random biometric vector for demo purposes
    const generateRandomVector = () => {
        const vector = Array(512).fill(0).map(() => (Math.random() * 2 - 1).toFixed(4));
        setBiometricVector(vector.join(', '));
    };

    // Generate similar vector (for testing duplicate detection)
    const generateSimilarVector = () => {
        if (!biometricVector) {
            generateRandomVector();
            return;
        }
        const currentVector = biometricVector.split(',').map(v => parseFloat(v.trim()));
        const similarVector = currentVector.map(val => (val + (Math.random() - 0.5) * 0.1).toFixed(4));
        setBiometricVector(similarVector.join(', '));
    };

    const handleRegister = async (e) => {
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
                .map(v => parseFloat(v.trim()))
                .filter(v => !isNaN(v));

            if (vectorArray.length !== 512) {
                throw new Error('Vector must have exactly 512 dimensions');
            }

            // Send registration request
            const response = await fetch('/api/biometric/register', {
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
                    message: data.message,
                    userId: data.userId,
                    commitment: data.commitment
                });
                // Clear form on success
                setUserId('');
                setBiometricVector('');
            } else {
                setResult({
                    success: false,
                    message: data.error,
                    details: data.similarity ? `Similarity: ${data.similarity}` : null
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
            const vector = vectorStr.split(',').map(v => parseFloat(v.trim()));
            return {
                valid: vector.length === 512 && vector.every(v => !isNaN(v)),
                length: vector.length
            };
        } catch {
            return { valid: false, length: 0 };
        }
    };

    const vectorValidation = validateVector(biometricVector);

    return (
        <div className="biometric-registration">
            <div className="registration-container">
                <h2>👤 Biometric Registration</h2>
                <p className="description">
                    Register a new biometric identity using Zero-Knowledge proofs. 
                    Your biometric data is never stored - only a cryptographic commitment.
                </p>

                <form onSubmit={handleRegister} className="registration-form">
                    <div className="form-group">
                        <label htmlFor="userId">User ID</label>
                        <input
                            type="text"
                            id="userId"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="Enter unique user identifier"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="biometricVector">
                            Biometric Vector (512 dimensions)
                            <span className="vector-info">
                                {biometricVector && (
                                    <span className={vectorValidation.valid ? 'valid' : 'invalid'}>
                                        {vectorValidation.length}/512 dimensions
                                        {vectorValidation.valid ? ' ✅' : ' ❌'}
                                    </span>
                                )}
                            </span>
                        </label>
                        <textarea
                            id="biometricVector"
                            value={biometricVector}
                            onChange={(e) => setBiometricVector(e.target.value)}
                            placeholder="Enter 512 comma-separated numbers (e.g., 0.1234, -0.5678, ...)"
                            rows="10"
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
                                🎲 Generate Random
                            </button>
                            <button
                                type="button"
                                onClick={generateSimilarVector}
                                className="helper-btn"
                                disabled={loading}
                            >
                                🔄 Generate Similar
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="register-btn"
                        disabled={loading || !vectorValidation.valid}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Generating ZK Proof...
                            </>
                        ) : (
                            '🔐 Register Biometric'
                        )}
                    </button>
                </form>

                {error && (
                    <div className="alert alert-error">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {result && (
                    <div className={`alert ${result.success ? 'alert-success' : 'alert-error'}`}>
                        <h3>{result.success ? '✅ Registration Successful' : '❌ Registration Failed'}</h3>
                        <p><strong>Message:</strong> {result.message}</p>
                        {result.success && (
                            <>
                                <p><strong>User ID:</strong> {result.userId}</p>
                                <p><strong>Commitment:</strong> {result.commitment}</p>
                                <div className="success-info">
                                    <p>🔒 Your biometric data has been securely committed using Zero-Knowledge cryptography.</p>
                                    <p>🛡️ The original biometric vector is never stored and cannot be recovered.</p>
                                </div>
                            </>
                        )}
                        {result.details && (
                            <p><strong>Details:</strong> {result.details}</p>
                        )}
                    </div>
                )}

                <div className="info-section">
                    <h3>🔍 How It Works</h3>
                    <div className="info-steps">
                        <div className="step">
                            <span className="step-number">1</span>
                            <div className="step-content">
                                <strong>Vector Processing:</strong> Your biometric is converted to 512 numbers
                            </div>
                        </div>
                        <div className="step">
                            <span className="step-number">2</span>
                            <div className="step-content">
                                <strong>Commitment Generation:</strong> A cryptographic commitment is created
                            </div>
                        </div>
                        <div className="step">
                            <span className="step-number">3</span>
                            <div className="step-content">
                                <strong>Uniqueness Check:</strong> ZK proofs verify no similar biometric exists
                            </div>
                        </div>
                        <div className="step">
                            <span className="step-number">4</span>
                            <div className="step-content">
                                <strong>Secure Storage:</strong> Only the commitment is stored, never the original data
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BiometricRegistration;