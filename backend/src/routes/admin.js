const express = require('express');
const router = express.Router();
const biometricService = require('../services/biometricService');
const proofService = require('../services/proofService');
const logger = require('../services/logger');

// Get all users (admin only)
router.get('/users', async (req, res) => {
    try {
        // In production, add proper authentication middleware here
        const users = await biometricService.getAllUsers();
        res.json({
            success: true,
            count: users.length,
            users: users
        });
    } catch (error) {
        logger.error('Admin users retrieval error:', error);
        res.status(500).json({
            error: 'Failed to retrieve users'
        });
    }
});

// Clear all biometric data (admin only)
router.delete('/clear-all', async (req, res) => {
    try {
        // In production, add proper authentication and confirmation
        await biometricService.clearAllData();
        
        logger.info('All biometric data cleared by admin');
        res.json({
            success: true,
            message: 'All biometric data cleared successfully'
        });
    } catch (error) {
        logger.error('Admin clear all error:', error);
        res.status(500).json({
            error: 'Failed to clear data'
        });
    }
});

// System health check
router.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0'
        };

        // Check ZK circuit status
        const proofInfo = await proofService.getSystemInfo();
        health.zkCircuit = {
            ready: proofInfo.circuitReady,
            files: proofInfo.files
        };

        // Check biometric service
        const stats = await biometricService.getSystemStats();
        health.biometricService = {
            totalUsers: stats.totalUsers,
            memoryUsage: stats.memoryUsage
        };

        res.json(health);
    } catch (error) {
        logger.error('Health check error:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Export system logs (admin only)
router.get('/logs', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const path = require('path');
        
        const logLevel = req.query.level || 'combined';
        const logFile = path.join(__dirname, '../../../logs', `${logLevel}.log`);
        
        try {
            const logData = await fs.readFile(logFile, 'utf8');
            const lines = logData.split('\n').slice(-100); // Last 100 lines
            
            res.json({
                success: true,
                logLevel: logLevel,
                lines: lines.filter(line => line.trim() !== '')
            });
        } catch (fileError) {
            res.json({
                success: true,
                logLevel: logLevel,
                lines: [],
                message: 'Log file not found or empty'
            });
        }
    } catch (error) {
        logger.error('Log export error:', error);
        res.status(500).json({
            error: 'Failed to export logs'
        });
    }
});

// Force garbage collection (admin only)
router.post('/gc', (req, res) => {
    try {
        if (global.gc) {
            global.gc();
            logger.info('Garbage collection forced by admin');
            res.json({
                success: true,
                message: 'Garbage collection completed',
                memoryAfter: process.memoryUsage()
            });
        } else {
            res.status(400).json({
                error: 'Garbage collection not available. Start with --expose-gc flag.'
            });
        }
    } catch (error) {
        logger.error('GC error:', error);
        res.status(500).json({
            error: 'Failed to run garbage collection'
        });
    }
});

// Database backup (admin only)
router.post('/backup', async (req, res) => {
    try {
        // For in-memory storage, export current state
        const users = await biometricService.getAllUsers();
        const stats = await biometricService.getSystemStats();
        
        const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            stats: stats,
            userCount: users.length,
            // Note: We don't export actual commitments for security
            metadata: users.map(user => ({
                userId: user.userId,
                createdAt: user.createdAt,
                metadata: user.metadata
            }))
        };
        
        res.json({
            success: true,
            backup: backup
        });
        
        logger.info('System backup created');
    } catch (error) {
        logger.error('Backup error:', error);
        res.status(500).json({
            error: 'Failed to create backup'
        });
    }
});

// Circuit recompilation trigger (admin only)
router.post('/recompile-circuit', async (req, res) => {
    try {
        const { exec } = require('child_process');
        const util = require('util');
        const execPromise = util.promisify(exec);
        
        logger.info('Starting circuit recompilation...');
        
        // Run compilation script
        const { stdout, stderr } = await execPromise('./scripts/compile_circuits.sh');
        
        if (stderr && !stderr.includes('Warning')) {
            throw new Error(stderr);
        }
        
        logger.info('Circuit recompilation completed');
        res.json({
            success: true,
            message: 'Circuit recompiled successfully',
            output: stdout
        });
    } catch (error) {
        logger.error('Circuit recompilation error:', error);
        res.status(500).json({
            error: 'Circuit recompilation failed',
            details: error.message
        });
    }
});

module.exports = router;