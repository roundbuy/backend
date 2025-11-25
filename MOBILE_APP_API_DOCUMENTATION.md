# Mobile App API Documentation

This document outlines the APIs specifically designed for the RoundBuy mobile application.

## Authentication Endpoints

### 1. Register User
**Endpoint:** `POST /api/v1/mobile-app/auth/register`

**Description:** Register a new user with email verification required before login.

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "language": "en"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for verification.",
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "full_name": "John Doe",
      "is_verified": false
    },
    "verification_sent": true
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

**Validation Rules:**
- `email`: Required, valid email format
- `password`: Required, minimum 8 characters
- `full_name`: Required
- `language`: Optional, defaults to 'en'

### 2. Verify Email
**Endpoint:** `POST /api/v1/mobile-app/auth/verify-email`

**Description:** Verify user's email address using the token sent via email.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "token": "verification_token_here"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "is_verified": true
    }
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "Invalid or expired verification token"
}
```

### 3. Resend Verification Email
**Endpoint:** `POST /api/v1/mobile-app/auth/resend-verification`

**Description:** Resend email verification token to user's email.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

### 4. Login User
**Endpoint:** `POST /api/v1/mobile-app/auth/login`

**Description:** Authenticate user and return access tokens. Requires email verification.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "john.doe@example.com",
      "full_name": "John Doe",
      "role": "subscriber",
      "language_preference": "en",
      "is_verified": true
    },
    "access_token": "jwt_access_token",
    "refresh_token": "jwt_refresh_token",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

**Response (Error - 403):**
```json
{
  "success": false,
  "message": "Please verify your email before logging in"
}
```

## Error Response Format
All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (only in development)"
}
```

## Subscription Endpoints

### 5. Get Subscription Plans
**Endpoint:** `GET /api/v1/mobile-app/subscription/plans`

**Description:** Get all available subscription plans with pricing in multiple currencies.

**Query Parameters:**
- `currency_code` (optional): Currency code (e.g., USD, EUR, INR). Defaults to system default.
- `language` (optional): Language code for localization (default: en)

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": 1,
        "name": "Free",
        "slug": "free",
        "subtitle": "Basic plan for new users",
        "description": "Basic plan for new users",
        "duration_days": 365,
        "features": {
          "max_ads": 3,
          "max_banners": 0,
          "featured_ads": 0,
          "support_priority": "low",
          "chat_enabled": true
        },
        "prices": [
          {
            "currency_code": "USD",
            "currency_name": "US Dollar",
            "symbol": "$",
            "price": 0,
            "tax_rate": 0,
            "is_default": false
          },
          {
            "currency_code": "INR",
            "currency_name": "Indian Rupee",
            "symbol": "₹",
            "price": 0,
            "tax_rate": 0,
            "is_default": true
          }
        ],
        "target_currency": {
          "code": "INR",
          "price": 0,
          "tax_rate": 0,
          "tax_amount": 0,
          "total_price": 0,
          "symbol": "₹"
        },
        "sort_order": 1,
        "is_best": false,
        "is_popular": false
      }
    ],
    "currencies": [
      {
        "code": "INR",
        "name": "Indian Rupee",
        "symbol": "₹",
        "is_default": true
      }
    ],
    "default_currency": "INR",
    "target_currency": "INR",
    "language": "en"
  }
}
```

### 6. Get Plan Details
**Endpoint:** `GET /api/v1/mobile-app/subscription/plans/:planId`

**Description:** Get detailed information about a specific subscription plan.

**Path Parameters:**
- `planId`: Plan ID

**Query Parameters:**
- `currency_code` (optional): Currency code
- `language` (optional): Language code (default: en)

**Response (Success - 200):**
Similar to above but for a single plan.

### 7. Purchase Subscription Plan
**Endpoint:** `POST /api/v1/mobile-app/subscription/purchase`

**Description:** Purchase a subscription plan with payment processing via Stripe.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "plan_id": 2,
  "currency_code": "INR",
  "payment_method_id": "pm_1234567890",
  "save_payment_method": true,
  "country": "IN",
  "zip_code": "110001"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Subscription purchased successfully",
  "data": {
    "subscription": {
      "id": 1,
      "plan_name": "Basic",
      "start_date": "2025-11-19T11:54:31.000Z",
      "end_date": "2025-12-19T11:54:31.000Z",
      "amount_paid": 829.17,
      "currency": "INR",
      "payment_id": "pi_1234567890"
    },
    "transaction": {
      "id": "pi_1234567890",
      "amount": 829.17,
      "currency": "INR",
      "status": "completed",
      "timestamp": "2025-11-19T11:54:31.000Z",
      "session_id": "pi_1234567890"
    }
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "User already has an active subscription"
}
```

### 8. Get Transaction Status
**Endpoint:** `GET /api/v1/mobile-app/subscription/transaction/:transactionId`

**Description:** Get transaction status and subscription details for a completed transaction.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "pi_1234567890",
      "amount": 829.17,
      "currency": "INR",
      "status": "completed",
      "timestamp": "2025-11-19T11:54:31.000Z",
      "session_id": "pi_1234567890"
    },
    "subscription": {
      "id": 1,
      "plan_name": "Basic",
      "start_date": "2025-11-19T11:54:31.000Z",
      "end_date": "2025-12-19T11:54:31.000Z",
      "status": "active"
    }
  }
}
```

### 9. Get Saved Payment Methods
**Endpoint:** `GET /api/v1/mobile-app/subscription/payment-methods`

**Description:** Get user's saved payment methods for future purchases.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "payment_methods": [
      {
        "id": 1,
        "type": "card",
        "provider": "stripe",
        "last_four": "4242",
        "card_brand": "visa",
        "expiry_month": 12,
        "expiry_year": 2025,
        "is_default": true,
        "created_at": "2025-11-19T11:54:31.000Z"
      }
    ]
  }
}
```

### 10. Get Stripe Configuration
**Endpoint:** `GET /api/v1/mobile-app/subscription/stripe-config`

**Description:** Get Stripe publishable key for frontend payment integration.

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "stripe_publishable_key": "pk_test_..."
  }
}
```

## Advertisement Endpoints

### 11. Get Advertisement Filters
**Endpoint:** `GET /api/v1/mobile-app/advertisements/filters`

**Description:** Get all filter options for creating advertisements (categories, activities, conditions, etc.)

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Electronics",
        "slug": "electronics",
        "subcategories": [
          {
            "id": 2,
            "name": "Smartphones",
            "slug": "smartphones"
          }
        ]
      }
    ],
    "activities": [
      {
        "id": 1,
        "name": "Buy",
        "slug": "buy"
      }
    ],
    "conditions": [
      {
        "id": 1,
        "name": "New",
        "slug": "new"
      }
    ],
    "ages": [
      {
        "id": 1,
        "name": "Child",
        "slug": "child"
      }
    ],
    "genders": [
      {
        "id": 1,
        "name": "Male",
        "slug": "male"
      }
    ],
    "sizes": [
      {
        "id": 1,
        "name": "M",
        "slug": "m"
      }
    ],
    "colors": [
      {
        "id": 1,
        "name": "Red",
        "slug": "red",
        "hex_code": "#FF0000"
      }
    ]
  }
}
```

### 12. Get User Locations
**Endpoint:** `GET /api/v1/mobile-app/advertisements/locations`

**Description:** Get user's saved locations for advertisements.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "id": 1,
        "name": "Home",
        "street": "123 Main St",
        "city": "New York",
        "country": "USA",
        "is_default": true
      }
    ]
  }
}
```

### 13. Create Advertisement
**Endpoint:** `POST /api/v1/mobile-app/advertisements`

**Description:** Create a new advertisement.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "iPhone 12 Pro",
  "description": "Excellent condition iPhone 12 Pro",
  "images": ["https://example.com/image1.jpg"],
  "category_id": 1,
  "subcategory_id": 2,
  "location_id": 1,
  "price": 599.99,
  "display_duration_days": 60,
  "activity_id": 1,
  "condition_id": 2,
  "age_id": 2,
  "gender_id": 1,
  "size_id": 3,
  "color_id": 1
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Advertisement created successfully",
  "data": {
    "advertisement": {
      "id": 1,
      "title": "iPhone 12 Pro",
      "status": "draft",
      "category_name": "Electronics",
      "location_name": "Home"
    }
  }
}
```

### 14. Get User Advertisements
**Endpoint:** `GET /api/v1/mobile-app/advertisements`

**Description:** Get user's advertisements with pagination and filtering.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (optional): Filter by status (draft, pending, approved, etc.)
- `page` (optional): Page number (default 1)
- `limit` (optional): Items per page (default 20)

### 15. Get Single Advertisement
**Endpoint:** `GET /api/v1/mobile-app/advertisements/:id`

**Description:** Get detailed information about a specific advertisement.

**Headers:**
```
Authorization: Bearer <access_token>
```

### 16. Update Advertisement
**Endpoint:** `PUT /api/v1/mobile-app/advertisements/:id`

**Description:** Update an existing advertisement.

**Headers:**
```
Authorization: Bearer <access_token>
```

### 17. Delete Advertisement
**Endpoint:** `DELETE /api/v1/mobile-app/advertisements/:id`

**Description:** Delete an advertisement (only if status is draft).

**Headers:**
```
Authorization: Bearer <access_token>
```

## Location Management Endpoints

### 18. Create User Location
**Endpoint:** `POST /api/v1/mobile-app/locations`

**Description:** Create a new user location (max 3 per user).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "Home",
  "street": "123 Main St",
  "street2": "Apt 4B",
  "city": "New York",
  "region": "NY",
  "country": "USA",
  "zip_code": "10001",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "is_default": true
}
```

### 19. Update User Location
**Endpoint:** `PUT /api/v1/mobile-app/locations/:id`

**Description:** Update an existing user location.

**Headers:**
```
Authorization: Bearer <access_token>
```

### 20. Delete User Location
**Endpoint:** `DELETE /api/v1/mobile-app/locations/:id`

**Description:** Soft delete a user location.

**Headers:**
```
Authorization: Bearer <access_token>
```

### 21. Set Default Location
**Endpoint:** `PATCH /api/v1/mobile-app/locations/:id/set-default`

**Description:** Set a location as the default location.

**Headers:**
```
Authorization: Bearer <access_token>
```

## Notes
- All endpoints return JSON responses
- Email verification is required before login
- Verification tokens expire after 24 hours
- Passwords must be at least 8 characters long
- Language preference affects UI localization
- Subscription plans support multiple currencies with tax calculations
- Default currency is configurable in system settings
- Plans marked as "best" or "popular" for UI highlighting
- Users can save up to 3 locations for advertisements
- Advertisement images are stored in `uploads/ads-images/{productId}/` directory
- Display duration can be 60 days or continuous (NULL for continuous)
- Only draft advertisements can be edited or deleted