"""
Crea conjunto de validación con ground truth de similitudes de artistas
Usado para medir calidad del modelo GNN
"""

import json
import pandas as pd
from pathlib import Path

print("="*80)
print("CREANDO CONJUNTO DE VALIDACION")
print("="*80)

# Cargar datos de Last.fm
lastfm_dir = Path("data/lastfm_supplement")
artist_info_path = lastfm_dir / "artist_info.json"

with open(artist_info_path, "r", encoding='utf-8') as f:
    artist_info = json.load(f)

print(f"\nArtistas cargados: {len(artist_info)}")

# ============================================================================
# 1. PARES SIMILARES (ground truth positivo)
# ============================================================================

similar_pairs = []
artist_connections = {}

for artist, info in artist_info.items():
    similar_artists = info.get('similar_artists', [])
    if similar_artists:
        artist_connections[artist.lower().strip()] = [s.lower().strip() for s in similar_artists]

        # Crear pares
        for similar in similar_artists[:5]:  # Top 5 similares
            pair = tuple(sorted([artist.lower().strip(), similar.lower().strip()]))
            similar_pairs.append({
                'artist1': pair[0],
                'artist2': pair[1],
                'label': 1,
                'source': 'lastfm_similar'
            })

# Eliminar duplicados
seen = set()
unique_similar = []
for pair in similar_pairs:
    key = (pair['artist1'], pair['artist2'])
    if key not in seen:
        seen.add(key)
        unique_similar.append(pair)

print(f"\n[SIMILAR] Pares similares creados: {len(unique_similar)}")

# ============================================================================
# 2. PARES DISÍMILES (ground truth negativo)
# ============================================================================

# Agrupar artistas por género principal
genre_groups = {}
for artist, info in artist_info.items():
    tags = info.get('tags', [])
    if tags:
        # Usar primer tag como género principal
        main_genre = tags[0].lower().strip()
        if main_genre not in genre_groups:
            genre_groups[main_genre] = []
        genre_groups[main_genre].append(artist.lower().strip())

print(f"\n[GENEROS] Grupos de genero identificados: {len(genre_groups)}")

# Top géneros
from collections import Counter
genre_counts = Counter({g: len(artists) for g, artists in genre_groups.items()})
print("\nTop 10 generos:")
for genre, count in genre_counts.most_common(10):
    print(f"  {genre}: {count} artistas")

# Crear pares disímiles (de géneros diferentes)
dissimilar_pairs = []

# Pares específicos de géneros muy diferentes
genre_opposites = [
    ('rock', 'classical'),
    ('electronic', 'country'),
    ('hip-hop', 'classical'),
    ('metal', 'pop'),
    ('punk', 'jazz'),
    ('indie', 'reggaeton'),
    ('alternative', 'folk'),
]

import random
random.seed(42)

for g1, g2 in genre_opposites:
    if g1 in genre_groups and g2 in genre_groups:
        artists_g1 = genre_groups[g1]
        artists_g2 = genre_groups[g2]

        # Sample pares
        num_pairs = min(50, len(artists_g1) * len(artists_g2))
        for _ in range(num_pairs):
            a1 = random.choice(artists_g1)
            a2 = random.choice(artists_g2)

            # Verificar que no sean similares según Last.fm
            if a1 in artist_connections and a2 not in artist_connections[a1]:
                pair = tuple(sorted([a1, a2]))
                dissimilar_pairs.append({
                    'artist1': pair[0],
                    'artist2': pair[1],
                    'label': 0,
                    'source': f'genre_opposite_{g1}_vs_{g2}'
                })

# Eliminar duplicados
seen_dis = set()
unique_dissimilar = []
for pair in dissimilar_pairs:
    key = (pair['artist1'], pair['artist2'])
    if key not in seen_dis:
        seen_dis.add(key)
        unique_dissimilar.append(pair)

print(f"\n[DISSIMILAR] Pares disimilares creados: {len(unique_dissimilar)}")

# ============================================================================
# 3. BALANCEAR DATASET
# ============================================================================

# Tomar mismo número de cada clase
min_size = min(len(unique_similar), len(unique_dissimilar))
print(f"\n[BALANCE] Balanceando a {min_size} pares de cada clase...")

similar_balanced = random.sample(unique_similar, min_size)
dissimilar_balanced = unique_dissimilar[:min_size]

all_pairs = similar_balanced + dissimilar_balanced
random.shuffle(all_pairs)

print(f"\n[TOTAL] Pares totales: {len(all_pairs)}")
print(f"  - Similares: {sum(1 for p in all_pairs if p['label'] == 1)}")
print(f"  - Disimilares: {sum(1 for p in all_pairs if p['label'] == 0)}")

# ============================================================================
# 4. SPLIT TRAIN/VAL/TEST
# ============================================================================

# 70% train, 15% val, 15% test
n = len(all_pairs)
train_size = int(0.70 * n)
val_size = int(0.15 * n)

train_pairs = all_pairs[:train_size]
val_pairs = all_pairs[train_size:train_size + val_size]
test_pairs = all_pairs[train_size + val_size:]

print(f"\n[SPLIT]")
print(f"  Train: {len(train_pairs)} ({len(train_pairs)/n*100:.1f}%)")
print(f"  Val:   {len(val_pairs)} ({len(val_pairs)/n*100:.1f}%)")
print(f"  Test:  {len(test_pairs)} ({len(test_pairs)/n*100:.1f}%)")

# ============================================================================
# 5. GUARDAR
# ============================================================================

output_dir = Path("data/validation")
output_dir.mkdir(parents=True, exist_ok=True)

# Guardar como JSON
validation_data = {
    'train': train_pairs,
    'val': val_pairs,
    'test': test_pairs,
    'stats': {
        'total_pairs': len(all_pairs),
        'train_size': len(train_pairs),
        'val_size': len(val_pairs),
        'test_size': len(test_pairs),
        'similar_pairs': sum(1 for p in all_pairs if p['label'] == 1),
        'dissimilar_pairs': sum(1 for p in all_pairs if p['label'] == 0)
    }
}

output_path = output_dir / "artist_similarity_validation.json"
with open(output_path, "w", encoding='utf-8') as f:
    json.dump(validation_data, f, indent=2, ensure_ascii=False)

print(f"\n[OK] Guardado en: {output_path}")

# Guardar también como CSV para inspección fácil
df_val = pd.DataFrame(val_pairs)
df_val.to_csv(output_dir / "validation_pairs.csv", index=False)

df_test = pd.DataFrame(test_pairs)
df_test.to_csv(output_dir / "test_pairs.csv", index=False)

print(f"[OK] CSVs guardados en: {output_dir}")

print("\n" + "="*80)
print("VALIDACION CREADA EXITOSAMENTE")
print("="*80)
