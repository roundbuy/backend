#!/bin/bash

# Image Upload Test Script
# Tests the /api/v1/mobile-app/upload/images endpoint

echo "🧪 Testing Image Upload Endpoint"
echo "=================================="
echo ""

# Configuration
API_URL="http://localhost:5001/api/v1/mobile-app"
TEST_IMAGE="/tmp/test-image.jpg"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
    fi
}

# Create a test image (100x100 red square)
echo "📝 Creating test image..."
convert -size 100x100 xc:red "$TEST_IMAGE" 2>/dev/null || {
    # If ImageMagick not available, create a simple PNG
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==" | base64 -d > "$TEST_IMAGE"
}

if [ -f "$TEST_IMAGE" ]; then
    echo -e "${GREEN}✅${NC} Test image created: $TEST_IMAGE"
    echo "   Size: $(ls -lh $TEST_IMAGE | awk '{print $5}')"
else
    echo -e "${RED}❌${NC} Failed to create test image"
    exit 1
fi

echo ""
echo "🔐 Step 1: Login to get authentication token"
echo "----------------------------------------------"

# Login to get token
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠️${NC}  Login failed or user doesn't exist"
    echo "   Creating test user..."
    
    # Register test user
    REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test@example.com",
        "password": "password123",
        "name": "Test User",
        "phone": "1234567890"
      }')
    
    # Try login again
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test@example.com",
        "password": "password123"
      }')
    
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌${NC} Failed to get authentication token"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅${NC} Authentication successful"
echo "   Token: ${TOKEN:0:20}..."

echo ""
echo "📤 Step 2: Test single image upload"
echo "----------------------------------------------"

UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/upload/images" \
  -H "Authorization: Bearer $TOKEN" \
  -F "images=@$TEST_IMAGE")

echo "Response:"
echo "$UPLOAD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$UPLOAD_RESPONSE"

# Check if upload was successful
if echo "$UPLOAD_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "Single image upload"
    
    # Extract image URL
    IMAGE_URL=$(echo $UPLOAD_RESPONSE | grep -o '"url":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "   Image URL: $IMAGE_URL"
    
    # Test if image is accessible
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$IMAGE_URL")
    if [ "$HTTP_CODE" = "200" ]; then
        print_result 0 "Image is accessible at URL"
    else
        print_result 1 "Image is NOT accessible (HTTP $HTTP_CODE)"
    fi
else
    print_result 1 "Single image upload"
fi

echo ""
echo "📤 Step 3: Test multiple image upload (3 images)"
echo "----------------------------------------------"

# Create 3 test images
TEST_IMAGE_2="/tmp/test-image-2.jpg"
TEST_IMAGE_3="/tmp/test-image-3.jpg"
cp "$TEST_IMAGE" "$TEST_IMAGE_2"
cp "$TEST_IMAGE" "$TEST_IMAGE_3"

MULTI_UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/upload/images" \
  -H "Authorization: Bearer $TOKEN" \
  -F "images=@$TEST_IMAGE" \
  -F "images=@$TEST_IMAGE_2" \
  -F "images=@$TEST_IMAGE_3")

echo "Response:"
echo "$MULTI_UPLOAD_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$MULTI_UPLOAD_RESPONSE"

if echo "$MULTI_UPLOAD_RESPONSE" | grep -q '"count":3'; then
    print_result 0 "Multiple image upload (3 images)"
else
    print_result 1 "Multiple image upload"
fi

echo ""
echo "🚫 Step 4: Test file size validation (should fail for >5MB)"
echo "----------------------------------------------"

# Create a large file (6MB)
LARGE_IMAGE="/tmp/large-image.jpg"
dd if=/dev/zero of="$LARGE_IMAGE" bs=1024 count=6144 2>/dev/null

LARGE_UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/upload/images" \
  -H "Authorization: Bearer $TOKEN" \
  -F "images=@$LARGE_IMAGE")

if echo "$LARGE_UPLOAD_RESPONSE" | grep -q "5MB"; then
    print_result 0 "File size validation (rejected >5MB file)"
else
    print_result 1 "File size validation (should reject >5MB)"
    echo "   Response: $LARGE_UPLOAD_RESPONSE"
fi

echo ""
echo "🚫 Step 5: Test file type validation (should fail for non-image)"
echo "----------------------------------------------"

# Create a text file
TEXT_FILE="/tmp/test.txt"
echo "This is not an image" > "$TEXT_FILE"

TYPE_UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/upload/images" \
  -H "Authorization: Bearer $TOKEN" \
  -F "images=@$TEXT_FILE")

if echo "$TYPE_UPLOAD_RESPONSE" | grep -q "JPG and PNG"; then
    print_result 0 "File type validation (rejected non-image)"
else
    print_result 1 "File type validation (should reject non-image)"
    echo "   Response: $TYPE_UPLOAD_RESPONSE"
fi

echo ""
echo "🚫 Step 6: Test max file count validation (should fail for >3 files)"
echo "----------------------------------------------"

TEST_IMAGE_4="/tmp/test-image-4.jpg"
cp "$TEST_IMAGE" "$TEST_IMAGE_4"

COUNT_UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/upload/images" \
  -H "Authorization: Bearer $TOKEN" \
  -F "images=@$TEST_IMAGE" \
  -F "images=@$TEST_IMAGE_2" \
  -F "images=@$TEST_IMAGE_3" \
  -F "images=@$TEST_IMAGE_4")

if echo "$COUNT_UPLOAD_RESPONSE" | grep -q "Maximum 3"; then
    print_result 0 "File count validation (rejected >3 files)"
else
    print_result 1 "File count validation (should reject >3 files)"
    echo "   Response: $COUNT_UPLOAD_RESPONSE"
fi

echo ""
echo "🚫 Step 7: Test authentication (should fail without token)"
echo "----------------------------------------------"

NO_AUTH_RESPONSE=$(curl -s -X POST "$API_URL/upload/images" \
  -F "images=@$TEST_IMAGE")

if echo "$NO_AUTH_RESPONSE" | grep -q "token\|auth\|unauthorized"; then
    print_result 0 "Authentication required"
else
    print_result 1 "Authentication check (should require token)"
    echo "   Response: $NO_AUTH_RESPONSE"
fi

# Cleanup
echo ""
echo "🧹 Cleaning up test files..."
rm -f "$TEST_IMAGE" "$TEST_IMAGE_2" "$TEST_IMAGE_3" "$TEST_IMAGE_4" "$LARGE_IMAGE" "$TEXT_FILE"

echo ""
echo "=================================="
echo "✅ Image Upload Tests Complete!"
echo "=================================="
