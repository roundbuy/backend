# Phase 2 Complete: Controllers & Routes ✅

## Files Created

### Controllers
1. **`backend/src/controllers/admin/notification.controller.js`** ✅
   - 8 controller methods
   - Full CRUD operations
   - Send notification functionality
   - Stats and preview

2. **`backend/src/controllers/mobile-app/notification.controller.js`** ✅
   - 10 controller methods
   - User notifications
   - Device token management
   - Heartbeat polling

### Routes
3. **`backend/src/routes/admin/notificationRoutes.js`** ✅
   - 8 admin endpoints
   - Protected with auth + admin middleware

4. **`backend/src/routes/mobile-app/notificationRoutes.js`** ✅
   - 11 mobile endpoints
   - Mixed auth (some public, some private)
   - Guest support

### Integration
5. **`backend/src/app.js`** ✅ (Updated)
   - Added route imports
   - Mounted notification routes

---

## API Endpoints

### Admin Endpoints (Protected)
Base URL: `/api/v1/admin/notifications`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create notification |
| GET | `/` | Get all notifications (with filters) |
| GET | `/:id` | Get notification by ID |
| PUT | `/:id` | Update notification |
| DELETE | `/:id` | Delete notification |
| POST | `/:id/send` | Send notification immediately |
| GET | `/:id/stats` | Get notification statistics |
| POST | `/preview-count` | Preview recipient count |

**Authentication**: Required (Admin only)

---

### Mobile Endpoints
Base URL: `/api/v1/mobile/notifications`

#### Public Endpoints (Guest + User)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/device-token` | Register FCM token | Optional |
| DELETE | `/device-token` | Remove FCM token | Optional |
| GET | `/heartbeat` | Check for new notifications | Optional |

#### Private Endpoints (User only)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get my notifications | Required |
| GET | `/unread-count` | Get unread count | Required |
| GET | `/my-devices` | Get my devices | Required |
| PUT | `/:id/read` | Mark as read | Required |
| PUT | `/:id/clicked` | Mark as clicked | Required |
| PUT | `/read-all` | Mark all as read | Required |
| DELETE | `/:id` | Delete notification | Required |

---

## Testing the APIs

### 1. Test Device Token Registration (Guest)

```bash
# Register device token (no auth)
curl -X POST http://localhost:3000/api/v1/mobile/notifications/device-token \
  -H "Content-Type: application/json" \
  -d '{
    "deviceToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
    "platform": "ios",
    "deviceId": "550e8400-e29b-41d4-a716-446655440000",
    "deviceName": "iPhone 13"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Device token registered successfully",
  "tokenId": 1
}
```

---

### 2. Test Create Notification (Admin)

```bash
# Create notification (requires admin auth)
curl -X POST http://localhost:3000/api/v1/admin/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "Welcome to RoundBuy!",
    "message": "Start exploring amazing deals near you",
    "type": "popup",
    "priority": "high",
    "targetAudience": "all_guests",
    "actionType": "open_screen",
    "actionData": {
      "screen": "Home"
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Notification created successfully",
  "notificationId": 1
}
```

---

### 3. Test Send Notification (Admin)

```bash
# Send notification immediately
curl -X POST http://localhost:3000/api/v1/admin/notifications/1/send \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "recipientCount": 5,
  "targetAudience": "all_guests"
}
```

---

### 4. Test Heartbeat (Guest)

```bash
# Check for new notifications (no auth)
curl -X GET "http://localhost:3000/api/v1/mobile/notifications/heartbeat?deviceId=550e8400-e29b-41d4-a716-446655440000"
```

**Expected Response**:
```json
{
  "success": true,
  "hasNew": true,
  "count": 1,
  "notifications": [
    {
      "notification_id": 1,
      "title": "Welcome to RoundBuy!",
      "message": "Start exploring amazing deals near you",
      "type": "popup",
      "priority": "high",
      "image_url": null,
      "action_type": "open_screen",
      "action_data": {
        "screen": "Home"
      }
    }
  ],
  "lastCheckAt": "2025-12-29T12:30:00.000Z"
}
```

---

### 5. Test Get Notifications (User)

```bash
# Get user's notifications (requires auth)
curl -X GET "http://localhost:3000/api/v1/mobile/notifications?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "notifications": [
    {
      "user_notification_id": 1,
      "is_read": false,
      "is_clicked": false,
      "delivered_at": "2025-12-29T12:00:00.000Z",
      "notification_id": 1,
      "title": "Welcome!",
      "message": "Thanks for joining",
      "type": "popup",
      "priority": "high"
    }
  ],
  "count": 1
}
```

---

### 6. Test Unread Count (User)

```bash
# Get unread count
curl -X GET http://localhost:3000/api/v1/mobile/notifications/unread-count \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "unreadCount": 5
}
```

---

### 7. Test Preview Count (Admin)

```bash
# Preview recipient count before sending
curl -X POST http://localhost:3000/api/v1/admin/notifications/preview-count \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "targetAudience": "condition",
    "targetConditions": {
      "subscription_plan": [2, 3],
      "is_verified": true
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "estimatedRecipients": 1234
}
```

---

## Request/Response Examples

### Create Notification with All Options

```json
{
  "title": "Flash Sale!",
  "message": "50% off on all electronics. Limited time only!",
  "type": "fullscreen",
  "priority": "high",
  "targetAudience": "condition",
  "targetConditions": {
    "subscription_plan": [2, 3],
    "country_code": ["IND", "USA"],
    "is_verified": true
  },
  "imageUrl": "https://example.com/sale-banner.jpg",
  "actionType": "open_url",
  "actionData": {
    "url": "https://roundbuy.com/flash-sale"
  },
  "scheduledAt": "2025-12-30T10:00:00Z",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

### Get Notifications with Filters

```
GET /api/v1/admin/notifications?type=popup&priority=high&sent=true&limit=20&offset=0
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not admin)
- `404` - Not Found
- `500` - Internal Server Error

---

## Next Steps

### Phase 3: FCM Integration & Dispatcher
1. **Firebase Config** - Setup Firebase Admin SDK
2. **FCM Service** - Send push notifications via Firebase
3. **Dispatcher Service** - Batch send to multiple users
4. **Scheduler Service** - Handle scheduled notifications

### Testing Checklist
- [ ] Test device token registration (guest)
- [ ] Test device token registration (user)
- [ ] Test create notification (admin)
- [ ] Test send notification (admin)
- [ ] Test heartbeat (guest)
- [ ] Test heartbeat (user)
- [ ] Test get notifications (user)
- [ ] Test mark as read (user)
- [ ] Test unread count (user)
- [ ] Test preview count (admin)

---

## Current Status

✅ **Database Tables** - 4 tables created
✅ **Backend Services** - 4 services created
✅ **Controllers** - 2 controllers created
✅ **Routes** - 2 route files created
✅ **Integration** - Routes mounted in app.js

**Ready for Phase 3: FCM Integration!** 🚀
