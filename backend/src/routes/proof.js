const express = require('express');
const router = express.Router();
const proofService = require('../services/proofService');
const logger = require('../services/logger');

// Get proof system information
router.get('/info', async (req, res) => {
    try {
        const info = await proofService.getSystemInfo();
        res.json(info);
    } catch (error) {
        logger.error('System info error:', error);
        res.status(500).json({
            error: 'Failed to retrieve system information',
            message: error.message
        });
    }
});

// Generate ZK proof
router.post('/generate', async (req, res) => {
    try {
        const { vectorA, vectorB, threshold } = req.body;
        
        if (!vectorA || !vectorB || !Array.isArray(vectorA) || !Array.isArray(vectorB)) {
            return res.status(400).json({
                error: 'Invalid vector inputs'
            });
        }
        
        if (vectorA.length !== 4 || vectorB.length !== 4) {
            return res.status(400).json({
                error: 'Vectors must be 4-dimensional'
            });
        }
        
        logger.info('Generating ZK proof for vector similarity');
        
        const result = await proofService.generateSimilarityProof(
            vectorA, 12345, 999888, 777666, threshold || 1000
        );
        
        if (result.success) {
            res.json({
                success: true,
                proof: result.proof,
                publicSignals: result.publicSignals,
                isUnique: result.isUnique,
                generationTime: result.generationTime,
                proofSize: result.proofSize
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
        
    } catch (error) {
        logger.error('Proof generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Proof generation failed',
            message: error.message
        });
    }
});

// Verify ZK proof
router.post('/verify', async (req, res) => {
    try {
        const { proof, publicSignals } = req.body;
        
        if (!proof || !publicSignals) {
            return res.status(400).json({
                error: 'Proof and public signals are required'
            });
        }
        
        const isValid = await proofService.verifyProof(proof, publicSignals);
        
        res.json({
            valid: isValid,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Proof verification error:', error);
        res.status(500).json({
            valid: false,
            error: 'Verification failed',
            message: error.message
        });
    }
});

module.exports = router;
