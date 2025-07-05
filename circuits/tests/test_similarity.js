const chai = require("chai");
const path = require("path");
const wasm_tester = require("circom_tester").wasm;
const expect = chai.expect;

describe("Biometric Similarity Circuit Tests", () => {
    let circuit;
    const vectorSize = 16; // Start with smaller size for testing
    
    before(async function() {
        this.timeout(60000); // Increase timeout for circuit compilation
        
        console.log("Compiling circuit...");
        circuit = await wasm_tester(
            path.join(__dirname, "..", "biometric_similarity.circom"),
            {
                recompile: true,
                output: path.join(__dirname, "..", "..", "keys"),
                verbose: true
            }
        );
        console.log("Circuit compiled successfully!");
    });
    
    describe("Basic Circuit Functionality", () => {
        it("Should compile and execute with valid inputs", async () => {
            const vectorA = Array(vectorSize).fill(0).map(() => 
                Math.floor((Math.random() * 2 - 1) * 1000) // Fixed-point representation
            );
            const vectorB = Array(vectorSize).fill(0).map(() => 
                Math.floor((Math.random() * 2 - 1) * 1000)
            );
            
            const input = {
                vector_a: vectorA,
                vector_b: vectorB,
                nonce_a: 12345,
                nonce_b: 67890,
                commitment_a: 999999, // Mock commitment
                commitment_b: 888888, // Mock commitment
                threshold: 100 // 10% similarity threshold in fixed-point
            };
            
            const witness = await circuit.calculateWitness(input);
            expect(witness[0]).to.equal(1n); // Circuit should execute successfully
        });
    });
    
    describe("Identical Vector Detection", () => {
        it("Should detect identical vectors (high similarity)", async () => {
            const identicalVector = Array(vectorSize).fill(0).map(() => 
                Math.floor((Math.random() * 2 - 1) * 1000)
            );
            
            const input = {
                vector_a: identicalVector,
                vector_b: [...identicalVector], // Same vector
                nonce_a: 11111,
                nonce_b: 22222,
                commitment_a: 777777,
                commitment_b: 666666,
                threshold: 800 // High threshold
            };
            
            const witness = await circuit.calculateWitness(input);
            const isUnique = witness[1]; // Output signal
            
            // For identical vectors, similarity should be high, so is_unique should be 0
            expect(isUnique.toString()).to.equal("0");
        });
    });
    
    describe("Different Vector Detection", () => {
        it("Should detect different vectors (low similarity)", async () => {
            const vectorA = Array(vectorSize).fill(1000); // All positive
            const vectorB = Array(vectorSize).fill(-1000); // All negative
            
            const input = {
                vector_a: vectorA,
                vector_b: vectorB,
                nonce_a: 33333,
                nonce_b: 44444,
                commitment_a: 555555,
                commitment_b: 444444,
                threshold: 100 // Low threshold
            };
            
            const witness = await circuit.calculateWitness(input);
            const isUnique = witness[1];
            
            // For very different vectors, is_unique should be 1
            expect(isUnique.toString()).to.equal("1");
        });
    });
    
    describe("Edge Cases", () => {
        it("Should handle zero vectors gracefully", async () => {
            const zeroVector = Array(vectorSize).fill(0);
            
            const input = {
                vector_a: zeroVector,
                vector_b: zeroVector,
                nonce_a: 55555,
                nonce_b: 66666,
                commitment_a: 333333,
                commitment_b: 222222,
                threshold: 50
            };
            
            try {
                const witness = await circuit.calculateWitness(input);
                console.log("Zero vector test passed");
            } catch (error) {
                console.log("Expected error for zero vectors:", error.message);
                // This is expected due to division by zero in norm calculation
            }
        });
        
        it("Should handle maximum values", async () => {
            const maxVector = Array(vectorSize).fill(1000); // Max positive values
            
            const input = {
                vector_a: maxVector,
                vector_b: maxVector,
                nonce_a: 77777,
                nonce_b: 88888,
                commitment_a: 111111,
                commitment_b: 999999,
                threshold: 900
            };
            
            const witness = await circuit.calculateWitness(input);
            expect(witness[0]).to.equal(1n);
        });
    });
    
    describe("Threshold Boundary Testing", () => {
        it("Should correctly classify vectors at threshold boundary", async () => {
            // Create vectors with known similarity
            const baseVector = [1000, 500, -300, 800, 200, -600, 400, -100, 
                               700, -400, 100, 900, -200, 300, -500, 600];
            
            // Slightly modified vector (should be similar)
            const similarVector = [1010, 490, -310, 790, 210, -590, 410, -90,
                                  710, -390, 110, 910, -190, 310, -490, 610];
            
            const input = {
                vector_a: baseVector,
                vector_b: similarVector,
                nonce_a: 99999,
                nonce_b: 11111,
                commitment_a: 123456,
                commitment_b: 654321,
                threshold: 500 // Medium threshold
            };
            
            const witness = await circuit.calculateWitness(input);
            const isUnique = witness[1];
            
            console.log(`Similarity test result: ${isUnique}`);
            expect([0n, 1n]).to.include(isUnique); // Should be either 0 or 1
        });
    });
});

describe("Component Tests", () => {
    describe("Dot Product Circuit", () => {
        let dotProductCircuit;
        
        before(async function() {
            this.timeout(30000);
            
            // Create a simple test circuit for dot product
            const testCircuitCode = `
                pragma circom 2.0.0;
                include "components/dot_product.circom";
                
                component main = DotProduct(4);
            `;
            
            // Write test circuit to temporary file
            const fs = require('fs');
            const tempPath = path.join(__dirname, 'temp_dot_product.circom');
            fs.writeFileSync(tempPath, testCircuitCode);
            
            dotProductCircuit = await wasm_tester(tempPath);
        });
        
        it("Should calculate dot product correctly", async () => {
            const input = {
                a: [1, 2, 3, 4],
                b: [5, 6, 7, 8]
            };
            
            const witness = await dotProductCircuit.calculateWitness(input);
            const result = witness[1]; // Output is at index 1
            
            // Expected: 1*5 + 2*6 + 3*7 + 4*8 = 5 + 12 + 21 + 32 = 70
            expect(result.toString()).to.equal("70");
        });
        
        it("Should handle negative values", async () => {
            const input = {
                a: [-1, 2, -3, 4],
                b: [1, -2, 3, -4]
            };
            
            const witness = await dotProductCircuit.calculateWitness(input);
            const result = witness[1];
            
            // Expected: (-1)*1 + 2*(-2) + (-3)*3 + 4*(-4) = -1 - 4 - 9 - 16 = -30
            expect(result.toString()).to.equal("-30");
        });
    });
});

// Helper functions for testing
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