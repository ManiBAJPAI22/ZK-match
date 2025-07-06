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
   git clone <your-repo-url>
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
   
   **Option A: Generate Your Own Keys (Recommended for Production)**
   ```bash
   # Install Circom globally if not already installed
   npm install -g circom
   
   # Install snarkjs globally if not already installed
   npm install -g snarkjs
   
   # Compile the ZK circuit
   npm run compile
   
   # Generate trusted setup keys (this may take 10-30 minutes)
   npm run setup-keys
   ```
   
   **Option B: Download Pre-generated Keys (Demo/Development)**
   ```bash
   # Create keys directory
   mkdir -p keys
   
   # Download pre-generated keys (if available)
   # Note: Replace with actual download links if you provide them
   curl -o keys/biometric_similarity_final.zkey <download-url>
   curl -o keys/verification_key.json <download-url>
   curl -o keys/biometric_similarity_js/biometric_similarity.wasm <download-url>
   ```
   
   **Option C: Use Demo Mode (No ZK Proofs)**
   ```bash
   # The system will run in demo mode without ZK proofs
   # Some features will be limited but the UI will work
   ```

4. **Start the application:**
   ```bash
   # Development mode (both frontend and backend)
   npm run dev
   ```

5. **Access the application:**
   - Open your browser and go to: `http://localhost:3000`
   - Backend API runs on: `http://localhost:3001`

### Production Deployment

#### Frontend (Vercel)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com/) and create a new project
3. Set root directory to `frontend/`
4. Add environment variable: `REACT_APP_API_URL` pointing to your backend URL
5. Deploy

#### Backend (Render/Railway/Heroku)
1. Deploy to your preferred platform (Render recommended for free tier)
2. **Important:** Include the generated keys in your deployment or generate them during deployment
3. Set environment variables as needed
4. Update frontend API URL to point to your backend

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

### Getting Help
- Check the logs in the terminal for error messages
- Ensure all dependencies are installed correctly
- Verify that circuit files are generated in the `keys/` directory
- If keys are missing, the system will run in demo mode with limited functionality
