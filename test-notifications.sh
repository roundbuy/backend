#!/bin/bash

# Notification System Test Script
# Tests all notification endpoints

API_URL="http://localhost:5001/api/v1"
ADMIN_EMAIL="admin@roundbuy.com"
ADMIN_PASSWORD="India@123@321"

echo "🧪 Testing Notification System"
echo "================================"
echo ""

# Step 1: Login as Admin
echo "📝 Step 1: Login as Admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('data', {}).get('access_token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Response:"
  echo $LOGIN_RESPONSE | python3 -m json.tool
  echo ""
  echo "💡 Make sure admin user exists with credentials:"
  echo "   Email: $ADMIN_EMAIL"
  echo "   Password: $ADMIN_PASSWORD"
  exit 1
fi

echo "✅ Login successful!"
echo "   Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Create a Test Notification
echo "📝 Step 2: Create Test Notification..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/admin/notifications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test notification from the automated test script!",
    "type": "push",
    "priority": "high",
    "targetAudience": "all_guests"
  }')

echo $CREATE_RESPONSE | python3 -m json.tool
NOTIFICATION_ID=$(echo $CREATE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('notificationId', ''))" 2>/dev/null)

if [ -z "$NOTIFICATION_ID" ]; then
  echo "❌ Failed to create notification"
  exit 1
fi

echo "✅ Notification created with ID: $NOTIFICATION_ID"
echo ""

# Step 3: Preview Target Count
echo "📝 Step 3: Preview Target Count..."
PREVIEW_RESPONSE=$(curl -s -X POST "$API_URL/admin/notifications/preview-count" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "targetAudience": "all_guests"
  }')

echo $PREVIEW_RESPONSE | python3 -m json.tool
echo ""

# Step 4: Get Notification Details
echo "📝 Step 4: Get Notification Details..."
DETAILS_RESPONSE=$(curl -s -X GET "$API_URL/admin/notifications/$NOTIFICATION_ID" \
  -H "Authorization: Bearer $TOKEN")

echo $DETAILS_RESPONSE | python3 -m json.tool
echo ""

# Step 5: Send Notification
echo "📝 Step 5: Send Notification..."
SEND_RESPONSE=$(curl -s -X POST "$API_URL/admin/notifications/$NOTIFICATION_ID/send" \
  -H "Authorization: Bearer $TOKEN")

echo $SEND_RESPONSE | python3 -m json.tool
echo ""

# Step 6: Get Statistics
echo "📝 Step 6: Get Notification Statistics..."
sleep 2  # Wait a bit for stats to update
STATS_RESPONSE=$(curl -s -X GET "$API_URL/admin/notifications/$NOTIFICATION_ID/stats" \
  -H "Authorization: Bearer $TOKEN")

echo $STATS_RESPONSE | python3 -m json.tool
echo ""

# Step 7: List All Notifications
echo "📝 Step 7: List All Notifications..."
LIST_RESPONSE=$(curl -s -X GET "$API_URL/admin/notifications?limit=5" \
  -H "Authorization: Bearer $TOKEN")

echo $LIST_RESPONSE | python3 -m json.tool
echo ""

# Step 8: Test Mobile Endpoints (Guest)
echo "📝 Step 8: Test Mobile Endpoints (Guest)..."
DEVICE_ID="test-device-$(date +%s)"

# Register device token
echo "   8a. Register Device Token..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/mobile/notifications/device-token" \
  -H "Content-Type: application/json" \
  -d "{
    \"deviceToken\": \"ExponentPushToken[test-token-123]\",
    \"platform\": \"ios\",
    \"deviceId\": \"$DEVICE_ID\",
    \"deviceName\": \"Test iPhone\"
  }")

echo $REGISTER_RESPONSE | python3 -m json.tool
echo ""

# Heartbeat check
echo "   8b. Heartbeat Check..."
HEARTBEAT_RESPONSE=$(curl -s -X GET "$API_URL/mobile/notifications/heartbeat?deviceId=$DEVICE_ID" \
  -H "Content-Type: application/json")

echo $HEARTBEAT_RESPONSE | python3 -m json.tool
echo ""

echo "================================"
echo "✅ All Tests Completed!"
echo ""
echo "📊 Summary:"
echo "   - Notification ID: $NOTIFICATION_ID"
echo "   - Device ID: $DEVICE_ID"
echo ""
echo "💡 Next Steps:"
echo "   1. Check admin panel at: http://localhost:5173/notifications"
echo "   2. Test mobile app notification center"
echo "   3. Verify push notifications on physical device"
echo ""
