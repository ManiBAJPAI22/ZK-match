pragma circom 2.0.0;

include "dot_product.circom";
include "vector_norm.circom";

// Computes cosine similarity between two vectors
// similarity = dot_product(a, b) / (norm(a) * norm(b))
template CosineSimilarity(n) {
    signal input vector_a[n];
    signal input vector_b[n];
    signal output similarity;
    
    // Calculate dot product
    component dot_prod = DotProduct(n);
    for (var i = 0; i < n; i++) {
        dot_prod.a[i] <== vector_a[i];
        dot_prod.b[i] <== vector_b[i];
    }
    
    // Calculate squared norms (to avoid square root complexity)
    component norm_a_sq = VectorNormSquared(n);
    component norm_b_sq = VectorNormSquared(n);
    
    for (var i = 0; i < n; i++) {
        norm_a_sq.vector[i] <== vector_a[i];
        norm_b_sq.vector[i] <== vector_b[i];
    }
    
    // Calculate similarity using squared norms
    // similarity = dot_product^2 / (norm_a^2 * norm_b^2)
    // This avoids square root but still gives relative comparison
    
    signal dot_squared <== dot_prod.result * dot_prod.result;
    signal norm_product <== norm_a_sq.norm_squared * norm_b_sq.norm_squared;
    
    // For ZK circuits, we need to be careful with division
    // We'll use the constraint: similarity * norm_product === dot_squared
    // And let the prover provide the similarity value
    
    // Alternative approach: Use fixed-point arithmetic
    // Scale up dot_product and scale down the result
    signal scaled_dot <== dot_prod.result * 1000000;  // Scale factor
    similarity <== scaled_dot / norm_product;
}

// Optimized version that works directly with cosine values
// Avoids division by using constraint-based approach
template CosineSimilarityOptimized(n, precision_bits) {
    signal input vector_a[n];
    signal input vector_b[n];
    signal output similarity;
    
    // Use fixed-point arithmetic throughout
    var scale_factor = 2 ** precision_bits;
    
    // Calculate dot product
    component dot_prod = DotProduct(n);
    for (var i = 0; i < n; i++) {
        dot_prod.a[i] <== vector_a[i];
        dot_prod.b[i] <== vector_b[i];
    }
    
    // Calculate norms
    component norm_a = VectorNormSquared(n);
    component norm_b = VectorNormSquared(n);
    
    for (var i = 0; i < n; i++) {
        norm_a.vector[i] <== vector_a[i];
        norm_b.vector[i] <== vector_b[i];
    }
    
    // Instead of division, use multiplication constraint
    // If similarity = dot / (norm_a * norm_b), then
    // similarity * norm_a * norm_b = dot
    
    signal norm_product <== norm_a.norm_squared * norm_b.norm_squared;
    
    // The prover provides similarity, we verify the constraint
    similarity * norm_product === dot_prod.result * scale_factor;
    
    // Ensure similarity is in valid range [-1, 1] scaled
    component range_check = RangeCheck(precision_bits + 1);
    range_check.in <== similarity + scale_factor;  // Shift to positive range
    range_check.max_value <== 2 * scale_factor;   // Max value for range [0, 2*scale]
}

// Helper template for range checking
template RangeCheck(bits) {
    signal input in;
    signal input max_value;
    
    component lt1 = LessThan(bits);
    lt1.in[0] <== 0;
    lt1.in[1] <== in + 1;  // Check in >= 0
    
    component lt2 = LessThan(bits);
    lt2.in[0] <== in;
    lt2.in[1] <== max_value + 1;  // Check in <= max_value
    
    // Both checks must pass
    signal check1 <== lt1.out;
    signal check2 <== lt2.out;
    check1 === 1;
    check2 === 1;
}

// Simplified cosine similarity for testing
template CosineSimilaritySimple(n) {
    signal input vector_a[n];
    signal input vector_b[n];
    signal output similarity;
    
    // Just compute dot product for now
    // In practice, you'd normalize by vector magnitudes
    component dot_prod = DotProduct(n);
    for (var i = 0; i < n; i++) {
        dot_prod.a[i] <== vector_a[i];
        dot_prod.b[i] <== vector_b[i];
    }
    
    // For testing, just return scaled dot product
    similarity <== dot_prod.result;
}