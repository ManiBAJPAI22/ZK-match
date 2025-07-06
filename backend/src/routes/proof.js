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

// Benchmark ZK proof performance
router.post('/benchmark', async (req, res) => {
    try {
        const { iterations = 5 } = req.body;
        
        logger.info(`Running ZK proof benchmark with ${iterations} iterations`);
        
        const proofTimes = [];
        const verifyTimes = [];
        const proofSizes = [];
        let successCount = 0;
        
        for (let i = 0; i < iterations; i++) {
            try {
                // Generate random 512-dimensional vectors
                const vectorA = Array.from({length: 512}, () => Math.floor((Math.random() - 0.5) * 100));
                const vectorB = Array.from({length: 512}, () => Math.floor((Math.random() - 0.5) * 100));
                const threshold = 100;
                
                // Generate proof
                const startTime = Date.now();
                const result = await proofService.generateSimilarityProof(vectorA, vectorB, threshold);
                const proofTime = Date.now() - startTime;
                
                if (result.success) {
                    proofTimes.push(proofTime);
                    proofSizes.push(result.proofSize);
                    
                    // Verify proof
                    const verifyStartTime = Date.now();
                    const isValid = await proofService.verifyProof(result.proof, result.publicSignals);
                    const verifyTime = Date.now() - verifyStartTime;
                    
                    if (isValid) {
                        verifyTimes.push(verifyTime);
                        successCount++;
                    }
                }
                
            } catch (error) {
                logger.error(`Benchmark iteration ${i + 1} failed:`, error);
            }
        }
        
        // Calculate statistics
        const avgProofTime = proofTimes.length > 0 ? proofTimes.reduce((a, b) => a + b, 0) / proofTimes.length : 0;
        const avgVerifyTime = verifyTimes.length > 0 ? verifyTimes.reduce((a, b) => a + b, 0) / verifyTimes.length : 0;
        const avgProofSize = proofSizes.length > 0 ? proofSizes.reduce((a, b) => a + b, 0) / proofSizes.length : 0;
        const successRate = iterations > 0 ? successCount / iterations : 0;
        
        const benchmark = {
            iterations,
            successCount,
            successRate,
            summary: {
                proofGeneration: {
                    averageTime: avgProofTime,
                    minTime: Math.min(...proofTimes),
                    maxTime: Math.max(...proofTimes),
                    successRate: successRate
                },
                verification: {
                    averageTime: avgVerifyTime,
                    minTime: Math.min(...verifyTimes),
                    maxTime: Math.max(...verifyTimes)
                },
                proofSize: {
                    average: avgProofSize,
                    min: Math.min(...proofSizes),
                    max: Math.max(...proofSizes)
                }
            },
            timestamp: new Date().toISOString()
        };
        
        logger.info(`Benchmark completed: ${successCount}/${iterations} successful, avg proof time: ${avgProofTime.toFixed(2)}ms`);
        
        res.json({
            success: true,
            benchmark
        });
        
    } catch (error) {
        logger.error('Benchmark error:', error);
        res.status(500).json({
            success: false,
            error: 'Benchmark failed',
            message: error.message
        });
    }
});

module.exports = router;
