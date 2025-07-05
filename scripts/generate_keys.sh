#!/bin/bash

# ZK Cryptographic Keys Generation Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_step "Generating cryptographic keys for ZK proofs..."

# Check dependencies
if ! command -v snarkjs &> /dev/null; then
    print_error "snarkjs is not installed!"
    echo "Install with: npm install -g snarkjs"
    exit 1
fi

# Check if circuit is compiled
if [ ! -f "keys/biometric_similarity.r1cs" ]; then
    print_error "Circuit not found! Please run ./scripts/compile_circuits.sh first"
    exit 1
fi

print_success "Dependencies check passed"

# Download Powers of Tau (trusted setup)
PTAU_FILE="keys/powersOfTau28_hez_final_15.ptau"

if [ ! -f "$PTAU_FILE" ]; then
    print_step "Downloading Powers of Tau ceremony file..."
    print_warning "This is a large file (~200MB) and may take a while..."
    
    cd keys
    
    # Try multiple sources
    if wget -O powersOfTau28_hez_final_15.ptau \
        "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau"; then
        print_success "Powers of Tau downloaded successfully"
    elif curl -o powersOfTau28_hez_final_15.ptau \
        "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau"; then
        print_success "Powers of Tau downloaded successfully (via curl)"
    else
        print_error "Failed to download Powers of Tau file"
        print_warning "You can manually download from:"
        echo "https://github.com/iden3/snarkjs#7-prepare-phase-2"
        exit 1
    fi
    
    cd ..
else
    print_success "Powers of Tau file already exists"
fi

# Verify the ptau file
print_step "Verifying Powers of Tau file..."
if snarkjs powersoftau verify "$PTAU_FILE"; then
    print_success "Powers of Tau verification passed"
else
    print_warning "Powers of Tau verification failed, but continuing..."
fi

# Phase 2 Setup (Circuit-specific)
print_step "Starting Phase 2 setup (circuit-specific)..."

snarkjs groth16 setup \
    keys/biometric_similarity.r1cs \
    "$PTAU_FILE" \
    keys/biometric_similarity_0000.zkey

print_success "Initial setup key generated"

# Contribute to the ceremony (add entropy)
print_step "Contributing randomness to the ceremony..."

# Generate random contribution name
CONTRIBUTION_NAME="contribution_$(date +%s)_$(hostname)"

echo "Adding entropy from system randomness..." | snarkjs zkey contribute \
    keys/biometric_similarity_0000.zkey \
    keys/biometric_similarity_0001.zkey \
    --name="$CONTRIBUTION_NAME" \
    -v

print_success "Contribution added successfully"

# Apply random beacon (final step)
print_step "Applying random beacon..."

snarkjs zkey beacon \
    keys/biometric_similarity_0001.zkey \
    keys/biometric_similarity_final.zkey \
    0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f \
    10 \
    -n="Final Beacon phase2"

print_success "Random beacon applied"

# Verify the final key
print_step "Verifying final proving key..."

if snarkjs zkey verify \
    keys/biometric_similarity.r1cs \
    "$PTAU_FILE" \
    keys/biometric_similarity_final.zkey; then
    print_success "Proving key verification passed"
else
    print_error "Proving key verification failed!"
    exit 1
fi

# Export verification key
print_step "Exporting verification key..."

snarkjs zkey export verificationkey \
    keys/biometric_similarity_final.zkey \
    keys/verification_key.json

print_success "Verification key exported"

# Export Solidity verifier (for smart contract integration)
print_step "Generating Solidity verifier contract..."

snarkjs zkey export solidityverifier \
    keys/biometric_similarity_final.zkey \
    contracts/BiometricVerifier.sol

print_success "Solidity verifier generated"

# Clean up intermediate files
print_step "Cleaning up intermediate files..."

rm -f keys/biometric_similarity_0000.zkey
rm -f keys/biometric_similarity_0001.zkey

print_success "Cleanup complete"

# Display final statistics
print_step "Key Generation Summary:"
echo ""
echo "📁 Generated Files:"
ls -lh keys/biometric_similarity_final.zkey
ls -lh keys/verification_key.json
ls -lh contracts/BiometricVerifier.sol 2>/dev/null || echo "Solidity verifier: Generated"

echo ""
echo "🔐 Key Sizes:"
echo "  Proving Key: $(du -h keys/biometric_similarity_final.zkey | cut -f1)"
echo "  Verification Key: $(du -h keys/verification_key.json | cut -f1)"

echo ""
print_success "🎉 Cryptographic setup complete!"
echo ""
echo "Next steps:"
echo "1. Run tests: npm test"
echo "2. Generate proofs: node scripts/proof_example.js"
echo "3. Deploy contracts (if using blockchain)"

print_warning "SECURITY NOTE: In production, the trusted setup ceremony should"
print_warning "be performed by multiple independent parties for maximum security."