import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [activeTab, setActiveTab] = useState('register');
    const [systemInfo, setSystemInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSystemInfo();
    }, []);

    const fetchSystemInfo = async () => {
        try {
            const response = await fetch('/api/proof/info');
            if (response.ok) {
                const info = await response.json();
                setSystemInfo(info);
            }
        } catch (error) {
            console.error('Failed to fetch system info:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'register':
                return <RegistrationTab systemInfo={systemInfo} />;
            case 'stats':
                return <StatsTab />;
            default:
                return <RegistrationTab systemInfo={systemInfo} />;
        }
    };

    if (loading) {
        return (
            <div className="app">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading ZK Biometric System...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            <header className="app-header">
                <div className="header-content">
                    <div>
                        <h1>ZK Biometric Privacy System</h1>
                        <p>Zero-Knowledge Biometric Verification with Anti-Sybil Protection</p>
                    </div>
                    {systemInfo && (
                        <div className="system-status">
                            <span className={`status-indicator ${systemInfo.circuitReady ? 'ready' : 'not-ready'}`}>
                                {systemInfo.circuitReady ? 'Circuit Ready - Full ZK Active!' : 'Demo Mode'}
                            </span>
                        </div>
                    )}
                </div>
            </header>

            <nav className="tab-navigation">
                <button 
                    className={`tab ${activeTab === 'register' ? 'active' : ''}`}
                    onClick={() => setActiveTab('register')}
                >
                    Register
                </button>
                <button 
                    className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stats')}
                >
                    Stats
                </button>
            </nav>

            <main className="main-content">
                {renderTabContent()}
            </main>

            <footer className="app-footer">
                <div className="footer-content">
                    <p>Built with Zero-Knowledge Proofs • Circom • snarkjs</p>
                    <div className="tech-stack">
                        <span className="tech-item">React</span>
                        <span className="tech-item">Node.js</span>
                        <span className="tech-item">ZK-SNARKs</span>
                        <span className="tech-item">Groth16 Proofs</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// Registration Tab Component
const RegistrationTab = ({ systemInfo }) => {
    const [userId, setUserId] = useState('');
    const [biometricVector, setBiometricVector] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const generateRandomVector = () => {
        const vector = Array(512).fill(0).map(() => (Math.random() * 2 - 1).toFixed(4));
        setBiometricVector(vector.join(', '));
    };

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
            const vectorArray = biometricVector
                .split(',')
                .map(v => parseFloat(v.trim()))
                .filter(v => !isNaN(v));

            if (vectorArray.length !== 512) {
                throw new Error('Vector must have exactly 512 dimensions');
            }

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
                    commitment: data.commitment,
                    zkEnabled: systemInfo?.circuitReady
                });
                setUserId('');
                setBiometricVector('');
            } else {
                setResult({
                    success: false,
                    message: data.error,
                    details: data.conflictingUsers ? `Found ${data.conflictingUsers.length} similar users` : null
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
        <div>
            <h3>Biometric Registration</h3>
            <p>Register a new biometric identity using Zero-Knowledge proofs.</p>
            
            {systemInfo?.circuitReady ? (
                <div className="alert alert-success">
                    <strong>ZK Circuit Active!</strong> Real Zero-Knowledge proofs are being generated.
                    Your biometric data will never be stored - only cryptographic commitments.
                </div>
            ) : (
                <div className="alert alert-warning">
                    <strong>Demo Mode:</strong> ZK circuits not yet compiled. Run setup scripts for full functionality.
                </div>
            )}

            <form onSubmit={handleRegister} className="registration-form">
                <div className="form-group">
                    <label>User ID:</label>
                    <input 
                        type="text" 
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Enter unique user identifier"
                        disabled={loading}
                        required
                    />
                </div>
                
                <div className="form-group">
                    <label>
                        Biometric Vector (512 dimensions):
                        {biometricVector && (
                            <span className={`vector-status ${vectorValidation.valid ? 'valid' : 'invalid'}`}>
                                {vectorValidation.length}/512 dimensions {vectorValidation.valid ? '✅' : '❌'}
                            </span>
                        )}
                    </label>
                    <textarea 
                        value={biometricVector}
                        onChange={(e) => setBiometricVector(e.target.value)}
                        placeholder="Enter 512 comma-separated numbers (e.g., 0.1234, -0.5678, ...)" 
                        rows="10"
                        disabled={loading}
                        required
                    />
                    <div className="button-group">
                        <button
                            type="button"
                            onClick={generateRandomVector}
                            className="secondary-button"
                            disabled={loading}
                        >
                            Generate Random
                        </button>
                        <button
                            type="button"
                            onClick={generateSimilarVector}
                            className="secondary-button"
                            disabled={loading}
                        >
                            Generate Similar
                        </button>
                    </div>
                </div>
                
                <button
                    type="submit"
                    disabled={!vectorValidation.valid || loading}
                    className={`submit-button ${!vectorValidation.valid || loading ? 'disabled' : ''}`}
                >
                    {loading ? (
                        <>
                            <div className="spinner"></div>
                            Generating ZK Proof...
                        </>
                    ) : (
                        'Register Biometric'
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
                    <h4>{result.success ? 'Registration Successful' : 'Registration Failed'}</h4>
                    <p><strong>Message:</strong> {result.message}</p>
                    {result.success && (
                        <>
                            <p><strong>User ID:</strong> {result.userId}</p>
                            <p><strong>Commitment:</strong> {result.commitment}</p>
                            {result.zkEnabled && (
                                <div className="zk-proof-info">
                                    <p><strong>Zero-Knowledge Proof Generated!</strong></p>
                                    <p>Your biometric data was never stored</p>
                                    <p>Privacy-preserving commitment created</p>
                                    <p>Anti-Sybil protection active</p>
                                </div>
                            )}
                        </>
                    )}
                    {result.details && (
                        <p><strong>Details:</strong> {result.details}</p>
                    )}
                </div>
            )}
        </div>
    );
};

// Demo Tab
const DemoTab = () => (
    <div>
        <h3>Zero-Knowledge Proof Demo</h3>
        <p>Interactive demonstration of Zero-Knowledge biometric similarity proofs.</p>
        <div className="demo-info-card">
            <h4>How ZK Proofs Work:</h4>
            <ol>
                <li><strong>Commitment:</strong> Biometric data is converted to a cryptographic commitment</li>
                <li><strong>Proof Generation:</strong> Mathematical proof shows similarity without revealing data</li>
                <li><strong>Verification:</strong> Proof is verified without accessing original biometric</li>
                <li><strong>Privacy Preserved:</strong> No biometric data is ever revealed or stored</li>
            </ol>
        </div>
    </div>
);

// Stats Tab
const StatsTab = () => {
    const [stats, setStats] = useState(null);
    const [benchmarkData, setBenchmarkData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [benchmarkLoading, setBenchmarkLoading] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/biometric/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const runBenchmark = async () => {
        setBenchmarkLoading(true);
        try {
            const response = await fetch('/api/proof/benchmark', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ iterations: 3 })
            });
            
            if (response.ok) {
                const data = await response.json();
                setBenchmarkData(data.benchmark);
            }
        } catch (error) {
            console.error('Benchmark failed:', error);
        } finally {
            setBenchmarkLoading(false);
        }
    };

    if (loading) {
        return <div>Loading statistics...</div>;
    }

    return (
        <div>
            <h3>System Statistics</h3>
            <div className="stats-grid">
                <div className="stats-card">
                    <h4>System Overview</h4>
                    <p>Total Users: <strong>{stats?.totalUsers || 0}</strong></p>
                    <p>Total Commitments: <strong>{stats?.totalCommitments || 0}</strong></p>
                    <p>Vector Dimension: <strong>{stats?.vectorDimension || 512}D</strong></p>
                    <p>Uptime: <strong>{Math.floor((stats?.uptime || 0) / 60)} minutes</strong></p>
                </div>
                
                <div className="stats-card">
                    <h4>ZK Proof System</h4>
                    <p>Circuit Status: <strong>Active</strong></p>
                    <p>Proof Algorithm: <strong>Groth16</strong></p>
                    <p>Curve: <strong>BN-128</strong></p>
                    <p>Privacy Level: <strong>Maximum</strong></p>
                </div>
                
                <div className="stats-card">
                    <h4>Performance</h4>
                    <p>Memory Usage: <strong>{Math.round((stats?.memoryUsage?.heapUsed || 0) / 1024 / 1024)} MB</strong></p>
                    {benchmarkData ? (
                        <>
                            <p>Avg Proof Time: <strong>{benchmarkData.summary.proofGeneration.averageTime.toFixed(0)}ms</strong></p>
                            <p>Avg Verify Time: <strong>{benchmarkData.summary.verification.averageTime.toFixed(0)}ms</strong></p>
                            <p>Proof Size: <strong>{benchmarkData.summary.proofSize.average.toFixed(0)} bytes</strong></p>
                            <p className="timestamp">
                                Last updated: {new Date(benchmarkData.timestamp).toLocaleTimeString()}
                            </p>
                        </>
                    ) : (
                        <>
                            <p>Avg Proof Time: <strong>--</strong></p>
                            <p>Avg Verify Time: <strong>--</strong></p>
                            <p>Proof Size: <strong>--</strong></p>
                        </>
                    )}
                </div>
            </div>
            
            <div className="button-group">
                <button 
                    onClick={fetchStats}
                    className="action-button refresh-button"
                >
                    Refresh Stats
                </button>
                
                <button 
                    onClick={runBenchmark}
                    disabled={benchmarkLoading}
                    className={`action-button benchmark-button ${benchmarkLoading ? 'loading' : ''}`}
                >
                    {benchmarkLoading ? 'Running...' : 'Run Performance Test'}
                </button>
            </div>

            {benchmarkData && (
                <div className="benchmark-results">
                    <h4>Performance Benchmark Results</h4>
                    <div className="benchmark-grid">
                        <div className="benchmark-section">
                            <strong>Proof Generation:</strong>
                            <p>Success Rate: {(benchmarkData.successRate * 100).toFixed(1)}%</p>
                            <p>Min Time: {benchmarkData.summary.proofGeneration.minTime}ms</p>
                            <p>Max Time: {benchmarkData.summary.proofGeneration.maxTime}ms</p>
                        </div>
                        <div className="benchmark-section">
                            <strong>Verification:</strong>
                            <p>Min Time: {benchmarkData.summary.verification.minTime}ms</p>
                            <p>Max Time: {benchmarkData.summary.verification.maxTime}ms</p>
                        </div>
                        <div className="benchmark-section">
                            <strong>Proof Size:</strong>
                            <p>Min: {benchmarkData.summary.proofSize.min} bytes</p>
                            <p>Max: {benchmarkData.summary.proofSize.max} bytes</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;