#!/bin/bash

# ZK Circuit Compilation Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_step "Starting ZK circuit compilation..."

# Create directories
mkdir -p keys
mkdir -p build

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    print_error "Circom is not installed! Please install it first."
    echo "Installation: https://docs.circom.io/getting-started/installation/"
    exit 1
fi

print_success "Circom found: $(circom --version)"

# Compile main circuit
print_step "Compiling biometric_similarity.circom..."

circom circuits/biometric_similarity.circom \
    --r1cs \
    --wasm \
    --sym \
    --output keys/ \
    --verbose

if [ $? -eq 0 ]; then
    print_success "Circuit compiled successfully!"
else
    print_error "Circuit compilation failed!"
    exit 1
fi

# Show circuit statistics
print_step "Circuit Information:"
if command -v snarkjs &> /dev/null; then
    snarkjs info -r keys/biometric_similarity.r1cs
else
    echo "snarkjs not found - install to see detailed circuit info"
fi

# Check file sizes
print_step "Generated Files:"
ls -lh keys/biometric_similarity*

print_success "Compilation complete! 🎉"
echo ""
echo "Next steps:"
echo "1. Run: ./scripts/generate_keys.sh"
echo "2. Run: npm test"