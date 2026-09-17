#!/bin/bash

# Test the API locally
echo "🧪 Testing API..."
echo ""

echo "1️⃣ Testing /api/health"
curl -s http://localhost:8787/api/health | jq '.'
echo ""

echo "2️⃣ Testing /api/stylists"
curl -s http://localhost:8787/api/stylists | jq '.'
echo ""

echo "3️⃣ Testing /api/menus"
curl -s http://localhost:8787/api/menus | jq '.'
echo ""

echo "4️⃣ Testing /api/appointments"
curl -s http://localhost:8787/api/appointments | jq '.'
echo ""

echo "5️⃣ Testing /api/messages"
curl -s http://localhost:8787/api/messages | jq '.'
echo ""

echo "6️⃣ Testing /api/charts"
curl -s http://localhost:8787/api/charts | jq '.'
echo ""

echo "✅ API test complete!"
