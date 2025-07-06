pragma circom 2.0.0;

include "components/cosine_similarity.circom";

// biometric_similarity.circom
// This circuit checks if two biometric vectors are sufficiently dissimilar (cosine similarity < threshold)
// for privacy-preserving, Sybil-resistant registration.
//
// Security/Privacy: No raw vectors are revealed; only the result of the similarity check is output.
// The circuit is designed for use in a zero-knowledge proof system (e.g., zkSNARKs).
//
// threshold: public input, e.g., 0.1 (scaled as needed for fixed-point arithmetic)
//
// For more details, see docs/ARCHITECTURE.md

template BiometricSimilarity(n) {
    // Inputs (all public for simplicity)
    signal input vector_a[n];
    signal input vector_b[n];
    signal input threshold;
    
    // Output
    signal output is_unique; // 1 if unique, 0 if similar
    
    // Calculate cosine similarity
    component cosine_sim = CosineSimilaritySimple(n);
    for (var i = 0; i < n; i++) {
        cosine_sim.vector_a[i] <== vector_a[i];
        cosine_sim.vector_b[i] <== vector_b[i];
    }
    
    // For cosine similarity: if similarity is below threshold, vectors are unique
    // Cosine similarity range: [-1, 1], where 1 = identical, -1 = opposite
    // We want to reject vectors with similarity >= threshold (too similar)
    component threshold_check = LessThan(32);
    threshold_check.in[0] <== cosine_sim.similarity;
    threshold_check.in[1] <== threshold;
    
    is_unique <== threshold_check.out;
}

// Start with 512 dimensions for realistic biometric vectors
component main = BiometricSimilarity(512);