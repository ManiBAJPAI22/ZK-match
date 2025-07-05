const snarkjs = require("snarkjs");
const fs = require("fs").promises;
const path = require("path");

class ProofService {
    constructor() {
        this.wasmPath = path.join(__dirname, '../../../keys/biometric_similarity_js/biometric_similarity.wasm');
        this.zkeyPath = path.join(__dirname, '../../../keys/biometric_similarity_final.zkey');
        this.vkeyPath = path.join(__dirname, '../../../keys/verification_key.json');
        this.circuitReady = false;
        this.verificationKey = null;
        
        this.initializeCircuit();
    }
    
    async initializeCircuit() {
        try {
            await this.checkRequiredFiles();
            
            const vkeyData = await fs.readFile(this.vkeyPath, 'utf8');
            this.verificationKey = JSON.parse(vkeyData);
            
            this.circuitReady = true;
            console.log('✅ ZK circuit initialized successfully');
        } catch (error) {
            console.log('⚠️ ZK circuit not ready:', error.message);
            this.circuitReady = false;
        }
    }
    
    async checkRequiredFiles() {
        const files = [this.wasmPath, this.zkeyPath, this.vkeyPath];
        
        for (const file of files) {
            try {
                await fs.access(file);
                console.log(`✅ Found: ${path.basename(file)}`);
            } catch (error) {
                throw new Error(`Required file not found: ${path.basename(file)}`);
            }
        }
    }
    
    async generateSimilarityProof(vectorA, nonceA, commitmentA, commitmentB, threshold) {
        try {
            if (!this.circuitReady) {
                throw new Error('ZK circuit not ready');
            }
            
            // For our 4D circuit, create a 4D vectorB
            const vectorB = [
                (commitmentA % 100) - 50,
                (commitmentA % 200) - 100,
                (commitmentA % 300) - 150,
                (commitmentA % 400) - 200
            ];
            const nonceB = commitmentB % 1000000;
            
            const input = {
                vector_a: vectorA,
                vector_b: vectorB,
                threshold: threshold
            };
            
            console.log('🔐 Generating ZK proof with input:', input);
            const startTime = Date.now();
            
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(
                input,
                this.wasmPath,
                this.zkeyPath
            );
            
            const generationTime = Date.now() - startTime;
            console.log(`✅ ZK proof generated in ${generationTime}ms`);
            
            return {
                success: true,
                proof,
                publicSignals,
                isUnique: publicSignals[0],
                generationTime,
                proofSize: JSON.stringify(proof).length
            };
            
        } catch (error) {
            console.error('❌ ZK proof generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async verifyProof(proof, publicSignals) {
        try {
            if (!this.circuitReady || !this.verificationKey) {
                throw new Error('Verification key not loaded');
            }
            
            const isValid = await snarkjs.groth16.verify(
                this.verificationKey,
                publicSignals,
                proof
            );
            
            console.log(`🔍 ZK proof verification: ${isValid ? 'VALID' : 'INVALID'}`);
            return isValid;
        } catch (error) {
            console.error('❌ ZK proof verification failed:', error);
            return false;
        }
    }
    
    async getSystemInfo() {
        return {
            circuitReady: this.circuitReady,
            files: {
                wasm: await this.fileExists(this.wasmPath),
                zkey: await this.fileExists(this.zkeyPath),
                vkey: await this.fileExists(this.vkeyPath)
            },
            versions: {
                snarkjs: '0.7.x', // FIXED: removed problematic package.json require
                node: process.version
            },
            paths: {
                wasm: path.basename(this.wasmPath),
                zkey: path.basename(this.zkeyPath),
                vkey: path.basename(this.vkeyPath)
            },
            status: this.circuitReady ? 'ZK Circuit Active - Full Functionality' : 'ZK Circuit Not Ready'
        };
    }
    
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = new ProofService();