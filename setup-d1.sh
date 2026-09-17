#!/bin/bash

set -e

echo "🔧 Setting up D1 local database..."

cd apps/api

# 1. Create local D1 database
echo "1️⃣ Creating D1 database (local)..."
npx wrangler d1 create a10-hairsalon || true

# 2. Run migrations
echo "2️⃣ Running migrations..."
npx wrangler d1 execute a10-hairsalon --file=./migrations/0001_init.sql --local || true

# 3. Seed data
echo "3️⃣ Seeding test data..."
npx wrangler d1 execute a10-hairsalon --file=./seed.sql --local || true

echo "✅ D1 setup complete!"
cd ../..
