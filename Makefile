.PHONY: help install dev build start stop clean seed-ghosts test

help:
	@echo "VibeMatch - Available Commands:"
	@echo ""
	@echo "  make install       - Install all dependencies"
	@echo "  make dev           - Start development environment"
	@echo "  make build         - Build all containers"
	@echo "  make start         - Start production containers"
	@echo "  make stop          - Stop all containers"
	@echo "  make clean         - Clean up containers and volumes"
	@echo "  make seed-ghosts   - Seed 10K ghost users"
	@echo "  make test          - Run all tests"
	@echo ""

install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

dev:
	@echo "Starting development environment..."
	docker-compose up

build:
	@echo "Building containers..."
	docker-compose build

start:
	@echo "Starting containers..."
	docker-compose up -d

stop:
	@echo "Stopping containers..."
	docker-compose down

clean:
	@echo "Cleaning up..."
	docker-compose down -v
	rm -rf backend/__pycache__ backend/**/__pycache__
	rm -rf frontend/node_modules frontend/.next

seed-ghosts:
	@echo "Seeding ghost users..."
	docker-compose exec backend python scripts/seed_ghost_users.py --count 10000

test:
	@echo "Running backend tests..."
	cd backend && pytest
	@echo "Running frontend tests..."
	cd frontend && npm test
