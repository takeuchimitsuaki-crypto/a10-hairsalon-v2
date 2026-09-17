#!/bin/bash

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}🚀 Starting A10 Hairsalon with D1 Setup${NC}"

# Kill any existing processes
kill_processes() {
  echo "Cleaning up..."
  lsof -ti:5173,5174,5175,8787 | xargs kill -9 2>/dev/null || true
}

trap kill_processes EXIT

# Clean up old local DB to start fresh
echo -e "${YELLOW}🧹 Cleaning up old local database...${NC}"
rm -rf ~/.wrangler/state/v3/d1/* 2>/dev/null || true
rm -rf "$PROJECT_ROOT/apps/api/.wrangler" 2>/dev/null || true

echo -e "${GREEN}✓ Starting API with fresh local D1...${NC}"
(cd "$PROJECT_ROOT/apps/api" && npm run dev > /tmp/api.log 2>&1) &
API_PID=$!

# Wait for API to be ready
echo -e "${YELLOW}⏳ Waiting for API to start...${NC}"
sleep 5

# Apply migrations
echo -e "${YELLOW}📝 Applying migrations...${NC}"
cd "$PROJECT_ROOT/apps/api"
npx wrangler d1 execute a10-hairsalon --file=./migrations/0001_init.sql --local > /dev/null 2>&1 || {
  echo "Migration issue - checking API logs..."
  tail -20 /tmp/api.log
  kill_processes
  exit 1
}

# Seed data
echo -e "${YELLOW}🌱 Seeding test data...${NC}"
npx wrangler d1 execute a10-hairsalon --file=./seed.sql --local > /dev/null 2>&1 || true

cd "$PROJECT_ROOT"

echo -e "${GREEN}✓ Starting Salon App on port 5173${NC}"
(cd "$PROJECT_ROOT/apps/salon" && npm run dev > /dev/null 2>&1) &
sleep 3

echo -e "${GREEN}✓ Starting Stylist App on port 5174${NC}"
(cd "$PROJECT_ROOT/apps/stylist" && npm run dev > /dev/null 2>&1) &
sleep 3

echo -e "${GREEN}✓ Starting Customer App on port 5175${NC}"
(cd "$PROJECT_ROOT/apps/customer" && npm run dev > /dev/null 2>&1) &
sleep 3

echo ""
echo -e "${BLUE}🎉 Development environment ready!${NC}"
echo ""
echo "📱 Access points:"
echo "  - Salon:    http://localhost:5173"
echo "  - Stylist:  http://localhost:5174"
echo "  - Customer: http://localhost:5175"
echo "  - API:      http://localhost:8787/api"
echo ""
echo "🧪 Test API:"
echo "  ./test-api.sh"
echo ""
echo "Press Ctrl+C to stop..."
echo ""

wait
