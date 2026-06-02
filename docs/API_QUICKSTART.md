# Quick Start: PostgreSQL Database Setup

## ðŸš€ Fastest Way to Get Started

### 1. **Update Your Password**
Edit `.env` file and replace `your_password_here` with your actual PostgreSQL password:
```env
DB_PASSWORD=your_actual_password
```

### 2. **Create the Database**

**Option A - Automated (Recommended):**
```powershell
.\setup-database.ps1
```

**Option B - Manual:**
```bash
psql -U postgres
CREATE DATABASE business_saas_db;
\q
```

### 3. **Start the Application**
```bash
npm run start:dev
```

### 4. **Test the Connection**
Open your browser or use curl:
```bash
curl https://endearing-taffy-91a2c6.netlify.app/users
```

## ðŸ“ What Was Created

```
apps/api/
â”œâ”€â”€ .env                          # Environment variables (UPDATE PASSWORD!)
â”œâ”€â”€ .gitignore                    # Prevents .env from being committed
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ config/
â”‚   â”‚   â””â”€â”€ typeorm.config.ts    # Database configuration
â”‚   â”œâ”€â”€ entities/
â”‚   â”‚   â””â”€â”€ user.entity.ts       # User database model
â”‚   â”œâ”€â”€ users/
â”‚   â”‚   â”œâ”€â”€ users.module.ts      # Users feature module
â”‚   â”‚   â”œâ”€â”€ users.controller.ts  # REST API endpoints
â”‚   â”‚   â””â”€â”€ users.service.ts     # Business logic
â”‚   â””â”€â”€ app.module.ts            # Updated with database connection
â”œâ”€â”€ DATABASE_SETUP.md            # Detailed setup guide
â”œâ”€â”€ create-database.sql          # SQL script for manual setup
â””â”€â”€ setup-database.ps1           # PowerShell automation script
```

## ðŸ”§ Configuration

### Environment Variables (.env)
```env
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=YOUR_PASSWORD_HERE    # âš ï¸ CHANGE THIS!
DB_DATABASE=business_saas_db
PORT=3000
NODE_ENV=development
```

## ðŸŽ¯ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users |
| GET | `/users/:id` | Get user by ID |
| POST | `/users` | Create new user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |

### Example: Create a User
```bash
curl -X POST https://endearing-taffy-91a2c6.netlify.app/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "name": "John Doe",
    "phone": "1234567890"
  }'
```

## âœ… Verification Checklist

- [ ] PostgreSQL is installed and running
- [ ] Database `business_saas_db` is created
- [ ] `.env` file has correct password
- [ ] Application starts without errors
- [ ] Can access https://endearing-taffy-91a2c6.netlify.app/users
- [ ] Can create a user via POST request

## ðŸ› Common Issues

### "password authentication failed"
â†’ Check your password in `.env` file

### "database does not exist"
â†’ Run `.\setup-database.ps1` or create manually

### "connection refused"
â†’ Ensure PostgreSQL service is running

## ðŸ“š Next Steps

1. **Read DATABASE_SETUP.md** for detailed documentation
2. **Add more entities** in `src/entities/`
3. **Create more modules** following the users module pattern
4. **Add authentication** (JWT, sessions, etc.)
5. **Add validation** using class-validator

## ðŸ” Security Notes

- âš ï¸ Never commit `.env` file to git
- âš ï¸ Use strong passwords for production
- âš ï¸ Disable `synchronize` in production
- âš ï¸ Use migrations for schema changes in production

---

**Need help?** Check `DATABASE_SETUP.md` for comprehensive documentation.

