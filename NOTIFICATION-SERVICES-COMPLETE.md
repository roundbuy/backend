# Backend Services Created ✅

## Services Completed

### 1. Device Token Service (`deviceToken.service.js`)
**Purpose**: Manage FCM/Expo push tokens for users and guests

**Key Functions**:
- `registerDeviceToken(data)` - Register/update token (works for users & guests)
- `getDeviceTokens(userId)` - Get all tokens for a user
- `getDeviceTokensByUserIds(userIds)` - Batch get for multiple users
- `getGuestDeviceTokens()` - Get all guest tokens
- `getAllDeviceTokens()` - Get all tokens (users + guests)
- `deactivateDeviceToken(token)` - Soft delete a token
- `deleteDeviceToken(token)` - Hard delete a token
- `cleanupInactiveTokens()` - Remove tokens not used in 90 days
- `associateDeviceWithUser(deviceId, userId)` - Link guest device to user when they log in

**Guest Support**: ✅ Full support with `device_id` field

---

### 2. Notification Service (`notification.service.js`)
**Purpose**: Manage notifications with advanced targeting

**Key Functions**:
- `createNotification(data)` - Create new notification
- `getNotificationById(id)` - Get single notification
- `getAllNotifications(filters)` - Get all with pagination & filters
- `updateNotification(id, data)` - Update notification
- `deleteNotification(id)` - Soft delete
- `getScheduledNotifications()` - Get notifications ready to send
- `getNotificationStats(id)` - Get delivery/read/click stats
- `getUserIdsByConditions(conditions)` - Get users matching conditions

**Advanced Features**:
- ✅ 5 target audience types (all, all_users, all_guests, specific_users, condition)
- ✅ Condition-based targeting (subscription, country, verified, dates)
- ✅ Scheduling support
- ✅ Expiration support
- ✅ Comprehensive stats

---

### 3. User Notification Service (`userNotification.service.js`)
**Purpose**: Track notification delivery and engagement per user

**Key Functions**:
- `createUserNotifications(notificationId, userIds)` - Bulk create for users
- `getUserNotifications(userId, limit, offset)` - Get user's notifications
- `getUnreadCount(userId)` - Get unread count for badge
- `markAsRead(userId, notificationId)` - Mark as read
- `markAsClicked(userId, notificationId)` - Track clicks
- `markAllAsRead(userId)` - Mark all as read
- `deleteUserNotification(userId, notificationId)` - Delete for user
- `getNewNotificationsSinceLastCheck(userId, lastCheckAt)` - For heartbeat

**Features**:
- ✅ Tracks read/click status
- ✅ Filters expired notifications
- ✅ Supports heartbeat polling
- ✅ Only popup/fullscreen for heartbeat

---

### 4. Heartbeat Service (`heartbeat.service.js`)
**Purpose**: Real-time notification polling for instant popups

**Key Functions**:
- `updateHeartbeat(userId, deviceId)` - Update last check time
- `getLastHeartbeat(userId, deviceId)` - Get last check time
- `checkForNewNotifications(userId, lastCheckAt)` - Check for users
- `checkForNewNotificationsGuest(deviceId, lastCheckAt)` - Check for guests
- `cleanupOldHeartbeats()` - Remove old records (30+ days)
- `getHeartbeatStats()` - Get active users/devices stats

**Features**:
- ✅ Works for both users and guests
- ✅ Returns only popup/fullscreen types
- ✅ Filters expired notifications
- ✅ Auto-updates last check time
- ✅ Statistics for monitoring

---

## How They Work Together

### Flow 1: Admin Creates Notification
```
1. Admin Panel → POST /api/admin/notifications
   ↓
2. notification.service.createNotification()
   ↓
3. Notification stored in database
   ↓
4. If immediate send → Dispatcher service (next phase)
```

### Flow 2: User Registers Device Token
```
1. Mobile App → POST /api/mobile/notifications/device-token
   ↓
2. deviceToken.service.registerDeviceToken()
   ↓
3. Token stored with user_id or device_id
```

### Flow 3: Heartbeat Polling (User)
```
1. Mobile App → GET /api/mobile/notifications/heartbeat
   (every 30 seconds)
   ↓
2. heartbeat.service.checkForNewNotifications()
   ↓
3. userNotification.service.getNewNotificationsSinceLastCheck()
   ↓
4. Returns new popup/fullscreen notifications
   ↓
5. Mobile app shows popup immediately
```

### Flow 4: Heartbeat Polling (Guest)
```
1. Mobile App → GET /api/mobile/notifications/heartbeat?device_id=xxx
   (every 30 seconds, no auth)
   ↓
2. heartbeat.service.checkForNewNotificationsGuest()
   ↓
3. Query notifications WHERE target_audience IN ('all', 'all_guests')
   ↓
4. Returns new notifications sent after last check
   ↓
5. Mobile app shows popup
```

### Flow 5: Guest Logs In
```
1. User logs in
   ↓
2. deviceToken.service.associateDeviceWithUser(deviceId, userId)
   ↓
3. Device token now linked to user_id
   ↓
4. Future notifications use user_id instead of device_id
```

---

## Next Steps

### Phase 2: Create Controllers & Routes
1. **Admin Notification Controller** - CRUD operations
2. **Mobile Notification Controller** - User-facing endpoints
3. **Heartbeat Controller** - Polling endpoint
4. **Admin Routes** - Protected admin endpoints
5. **Mobile Routes** - User & guest endpoints

### Phase 3: FCM Integration
1. **Firebase Config** - Setup Firebase Admin SDK
2. **FCM Service** - Send push notifications
3. **Dispatcher Service** - Dispatch to target users
4. **Scheduler Service** - Handle scheduled notifications

---

## Testing the Services

You can test these services directly:

```javascript
// Test device token service
const deviceTokenService = require('./services/deviceToken.service');

// Register guest token
await deviceTokenService.registerDeviceToken({
  userId: null,
  deviceToken: 'expo-token-here',
  platform: 'ios',
  deviceId: 'uuid-123',
  deviceName: 'iPhone 13'
});

// Test notification service
const notificationService = require('./services/notification.service');

// Create notification
const notificationId = await notificationService.createNotification({
  title: 'Welcome!',
  message: 'Thanks for using our app',
  type: 'popup',
  priority: 'high',
  targetAudience: 'all_guests',
  createdBy: 1
});

// Test heartbeat service
const heartbeatService = require('./services/heartbeat.service');

// Check for new notifications (guest)
const result = await heartbeatService.checkForNewNotificationsGuest('uuid-123');
console.log(result);
// { hasNew: true, count: 1, notifications: [...] }
```

---

## Service Features Summary

| Feature | Device Token | Notification | User Notification | Heartbeat |
|---------|-------------|--------------|-------------------|-----------|
| Guest Support | ✅ | ✅ | ❌ (users only) | ✅ |
| Condition Targeting | - | ✅ | - | - |
| Scheduling | - | ✅ | - | - |
| Expiration | - | ✅ | ✅ (filters) | ✅ (filters) |
| Read/Click Tracking | - | - | ✅ | - |
| Real-time Polling | - | - | ✅ | ✅ |
| Cleanup Jobs | ✅ | - | - | ✅ |
| Statistics | - | ✅ | ✅ | ✅ |

---

## All Services Ready! 🎉

✅ Device Token Service - Complete
✅ Notification Service - Complete  
✅ User Notification Service - Complete
✅ Heartbeat Service - Complete

**Ready to continue with controllers and routes!**
