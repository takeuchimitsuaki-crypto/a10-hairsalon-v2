#!/bin/bash

set -e

echo "🔧 Initializing D1 Database..."
echo ""

cd apps/api

echo "1️⃣  Installing dependencies..."
npm install > /dev/null 2>&1 || true

echo "2️⃣  Creating database..."
npx wrangler d1 create a10-hairsalon 2>&1 | grep -i "database_id\|created" || echo "Database already exists"

echo "3️⃣  Running migrations..."
npx wrangler d1 execute a10-hairsalon --file=./migrations/0001_init.sql 2>&1 | tail -5

echo "4️⃣  Seeding test data..."
npx wrangler d1 execute a10-hairsalon --file=./seed.sql 2>&1 | tail -5

echo ""
echo "✅ Database initialized successfully!"
echo ""

cd ../..

# Output the database ID if created
echo "📝 Next steps:"
echo "  1. Update .env.local with CLOUDFLARE_D1_DATABASE_ID if needed"
echo "  2. Run: ./start-dev.sh"
echo ""
