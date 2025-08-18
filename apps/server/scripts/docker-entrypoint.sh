#!/bin/bash
set -e

# Function to wait for database to be ready
wait_for_db() {
  echo "Waiting for PostgreSQL to be ready..."
  
  until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-navify_user}"; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 2
  done
  
  echo "PostgreSQL is up - executing command"
}

# Function to run database migrations
run_migrations() {
  echo "Running database migrations..."
  
  # Check if DATABASE_URL is set
  if [ -z "$DATABASE_URL" ]; then
    echo "Warning: DATABASE_URL not set. Skipping migrations."
    return
  fi
  
  # Run Drizzle migrations
  yarn drizzle:migrate || {
    echo "Migration failed. Continuing anyway..."
  }
  
  echo "Migrations completed"
}

# Function to seed database (optional)
seed_database() {
  if [ "$SEED_DATABASE" = "true" ]; then
    echo "Seeding database..."
    yarn db:seed || {
      echo "Seeding failed. Continuing anyway..."
    }
  fi
}

# Main execution
case "${1}" in
  "dev")
    wait_for_db
    run_migrations
    seed_database
    echo "Starting development server..."
    exec yarn dev
    ;;
  "start")
    wait_for_db
    run_migrations
    echo "Starting production server..."
    exec yarn start
    ;;
  "migrate")
    wait_for_db
    run_migrations
    exit 0
    ;;
  "seed")
    wait_for_db
    seed_database
    exit 0
    ;;
  *)
    echo "Running custom command: $@"
    exec "$@"
    ;;
esac 