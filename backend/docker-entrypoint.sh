#!/bin/sh

# Wait for database to be ready
max_retries=30
counter=0
until bunx prisma db push --skip-generate; do
    counter=$((counter + 1))
    if [ $counter -eq $max_retries ]; then
        echo "Failed to connect to database after $max_retries attempts."
        exit 1
    fi
    echo "Database not ready. Waiting..."
    sleep 1
done

exec bun run src/index.ts