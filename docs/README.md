# ðŸ“š Business SaaS Platform - Documentation

Welcome to the documentation for the Business SaaS Platform!

## ðŸ“‹ Table of Contents

### Getting Started
1. **[DATABASE_CONNECTION_COMPLETE.md](./DATABASE_CONNECTION_COMPLETE.md)** - Complete database setup guide
   - Database configuration
   - Schema details
   - Seed data information
   - TypeORM configuration

2. **[API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)** - â­ **NEW!** Complete API integration
   - User, Vendor, Admin endpoints
   - Frontend integration
   - React hooks usage
   - Testing instructions

3. **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** - â­ **NEW!** System architecture
   - Visual diagrams
   - Data flow
   - User type flows
   - File structure

4. **[RESET_PASSWORD_GUIDE.md](./RESET_PASSWORD_GUIDE.md)** - PostgreSQL password reset guide
   - Step-by-step password reset
   - Common issues and solutions

5. **[QUICKSTART.txt](./QUICKSTART.txt)** - Quick reference card
   - Essential commands
   - Quick troubleshooting

### API Documentation
6. **[API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)** - API testing and usage
   - Endpoint testing commands
   - Database queries
   - Sample data creation

7. **[API_SPECIFICATION.md](./API_SPECIFICATION.md)** - API specifications
   - Endpoint details
   - Request/response formats

### Status & Reference
8. **[API_LINKING_COMPLETE.txt](./API_LINKING_COMPLETE.txt)** - â­ **NEW!** Integration status
   - User, Vendor, Admin linking complete
   - Feature summary
   - Quick reference

9. **[STATUS.txt](./STATUS.txt)** - Current system status
   - Database metrics
   - Running services
   - Quick commands

---

## ðŸš€ Quick Start

### 1. Database Connection
```powershell
# Test database connection
$env:PGPASSWORD = "5432"
psql -h your-db-host -p 5432 -U postgres -d webapp
```

### 2. Start API
```bash
cd apps/api
npm run start:dev
```

### 3. Access API
- **Web Interface:** https://local-business-listing-directory-production.up.railway.app
- **Users Endpoint:** https://local-business-listing-directory-production.up.railway.app/api/v1/users

---

## ðŸ“Š System Overview

### Database
- **Name:** webapp
- **Host:** your-db-host:5432
- **User:** postgres
- **Password:** 5432
- **Tables:** 15

### API
- **Port:** 3001 (Local) / Railway Managed (Prod)
- **Status:** Running
- **Framework:** NestJS
- **Database:** TypeORM + PostgreSQL
- **Production URL:** https://local-business-listing-directory-production.up.railway.app

---

## ðŸ—„ï¸ Database Tables

| Category | Tables |
|----------|--------|
| **Users & Auth** | users, vendors |
| **Business** | businesses, business_hours, business_amenities, categories, amenities |
| **Engagement** | reviews, review_helpful_votes, leads, favorites |
| **Subscriptions** | subscription_plans, subscriptions, transactions |
| **System** | notifications |

---

## ðŸ”— Useful Links

- **Production API Root:** https://local-business-listing-directory-production.up.railway.app/api/v1
- **Local API Root:** `${process.env.NEXT_PUBLIC_API_URL}`
- **Swagger Docs:** https://local-business-listing-directory-production.up.railway.app/api/docs

---

## ðŸ“ Documentation Files

All documentation files are organized in this `/docs` folder:

```
docs/
â”œâ”€â”€ README.md                           (this file)
â”œâ”€â”€ DATABASE_CONNECTION_COMPLETE.md     (complete setup guide)
â”œâ”€â”€ API_TESTING_GUIDE.md                (API testing)
â”œâ”€â”€ RESET_PASSWORD_GUIDE.md             (password reset)
â”œâ”€â”€ QUICKSTART.txt                      (quick reference)
â”œâ”€â”€ HOW_TO_RESET_PASSWORD.txt           (password reset steps)
â””â”€â”€ STATUS.txt                          (system status)
```

---

## ðŸ†˜ Need Help?

1. **Database Issues:** See [DATABASE_CONNECTION_COMPLETE.md](./DATABASE_CONNECTION_COMPLETE.md)
2. **API Testing:** See [API_TESTING_GUIDE.md](./API_TESTING_GUIDE.md)
3. **Password Reset:** See [RESET_PASSWORD_GUIDE.md](./RESET_PASSWORD_GUIDE.md)
4. **Quick Reference:** See [STATUS.txt](./STATUS.txt)

---

## âœ… System Status

- âœ… PostgreSQL 18 - Running
- âœ… Database 'webapp' - Connected
- âœ… Simple API (Port 3000) - Running
- âœ… 15 Tables Created
- âœ… Seed Data Inserted

---

**Last Updated:** 2026-02-07 22:20 IST  
**Status:** âœ… OPERATIONAL

