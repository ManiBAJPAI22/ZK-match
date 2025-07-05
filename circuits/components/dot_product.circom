pragma circom 2.0.0;

template DotProduct(n) {
    signal input a[n];
    signal input b[n];
    signal output result;
    
    signal products[n];
    signal partial_sums[n];
    
    products[0] <== a[0] * b[0];
    partial_sums[0] <== products[0];
    
    for (var i = 1; i < n; i++) {
        products[i] <== a[i] * b[i];
        partial_sums[i] <== partial_sums[i-1] + products[i];
    }
    
    result <== partial_sums[n-1];
}