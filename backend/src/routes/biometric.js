const express = require('express');
const router = express.Router();
const biometricService = require('../services/biometricService');
const logger = require("../services/logger"); // Simple logger for now

// Register new biometric
router.post('/register', async (req, res) => {
    try {
        const { biometricVector, userId } = req.body;
        
        // Validate input
        if (!biometricVector || !Array.isArray(biometricVector)) {
            return res.status(400).json({
                error: 'Invalid biometric vector'
            });
        }
        
        if (biometricVector.length !== 512) { // Using 512D vectors from our circuit
            return res.status(400).json({
                error: 'Biometric vector must be 512-dimensional'
            });
        }
        
        if (!userId) {
            return res.status(400).json({
                error: 'User ID is required'
            });
        }
        
        logger.info(`Processing biometric registration for user: ${userId}`);
        
        // Check if user already exists
        const existingUser = await biometricService.getUserByID(userId);
        if (existingUser) {
            return res.status(409).json({
                error: 'User already registered'
            });
        }
        
        // Process the vector
        const processedVector = biometricService.preprocessVector(biometricVector);
        
        // Generate commitment
        const { commitment, nonce } = await biometricService.generateCommitment(processedVector);
        
        // Check uniqueness using ZK proofs
        const uniquenessResult = await biometricService.checkUniqueness(
            processedVector,
            nonce,
            commitment
        );
        
        if (!uniquenessResult.isUnique) {
            logger.info(`Duplicate biometric detected for user: ${userId}`);
            return res.status(409).json({
                error: 'Similar biometric already exists in system',
                conflictingUsers: uniquenessResult.similarUsers,
                checkedCount: uniquenessResult.checkedCount
            });
        }
        
        // Store the commitment
        await biometricService.storeCommitment(userId, commitment, {
            timestamp: new Date(),
            vectorDimension: processedVector.length
        }, processedVector);
        
        logger.info(`Successfully registered user: ${userId}`);
        
        res.status(201).json({
            success: true,
            userId: userId,
            commitment: commitment,
            message: 'Biometric registered successfully using ZK proofs!'
        });
        
    } catch (error) {
        logger.info('Biometric registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: error.message
        });
    }
});

// Get system statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await biometricService.getSystemStats();
        res.json(stats);
    } catch (error) {
        logger.info('Stats retrieval error:', error);
        res.status(500).json({
            error: 'Failed to retrieve statistics'
        });
    }
});

// Verify biometric
router.post('/verify', async (req, res) => {
    try {
        const { biometricVector, userId } = req.body;
        
        // Validate input
        if (!biometricVector || !Array.isArray(biometricVector)) {
            return res.status(400).json({
                error: 'Invalid biometric vector'
            });
        }
        
        if (biometricVector.length !== 512) { // Using 512D vectors from our circuit
            return res.status(400).json({
                error: 'Biometric vector must be 512-dimensional'
            });
        }
        
        if (!userId) {
            return res.status(400).json({
                error: 'User ID is required'
            });
        }
        
        logger.info(`Processing biometric verification for user: ${userId}`);
        
        // Check if user exists
        const existingUser = await biometricService.getUserByID(userId);
        if (!existingUser) {
            return res.status(404).json({
                error: 'User not found'
            });
        }
        
        // Process the vector
        const processedVector = biometricService.preprocessVector(biometricVector);
        
        // Generate commitment for verification
        const { commitment, nonce } = await biometricService.generateCommitment(processedVector);
        
        // Verify against stored commitment using ZK proofs
        const verificationResult = await biometricService.verifyBiometric(
            processedVector,
            nonce,
            commitment,
            existingUser.commitment
        );
        
        if (verificationResult.verified) {
            logger.info(`Successfully verified user: ${userId}`);
            res.json({
                success: true,
                verified: true,
                userId: userId,
                message: 'Identity verified successfully using ZK proofs!',
                proof: verificationResult.proof
            });
        } else {
            logger.info(`Verification failed for user: ${userId}`);
            res.json({
                success: true,
                verified: false,
                userId: userId,
                message: 'Identity verification failed - biometric does not match',
                proof: verificationResult.proof
            });
        }
        
    } catch (error) {
        logger.info('Biometric verification error:', error);
        res.status(500).json({
            error: 'Verification failed',
            message: error.message
        });
    }
});

module.exports = router;
