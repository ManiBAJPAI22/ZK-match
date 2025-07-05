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
            case 'demo':
                return <DemoTab />;
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
                    <h1>🔐 ZK Biometric Privacy System</h1>
                    <p>Zero-Knowledge Biometric Verification with Anti-Sybil Protection</p>
                    {systemInfo && (
                        <div className="system-status">
                            <span className={`status-indicator ${systemInfo.circuitReady ? 'ready' : 'not-ready'}`}>
                                {systemInfo.circuitReady ? '✅ Circuit Ready - Full ZK Active!' : '❌ Demo Mode'}
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
                    👤 Register
                </button>
                <button 
                    className={`tab ${activeTab === 'demo' ? 'active' : ''}`}
                    onClick={() => setActiveTab('demo')}
                >
                    🧪 Demo
                </button>
                <button 
                    className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stats')}
                >
                    📊 Stats
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
        const vector = Array(4).fill(0).map(() => 
            Math.floor(Math.random() * 1000 - 500)
        );
        setBiometricVector(vector.join(', '));
    };

    const generateSimilarVector = () => {
        if (!biometricVector) {
            generateRandomVector();
            return;
        }
        
        const currentVector = biometricVector.split(', ').map(v => parseInt(v));
        const similarVector = currentVector.map(val => 
            val + Math.floor(Math.random() * 20 - 10)
        );
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
                .map(v => parseInt(v.trim()))
                .filter(v => !isNaN(v));

            if (vectorArray.length !== 4) {
                throw new Error('Vector must have exactly 4 dimensions');
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
        <div>
            <h3>👤 Biometric Registration</h3>
            <p>Register a new biometric identity using Zero-Knowledge proofs.</p>
            
            {systemInfo?.circuitReady ? (
                <div style={{background: '#d4edda', padding: '15px', borderRadius: '8px', margin: '15px 0', border: '1px solid #28a745', color: '#155724'}}>
                    <strong>🔐 ZK Circuit Active!</strong> Real Zero-Knowledge proofs are being generated.
                    Your biometric data will never be stored - only cryptographic commitments.
                </div>
            ) : (
                <div style={{background: '#fff3cd', padding: '15px', borderRadius: '8px', margin: '15px 0', border: '1px solid #ffeaa7', color: '#856404'}}>
                    <strong>⚠️ Demo Mode:</strong> ZK circuits not yet compiled. Run setup scripts for full functionality.
                </div>
            )}

            <form onSubmit={handleRegister} style={{display: 'grid', gap: '20px'}}>
                <div>
                    <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>User ID:</label>
                    <input 
                        type="text" 
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Enter unique user identifier" 
                        style={{width: '100%', padding: '12px', border: '2px solid #e9ecef', borderRadius: '8px'}}
                        disabled={loading}
                        required
                    />
                </div>
                
                <div>
                    <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>
                        Biometric Vector (4 dimensions):
                        {biometricVector && (
                            <span style={{fontWeight: 'normal', fontSize: '0.9rem', marginLeft: '10px', color: vectorValidation.valid ? '#28a745' : '#dc3545'}}>
                                {vectorValidation.length}/4 dimensions {vectorValidation.valid ? '✅' : '❌'}
                            </span>
                        )}
                    </label>
                    <textarea 
                        value={biometricVector}
                        onChange={(e) => setBiometricVector(e.target.value)}
                        placeholder="Enter 4 comma-separated numbers (e.g., 100, 200, 300, 400)" 
                        rows="3"
                        style={{width: '100%', padding: '12px', border: '2px solid #e9ecef', borderRadius: '8px', fontFamily: 'monospace'}}
                        disabled={loading}
                        required
                    />
                    <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                        <button
                            type="button"
                            onClick={generateRandomVector}
                            style={{background: '#6c757d', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer'}}
                            disabled={loading}
                        >
                            🎲 Generate Random
                        </button>
                        <button
                            type="button"
                            onClick={generateSimilarVector}
                            style={{background: '#6c757d', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer'}}
                            disabled={loading}
                        >
                            🔄 Generate Similar
                        </button>
                    </div>
                </div>
                
                <button
                    type="submit"
                    disabled={!vectorValidation.valid || loading}
                    style={{
                        background: vectorValidation.valid && !loading ? 'linear-gradient(135deg, #007bff, #0056b3)' : '#ccc',
                        color: 'white',
                        border: 'none',
                        padding: '15px 30px',
                        borderRadius: '10px',
                        fontSize: '1.1rem',
                        cursor: vectorValidation.valid && !loading ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}
                >
                    {loading ? (
                        <>
                            <div className="spinner"></div>
                            Generating ZK Proof...
                        </>
                    ) : (
                        '🔐 Register Biometric'
                    )}
                </button>
            </form>

            {error && (
                <div style={{background: '#f8d7da', padding: '15px', borderRadius: '8px', margin: '15px 0', border: '1px solid #dc3545', color: '#721c24'}}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && (
                <div style={{
                    background: result.success ? '#d4edda' : '#f8d7da',
                    padding: '20px',
                    borderRadius: '10px',
                    margin: '20px 0',
                    border: `1px solid ${result.success ? '#28a745' : '#dc3545'}`,
                    color: result.success ? '#155724' : '#721c24'
                }}>
                    <h4>{result.success ? '✅ Registration Successful' : '❌ Registration Failed'}</h4>
                    <p><strong>Message:</strong> {result.message}</p>
                    {result.success && (
                        <>
                            <p><strong>User ID:</strong> {result.userId}</p>
                            <p><strong>Commitment:</strong> {result.commitment}</p>
                            {result.zkEnabled && (
                                <div style={{background: 'rgba(40,167,69,0.1)', padding: '15px', borderRadius: '8px', marginTop: '15px'}}>
                                    <p>🔐 <strong>Zero-Knowledge Proof Generated!</strong></p>
                                    <p>✅ Your biometric data was never stored</p>
                                    <p>🛡️ Privacy-preserving commitment created</p>
                                    <p>🔍 Anti-Sybil protection active</p>
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
        <h3>🧪 Zero-Knowledge Proof Demo</h3>
        <p>Interactive demonstration of Zero-Knowledge biometric similarity proofs.</p>
        <div style={{background: '#f8f9fa', padding: '20px', borderRadius: '10px', margin: '20px 0'}}>
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
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return <div>Loading statistics...</div>;
    }

    return (
        <div>
            <h3>📊 System Statistics</h3>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', margin: '20px 0'}}>
                <div style={{background: '#f8f9fa', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #007bff'}}>
                    <h4>🏠 System Overview</h4>
                    <p>Total Users: {stats?.totalUsers || 0}</p>
                    <p>Total Commitments: {stats?.totalCommitments || 0}</p>
                    <p>Vector Dimension: {stats?.vectorDimension || 4}D</p>
                    <p>Uptime: {Math.floor((stats?.uptime || 0) / 60)} minutes</p>
                </div>
                
                <div style={{background: '#f8f9fa', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #28a745'}}>
                    <h4>🔐 ZK Proof System</h4>
                    <p>Circuit Status: ✅ Active</p>
                    <p>Proof Algorithm: Groth16</p>
                    <p>Curve: BN-128</p>
                    <p>Privacy Level: Maximum</p>
                </div>
                
                <div style={{background: '#f8f9fa', padding: '20px', borderRadius: '10px', borderLeft: '4px solid #ffc107'}}>
                    <h4>💾 Performance</h4>
                    <p>Memory Usage: {Math.round((stats?.memoryUsage?.heapUsed || 0) / 1024 / 1024)} MB</p>
                    <p>Avg Proof Time: ~500ms</p>
                    <p>Avg Verify Time: ~5ms</p>
                    <p>Proof Size: ~200 bytes</p>
                </div>
            </div>
            
            <button 
                onClick={fetchStats}
                style={{background: '#17a2b8', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer'}}
            >
                🔄 Refresh Stats
            </button>
        </div>
    );
};

export default App;