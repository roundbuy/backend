#!/bin/bash

# Mobile App FAQ API Test Script
# Tests all mobile-app FAQ endpoints

echo "🧪 Testing Mobile App FAQ API Endpoints"
echo "========================================"
echo ""

BASE_URL="http://localhost:5000/api/v1/mobile-app/faqs"

# Test 1: Get all FAQs (hierarchical)
echo "1️⃣  Testing GET /mobile-app/faqs"
echo "-----------------------------------"
curl -s "${BASE_URL}" | jq '.success, .data.total_categories, .data.total_faqs' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 2: Get categories only (lightweight)
echo "2️⃣  Testing GET /mobile-app/faqs/categories"
echo "-----------------------------------"
curl -s "${BASE_URL}/categories" | jq '.success, .data.total' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 3: Search FAQs
echo "3️⃣  Testing GET /mobile-app/faqs/search?q=account"
echo "-----------------------------------"
curl -s "${BASE_URL}/search?q=account" | jq '.success, .data.count, .data.query' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 4: Get FAQs by category
echo "4️⃣  Testing GET /mobile-app/faqs/category/1"
echo "-----------------------------------"
curl -s "${BASE_URL}/category/1" | jq '.success, .data.category.name, .data.category.total_faqs' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 5: Get single FAQ
echo "5️⃣  Testing GET /mobile-app/faqs/1"
echo "-----------------------------------"
curl -s "${BASE_URL}/1" | jq '.success, .data.faq.question' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 6: Filter by category
echo "6️⃣  Testing GET /mobile-app/faqs?category_id=2"
echo "-----------------------------------"
curl -s "${BASE_URL}?category_id=2" | jq '.success, .data.total_categories' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 7: Search with short query (should fail)
echo "7️⃣  Testing GET /mobile-app/faqs/search?q=a (validation test)"
echo "-----------------------------------"
curl -s "${BASE_URL}/search?q=a" | jq '.success, .message' 2>/dev/null || echo "❌ Failed"
echo ""

echo "========================================"
echo "✅ All tests completed!"
echo ""
echo "Note: If you see 'parse error' or no output, the server might need to be restarted."
echo "To restart: Stop the current server (Ctrl+C) and run 'node server.js'"
