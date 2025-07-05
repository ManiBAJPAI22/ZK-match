const proofService = require('./proofService');

// In-memory storage for demo
const biometricDatabase = new Map();
const commitmentDatabase = new Map();

class BiometricService {
    constructor() {
        this.vectorDimension = 512;
        this.fixedPointScale = 1000;
    }
    
    preprocessVector(rawVector) {
        if (!Array.isArray(rawVector) || rawVector.length !== this.vectorDimension) {
            throw new Error(`Vector must have ${this.vectorDimension} dimensions`);
        }
        
        // Convert to fixed-point representation
        return rawVector.map(val => {
            const clamped = Math.max(-1000, Math.min(1000, val)); // Allow larger range for testing
            return Math.round(clamped);
        });
    }
    
    generateCommitment(vector) {
        const nonce = Math.floor(Math.random() * 1000000);
        const vectorSum = vector.reduce((sum, val) => sum + val, 0);
        const commitment = Math.abs((vectorSum * nonce + nonce * 997) % 1000000);
        
        return { commitment, nonce };
    }
    
    async checkUniqueness(vector, nonce, commitment) {
        const threshold = 100; // Dot product threshold for 512-dimensional vectors (much lower)
        const existingCommitments = Array.from(commitmentDatabase.values());
        
        console.log(`Checking uniqueness against ${existingCommitments.length} existing commitments`);
        
        const similarUsers = [];
        
        for (const existingData of existingCommitments) {
            try {
                // Use the stored preprocessed vector for ZK proof input
                const vectorB = existingData.vector;
                if (!vectorB || vectorB.length !== this.vectorDimension) {
                    console.log('Skipping user with missing or invalid vector:', existingData.userId);
                    continue;
                }
                const proofResult = await proofService.generateSimilarityProof(
                    vector, vectorB, threshold
                );
                if (proofResult.success) {
                    console.log(`Proof result for ${existingData.userId}: isUnique = ${proofResult.isUnique}`);
                    if (proofResult.isUnique === "0") {
                        similarUsers.push({ userId: existingData.userId });
                    }
                } else {
                    console.log('Proof generation failed:', proofResult.error);
                }
            } catch (error) {
                console.log('Proof generation error:', error.message);
            }
        }
        
        return {
            isUnique: similarUsers.length === 0,
            similarUsers,
            checkedCount: existingCommitments.length
        };
    }
    
    async storeCommitment(userId, commitment, metadata = {}, vector = null) {
        if (biometricDatabase.has(userId)) {
            throw new Error('User already exists');
        }
        const userData = {
            userId,
            commitment,
            createdAt: new Date(),
            metadata,
            vector // Store the preprocessed vector for ZK proof input
        };
        biometricDatabase.set(userId, userData);
        commitmentDatabase.set(commitment, userData);
        return true;
    }
    
    async getUserByID(userId) {
        return biometricDatabase.get(userId) || null;
    }
    
    async getSystemStats() {
        return {
            totalUsers: biometricDatabase.size,
            totalCommitments: commitmentDatabase.size,
            vectorDimension: this.vectorDimension,
            fixedPointScale: this.fixedPointScale,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            lastUpdated: new Date().toISOString()
        };
    }
    
    async getAllUsers() {
        return Array.from(biometricDatabase.values()).map(user => ({
            userId: user.userId,
            createdAt: user.createdAt,
            metadata: user.metadata
        }));
    }
    
    async clearAllData() {
        biometricDatabase.clear();
        commitmentDatabase.clear();
        return true;
    }
    
    async verifyBiometric(vector, nonce, commitment, storedCommitment) {
        try {
            // For now, implement a simple verification
            // In a real system, this would use ZK proofs to verify similarity
            const threshold = 1000;
            
            // Simple similarity check (this should be replaced with ZK proof verification)
            const vectorSum = vector.reduce((sum, val) => sum + val, 0);
            const currentCommitment = Math.abs((vectorSum * nonce + nonce * 997) % 1000000);
            
            // Check if commitments are similar (within threshold)
            const difference = Math.abs(currentCommitment - storedCommitment);
            const verified = difference <= threshold;
            
            // Generate a mock proof for demo purposes
            const proof = {
                type: 'biometric_verification',
                commitment: currentCommitment,
                storedCommitment: storedCommitment,
                difference: difference,
                threshold: threshold,
                timestamp: new Date().toISOString()
            };
            
            return {
                verified,
                proof
            };
            
        } catch (error) {
            console.error('Verification error:', error);
            return {
                verified: false,
                proof: null,
                error: error.message
            };
        }
    }
}

module.exports = new BiometricService();
