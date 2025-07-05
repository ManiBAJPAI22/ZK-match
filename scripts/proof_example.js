const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

// Console colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorLog(color, message) {
    console.log(color + message + colors.reset);
}

// Helper functions
function generateRandomVector(size, scale = 1000) {
    return Array(size).fill(0).map(() => 
        Math.floor((Math.random() * 2 - 1) * scale)
    );
}

function calculateDotProduct(a, b) {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
}

function calculateNormSquared(vector) {
    return vector.reduce((sum, val) => sum + val * val, 0);
}

function calculateCosineSimilarity(a, b) {
    const dotProd = calculateDotProduct(a, b);
    const normA = Math.sqrt(calculateNormSquared(a));
    const normB = Math.sqrt(calculateNormSquared(b));
    
    if (normA === 0 || normB === 0) return 0;
    return dotProd / (normA * normB);
}

// Mock commitment function (in practice, this would use proper cryptography)
function generateCommitment(vector, nonce) {
    const vectorSum = vector.reduce((sum, val) => sum + val, 0);
    return Math.abs(vectorSum * nonce) % 1000000;
}

async function demonstrateZKProof() {
    colorLog(colors.blue + colors.bright, "🔐 ZK Biometric Similarity Proof Demonstration");
    console.log("=" .repeat(60));
    
    try {
        // Check required files exist
        const requiredFiles = [
            "keys/biometric_similarity.wasm",
            "keys/biometric_similarity_final.zkey",
            "keys/verification_key.json"
        ];
        
        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Required file missing: ${file}\nPlease run setup scripts first.`);
            }
        }
        
        colorLog(colors.green, "✅ All required files found");
        
        // Test Case 1: Similar vectors (should be flagged as duplicate)
        colorLog(colors.cyan, "\n📋 Test Case 1: Similar Vectors (Expected: NOT UNIQUE)");
        await testSimilarVectors();
        
        // Test Case 2: Different vectors (should be unique)
        colorLog(colors.cyan, "\n📋 Test Case 2: Different Vectors (Expected: UNIQUE)");
        await testDifferentVectors();
        
        // Test Case 3: Identical vectors (should definitely be flagged)
        colorLog(colors.cyan, "\n📋 Test Case 3: Identical Vectors (Expected: NOT UNIQUE)");
        await testIdenticalVectors();
        
        // Test Case 4: Performance test
        colorLog(colors.cyan, "\n📋 Test Case 4: Performance Measurement");
        await performanceTest();
        
    } catch (error) {
        colorLog(colors.red, `❌ Error: ${error.message}`);
        process.exit(1);
    }
}

async function testSimilarVectors() {
    const vectorSize = 16;
    
    // Create base vector
    const baseVector = generateRandomVector(vectorSize, 500);
    
    // Create similar vector (base + small noise)
    const similarVector = baseVector.map(val => 
        val + Math.floor((Math.random() - 0.5) * 100) // Add ±50 noise
    );
    
    const similarity = calculateCosineSimilarity(baseVector, similarVector);
    console.log(`   📊 Calculated similarity: ${similarity.toFixed(4)}`);
    
    await runProofTest("Similar Vectors", baseVector, similarVector, 100);
}

async function testDifferentVectors() {
    const vectorSize = 16;
    
    // Create very different vectors
    const vectorA = Array(vectorSize).fill(1000);  // All positive
    const vectorB = Array(vectorSize).fill(-1000); // All negative
    
    const similarity = calculateCosineSimilarity(vectorA, vectorB);
    console.log(`   📊 Calculated similarity: ${similarity.toFixed(4)}`);
    
    await runProofTest("Different Vectors", vectorA, vectorB, 100);
}

async function testIdenticalVectors() {
    const vectorSize = 16;
    
    const identicalVector = generateRandomVector(vectorSize, 800);
    
    const similarity = calculateCosineSimilarity(identicalVector, identicalVector);
    console.log(`   📊 Calculated similarity: ${similarity.toFixed(4)}`);
    
    await runProofTest("Identical Vectors", identicalVector, [...identicalVector], 900);
}

async function runProofTest(testName, vectorA, vectorB, threshold) {
    console.log(`   🔄 Running ${testName} test...`);
    
    const startTime = Date.now();
    
    try {
        // Generate mock commitments
        const nonceA = Math.floor(Math.random() * 1000000);
        const nonceB = Math.floor(Math.random() * 1000000);
        const commitmentA = generateCommitment(vectorA, nonceA);
        const commitmentB = generateCommitment(vectorB, nonceB);
        
        // Prepare circuit input
        const input = {
            vector_a: vectorA,
            vector_b: vectorB,
            nonce_a: nonceA,
            nonce_b: nonceB,
            commitment_a: commitmentA,
            commitment_b: commitmentB,
            threshold: threshold
        };
        
        console.log(`   🔐 Generating ZK proof...`);
        
        // Generate the proof
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            "keys/biometric_similarity.wasm",
            "keys/biometric_similarity_final.zkey"
        );
        
        const proofTime = Date.now() - startTime;
        console.log(`   ⏱️  Proof generation time: ${proofTime}ms`);
        
        // Extract the result
        const isUnique = publicSignals[0];
        const uniqueStatus = isUnique === "1" ? "UNIQUE" : "NOT UNIQUE";
        const statusColor = isUnique === "1" ? colors.green : colors.yellow;
        
        colorLog(statusColor, `   🎯 Result: ${uniqueStatus}`);
        
        // Verify the proof
        console.log(`   🔍 Verifying proof...`);
        const vKey = JSON.parse(fs.readFileSync("keys/verification_key.json"));
        const isValid = await snarkjs.groth16.verify(vKey, publicSignals, proof);
        
        const verifyTime = Date.now() - startTime - proofTime;
        console.log(`   ⏱️  Verification time: ${verifyTime}ms`);
        
        if (isValid) {
            colorLog(colors.green, `   ✅ Proof verification: VALID`);
        } else {
            colorLog(colors.red, `   ❌ Proof verification: INVALID`);
        }
        
        // Display proof statistics
        console.log(`   📈 Proof size: ${JSON.stringify(proof).length} bytes`);
        console.log(`   📊 Public signals: ${publicSignals.length} values`);
        
        return { isValid, proofTime, verifyTime, isUnique };
        
    } catch (error) {
        colorLog(colors.red, `   ❌ Test failed: ${error.message}`);
        throw error;
    }
}

async function performanceTest() {
    console.log(`   🚀 Running performance benchmark...`);
    
    const testCount = 5;
    const results = [];
    
    for (let i = 0; i < testCount; i++) {
        console.log(`   📊 Benchmark ${i + 1}/${testCount}`);
        
        const vectorA = generateRandomVector(16, 1000);
        const vectorB = generateRandomVector(16, 1000);
        
        const result = await runProofTest(`Benchmark ${i + 1}`, vectorA, vectorB, 200);
        results.push(result);
    }
    
    // Calculate averages
    const avgProofTime = results.reduce((sum, r) => sum + r.proofTime, 0) / testCount;
    const avgVerifyTime = results.reduce((sum, r) => sum + r.verifyTime, 0) / testCount;
    
    console.log("\n   📈 Performance Summary:");
    console.log(`   Average proof generation: ${avgProofTime.toFixed(2)}ms`);
    console.log(`   Average verification: ${avgVerifyTime.toFixed(2)}ms`);
    console.log(`   Total tests run: ${testCount}`);
    console.log(`   Success rate: ${results.filter(r => r.isValid).length}/${testCount}`);
}

// Example of how to integrate with a backend service
async function generateProofForAPI(vectorA, vectorB, threshold = 100) {
    try {
        const nonceA = Math.floor(Math.random() * 1000000);
        const nonceB = Math.floor(Math.random() * 1000000);
        const commitmentA = generateCommitment(vectorA, nonceA);
        const commitmentB = generateCommitment(vectorB, nonceB);
        
        const input = {
            vector_a: vectorA,
            vector_b: vectorB,
            nonce_a: nonceA,
            nonce_b: nonceB,
            commitment_a: commitmentA,
            commitment_b: commitmentB,
            threshold: threshold
        };
        
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            "keys/biometric_similarity.wasm",
            "keys/biometric_similarity_final.zkey"
        );
        
        return {
            success: true,
            proof: proof,
            publicSignals: publicSignals,
            isUnique: publicSignals[0] === "1",
            commitments: {
                commitment_a: commitmentA,
                commitment_b: commitmentB
            }
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Export for use in other modules
module.exports = {
    generateProofForAPI,
    calculateCosineSimilarity,
    generateRandomVector
};

// Run demonstration if called directly
if (require.main === module) {
    demonstrateZKProof().then(() => {
        colorLog(colors.green + colors.bright, "\n🎉 ZK Proof demonstration completed successfully!");
        console.log("\nNext steps:");
        console.log("1. Integrate with your backend service");
        console.log("2. Scale to 512-dimensional vectors");
        console.log("3. Deploy to production environment");
    }).catch(error => {
        colorLog(colors.red, `\n💥 Demonstration failed: ${error.message}`);
        process.exit(1);
    });
}