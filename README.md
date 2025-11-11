# RoundBuy Backend API

Node.js + Express + MySQL backend for the RoundBuy C2C marketplace platform.

## Features

- **Authentication**: JWT-based auth with access/refresh tokens
- **User Management**: Role-based access (subscriber, editor, admin)
- **Subscription System**: Multiple subscription tiers with features
- **Advertisement Management**: Create and manage paid advertisements
- **Banner System**: Premium banner placements
- **Multi-language Support**: Translations with Google Translate integration
- **Content Moderation**: Word filtering and approval workflows
- **Settings Management**: Comprehensive admin settings
- **API Logging**: Track all API requests

## Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

## Installation

1. **Clone the repository** (if not already done)

2. **Navigate to backend directory**
   ```bash
   cd backend
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update with your configuration:
   - Database credentials
   - JWT secrets
   - CORS origins
   - API keys

5. **Create MySQL database**
   ```sql
   CREATE DATABASE roundbuy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

6. **Run database migrations**
   ```bash
   npm run migrate
   ```

## Running the Server

### Development mode (with auto-reload)
```bash
npm run dev
```

### Production mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "full_name": "John Doe",
  "phone": "+1234567890"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer {access_token}
```

### Health Check
```http
GET /health
```

## Database Schema

The database includes the following main tables:

- `users` - User accounts with roles and subscriptions
- `subscription_plans` - Subscription tier definitions
- `user_subscriptions` - User subscription records
- `categories` - Product/ad categories
- `advertisements` - User advertisements
- `advertisement_plans` - Advertisement plan options
- `banners` - Banner advertisements
- `banner_plans` - Banner plan options
- `products` - Marketplace products
- `orders` - Order transactions
- `messages` - User messaging
- `reviews` - User reviews
- `languages` - Supported languages
- `translation_keys` - Translation key definitions
- `translations` - Translations for each language
- `moderation_words` - Content moderation word list
- `moderation_queue` - Content moderation queue
- `settings` - Application settings
- `api_logs` - API request logs
- `notifications` - User notifications

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   └── database.js   # Database connection
│   ├── controllers/      # Request handlers
│   │   └── auth.controller.js
│   ├── middleware/       # Express middleware
│   │   └── auth.middleware.js
│   ├── routes/          # API routes
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── advertisement.routes.js
│   │   └── ...
│   ├── utils/           # Utility functions
│   │   └── jwt.js
│   └── app.js           # Express app setup
├── database/
│   ├── schema.sql       # Database schema
│   └── migrate.js       # Migration script
├── uploads/             # File uploads directory
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
└── server.js            # Server entry point
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 5000 |
| `DB_HOST` | MySQL host | localhost |
| `DB_PORT` | MySQL port | 3306 |
| `DB_NAME` | Database name | roundbuy_db |
| `DB_USER` | Database user | root |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRE` | JWT expiration | 7d |
| `CORS_ORIGIN` | Allowed CORS origins | * |

## Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API rate limiting
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt
- **Input Validation**: express-validator
- **SQL Injection Protection**: Parameterized queries

## API Rate Limiting

Default rate limits:
- 100 requests per 15 minutes per IP
- Configurable via environment variables

## Error Handling

API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

## Success Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

## Development

### Adding New Routes

1. Create controller in `src/controllers/`
2. Create route file in `src/routes/`
3. Import and mount route in `src/app.js`

### Adding Middleware

1. Create middleware in `src/middleware/`
2. Apply to routes as needed

### Database Queries

Use the connection pool from `src/config/database.js`:

```javascript
const { promisePool } = require('../config/database');

const [rows] = await promisePool.query('SELECT * FROM users WHERE id = ?', [userId]);
```

## Testing

```bash
# Add tests here when implemented
npm test
```

## Deployment

### Using PM2

```bash
npm install -g pm2
pm2 start server.js --name roundbuy-api
pm2 save
pm2 startup
```

### Using Docker

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists

### Port Already in Use
- Change PORT in `.env`
- Kill process using the port

### JWT Errors
- Verify JWT_SECRET is set
- Check token expiration
- Ensure token format is correct

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

MIT

## Support

For issues and questions, please create an issue in the repository.