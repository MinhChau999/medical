# Medical Electronics System - Makefile

.PHONY: help install dev build start stop restart clean logs test

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "${GREEN}Medical Electronics System - Available Commands${NC}"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "${YELLOW}%-20s${NC} %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "${GREEN}Installing backend dependencies...${NC}"
	cd backend && npm install
	@echo "${GREEN}Installing admin dashboard dependencies...${NC}"
	cd frontend/admin && npm install
	@echo "${GREEN}Installing shop dependencies...${NC}"
	cd frontend/shop && npm install
	@echo "${GREEN}Installing POS dependencies...${NC}"
	cd frontend/pos && npm install
	@echo "${GREEN}Dependencies installed successfully!${NC}"

dev: ## Start development environment
	@echo "${GREEN}Starting development environment...${NC}"
	docker-compose -f docker-compose.yml up postgres redis -d
	@echo "${YELLOW}Waiting for database to be ready...${NC}"
	sleep 5
	cd backend && npm run dev &
	cd frontend/admin && npm run dev &
	cd frontend/shop && npm run dev &
	cd frontend/pos && npm run dev &
	@echo "${GREEN}Development environment started!${NC}"
	@echo "Admin: http://localhost:5173"
	@echo "Shop: http://localhost:3002"
	@echo "POS: http://localhost:5174"
	@echo "API: http://localhost:3000"

build: ## Build all Docker images
	@echo "${GREEN}Building Docker images...${NC}"
	docker-compose build --no-cache
	@echo "${GREEN}Docker images built successfully!${NC}"

start: ## Start production environment with Docker
	@echo "${GREEN}Starting production environment...${NC}"
	docker-compose up -d
	@echo "${GREEN}Production environment started!${NC}"
	@echo "Admin: http://localhost:3001"
	@echo "Shop: http://localhost:3002" 
	@echo "POS: http://localhost:3003"
	@echo "API: http://localhost:3000"

stop: ## Stop all Docker containers
	@echo "${YELLOW}Stopping all containers...${NC}"
	docker-compose down
	@echo "${GREEN}All containers stopped!${NC}"

restart: ## Restart all Docker containers
	@echo "${YELLOW}Restarting all containers...${NC}"
	docker-compose restart
	@echo "${GREEN}All containers restarted!${NC}"

clean: ## Clean up Docker resources
	@echo "${RED}Cleaning up Docker resources...${NC}"
	docker-compose down -v
	docker system prune -f
	@echo "${GREEN}Cleanup completed!${NC}"

logs: ## Show Docker logs
	docker-compose logs -f

logs-backend: ## Show backend logs
	docker-compose logs -f backend

logs-admin: ## Show admin dashboard logs
	docker-compose logs -f admin

logs-shop: ## Show shop logs
	docker-compose logs -f shop

logs-pos: ## Show POS logs
	docker-compose logs -f pos

test: ## Run tests
	@echo "${GREEN}Running backend tests...${NC}"
	cd backend && npm test
	@echo "${GREEN}Running admin tests...${NC}"
	cd frontend/admin && npm test
	@echo "${GREEN}Running shop tests...${NC}"
	cd frontend/shop && npm test
	@echo "${GREEN}Running POS tests...${NC}"
	cd frontend/pos && npm test

db-migrate: ## Run database migrations
	@echo "${GREEN}Running database migrations...${NC}"
	docker-compose exec postgres psql -U dobby -d medical -f /docker-entrypoint-initdb.d/01-schema.sql
	@echo "${GREEN}Migrations completed!${NC}"

db-seed: ## Seed database with sample data
	@echo "${GREEN}Seeding database...${NC}"
	docker-compose exec postgres psql -U dobby -d medical -f /docker-entrypoint-initdb.d/02-seed.sql
	@echo "${GREEN}Database seeded!${NC}"

db-reset: ## Reset database
	@echo "${RED}Resetting database...${NC}"
	docker-compose exec postgres psql -U dobby -c "DROP DATABASE IF EXISTS medical;"
	docker-compose exec postgres psql -U dobby -c "CREATE DATABASE medical;"
	$(MAKE) db-migrate
	$(MAKE) db-seed
	@echo "${GREEN}Database reset completed!${NC}"

backup: ## Backup database
	@echo "${GREEN}Creating database backup...${NC}"
	mkdir -p backups
	docker-compose exec postgres pg_dump -U dobby medical > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "${GREEN}Backup created successfully!${NC}"

restore: ## Restore database from latest backup
	@echo "${YELLOW}Restoring database from latest backup...${NC}"
	@latest_backup=$$(ls -t backups/*.sql | head -1); \
	if [ -z "$$latest_backup" ]; then \
		echo "${RED}No backup found!${NC}"; \
	else \
		docker-compose exec -T postgres psql -U dobby medical < $$latest_backup; \
		echo "${GREEN}Database restored from $$latest_backup${NC}"; \
	fi

status: ## Check status of all services
	@echo "${GREEN}Checking service status...${NC}"
	docker-compose ps
	@echo ""
	@echo "${GREEN}Health checks:${NC}"
	@curl -s http://localhost:3000/health | jq '.' || echo "Backend: ${RED}Not responding${NC}"
	@curl -s http://localhost:3001 > /dev/null && echo "Admin: ${GREEN}Running${NC}" || echo "Admin: ${RED}Not responding${NC}"
	@curl -s http://localhost:3002 > /dev/null && echo "Shop: ${GREEN}Running${NC}" || echo "Shop: ${RED}Not responding${NC}"
	@curl -s http://localhost:3003 > /dev/null && echo "POS: ${GREEN}Running${NC}" || echo "POS: ${RED}Not responding${NC}"