#!/bin/bash

echo "🔑 Creating local ZK ceremony for testing..."

cd keys

echo "📋 Step 1: Initialize Powers of Tau ceremony..."
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v

echo "📋 Step 2: Add first contribution..."
echo "first_contribution_$(date +%s)" | snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v

echo "📋 Step 3: Add second contribution..."
echo "second_contribution_$(date +%s)" | snarkjs powersoftau contribute pot12_0001.ptau pot12_0002.ptau --name="Second contribution" -v

echo "📋 Step 4: Apply random beacon..."
snarkjs powersoftau beacon pot12_0002.ptau pot12_beacon.ptau 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final beacon"

echo "📋 Step 5: Prepare for phase 2..."
snarkjs powersoftau prepare phase2 pot12_beacon.ptau pot12_final.ptau -v

echo "📋 Step 6: Verify ceremony..."
snarkjs powersoftau verify pot12_final.ptau

echo "📋 Step 7: Generate circuit-specific proving key..."
snarkjs groth16 setup biometric_similarity.r1cs pot12_final.ptau biometric_similarity_0000.zkey

echo "📋 Step 8: Contribute to circuit key..."
echo "circuit_contribution_$(date +%s)" | snarkjs zkey contribute biometric_similarity_0000.zkey biometric_similarity_final.zkey --name="Circuit contribution"

echo "📋 Step 9: Export verification key..."
snarkjs zkey export verificationkey biometric_similarity_final.zkey verification_key.json

echo "📋 Step 10: Verify final keys..."
snarkjs zkey verify biometric_similarity.r1cs pot12_final.ptau biometric_similarity_final.zkey

echo "✅ Local ceremony completed successfully!"
echo ""
echo "📁 Generated files:"
ls -lh biometric_similarity_final.zkey verification_key.json

# Clean up intermediate files
rm -f pot12_0000.ptau pot12_0001.ptau pot12_0002.ptau pot12_beacon.ptau biometric_similarity_0000.zkey

cd ..
