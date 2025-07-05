pragma circom 2.0.0;

// Verifies that a commitment was created correctly from a vector and nonce
// Uses Pedersen commitment scheme: commitment = hash(vector || nonce)
template CommitmentVerify(n) {
    signal input vector[n];              // The original vector
    signal input nonce;                  // Random nonce used in commitment
    signal input expected_commitment;    // The commitment to verify
    signal output is_valid;              // 1 if commitment is valid, 0 otherwise
    
    // Calculate the commitment from vector and nonce
    component commitment_calc = PedersenCommitment(n);
    
    for (var i = 0; i < n; i++) {
        commitment_calc.vector[i] <== vector[i];
    }
    commitment_calc.nonce <== nonce;
    
    // Check if calculated commitment matches expected
    component equality_check = IsEqual();
    equality_check.in[0] <== commitment_calc.commitment;
    equality_check.in[1] <== expected_commitment;
    
    is_valid <== equality_check.out;
}

// Pedersen commitment calculation
// commitment = sum(vector[i] * G[i]) + nonce * H
// Where G[i] and H are generator points (simplified as constants here)
template PedersenCommitment(n) {
    signal input vector[n];
    signal input nonce;
    signal output commitment;
    
    // Simplified Pedersen commitment using scalar multiplication
    // In practice, this would use elliptic curve operations
    
    signal partial_commits[n];
    signal accumulated[n];
    
    // Generator constants (in practice, these would be elliptic curve points)
    var generators[n];
    for (var i = 0; i < n; i++) {
        generators[i] = 1000 + i;  // Simple constants for demo
    }
    
    // Calculate vector[i] * generators[i] for each component
    for (var i = 0; i < n; i++) {
        partial_commits[i] <== vector[i] * generators[i];
    }
    
    // Accumulate all partial commitments
    accumulated[0] <== partial_commits[0];
    for (var i = 1; i < n; i++) {
        accumulated[i] <== accumulated[i-1] + partial_commits[i];
    }
    
    // Add nonce contribution
    signal nonce_contribution <== nonce * 999999;  // H generator
    commitment <== accumulated[n-1] + nonce_contribution;
}

// More realistic Pedersen commitment using Poseidon hash
template PedersenCommitmentPoseidon(n) {
    signal input vector[n];
    signal input nonce;
    signal output commitment;
    
    // Use Poseidon hash for commitment
    component hasher = Poseidon(n + 1);
    
    for (var i = 0; i < n; i++) {
        hasher.inputs[i] <== vector[i];
    }
    hasher.inputs[n] <== nonce;
    
    commitment <== hasher.out;
}

// Poseidon hash implementation (simplified)
template Poseidon(nInputs) {
    signal input inputs[nInputs];
    signal output out;
    
    // Simplified hash - in practice use the full Poseidon implementation
    signal sum;
    sum <== 0;
    
    signal accumulated[nInputs];
    accumulated[0] <== inputs[0];
    
    for (var i = 1; i < nInputs; i++) {
        accumulated[i] <== accumulated[i-1] + inputs[i] * (i + 1);
    }
    
    // Apply some non-linear transformation (simplified)
    out <== accumulated[nInputs - 1] * accumulated[nInputs - 1];
}

// Equality check template
template IsEqual() {
    signal input in[2];
    signal output out;
    
    component isz = IsZero();
    isz.in <== in[1] - in[0];
    
    out <== isz.out;
}

// Zero check template
template IsZero() {
    signal input in;
    signal output out;
    
    signal inv;
    
    inv <-- in != 0 ? 1/in : 0;
    
    out <== -in*inv +1;
    in*out === 0;
}

// Hash-based commitment (alternative to Pedersen)
template HashCommitment(n) {
    signal input vector[n];
    signal input nonce;
    signal output commitment;
    
    // Simple hash function using arithmetic operations
    signal sum <== 0;
    signal products[n];
    signal accumulator[n];
    
    // Multiply each vector element by a prime and accumulate
    var primes[16] = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53];
    
    for (var i = 0; i < n; i++) {
        var prime = (i < 16) ? primes[i] : (53 + i);
        products[i] <== vector[i] * prime;
    }
    
    accumulator[0] <== products[0];
    for (var i = 1; i < n; i++) {
        accumulator[i] <== accumulator[i-1] + products[i];
    }
    
    // Mix in the nonce
    commitment <== accumulator[n-1] + nonce * 97;  // 97 is another prime
}