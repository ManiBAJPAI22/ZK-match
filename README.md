# ZK-match

> **Note:** This project is a submission for the ZK Match coding challenge assignment. All architectural documentation, diagrams, and developer notes are in `docs/ARCHITECTURE.md`.

## Overview
A privacy-preserving biometric system using Zero-Knowledge Proofs (ZKPs) to prevent Sybil attacks and protect user privacy. Each user's biometric is a 512-dimensional vector, stored as a cryptographic commitment. Cosine similarity checks are performed in zero-knowledge to ensure uniqueness.

## Architecture
See `docs/ARCHITECTURE.md` for detailed diagrams, flowcharts, and developer notes.

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

## Developer Notes
- All key architectural decisions, diagrams, and pseudo-code are in `docs/ARCHITECTURE.md`.
- Key code sections are commented for clarity.
- For production, review all security and scalability notes above.
