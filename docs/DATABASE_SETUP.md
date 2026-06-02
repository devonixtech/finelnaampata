# PostgreSQL Database Setup Guide

## Prerequisites
- PostgreSQL installed on your system
- Node.js and npm installed

## Step 1: Install PostgreSQL (if not already installed)

### Windows:
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation, set a password for the `postgres` user (remember this!)
4. Default port is 5432 (keep this unless you have a conflict)

### Verify Installation:
```bash
psql --version
```

## Step 2: Create the Database

### Option A: Using pgAdmin (GUI)
1. Open pgAdmin (installed with PostgreSQL)
2. Connect to your PostgreSQL server
3. Right-click on "Databases" â†’ "Create" â†’ "Database"
4. Name: `business_saas_db`
5. Click "Save"

### Option B: Using Command Line
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE business_saas_db;

# List databases to verify
\l

# Exit
\q
```

## Step 3: Configure Environment Variables

Edit the `.env` file in `apps/api/` directory:

```env
# Database Configuration
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=YOUR_ACTUAL_PASSWORD_HERE  # âš ï¸ CHANGE THIS!
DB_DATABASE=business_saas_db

# Application Configuration
PORT=3000
NODE_ENV=development
```

**âš ï¸ IMPORTANT:** Replace `YOUR_ACTUAL_PASSWORD_HERE` with your actual PostgreSQL password!

## Step 4: Start the Application

```bash
# Navigate to the API directory
cd apps/api

# Start in development mode
npm run start:dev
```

## Step 5: Verify Database Connection

### Check the Console Output:
You should see messages indicating successful database connection:
- TypeORM connection established
- No errors about database connection

### Test the API Endpoints:

#### Create a User:
```bash
curl -X POST https://endearing-taffy-91a2c6.netlify.app/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "phone": "1234567890"
  }'
```

#### Get All Users:
```bash
curl https://endearing-taffy-91a2c6.netlify.app/users
```

## Available API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create new user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

## Database Schema

The `users` table will be automatically created with the following structure:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  phone VARCHAR,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting

### Error: "password authentication failed"
- Check your password in `.env` file
- Verify PostgreSQL is running: `pg_ctl status`

### Error: "database does not exist"
- Create the database using pgAdmin or psql command line
- Verify database name matches in `.env`

### Error: "connection refused"
- Ensure PostgreSQL service is running
- Check if port 5432 is correct
- Verify `DB_HOST` is set to your managed database host

### Error: "relation does not exist"
- The tables should auto-create on first run (synchronize: true)
- Check console for TypeORM sync messages

## Next Steps

1. **Add More Entities**: Create additional entity files in `src/entities/`
2. **Add Migrations**: For production, use migrations instead of synchronize
3. **Add Validation**: Use class-validator for DTO validation
4. **Add Authentication**: Implement JWT authentication
5. **Add Relations**: Define relationships between entities

## Production Considerations

âš ï¸ **Before deploying to production:**

1. Set `synchronize: false` in `typeorm.config.ts`
2. Use migrations for schema changes
3. Use environment-specific `.env` files
4. Enable SSL for database connections
5. Use connection pooling
6. Implement proper error handling
7. Add database backups

## Useful PostgreSQL Commands

```bash
# Connect to database
psql -U postgres -d business_saas_db

# List all tables
\dt

# Describe table structure
\d users

# View all users
SELECT * FROM users;

# Exit
\q
```


