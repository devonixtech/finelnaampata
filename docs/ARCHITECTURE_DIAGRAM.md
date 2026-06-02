# ðŸ”— API Integration Architecture

## System Overview

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     BUSINESS SAAS PLATFORM                          â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                  â”‚         â”‚                  â”‚         â”‚                  â”‚
â”‚   FRONTEND       â”‚â”€â”€â”€â”€â”€â”€â”€â”€â–¶â”‚    BACKEND       â”‚â”€â”€â”€â”€â”€â”€â”€â”€â–¶â”‚   DATABASE       â”‚
â”‚   (Next.js)      â”‚         â”‚    (NestJS)      â”‚         â”‚  (PostgreSQL)    â”‚
â”‚                  â”‚         â”‚                  â”‚         â”‚                  â”‚
â”‚   Port 3000      â”‚         â”‚   Port 3001      â”‚         â”‚   Port 5432      â”‚
â”‚                  â”‚         â”‚                  â”‚         â”‚                  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
        â”‚                            â”‚                             â”‚
        â”‚                            â”‚                             â”‚
        â–¼                            â–¼                             â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                  â”‚         â”‚                  â”‚         â”‚                  â”‚
â”‚  3 USER TYPES    â”‚         â”‚  12 API MODULES  â”‚         â”‚   15 TABLES      â”‚
â”‚                  â”‚         â”‚                  â”‚         â”‚                  â”‚
â”‚  â€¢ User          â”‚         â”‚  â€¢ Auth          â”‚         â”‚  â€¢ users         â”‚
â”‚  â€¢ Vendor        â”‚         â”‚  â€¢ Users         â”‚         â”‚  â€¢ vendors       â”‚
â”‚  â€¢ Admin         â”‚         â”‚  â€¢ Vendors       â”‚         â”‚  â€¢ businesses    â”‚
â”‚                  â”‚         â”‚  â€¢ Businesses    â”‚         â”‚  â€¢ categories    â”‚
â”‚                  â”‚         â”‚  â€¢ Categories    â”‚         â”‚  â€¢ reviews       â”‚
â”‚                  â”‚         â”‚  â€¢ Reviews       â”‚         â”‚  â€¢ leads         â”‚
â”‚                  â”‚         â”‚  â€¢ Leads         â”‚         â”‚  â€¢ favorites     â”‚
â”‚                  â”‚         â”‚  â€¢ Subscriptions â”‚         â”‚  â€¢ subscriptions â”‚
â”‚                  â”‚         â”‚  â€¢ Search        â”‚         â”‚  â€¢ transactions  â”‚
â”‚                  â”‚         â”‚  â€¢ Admin         â”‚         â”‚  â€¢ notifications â”‚
â”‚                  â”‚         â”‚  â€¢ Notifications â”‚         â”‚  â€¢ amenities     â”‚
â”‚                  â”‚         â”‚  â€¢ Stripe        â”‚         â”‚  â€¢ ...           â”‚
â”‚                  â”‚         â”‚                  â”‚         â”‚                  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## User Type Flows

### ðŸ‘¤ USER SIDE FLOW

```
User Browser
    â”‚
    â”œâ”€â–¶ Browse Businesses â”€â”€â–¶ api.user.searchBusinesses() â”€â”€â–¶ GET /businesses/search
    â”‚                                                              â”‚
    â”œâ”€â–¶ View Details â”€â”€â”€â”€â”€â”€â–¶ api.user.getBusinessById() â”€â”€â”€â”€â–¶ GET /businesses/:id
    â”‚                                                              â”‚
    â”œâ”€â–¶ Write Review â”€â”€â”€â”€â”€â”€â–¶ api.user.createReview() â”€â”€â”€â”€â”€â”€â”€â”€â–¶ POST /reviews
    â”‚                                                              â”‚
    â”œâ”€â–¶ Save Favorite â”€â”€â”€â”€â”€â–¶ api.user.addFavorite() â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶ POST /users/favorites
    â”‚                                                              â”‚
    â””â”€â–¶ Contact Business â”€â”€â–¶ api.user.createLead() â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶ POST /leads
                                                                   â”‚
                                                                   â–¼
                                                            PostgreSQL Database
                                                            (businesses, reviews,
                                                             favorites, leads)
```

### ðŸ¢ VENDOR SIDE FLOW

```
Business Dashboard
    â”‚
    â”œâ”€â–¶ View Stats â”€â”€â”€â”€â”€â”€â”€â”€â–¶ api.vendor.getDashboardStats() â”€â”€â–¶ GET /vendors/dashboard-stats
    â”‚                                                               â”‚
    â”œâ”€â–¶ Manage Businesses â”€â–¶ api.vendor.getMyBusinesses() â”€â”€â”€â”€â”€â–¶ GET /businesses/my-businesses
    â”‚                                                               â”‚
    â”œâ”€â–¶ Create Business â”€â”€â”€â–¶ api.vendor.createBusiness() â”€â”€â”€â”€â”€â”€â”€â–¶ POST /businesses
    â”‚                                                               â”‚
    â”œâ”€â–¶ View Leads â”€â”€â”€â”€â”€â”€â”€â”€â–¶ api.vendor.getMyLeads() â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶ GET /leads/my-leads
    â”‚                                                               â”‚
    â”œâ”€â–¶ Manage Subscriptionâ–¶ api.vendor.subscribeToPlan() â”€â”€â”€â”€â”€â”€â–¶ POST /subscriptions/subscribe
    â”‚                                                               â”‚
    â””â”€â–¶ Update Profile â”€â”€â”€â”€â–¶ api.vendor.updateProfile() â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶ PATCH /vendors/profile
                                                                    â”‚
                                                                    â–¼
                                                            PostgreSQL Database
                                                            (vendors, businesses,
                                                             leads, subscriptions)
```

### âš¡ ADMIN SIDE FLOW

```
Admin Dashboard
    â”‚
    â”œâ”€â–¶ View Global Stats â”€â–¶ api.admin.getGlobalStats() â”€â”€â”€â”€â”€â”€â”€â”€â–¶ GET /admin/stats
    â”‚                                                                â”‚
    â”œâ”€â–¶ Manage Users â”€â”€â”€â”€â”€â”€â–¶ api.admin.getAllUsers() â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶ GET /admin/users
    â”‚                                                                â”‚
    â”œâ”€â–¶ Moderate Business â”€â–¶ api.admin.moderateBusiness() â”€â”€â”€â”€â”€â”€â”€â–¶ PATCH /admin/business/:id/moderate
    â”‚                                                                â”‚
    â”œâ”€â–¶ Moderate Review â”€â”€â”€â–¶ api.admin.moderateReview() â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶ PATCH /admin/review/:id/moderate
    â”‚                                                                â”‚
    â”œâ”€â–¶ Verify Vendor â”€â”€â”€â”€â”€â–¶ api.admin.verifyVendor() â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶ POST /admin/vendor/:id/verify
    â”‚                                                                â”‚
    â””â”€â–¶ Manage Categories â”€â–¶ api.admin.createCategory() â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¶ POST /categories
                                                                     â”‚
                                                                     â–¼
                                                            PostgreSQL Database
                                                            (all tables - full access)
```

---

## Data Flow

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   USER      â”‚
â”‚   ACTION    â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜
       â”‚
       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   FRONTEND (Next.js)            â”‚
â”‚   â€¢ React Components            â”‚
â”‚   â€¢ Custom Hooks (useApi.ts)    â”‚
â”‚   â€¢ API Client (api.ts)         â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
       â”‚
       â”‚ HTTP Request
       â”‚ (JSON + JWT Token)
       â”‚
       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   BACKEND (NestJS)              â”‚
â”‚   â€¢ Controllers                 â”‚
â”‚   â€¢ Services                    â”‚
â”‚   â€¢ Guards (Auth, Roles)        â”‚
â”‚   â€¢ Validators                  â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
       â”‚
       â”‚ SQL Query
       â”‚ (TypeORM)
       â”‚
       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   DATABASE (PostgreSQL)         â”‚
â”‚   â€¢ 15 Tables                   â”‚
â”‚   â€¢ Relationships               â”‚
â”‚   â€¢ Indexes                     â”‚
â”‚   â€¢ Constraints                 â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
       â”‚
       â”‚ Result Set
       â”‚
       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   RESPONSE                      â”‚
â”‚   â€¢ JSON Data                   â”‚
â”‚   â€¢ Status Code                 â”‚
â”‚   â€¢ Error Messages              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Authentication Flow

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  User Login  â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
       â”‚
       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  POST /auth/login               â”‚
â”‚  { email, password }            â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
       â”‚
       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Backend Validates              â”‚
â”‚  â€¢ Check credentials            â”‚
â”‚  â€¢ Verify user exists           â”‚
â”‚  â€¢ Check password hash          â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
       â”‚
       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Generate JWT Token             â”‚
â”‚  â€¢ Include user ID              â”‚
â”‚  â€¢ Include role (user/vendor/admin)
â”‚  â€¢ Set expiration               â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
       â”‚
       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Return Response                â”‚
â”‚  { token, user }                â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
       â”‚
       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Frontend Stores Token          â”‚
â”‚  localStorage.setItem('token')  â”‚
â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
       â”‚
       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Subsequent Requests            â”‚
â”‚  Authorization: Bearer <token>  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## File Structure

```
business-saas/
â”‚
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ web/                          # Frontend (Next.js)
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”‚   â”œâ”€â”€ lib/
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ api.ts           âœ… API Client (50+ functions)
â”‚   â”‚   â”‚   â”œâ”€â”€ hooks/
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ useApi.ts        âœ… React Hooks (15+ hooks)
â”‚   â”‚   â”‚   â””â”€â”€ components/
â”‚   â”‚   â”‚       â”œâ”€â”€ user/            # User components
â”‚   â”‚   â”‚       â”œâ”€â”€ vendor/          # Vendor components
â”‚   â”‚   â”‚       â””â”€â”€ admin/           # Admin components
â”‚   â”‚   â””â”€â”€ .env                     âœ… Frontend config
â”‚   â”‚
â”‚   â””â”€â”€ api/                          # Simple API (Port 3000)
â”‚       â””â”€â”€ src/
â”‚           â””â”€â”€ app.controller.ts    âœ… Landing page
â”‚
â”œâ”€â”€ backend/                          # Backend (NestJS)
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ modules/
â”‚   â”‚   â”‚   â”œâ”€â”€ auth/                âœ… Authentication
â”‚   â”‚   â”‚   â”œâ”€â”€ users/               âœ… User management
â”‚   â”‚   â”‚   â”œâ”€â”€ vendors/             âœ… Business management
â”‚   â”‚   â”‚   â”œâ”€â”€ businesses/          âœ… Business CRUD
â”‚   â”‚   â”‚   â”œâ”€â”€ categories/          âœ… Categories
â”‚   â”‚   â”‚   â”œâ”€â”€ reviews/             âœ… Reviews & ratings
â”‚   â”‚   â”‚   â”œâ”€â”€ leads/               âœ… Lead generation
â”‚   â”‚   â”‚   â”œâ”€â”€ subscriptions/       âœ… Subscriptions
â”‚   â”‚   â”‚   â”œâ”€â”€ search/              âœ… Search
â”‚   â”‚   â”‚   â”œâ”€â”€ admin/               âœ… Admin operations
â”‚   â”‚   â”‚   â”œâ”€â”€ notifications/       âœ… Notifications
â”‚   â”‚   â”‚   â””â”€â”€ stripe/              âœ… Payments
â”‚   â”‚   â””â”€â”€ entities/                âœ… 15 database entities
â”‚   â””â”€â”€ .env                         âœ… Backend config
â”‚
â”œâ”€â”€ docs/                             # Documentation
â”‚   â”œâ”€â”€ API_INTEGRATION_GUIDE.md     âœ… Complete guide
â”‚   â”œâ”€â”€ API_LINKING_COMPLETE.txt     âœ… Summary
â”‚   â”œâ”€â”€ ARCHITECTURE_DIAGRAM.md      âœ… This file
â”‚   â””â”€â”€ ...
â”‚
â””â”€â”€ database/                         # PostgreSQL
    â””â”€â”€ webapp                        âœ… 15 tables with data
```

---

## Quick Reference

### Start Commands

```bash
# 1. Database (already running)
# Port 5432

# 2. Backend
cd backend
npm run start:dev
# Port 3001

# 3. Frontend
cd apps/web
npm run dev
# Port 3000
```

### API URLs

- **Frontend:** https://endearing-taffy-91a2c6.netlify.app
- **Backend:** http://process.env.NEXT_PUBLIC_API_URL
- **API Docs:** http://process.env.NEXT_PUBLIC_API_URL/api/docs
- **Database:** your-db-host:5432/webapp

### Test Endpoints

```bash
# Public endpoints
curl `${process.env.NEXT_PUBLIC_API_URL}`/categories
curl `${process.env.NEXT_PUBLIC_API_URL}`/subscriptions/plans

# Auth required
curl -H "Authorization: Bearer TOKEN" \
  `${process.env.NEXT_PUBLIC_API_URL}`/vendors/dashboard-stats
```

---

**âœ… All three user types (User, Vendor, Admin) are now fully integrated!**


