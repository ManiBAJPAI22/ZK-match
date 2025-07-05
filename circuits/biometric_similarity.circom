pragma circom 2.0.0;

include "components/dot_product.circom";
include "components/vector_norm.circom";

template BiometricSimilarity(n) {
    // Inputs (all public for simplicity)
    signal input vector_a[n];
    signal input vector_b[n];
    signal input threshold;
    
    // Output
    signal output is_unique; // 1 if unique, 0 if similar
    
    // Calculate dot product
    component dot_prod = DotProduct(n);
    for (var i = 0; i < n; i++) {
        dot_prod.a[i] <== vector_a[i];
        dot_prod.b[i] <== vector_b[i];
    }
    
    // Simple threshold check: if dot product is below threshold, vectors are unique
    component threshold_check = LessThan(32);
    threshold_check.in[0] <== dot_prod.result;
    threshold_check.in[1] <== threshold;
    
    is_unique <== threshold_check.out;
}

// Start with 4 dimensions for testing (easier to debug)
component main = BiometricSimilarity(4);