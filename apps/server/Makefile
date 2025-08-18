# Navify Backend Docker Commands

.PHONY: help build dev prod logs clean restart status migrate seed

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Development commands
build: ## Build Docker images
	docker-compose build

dev: ## Start development environment with hot reload
	docker-compose -f docker-compose.dev.yml up --build

dev-detached: ## Start development environment in background
	docker-compose -f docker-compose.dev.yml up -d --build

# Production commands
prod: ## Start production environment
	docker-compose up --build

prod-detached: ## Start production environment in background
	docker-compose up -d --build

# Database commands
migrate: ## Run database migrations
	docker-compose run --rm migrate

migrate-dev: ## Run database migrations in development
	docker-compose -f docker-compose.dev.yml run --rm api-dev yarn drizzle:migrate

seed: ## Seed the database
	docker-compose run --rm api yarn db:seed

seed-dev: ## Seed the development database
	docker-compose -f docker-compose.dev.yml run --rm api-dev yarn db:seed

# Utility commands
logs: ## Show logs from all services
	docker-compose logs -f

logs-api: ## Show logs from API service only
	docker-compose logs -f api

logs-db: ## Show logs from database service only
	docker-compose logs -f postgres

status: ## Show status of all containers
	docker-compose ps

restart: ## Restart all services
	docker-compose restart

restart-api: ## Restart only API service
	docker-compose restart api

# Cleanup commands
stop: ## Stop all services
	docker-compose down

stop-dev: ## Stop development services
	docker-compose -f docker-compose.dev.yml down

clean: ## Remove containers, networks, and volumes
	docker-compose down -v --remove-orphans
	docker system prune -f

clean-all: ## Remove everything including images
	docker-compose down -v --remove-orphans --rmi all
	docker system prune -af

# Database utility commands
db-shell: ## Connect to PostgreSQL shell
	docker-compose exec postgres psql -U navify_user -d navify_db

db-shell-dev: ## Connect to development PostgreSQL shell
	docker-compose -f docker-compose.dev.yml exec postgres psql -U navify_user -d navify_dev

redis-cli: ## Connect to Redis CLI
	docker-compose exec redis redis-cli

# Container shell access
shell: ## Access API container shell
	docker-compose exec api sh

shell-dev: ## Access development API container shell
	docker-compose -f docker-compose.dev.yml exec api-dev sh

# Health checks
health: ## Check health of all services
	@echo "Checking API health..."
	@curl -f http://localhost:5001/health || echo "API is not responding"
	@echo "\nChecking database connection..."
	@docker-compose exec postgres pg_isready -U navify_user -d navify_db || echo "Database is not ready"
	@echo "\nChecking Redis connection..."
	@docker-compose exec redis redis-cli ping || echo "Redis is not responding"

# Testing
test: ## Run tests in container
	docker-compose run --rm api yarn test

test-dev: ## Run tests in development environment
	docker-compose -f docker-compose.dev.yml run --rm api-dev yarn test 