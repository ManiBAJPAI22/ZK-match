pragma circom 2.0.0;

template VectorNormSquared(n) {
    signal input vector[n];
    signal output norm_squared;
    
    signal squares[n];
    signal partial_sums[n];
    
    squares[0] <== vector[0] * vector[0];
    partial_sums[0] <== squares[0];
    
    for (var i = 1; i < n; i++) {
        squares[i] <== vector[i] * vector[i];
        partial_sums[i] <== partial_sums[i-1] + squares[i];
    }
    
    norm_squared <== partial_sums[n-1];
}

template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;
    
    component lt = Num2Bits(n + 1);
    lt.in <== in[0] + (1 << n) - in[1];
    out <== 1 - lt.out[n];
}

template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var lc1 = 0;
    var e2 = 1;
    
    for (var i = 0; i < n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] - 1) === 0;
        lc1 += out[i] * e2;
        e2 = e2 + e2;
    }
    lc1 === in;
}