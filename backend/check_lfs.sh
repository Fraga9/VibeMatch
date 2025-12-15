#!/bin/bash
# Check if Git LFS files are properly downloaded

echo "Checking Git LFS files..."

# Check if precomputed_embeddings.pkl is a proper file
if [ ! -f "model/precomputed_embeddings.pkl" ]; then
    echo "❌ precomputed_embeddings.pkl not found!"
    exit 1
fi

# Check file size (should be ~345 MB, not ~130 bytes which is LFS pointer)
SIZE=$(stat -f%z "model/precomputed_embeddings.pkl" 2>/dev/null || stat -c%s "model/precomputed_embeddings.pkl" 2>/dev/null)

if [ "$SIZE" -lt 1000000 ]; then
    echo "❌ precomputed_embeddings.pkl is too small ($SIZE bytes) - LFS didn't download!"
    echo "📄 File content:"
    head -n 5 "model/precomputed_embeddings.pkl"

    echo ""
    echo "🔧 Attempting to pull LFS files..."
    git lfs pull

    # Check size again
    SIZE=$(stat -f%z "model/precomputed_embeddings.pkl" 2>/dev/null || stat -c%s "model/precomputed_embeddings.pkl" 2>/dev/null)
    if [ "$SIZE" -lt 1000000 ]; then
        echo "❌ LFS pull failed! File still too small."
        exit 1
    fi
fi

echo "✅ Git LFS files OK (size: $SIZE bytes)"
