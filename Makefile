.PHONY: app-up app-down app-clean test test-headed test-ui docker-build docker-test docker-clean report lint lint-fix install clean clean-all

# Application
app-up:
	cd realworld-django-rest-framework-angular && docker compose up -d

app-down:
	cd realworld-django-rest-framework-angular && docker compose down

app-clean:
	cd realworld-django-rest-framework-angular && docker compose down -v --rmi all --remove-orphans

app-logs:
	cd realworld-django-rest-framework-angular && docker compose logs -f

# Install dependencies
install:
	npm ci
	npm run pw:setup

# Tests - Local
test:
	npx playwright test

test-headed:
	npx playwright test --headed

test-ui:
	npx playwright test --ui

test-debug:
	npx playwright test --debug

test-auth:
	npx playwright test --grep @auth

test-articles:
	npx playwright test --grep @articles

test-comments:
	npx playwright test --grep @comments

test-feed:
	npx playwright test --grep @feed

test-tags:
	npx playwright test --grep @tags

# Tests - Docker
docker-build:
	docker build -t qa-kra-tests .

docker-test:
	docker run --rm --network host \
		-v $(PWD)/playwright-report:/app/playwright-report \
		-v $(PWD)/test-results:/app/test-results \
		qa-kra-tests

docker-clean:
	docker rmi -f qa-kra-tests 2>/dev/null || true

# Reports
report:
	open playwright-report/$$(ls -t playwright-report | head -1)/index.html

# Linting
lint:
	npx eslint src tests --ext .ts

lint-fix:
	npx eslint src tests --ext .ts --fix

format:
	npx prettier --write "src/**/*.ts" "tests/**/*.ts"

format-check:
	npx prettier --check "src/**/*.ts" "tests/**/*.ts"

# Cleanup
clean:
	rm -rf node_modules
	rm -rf playwright-report
	rm -rf test-results
	rm -rf storage

clean-all: app-clean docker-clean clean
	@echo "All resources cleaned up"

# Full pipeline
run-all: app-up test report

# Help
help:
	@echo "Available commands:"
	@echo "  make app-up        - Start the application with Docker Compose"
	@echo "  make app-down      - Stop the application"
	@echo "  make app-clean     - Stop and remove all app containers, images, and volumes"
	@echo "  make app-logs      - View application logs"
	@echo "  make install       - Install dependencies and Playwright browsers"
	@echo "  make test          - Run all tests"
	@echo "  make test-headed   - Run tests with browser visible"
	@echo "  make test-ui       - Run tests with Playwright UI"
	@echo "  make test-debug    - Run tests in debug mode"
	@echo "  make test-auth     - Run authentication tests only"
	@echo "  make test-articles - Run article tests only"
	@echo "  make test-comments - Run comment tests only"
	@echo "  make test-feed     - Run follow feed tests only"
	@echo "  make test-tags     - Run tag filter tests only"
	@echo "  make docker-build  - Build Docker image for tests"
	@echo "  make docker-test   - Run tests in Docker container"
	@echo "  make docker-clean  - Remove test Docker image"
	@echo "  make report        - Open HTML test report"
	@echo "  make lint          - Run ESLint"
	@echo "  make lint-fix      - Run ESLint with auto-fix"
	@echo "  make format        - Format code with Prettier"
	@echo "  make clean         - Remove generated files (node_modules, reports, etc.)"
	@echo "  make clean-all     - Full cleanup: app containers, Docker images, and local files"
	@echo "  make run-all       - Start app, run tests, show report"
