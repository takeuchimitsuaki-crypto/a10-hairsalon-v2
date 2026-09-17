#!/bin/bash

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get the directory where this script is located
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}🚀 Starting A10 Hairsalon Development Environment${NC}"
echo "Project root: $PROJECT_ROOT"
echo ""

# Kill any existing processes on exit
kill_processes() {
  echo "Cleaning up processes..."
  lsof -ti:5173,5174,5175,8787 | xargs kill -9 2>/dev/null || true
}

trap kill_processes EXIT

echo -e "${GREEN}✓ Starting API (Cloudflare Workers) on port 8787${NC}"
(cd "$PROJECT_ROOT/apps/api" && npm run dev) &
sleep 4

echo -e "${GREEN}✓ Starting Salon App on port 5173${NC}"
(cd "$PROJECT_ROOT/apps/salon" && npm run dev) &
sleep 3

echo -e "${GREEN}✓ Starting Stylist App on port 5174${NC}"
(cd "$PROJECT_ROOT/apps/stylist" && npm run dev) &
sleep 3

echo -e "${GREEN}✓ Starting Customer App on port 5175${NC}"
(cd "$PROJECT_ROOT/apps/customer" && npm run dev) &
sleep 3

echo ""
echo -e "${BLUE}🎉 Development environment started!${NC}"
echo ""
echo "📱 Apps:"
echo "  - Salon:    http://localhost:5173"
echo "  - Stylist:  http://localhost:5174"
echo "  - Customer: http://localhost:5175"
echo "  - API:      http://localhost:8787"
echo ""
echo "Press Ctrl+C to stop all services..."
echo ""

wait
