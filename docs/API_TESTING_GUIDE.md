# ðŸ§ª API Testing Guide

## Quick Test Commands

### Simple API (Port 3000) - Currently Running âœ…

```powershell
# Get all users
curl https://endearing-taffy-91a2c6.netlify.app/users -UseBasicParsing

# Expected: []
```

---

## Full Backend API (Port 3001) - Ready to Start

### Start the Backend
```powershell
cd backend
npm install  # First time only
npm run start:dev
```

### Once Started, Test These Endpoints:

#### 1. Subscription Plans
```powershell
curl `${process.env.NEXT_PUBLIC_API_URL}`/subscriptions/plans -UseBasicParsing
```
**Expected:** List of 4 subscription plans (Free, Basic, Premium, Enterprise)

#### 2. Categories
```powershell
curl `${process.env.NEXT_PUBLIC_API_URL}`/categories -UseBasicParsing
```
**Expected:** List of 8 categories (Restaurants, Health, Education, etc.)

#### 3. Health Check
```powershell
curl http://process.env.NEXT_PUBLIC_API_URL/health -UseBasicParsing
```
**Expected:** `{"status":"ok"}`

#### 4. API Documentation
Open in browser:
```
http://process.env.NEXT_PUBLIC_API_URL/api/docs
```
**Expected:** Swagger UI with all API endpoints

---

## Database Direct Queries

### View Subscription Plans
```powershell
$env:PGPASSWORD = "5432"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h your-db-host -p 5432 -U postgres -d webapp -c "SELECT name, price, max_listings FROM subscription_plans ORDER BY price;"
```

### View Categories
```powershell
$env:PGPASSWORD = "5432"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h your-db-host -p 5432 -U postgres -d webapp -c "SELECT name, slug FROM categories ORDER BY display_order;"
```

### Count All Records
```powershell
$env:PGPASSWORD = "5432"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h your-db-host -p 5432 -U postgres -d webapp -c "
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'businesses', COUNT(*) FROM businesses
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'subscription_plans', COUNT(*) FROM subscription_plans
UNION ALL SELECT 'amenities', COUNT(*) FROM amenities;
"
```

---

## Create Test Data

### Create a Test User
```powershell
$env:PGPASSWORD = "5432"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h your-db-host -p 5432 -U postgres -d webapp -c "
INSERT INTO users (firebase_uid, email, full_name, phone, role)
VALUES ('test-uid-123', 'test@example.com', 'Test User', '9876543210', 'user')
RETURNING id, email, full_name;
"
```

### Create a Test Vendor
```powershell
# First, get the user ID from above, then:
$env:PGPASSWORD = "5432"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h your-db-host -p 5432 -U postgres -d webapp -c "
INSERT INTO vendors (user_id, business_name, business_phone)
VALUES ('<USER_ID_HERE>', 'Test Business', '9876543210')
RETURNING id, business_name;
"
```

---

## Useful psql Commands

### Connect to Database
```powershell
$env:PGPASSWORD = "5432"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h your-db-host -p 5432 -U postgres -d webapp
```

### Inside psql:
```sql
-- List all tables
\dt

-- Describe a table
\d users

-- List all databases
\l

-- Quit
\q
```

---

## Status Check

Run this to verify everything is working:

```powershell
Write-Host "=== Database Connection Test ===" -ForegroundColor Cyan
$env:PGPASSWORD = "5432"
$result = & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h your-db-host -p 5432 -U postgres -d webapp -t -c "SELECT 'Connected!' as status;"
if ($LASTEXITCODE -eq 0) {
    Write-Host "âœ… Database: Connected" -ForegroundColor Green
} else {
    Write-Host "âŒ Database: Failed" -ForegroundColor Red
}

Write-Host "`n=== Simple API Test ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://endearing-taffy-91a2c6.netlify.app/users" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "âœ… Simple API (Port 3000): Running" -ForegroundColor Green
    }
} catch {
    Write-Host "âŒ Simple API (Port 3000): Not running" -ForegroundColor Red
}

Write-Host "`n=== Backend API Test ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://process.env.NEXT_PUBLIC_API_URL/health" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "âœ… Backend API (Port 3001): Running" -ForegroundColor Green
    }
} catch {
    Write-Host "â³ Backend API (Port 3001): Not started yet" -ForegroundColor Yellow
    Write-Host "   Run: cd backend && npm run start:dev" -ForegroundColor Gray
}

Write-Host "`n=== Database Tables ===" -ForegroundColor Cyan
$tables = & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h your-db-host -p 5432 -U postgres -d webapp -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
Write-Host "âœ… Total Tables: $($tables.Trim())" -ForegroundColor Green

Write-Host "`n=== Seed Data ===" -ForegroundColor Cyan
$plans = & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h your-db-host -p 5432 -U postgres -d webapp -t -c "SELECT COUNT(*) FROM subscription_plans;"
$categories = & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h your-db-host -p 5432 -U postgres -d webapp -t -c "SELECT COUNT(*) FROM categories;"
$amenities = & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h your-db-host -p 5432 -U postgres -d webapp -t -c "SELECT COUNT(*) FROM amenities;"
Write-Host "âœ… Subscription Plans: $($plans.Trim())" -ForegroundColor Green
Write-Host "âœ… Categories: $($categories.Trim())" -ForegroundColor Green
Write-Host "âœ… Amenities: $($amenities.Trim())" -ForegroundColor Green

Write-Host "`nðŸŽ‰ All systems operational!" -ForegroundColor Green
```

Save this as `test-status.ps1` and run it anytime to check your setup!

