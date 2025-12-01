#!/usr/bin/env python3
"""
Standalone script to seed ghost users into Qdrant

Usage:
    python seed_ghost_users.py --count 10000 --force-reseed

This script can be run independently of the FastAPI server.
It directly populates Qdrant with diverse ghost users.
"""

import asyncio
import argparse
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.utils.ghost_seeder import GhostUserSeeder
from app.services.qdrant_service import qdrant_service
from dotenv import load_dotenv


async def main():
    # Parse arguments
    parser = argparse.ArgumentParser(description="Seed ghost users into Qdrant")
    parser.add_argument(
        "--count",
        type=int,
        default=10000,
        help="Number of ghost users to create (default: 10000)"
    )
    parser.add_argument(
        "--force-reseed",
        action="store_true",
        help="Delete existing ghost users before seeding"
    )
    args = parser.parse_args()

    # Load environment variables
    load_dotenv()

    print("=" * 60)
    print("VibeMatch Ghost User Seeding Script")
    print("=" * 60)
    print(f"Target count: {args.count}")
    print(f"Force reseed: {args.force_reseed}")
    print()

    # Check current state
    current_ghosts = qdrant_service.count_users(is_real=False)
    current_real = qdrant_service.count_users(is_real=True)

    print(f"Current state:")
    print(f"  Real users: {current_real}")
    print(f"  Ghost users: {current_ghosts}")
    print()

    # Force reseed if requested
    if args.force_reseed and current_ghosts > 0:
        print(f"Deleting {current_ghosts} existing ghost users...")
        deleted = qdrant_service.delete_all_ghost_users()
        print(f"Deleted {deleted} ghost users")
        print()

    # Run seeding
    print("Starting ghost user seeding...")
    print()

    seeder = GhostUserSeeder()
    users_created = await seeder.seed_ghost_users(count=args.count)

    print()
    print("=" * 60)
    print("Seeding Complete!")
    print("=" * 60)
    print(f"Users created: {users_created}")

    # Final state
    final_ghosts = qdrant_service.count_users(is_real=False)
    final_real = qdrant_service.count_users(is_real=True)
    final_total = qdrant_service.count_users()

    print()
    print(f"Final state:")
    print(f"  Real users: {final_real}")
    print(f"  Ghost users: {final_ghosts}")
    print(f"  Total users: {final_total}")
    print()

    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
