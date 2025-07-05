const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const biometricRoutes = require('./routes/biometric');
const proofRoutes = require('./routes/proof');
const logger = require('./services/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Logging
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        zkEnabled: true,
        message: 'ZK Biometric System Backend - Full ZK Functionality Active!'
    });
});

// API routes
app.use('/api/biometric', biometricRoutes);
app.use('/api/proof', proofRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /health',
            'GET /api/biometric/stats',
            'GET /api/proof/info',
            'POST /api/biometric/register',
            'POST /api/biometric/verify',
            'POST /api/proof/generate',
            'POST /api/proof/verify'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ZK Biometric System backend running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 ZK Circuits: ACTIVE - Full functionality enabled!`);
});

module.exports = app;
