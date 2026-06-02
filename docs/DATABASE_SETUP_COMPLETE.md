# PostgreSQL Database Setup - Complete âœ…

## Database Information
- **Database Name**: `business_saas_db`
- **Host**: `your-db-host`
- **Port**: `5432`
- **Username**: `postgres`
- **Password**: `5432`

## Status: FULLY CONFIGURED âœ…

All data is now being stored in PostgreSQL. The application is connected and operational.

---

## Database Schema

### Tables Created (15 total)

1. **users** - User accounts (customers, vendors, admins)
2. **vendors** - Business owner profiles
3. **categories** - Business categories
4. **businesses** - Business listings
5. **reviews** - Customer reviews for businesses
6. **leads** - Customer inquiries/leads
7. **favorites** - User's saved businesses
8. **subscriptions** - Vendor subscription plans
9. **transactions** - Payment transactions
10. **business_hours** - Operating hours for businesses
11. **business_images** - Business photo gallery
12. **amenities** - Available amenities/features
13. **business_amenities** - Business-amenity relationships
14. **notifications** - User notifications
15. **analytics_events** - Analytics tracking

### ENUMs Created (8 total)

1. **user_role**: user, vendor, admin
2. **business_status**: pending, approved, rejected, suspended
3. **lead_type**: call, whatsapp, email, chat, website
4. **lead_status**: new, contacted, converted, lost
5. **subscription_plan**: free, basic, premium, enterprise
6. **subscription_status**: active, cancelled, expired, suspended
7. **payment_status**: pending, completed, failed, refunded
8. **day_of_week**: monday through sunday

---

## TypeORM Configuration

### Current Settings
- **Synchronize**: `false` (manual migrations for safety)
- **Logging**: Enabled in development mode
- **Entity Auto-loading**: Enabled via `__dirname + '/**/*.entity{.ts,.js}'`

### Entity Files Created

All entities are located in `apps/api/src/entities/`:

- âœ… user.entity.ts
- âœ… vendor.entity.ts
- âœ… category.entity.ts
- âœ… business.entity.ts
- âœ… review.entity.ts
- âœ… lead.entity.ts
- âœ… favorite.entity.ts
- âœ… subscription.entity.ts
- âœ… notification.entity.ts

---

## Database Scripts

### Available Scripts

1. **check-db.js** - Verify database connection and list tables
   ```bash
   node scripts/check-db.js
   ```

2. **setup-db.js** - Create database if it doesn't exist
   ```bash
   node scripts/setup-db.js
   ```

3. **setup-full-db.js** - Initialize complete schema
   ```bash
   node scripts/setup-full-db.js
   ```

---

## Key Features

### âœ… Completed
- PostgreSQL database created and connected
- All tables and relationships established
- ENUMs for type safety
- Indexes for performance optimization
- TypeORM entities mapped to database schema
- Environment variable configuration
- WebSocket gateway for real-time notifications

### ðŸ”’ Security Features
- UUID primary keys for all tables
- Foreign key constraints
- Cascade delete rules
- Unique constraints on critical fields
- Password field added to users table (nullable for Firebase compatibility)

### ðŸ“Š Data Integrity
- NOT NULL constraints on required fields
- CHECK constraints for ratings (1-5)
- Default values for status fields
- Timestamps (created_at, updated_at) on all tables
- Unique constraints to prevent duplicates

---

## Backend API Status

### Running Services
- **Backend API**: https://local-business-listing-directory-production.up.railway.app/api/v1
- **WebSocket**: wss://local-business-listing-directory-production.up.railway.app/socket.io
- **Database**: PostgreSQL on your-db-host:5432

### Available Endpoints

#### Users
- `GET /api/v1/users` - List all users
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

#### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration

#### Categories
- `GET /api/v1/categories` - List all categories

#### Businesses
- `GET /api/v1/businesses` - List all businesses

---

## Environment Configuration

### apps/api/.env
```env
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=5432
DB_DATABASE=business_saas_db

PORT=3005
NODE_ENV=development
```

---

## Next Steps (Optional Enhancements)

1. **Seed Data**: Add sample data for testing
2. **Migrations**: Set up TypeORM migrations for version control
3. **Backup Strategy**: Implement automated database backups
4. **Performance**: Add additional indexes based on query patterns
5. **PostGIS**: Install PostGIS extension for advanced geospatial queries
6. **Full-text Search**: Implement pg_trgm for fuzzy search

---

## Troubleshooting

### Check Database Connection
```bash
node scripts/check-db.js
```

### Verify Backend is Running
```bash
curl https://local-business-listing-directory-production.up.railway.app/api/v1/users
```

### View Database Tables
The check-db.js script will show all tables and enums.

---

## Important Notes

1. **Synchronize is OFF**: Schema changes must be done via migrations or manual SQL
2. **Password Storage**: Passwords should be hashed before storing (implement bcrypt)
3. **JWT Tokens**: Implement JWT strategy for authentication
4. **CORS**: Currently set to allow all origins (adjust for production)
5. **Environment Variables**: All DB credentials are loaded from .env file

---

**Status**: âœ… Database is fully configured and operational
**Last Updated**: 2026-02-08
**Database Version**: PostgreSQL (compatible with 15+)


