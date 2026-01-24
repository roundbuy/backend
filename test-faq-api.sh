#!/bin/bash

# FAQ API Test Script
# Tests all public FAQ endpoints

echo "🧪 Testing FAQ API Endpoints"
echo "================================"
echo ""

BASE_URL="http://localhost:5000/api/v1"

# Test 1: Get all categories
echo "1️⃣  Testing GET /faqs/categories"
echo "-----------------------------------"
curl -s "${BASE_URL}/faqs/categories" | jq '.success, .categories | length' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 2: Get all FAQs
echo "2️⃣  Testing GET /faqs"
echo "-----------------------------------"
curl -s "${BASE_URL}/faqs" | jq '.success, .count' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 3: Get organized FAQs
echo "3️⃣  Testing GET /faqs/organized"
echo "-----------------------------------"
curl -s "${BASE_URL}/faqs/organized" | jq '.success, .data | length' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 4: Get single FAQ
echo "4️⃣  Testing GET /faqs/1"
echo "-----------------------------------"
curl -s "${BASE_URL}/faqs/1" | jq '.success, .faq.question' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 5: Search FAQs
echo "5️⃣  Testing GET /faqs/search?q=account"
echo "-----------------------------------"
curl -s "${BASE_URL}/faqs/search?q=account" | jq '.success, .count' 2>/dev/null || echo "❌ Failed"
echo ""

# Test 6: Filter by category
echo "6️⃣  Testing GET /faqs?category_id=1"
echo "-----------------------------------"
curl -s "${BASE_URL}/faqs?category_id=1" | jq '.success, .count' 2>/dev/null || echo "❌ Failed"
echo ""

echo "================================"
echo "✅ All tests completed!"
echo ""
echo "Note: If you see 'parse error' or no output, the server might need to be restarted."
echo "To restart: Stop the current server (Ctrl+C) and run 'node server.js'"
