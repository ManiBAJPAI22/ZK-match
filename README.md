# ZK-match

> **Note:** This project is a submission for the ZK Match coding challenge assignment. All architectural documentation, diagrams, and developer notes are in `docs/ARCHITECTURE.md`.

## Overview
A privacy-preserving biometric system using Zero-Knowledge Proofs (ZKPs) to prevent Sybil attacks and protect user privacy. Each user's biometric is a 512-dimensional vector, stored as a cryptographic commitment. Cosine similarity checks are performed in zero-knowledge to ensure uniqueness.

## Quick Start

### Prerequisites
- **Node.js** (v18+ recommended)
- **npm** (v8+)
- **Circom** and **snarkjs** installed globally
- **Git**

### Installation & Deployment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ManiBAJPAI22/ZK-match/tree/512D
   cd zk-biometric-system
   ```

2. **Install dependencies:**
   ```bash
   # Root dependencies
   npm install
   
   # Backend dependencies
   cd backend && npm install && cd ..
   
   # Frontend dependencies
   cd frontend && npm install && cd ..
   ```

3. **Set up ZK Circuit Keys (Required):**
   
   **Recommended: Generate Your Own Keys Using Provided Scripts**
   ```bash
   # Install Circom globally if not already installed
   npm install -g circom
   
   # Install snarkjs globally if not already installed
   npm install -g snarkjs
   
   # Compile the ZK circuit (generates .r1cs, .wasm, .sym files)
   npm run compile
   # OR run the script directly:
   ./scripts/compile_circuits.sh
   
   # Generate trusted setup keys (this may take 10-30 minutes)
   # This creates the proving key (.zkey) and verification key (.json)
   npm run setup-keys
   # OR run the script directly:
   ./scripts/generate_keys.sh
   
   # Alternative: Quick test ceremony (faster, for development)
   ./scripts/create_test_ceremony.sh
   ```

   **Note:** The keys are not included in the repository for security reasons. 
   Each user should generate their own keys using the provided scripts.
   - Use `./scripts/create_test_ceremony.sh` for quick development/testing
   - Use `./scripts/generate_keys.sh` for production-ready keys

4. **Start the application:**
   ```bash
   # Development mode (both frontend and backend)
   npm run dev
   ```

5. **Access the application:**
   - Open your browser and go to: `http://localhost:3000`
   - Backend API runs on: `http://localhost:3001`


## Architecture
See `docs/ARCHITECTURE.md` for detailed diagrams, flowcharts, and developer notes.

## ZK Proof System Specifications

| Specification | Value/Type |
|---------------|------------|
| **ZK Protocol** | Groth16 zkSNARK |
| **Library Version** | snarkjs v0.7.5 |
| **Elliptic Curve** | BN-128 |
| **Field Size** | ~254 bits |
| **Vector Dimension** | 512 |
| **Similarity Threshold** | 0.1 (10%) |
| **Fixed-Point Scale** | 1,000,000 |
| **Proof Size** | ~200 bytes |
| **Verification Time** | O(1) |
| **Generation Time** | O(n²) |

## Security Assumptions & Privacy Guarantees
- **Trusted Setup:** zkSNARKs require a secure, multi-party trusted setup. For production, use a distributed ceremony.
- **In-Memory Storage:** This demo uses in-memory storage. For production, use encrypted, persistent storage.
- **Compromise Resistance:** If the server is compromised, only commitments (not raw biometrics) are exposed. Nonces are random and unique per user, preventing reverse engineering.
- **No Raw Biometric Storage:** The system never stores or transmits raw biometric vectors.

## Scalability & Performance
- **Proof Generation:** Generating ZK proofs for 512-dimensional vectors is computationally intensive. Consider offloading to the client and providing user feedback (see User Experience).
- **Large User Bases:** For many users, use batched proofs, approximate search, or hierarchical filtering to reduce the number of ZK checks per registration.
- **Verification:** Server-side verification is fast and scales well.

## Testing & Validation
- **ZK Circuit Testing:**
  - Use Circom's test suite to check edge cases (e.g., vectors at the similarity threshold, all-zeros, all-ones, etc.).
  - Example: `npm test` or `npm run test:verbose` to run all circuit tests in `circuits/tests/`.
- **End-to-End Testing:**
  - Simulate registration and verification flows with both valid and invalid proofs.
  - Use tools like Postman or integration test scripts to automate API testing.
- **Security Audits:**
  - Review commitment scheme and ZK circuit for vulnerabilities.
  - Consider third-party audits for production deployments.

## User Experience
- **Proof Generation Feedback:** Proof generation can take several seconds. Add a progress bar or spinner in the UI to inform users (see TODOs in frontend code).
- **Error Handling:** Clearly display errors if proof generation or verification fails.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run compile` | Compile the ZK circuit using Circom |
| `npm run setup-keys` | Generate trusted setup keys for ZK proofs |
| `npm test` | Run circuit tests |
| `npm run build` | Compile circuits and generate keys |
| `npm start` | Start backend server only |
| `npm run frontend:dev` | Start frontend only |
| `npm run frontend:build` | Build frontend for production |

## Developer Notes
- All key architectural decisions, diagrams, and pseudo-code are in `docs/ARCHITECTURE.md`.
- Key code sections are commented for clarity.
- For production, review all security and scalability notes above.

## Troubleshooting

### Common Issues
1. **Circuit not ready:** Run `npm run compile` and `npm run setup-keys`
2. **Port conflicts:** Change ports in `frontend/package.json` (proxy) and `backend/src/app.js`
3. **Memory issues:** Increase Node.js memory limit with `--max-old-space-size=4096`
4. **Missing keys:** Ensure you've generated or downloaded the required ZK circuit keys

