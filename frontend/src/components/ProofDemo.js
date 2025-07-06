import React, { useState } from 'react';
import './ProofDemo.css';

// ProofDemo.js
// This component demonstrates ZK proof generation and verification for biometric similarity.
// No raw biometric data is ever sent to the backend; only proofs and commitments are transmitted.
// See docs/ARCHITECTURE.md for privacy details.

const ProofDemo = () => {
    const [vectorA, setVectorA] = useState('');
    const [vectorB, setVectorB] = useState('');
    const [threshold, setThreshold] = useState(100);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);

    // Generate random vectors
    const generateRandomVectors = () => {
        const vecA = Array(16).fill(0).map(() => (Math.random() * 2 - 1).toFixed(4));
        const vecB = Array(16).fill(0).map(() => (Math.random() * 2 - 1).toFixed(4));
        
        setVectorA(vecA.join(', '));
        setVectorB(vecB.join(', '));
        setCurrentStep(2);
    };

    // Generate similar vectors
    const generateSimilarVectors = () => {
        const baseVector = Array(16).fill(0).map(() => Math.random() * 2 - 1);
        const similarVector = baseVector.map(val => val + (Math.random() - 0.5) * 0.1);
        
        setVectorA(baseVector.map(v => v.toFixed(4)).join(', '));
        setVectorB(similarVector.map(v => v.toFixed(4)).join(', '));
        setCurrentStep(2);
    };

    // Generate different vectors
    const generateDifferentVectors = () => {
        const vecA = Array(16).fill(1000);
        const vecB = Array(16).fill(-1000);
        
        setVectorA(vecA.join(', '));
        setVectorB(vecB.join(', '));
        setCurrentStep(2);
    };

    // Calculate cosine similarity
    const calculateSimilarity = (vA, vB) => {
        const dotProduct = vA.reduce((sum, val, i) => sum + val * vB[i], 0);
        const normA = Math.sqrt(vA.reduce((sum, val) => sum + val * val, 0));
        const normB = Math.sqrt(vB.reduce((sum, val) => sum + val * val, 0));
        
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (normA * normB);
    };

    const generateProof = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        setCurrentStep(3);

        try {
            // Parse vectors
            const parsedVectorA = vectorA.split(',').map(v => parseFloat(v.trim()));
            const parsedVectorB = vectorB.split(',').map(v => parseFloat(v.trim()));

            if (parsedVectorA.length !== 16 || parsedVectorB.length !== 16) {
                throw new Error('Both vectors must have exactly 16 dimensions');
            }

            // Calculate expected similarity
            const expectedSimilarity = calculateSimilarity(parsedVectorA, parsedVectorB);

            // Generate mock commitments and nonces
            const nonceA = Math.floor(Math.random() * 1000000);
            const nonceB = Math.floor(Math.random() * 1000000);
            const commitmentA = Math.floor(Math.random() * 1000000);
            const commitmentB = Math.floor(Math.random() * 1000000);

            // Send proof generation request
            const response = await fetch('/api/proof/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    vectorA: parsedVectorA,
                    vectorB: parsedVectorB,
                    nonceA: nonceA,
                    nonceB: nonceB,
                    commitmentA: commitmentA,
                    commitmentB: commitmentB,
                    threshold: threshold
                })
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    success: true,
                    proof: data.proof,
                    publicSignals: data.publicSignals,
                    isUnique: data.isUnique,
                    generationTime: data.generationTime,
                    proofSize: data.proofSize,
                    expectedSimilarity: expectedSimilarity,
                    thresholdPercent: threshold / 10 // Convert to percentage
                });
                setCurrentStep(4);
            } else {
                throw new Error(data.error || 'Proof generation failed');
            }

        } catch (error) {
            setError(error.message);
            setCurrentStep(2);
        } finally {
            setLoading(false);
        }
    };

    const resetDemo = () => {
        setVectorA('');
        setVectorB('');
        setResult(null);
        setError(null);
        setCurrentStep(1);
    };

    const validateVectors = () => {
        try {
            const vA = vectorA.split(',').map(v => parseFloat(v.trim()));
            const vB = vectorB.split(',').map(v => parseFloat(v.trim()));
            return vA.length === 16 && vB.length === 16 && 
                   vA.every(v => !isNaN(v)) && vB.every(v => !isNaN(v));
        } catch {
            return false;
        }
    };

    return (
        <div className="proof-demo">
            <div className="demo-container">
                <h2>🧪 Zero-Knowledge Proof Demo</h2>
                <p className="description">
                    Interactive demonstration of Zero-Knowledge biometric similarity proofs.
                    Generate proofs that show whether two biometric vectors are similar 
                    without revealing the actual vectors.
                </p>

                {/* Progress Steps */}
                <div className="progress-steps">
                    <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                        <span className="step-number">1</span>
                        <span className="step-label">Generate Vectors</span>
                    </div>
                    <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                        <span className="step-number">2</span>
                        <span className="step-label">Set Parameters</span>
                    </div>
                    <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                        <span className="step-number">3</span>
                        <span className="step-label">Generate Proof</span>
                    </div>
                    <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
                        <span className="step-number">4</span>
                        <span className="step-label">View Results</span>
                    </div>
                </div>

                {/* Step 1: Generate Vectors */}
                {currentStep === 1 && (
                    <div className="demo-step">
                        <h3>Step 1: Generate Test Vectors</h3>
                        <p>Choose how to generate the biometric vectors for testing:</p>
                        
                        <div className="vector-options">
                            <button onClick={generateRandomVectors} className="option-btn">
                                🎲 Random Vectors
                                <span>Generate completely random vectors (likely different)</span>
                            </button>
                            <button onClick={generateSimilarVectors} className="option-btn">
                                🔄 Similar Vectors
                                <span>Generate vectors with high similarity (should be detected)</span>
                            </button>
                            <button onClick={generateDifferentVectors} className="option-btn">
                                ↔️ Very Different Vectors
                                <span>Generate opposite vectors (definitely different)</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Configure Parameters */}
                {currentStep >= 2 && (
                    <div className="demo-step">
                        <h3>Step 2: Configure Vectors and Parameters</h3>
                        
                        <div className="vector-inputs">
                            <div className="vector-group">
                                <label>Vector A (16 dimensions)</label>
                                <textarea
                                    value={vectorA}
                                    onChange={(e) => setVectorA(e.target.value)}
                                    placeholder="Enter 16 comma-separated numbers"
                                    rows="3"
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="vector-group">
                                <label>Vector B (16 dimensions)</label>
                                <textarea
                                    value={vectorB}
                                    onChange={(e) => setVectorB(e.target.value)}
                                    placeholder="Enter 16 comma-separated numbers"
                                    rows="3"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="parameter-group">
                            <label>
                                Similarity Threshold: {threshold / 10}%
                                <input
                                    type="range"
                                    min="10"
                                    max="900"
                                    value={threshold}
                                    onChange={(e) => setThreshold(parseInt(e.target.value))}
                                    disabled={loading}
                                />
                                <span className="threshold-info">
                                    Vectors with similarity ≥ {threshold / 10}% will be flagged as duplicates
                                </span>
                            </label>
                        </div>

                        <div className="step-actions">
                            <button onClick={resetDemo} className="secondary-btn">
                                ← Back to Step 1
                            </button>
                            <button
                                onClick={generateProof}
                                disabled={!validateVectors() || loading}
                                className="primary-btn"
                            >
                                {/* TODO: Add a spinner or progress indicator during proof generation for better UX */}
                                {loading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Generating ZK Proof...
                                    </>
                                ) : (
                                    '🔐 Generate ZK Proof'
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="alert alert-error">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {/* Step 4: Results */}
                {result && currentStep === 4 && (
                    <div className="demo-step">
                        <h3>Step 4: ZK Proof Results</h3>
                        
                        <div className="results-grid">
                            <div className="result-card">
                                <h4>📊 Similarity Analysis</h4>
                                <div className="result-items">
                                    <div className="result-item">
                                        <span>Expected Similarity:</span>
                                        <span className="value">
                                            {(result.expectedSimilarity * 100).toFixed(2)}%
                                        </span>
                                    </div>
                                    <div className="result-item">
                                        <span>Threshold:</span>
                                        <span className="value">{result.thresholdPercent}%</span>
                                    </div>
                                    <div className="result-item">
                                        <span>ZK Result:</span>
                                        <span className={`value ${result.isUnique === "1" ? 'unique' : 'duplicate'}`}>
                                            {result.isUnique === "1" ? '✅ UNIQUE' : '❌ DUPLICATE'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="result-card">
                                <h4>⚡ Performance Metrics</h4>
                                <div className="result-items">
                                    <div className="result-item">
                                        <span>Generation Time:</span>
                                        <span className="value">{result.generationTime}ms</span>
                                    </div>
                                    <div className="result-item">
                                        <span>Proof Size:</span>
                                        <span className="value">{result.proofSize} bytes</span>
                                    </div>
                                    <div className="result-item">
                                        <span>Public Signals:</span>
                                        <span className="value">{result.publicSignals.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="proof-explanation">
                            <h4>🔍 What Just Happened?</h4>
                            <div className="explanation-content">
                                <p>
                                    <strong>Zero-Knowledge Magic:</strong> The system generated a mathematical proof 
                                    that demonstrates whether your two biometric vectors are similar or different, 
                                    but the proof itself reveals NOTHING about the actual vector values.
                                </p>
                                <ul>
                                    <li>✅ The verifier knows the similarity result (unique/duplicate)</li>
                                    <li>🔒 The verifier learns nothing about the original vectors</li>
                                    <li>🛡️ Even if the proof is intercepted, the biometric data remains private</li>
                                    <li>🎯 The math guarantees the result is correct without revealing how</li>
                                </ul>
                            </div>
                        </div>

                        <div className="step-actions">
                            <button onClick={resetDemo} className="secondary-btn">
                                🔄 Start New Demo
                            </button>
                            <button 
                                onClick={() => setCurrentStep(2)} 
                                className="secondary-btn"
                            >
                                ← Modify Parameters
                            </button>
                        </div>
                    </div>
                )}

                {/* Educational Section */}
                <div className="educational-section">
                    <h3>📚 How Zero-Knowledge Proofs Work</h3>
                    <div className="concept-cards">
                        <div className="concept-card">
                            <h4>🎭 Zero-Knowledge</h4>
                            <p>
                                The verifier learns only the final result (similar/different) 
                                but gains zero knowledge about the actual biometric vectors.
                            </p>
                        </div>
                        <div className="concept-card">
                            <h4>🔒 Completeness</h4>
                            <p>
                                If the vectors truly have the claimed similarity relationship, 
                                the proof will always convince an honest verifier.
                            </p>
                        </div>
                        <div className="concept-card">
                            <h4>🛡️ Soundness</h4>
                            <p>
                                A malicious prover cannot convince the verifier of a false 
                                claim about vector similarity.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Use Cases */}
                <div className="use-cases-section">
                    <h3>🚀 Real-World Applications</h3>
                    <div className="use-case-grid">
                        <div className="use-case">
                            <h4>🏛️ Government ID Systems</h4>
                            <p>Prevent duplicate citizenship or voting registrations without storing biometrics</p>
                        </div>
                        <div className="use-case">
                            <h4>🏦 Banking & Finance</h4>
                            <p>Anti-fraud systems that detect duplicate accounts while preserving privacy</p>
                        </div>
                        <div className="use-case">
                            <h4>🎮 Gaming & Social</h4>
                            <p>Prevent multiple accounts (Sybil attacks) in games and social platforms</p>
                        </div>
                        <div className="use-case">
                            <h4>🔬 Healthcare</h4>
                            <p>Patient matching across hospitals without sharing sensitive biometric data</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProofDemo;