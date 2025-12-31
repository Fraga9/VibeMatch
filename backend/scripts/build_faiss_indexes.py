"""
Script para pre-construir índices FAISS offline.

Ejecutar localmente ANTES de deploy:
    python scripts/build_faiss_indexes.py

Esto genera:
    - model/track_faiss.index
    - model/artist_faiss.index
    - model/faiss_mappings.pkl

Reduce el pico de memoria en producción de ~1.9GB a ~600MB
y el tiempo de inicio de ~23s a ~2s.
"""

import pickle
import numpy as np
from pathlib import Path
import sys

try:
    import faiss
except ImportError:
    print("Error: FAISS not installed. Run: pip install faiss-cpu")
    sys.exit(1)


def build_faiss_indexes():
    model_dir = Path(__file__).parent.parent / "model"
    embeddings_path = model_dir / "precomputed_embeddings.pkl"

    print(f"Loading embeddings from {embeddings_path}...")

    if not embeddings_path.exists():
        print(f"Error: {embeddings_path} not found!")
        sys.exit(1)

    with open(embeddings_path, "rb") as f:
        data = pickle.load(f)
        track_embeddings = data.get("track_embeddings", {})
        artist_embeddings = data.get("artist_embeddings", {})

    print(f"Loaded {len(track_embeddings)} track embeddings")
    print(f"Loaded {len(artist_embeddings)} artist embeddings")

    # Build track index
    print("\nBuilding track FAISS index...")
    track_id_to_name = list(track_embeddings.keys())
    track_embeddings_array = np.array([track_embeddings[name] for name in track_id_to_name]).astype('float32')

    embedding_dim = track_embeddings_array.shape[1]
    print(f"  Embedding dimension: {embedding_dim}")
    print(f"  Array shape: {track_embeddings_array.shape}")

    track_index = faiss.IndexFlatIP(embedding_dim)  # Inner product for cosine similarity
    track_index.add(track_embeddings_array)
    print(f"  Index size: {track_index.ntotal} vectors")

    # Free memory before building artist index
    del track_embeddings_array

    # Build artist index
    print("\nBuilding artist FAISS index...")
    artist_id_to_name = list(artist_embeddings.keys())
    artist_embeddings_array = np.array([artist_embeddings[name] for name in artist_id_to_name]).astype('float32')

    print(f"  Array shape: {artist_embeddings_array.shape}")

    artist_index = faiss.IndexFlatIP(embedding_dim)
    artist_index.add(artist_embeddings_array)
    print(f"  Index size: {artist_index.ntotal} vectors")

    del artist_embeddings_array

    # Save indexes
    track_index_path = model_dir / "track_faiss.index"
    artist_index_path = model_dir / "artist_faiss.index"
    mappings_path = model_dir / "faiss_mappings.pkl"

    print(f"\nSaving track index to {track_index_path}...")
    faiss.write_index(track_index, str(track_index_path))

    print(f"Saving artist index to {artist_index_path}...")
    faiss.write_index(artist_index, str(artist_index_path))

    print(f"Saving mappings to {mappings_path}...")
    with open(mappings_path, "wb") as f:
        pickle.dump({
            "track_id_to_name": track_id_to_name,
            "artist_id_to_name": artist_id_to_name,
        }, f)

    # Save artist embeddings separately (for memory-efficient loading)
    artist_embeddings_path = model_dir / "artist_embeddings.pkl"
    print(f"Saving artist embeddings to {artist_embeddings_path}...")
    with open(artist_embeddings_path, "wb") as f:
        pickle.dump(artist_embeddings, f)

    # Print file sizes
    print("\nGenerated files:")
    for path in [track_index_path, artist_index_path, mappings_path, artist_embeddings_path]:
        size_mb = path.stat().st_size / (1024 * 1024)
        print(f"  {path.name}: {size_mb:.1f} MB")

    print("\nDone! Now commit these files and deploy.")


if __name__ == "__main__":
    build_faiss_indexes()
