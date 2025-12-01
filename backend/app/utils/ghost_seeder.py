import asyncio
import random
from typing import List
from app.services.lastfm import lastfm_service
from app.services.embedding import embedding_service
from app.services.qdrant_service import qdrant_service


class GhostUserSeeder:
    """
    Utility class for seeding Qdrant with diverse ghost users from Last.fm

    Creates a diverse pool of users across different:
    - Popularity levels (top scrobblers vs niche listeners)
    - Genres (mainstream, underground, regional)
    - Geography (different countries)
    - Listening history length
    """

    def __init__(self):
        # Curated list of diverse Last.fm users for seeding
        # In production, this could be fetched from a database or API
        self.curated_users = {
            "top_scrobblers": [
                # These are example usernames - replace with real ones
                "RJ", "Zakalwe_", "ilovebees", "C_A_R_T_E_R",
                "playaplaya", "CelestialBlue"
            ],
            "niche_genres": {
                "vaporwave": ["dreamcatalogue", "electronicgems"],
                "hyperpop": ["pc_music_fan", "charli_xcx_stan"],
                "cumbia": ["cumbia_lover", "latin_beats"],
                "shoegaze": ["mbv_fan", "noise_pop"],
                "ambient": ["eno_disciple", "dronemusic"],
                "experimental": ["avant_garde_88", "noise_artist"]
            },
            "veteran_users": [
                # Users who joined early (2000s)
            ],
            "international": {
                "japan": ["jpop_fan", "citypop_lover"],
                "brazil": ["mpb_enthusiast", "bossa_nova"],
                "korea": ["kpop_stan", "khiphop_head"],
                "france": ["french_house", "chanson_lover"],
                "germany": ["krautrock_fan", "techno_berlin"]
            }
        }

    async def seed_ghost_users(self, count: int = 10000) -> int:
        """
        Seed ghost users into Qdrant

        Args:
            count: Target number of ghost users to create

        Returns:
            Number of users actually created
        """
        users_created = 0

        # Calculate distribution
        distributions = {
            "top_scrobblers": int(count * 0.4),
            "niche_genres": int(count * 0.3),
            "veteran_users": int(count * 0.2),
            "international": int(count * 0.1)
        }

        print(f"Starting ghost user seeding with target: {count}")
        print(f"Distribution: {distributions}")

        # Seed top scrobblers
        users_created += await self._seed_category(
            usernames=self.curated_users["top_scrobblers"],
            target_count=distributions["top_scrobblers"],
            category="top_scrobblers"
        )

        # Seed niche genres
        niche_usernames = []
        for genre_users in self.curated_users["niche_genres"].values():
            niche_usernames.extend(genre_users)

        users_created += await self._seed_category(
            usernames=niche_usernames,
            target_count=distributions["niche_genres"],
            category="niche_genres"
        )

        # Seed international users
        intl_usernames = []
        for country_users in self.curated_users["international"].values():
            intl_usernames.extend(country_users)

        users_created += await self._seed_category(
            usernames=intl_usernames,
            target_count=distributions["international"],
            category="international"
        )

        print(f"Ghost seeding complete! Created {users_created} users")
        return users_created

    async def _seed_category(
        self,
        usernames: List[str],
        target_count: int,
        category: str
    ) -> int:
        """Seed a specific category of users"""
        created = 0

        # If we don't have enough real usernames, generate synthetic ones
        if len(usernames) < target_count:
            print(f"Warning: Not enough real users for {category}. Using synthetic generation.")
            return await self._generate_synthetic_users(target_count, category)

        # Sample from available usernames
        sample_size = min(len(usernames), target_count)
        selected_users = random.sample(usernames, sample_size)

        for username in selected_users:
            try:
                # Fetch user profile from Last.fm
                profile = await lastfm_service.get_user_profile(username)

                # Generate embedding
                embedding = embedding_service.generate_user_embedding(profile)

                # Infer genres
                top_genres = embedding_service.infer_genres_from_artists(
                    [a.name for a in profile.top_artists[:20]]
                )

                # Store in Qdrant as ghost user
                qdrant_service.add_user_embedding(
                    username=f"ghost_{username}",
                    embedding=embedding.tolist(),
                    top_artists=[a.name for a in profile.top_artists[:10]],
                    is_real=False,
                    country=profile.country,
                    profile_image=profile.image,
                    top_genres=top_genres
                )

                created += 1
                print(f"Created ghost user: {username} ({category})")

                # Rate limiting
                await asyncio.sleep(0.5)

            except Exception as e:
                print(f"Failed to create ghost user {username}: {str(e)}")
                continue

        return created

    async def _generate_synthetic_users(self, count: int, category: str) -> int:
        """
        Generate synthetic users when real users aren't available

        This creates embeddings based on genre/artist patterns
        """
        print(f"Generating {count} synthetic users for {category}")

        # Define artist pools for different categories
        artist_pools = {
            "top_scrobblers": [
                "The Beatles", "Radiohead", "Pink Floyd", "Led Zeppelin",
                "David Bowie", "The Smiths", "Nirvana", "Arctic Monkeys"
            ],
            "niche_genres": [
                "Aphex Twin", "Boards of Canada", "Death Grips", "SOPHIE",
                "Yves Tumor", "Black Country New Road", "black midi"
            ],
            "international": [
                "BTS", "BLACKPINK", "Rosalía", "Bad Bunny", "Burna Boy",
                "Aya Nakamura", "C-Pop Artists", "J-Rock Bands"
            ]
        }

        artists = artist_pools.get(category, artist_pools["top_scrobblers"])
        created = 0

        for i in range(count):
            try:
                # Generate synthetic embedding by averaging random artist embeddings
                embeddings = []
                selected_artists = random.sample(artists, min(5, len(artists)))

                for artist in selected_artists:
                    emb = embedding_service.get_artist_embedding(artist)
                    if emb is not None:
                        embeddings.append(emb)

                if embeddings:
                    import numpy as np
                    synthetic_embedding = np.mean(embeddings, axis=0)
                    synthetic_embedding = synthetic_embedding / np.linalg.norm(synthetic_embedding)

                    # Create synthetic user
                    qdrant_service.add_user_embedding(
                        username=f"synthetic_{category}_{i}",
                        embedding=synthetic_embedding.tolist(),
                        top_artists=selected_artists,
                        is_real=False,
                        country=None,
                        profile_image=None,
                        top_genres=[category]
                    )

                    created += 1

            except Exception as e:
                print(f"Failed to create synthetic user: {str(e)}")
                continue

        return created
