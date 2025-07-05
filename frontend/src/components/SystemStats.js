import React, { useState, useEffect } from 'react';
import './SystemStats.css';

const SystemStats = () => {
    const [stats, setStats] = useState(null);
    const [proofInfo, setProofInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [benchmarkRunning, setBenchmarkRunning] = useState(false);
    const [benchmarkResults, setBenchmarkResults] = useState(null);

    useEffect(() => {
        fetchStats();
        fetchProofInfo();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/biometric/stats');
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            } else {
                throw new Error('Failed to fetch stats');
            }
        } catch (error) {
            setError('Failed to load system statistics');
            console.error('Stats error:', error);
        }
    };

    const fetchProofInfo = async () => {
        try {
            const response = await fetch('/api/proof/info');
            if (response.ok) {
                const data = await response.json();
                setProofInfo(data);
            } else {
                throw new Error('Failed to fetch proof info');
            }
        } catch (error) {
            console.error('Proof info error:', error);
        } finally {
            setLoading(false);
        }
    };

    const runBenchmark = async () => {
        setBenchmarkRunning(true);
        setBenchmarkResults(null);
        
        try {
            const response = await fetch('/api/proof/benchmark', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ iterations: 5 })
            });
            
            if (response.ok) {
                const data = await response.json();
                setBenchmarkResults(data.benchmark);
            } else {
                throw new Error('Benchmark failed');
            }
        } catch (error) {
            setError('Benchmark failed: ' + error.message);
        } finally {
            setBenchmarkRunning(false);
        }
    };

    const clearAllData = async () => {
        if (!window.confirm('Are you sure you want to clear all biometric data? This cannot be undone.')) {
            return;
        }
        
        try {
            const response = await fetch('/api/biometric/clear-all', {
                method: 'DELETE'
            });
            
            if (response.ok) {
                alert('All data cleared successfully');
                fetchStats(); // Refresh stats
            } else {
                throw new Error('Failed to clear data');
            }
        } catch (error) {
            setError('Failed to clear data: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="system-stats">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading system statistics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="system-stats">
            <div className="stats-container">
                <h2>📊 System Statistics</h2>
                
                {error && (
                    <div className="alert alert-error">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <div className="stats-grid">
                    {/* System Overview */}
                    <div className="stat-card">
                        <h3>🏠 System Overview</h3>
                        {stats && (
                            <div className="stat-items">
                                <div className="stat-item">
                                    <span className="stat-label">Total Users:</span>
                                    <span className="stat-value">{stats.totalUsers}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Total Commitments:</span>
                                    <span className="stat-value">{stats.totalCommitments}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Vector Dimension:</span>
                                    <span className="stat-value">{stats.vectorDimension}D</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Uptime:</span>
                                    <span className="stat-value">{Math.floor(stats.uptime / 60)} minutes</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ZK Proof System */}
                    <div className="stat-card">
                        <h3>🔐 ZK Proof System</h3>
                        {proofInfo && (
                            <div className="stat-items">
                                <div className="stat-item">
                                    <span className="stat-label">Circuit Status:</span>
                                    <span className={`stat-value ${proofInfo.circuitReady ? 'success' : 'error'}`}>
                                        {proofInfo.circuitReady ? '✅ Ready' : '❌ Not Ready'}
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">WASM File:</span>
                                    <span className={`stat-value ${proofInfo.files.wasm ? 'success' : 'error'}`}>
                                        {proofInfo.files.wasm ? '✅ Available' : '❌ Missing'}
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Proving Key:</span>
                                    <span className={`stat-value ${proofInfo.files.zkey ? 'success' : 'error'}`}>
                                        {proofInfo.files.zkey ? '✅ Available' : '❌ Missing'}
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Verification Key:</span>
                                    <span className={`stat-value ${proofInfo.files.vkey ? 'success' : 'error'}`}>
                                        {proofInfo.files.vkey ? '✅ Available' : '❌ Missing'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Memory Usage */}
                    <div className="stat-card">
                        <h3>💾 Memory Usage</h3>
                        {stats && stats.memoryUsage && (
                            <div className="stat-items">
                                <div className="stat-item">
                                    <span className="stat-label">RSS:</span>
                                    <span className="stat-value">
                                        {(stats.memoryUsage.rss / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Heap Used:</span>
                                    <span className="stat-value">
                                        {(stats.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Heap Total:</span>
                                    <span className="stat-value">
                                        {(stats.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">External:</span>
                                    <span className="stat-value">
                                        {(stats.memoryUsage.external / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Performance Benchmark */}
                    <div className="stat-card">
                        <h3>⚡ Performance Benchmark</h3>
                        <div className="benchmark-controls">
                            <button
                                onClick={runBenchmark}
                                disabled={benchmarkRunning}
                                className="benchmark-btn"
                            >
                                {benchmarkRunning ? (
                                    <>
                                        <span className="spinner small"></span>
                                        Running Benchmark...
                                    </>
                                ) : (
                                    '🚀 Run Benchmark'
                                )}
                            </button>
                        </div>
                        
                        {benchmarkResults && (
                            <div className="benchmark-results">
                                <div className="stat-item">
                                    <span className="stat-label">Iterations:</span>
                                    <span className="stat-value">{benchmarkResults.iterations}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Avg Proof Time:</span>
                                    <span className="stat-value">
                                        {benchmarkResults.summary.proofGeneration.averageTime.toFixed(2)}ms
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Avg Verify Time:</span>
                                    <span className="stat-value">
                                        {benchmarkResults.summary.verification.averageTime.toFixed(2)}ms
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Success Rate:</span>
                                    <span className="stat-value">
                                        {(benchmarkResults.summary.proofGeneration.successRate * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Technical Details */}
                <div className="technical-details">
                    <h3>🔧 Technical Details</h3>
                    <div className="tech-grid">
                        {proofInfo && (
                            <>
                                <div className="tech-item">
                                    <strong>snarkjs Version:</strong>
                                    <span>{proofInfo.versions.snarkjs}</span>
                                </div>
                                <div className="tech-item">
                                    <strong>Node.js Version:</strong>
                                    <span>{proofInfo.versions.node}</span>
                                </div>
                                <div className="tech-item">
                                    <strong>Circuit Files:</strong>
                                    <span>
                                        WASM: {proofInfo.paths.wasm} | 
                                        ZKey: {proofInfo.paths.zkey} | 
                                        VKey: {proofInfo.paths.vkey}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Admin Controls */}
                <div className="admin-controls">
                    <h3>⚙️ Admin Controls</h3>
                    <div className="control-buttons">
                        <button
                            onClick={fetchStats}
                            className="control-btn refresh"
                        >
                            🔄 Refresh Stats
                        </button>
                        <button
                            onClick={clearAllData}
                            className="control-btn danger"
                        >
                            🗑️ Clear All Data
                        </button>
                    </div>
                </div>

                {/* Last Updated */}
                <div className="last-updated">
                    <p>Last updated: {new Date().toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
};

export default SystemStats;