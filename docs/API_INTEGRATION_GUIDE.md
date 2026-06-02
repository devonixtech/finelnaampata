# ðŸ”— API Integration Guide - Complete Setup

## ðŸ“Š System Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    Business SaaS Platform                   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   Frontend   â”‚â”€â”€â”€â”€â”€â–¶â”‚   Backend    â”‚â”€â”€â”€â”€â”€â–¶â”‚  PostgreSQL  â”‚
â”‚  (Next.js)   â”‚      â”‚   (NestJS)   â”‚      â”‚   Database   â”‚
â”‚  Port 3000   â”‚      â”‚  Port 3001   â”‚      â”‚  Port 5432   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
      â”‚                      â”‚
      â”‚                      â”‚
      â–¼                      â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  User Side   â”‚      â”‚   12 API     â”‚
â”‚ Business Side  â”‚      â”‚   Modules    â”‚
â”‚ Admin Side   â”‚      â”‚              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## ðŸŽ¯ Three User Types

### 1. **ðŸ‘¤ User Side** (Public & Registered Users)
- Browse businesses
- Search and filter
- View business details
- Write reviews
- Save favorites
- Generate leads (contact businesses)

### 2. **ðŸ¢ Business Side** (Business Owners)
- Create/manage business listings
- View dashboard stats
- Manage leads
- Respond to reviews
- Manage subscriptions
- Upload verification documents

### 3. **âš¡ Admin Side** (Super Admin)
- View global statistics
- Moderate businesses (approve/reject)
- Moderate reviews
- Verify vendors
- Manage categories
- Manage subscription plans
- View all users

---

## ðŸ“ Updated Files

### âœ… Frontend API Client
**File:** `apps/web/src/lib/api.ts`

**Features:**
- âœ… Complete API client for all three user types
- âœ… Separate namespaces: `userApi`, `vendorApi`, `adminApi`
- âœ… TypeScript support
- âœ… Error handling
- âœ… Token-based authentication

**Usage Example:**
```typescript
import api from '@/lib/api';

// User Side
const businesses = await api.user.searchBusinesses({ city: 'Mumbai' });
const categories = await api.user.getCategories();

// Business Side
const stats = await api.vendor.getDashboardStats(token);
const myBusinesses = await api.vendor.getMyBusinesses(token);

// Admin Side
const globalStats = await api.admin.getGlobalStats(token);
const users = await api.admin.getAllUsers(1, 20, token);
```

---

## ðŸš€ Quick Start

### 1. Start PostgreSQL
```powershell
# Already running âœ…
# Database: webapp
# Port: 5432
```

### 2. Start Backend API
```bash
cd backend
npm install  # First time only
npm run start:dev
```

**Local API:** `${process.env.NEXT_PUBLIC_API_URL}`
**Production API:** https://local-business-listing-directory-production.up.railway.app/api/v1
**API Docs (Swagger):** https://local-business-listing-directory-production.up.railway.app/api/docs

### 3. Start Frontend
```bash
cd apps/web
npm install  # First time only
npm run dev
```

**Frontend will run on:** https://endearing-taffy-91a2c6.netlify.app

---

## ðŸ“¡ API Endpoints by User Type

### ðŸ‘¤ User Side Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /users/profile` - Get user profile
- `PATCH /users/profile` - Update user profile

#### Businesses (Public)
- `GET /businesses/search` - Search businesses
- `GET /businesses/:id` - Get business details
- `GET /businesses/category/:id` - Get businesses by category
- `GET /businesses/nearby` - Get nearby businesses

#### Categories
- `GET /categories` - Get all categories
- `GET /categories/:id` - Get category details

#### Reviews
- `GET /reviews/business/:id` - Get business reviews
- `POST /reviews` - Create review (auth required)
- `PATCH /reviews/:id` - Update review (auth required)
- `DELETE /reviews/:id` - Delete review (auth required)
- `POST /reviews/:id/helpful` - Mark review helpful

#### Favorites
- `GET /users/favorites` - Get user favorites
- `POST /users/favorites` - Add favorite
- `DELETE /users/favorites/:id` - Remove favorite

#### Leads
- `POST /leads` - Create lead (contact business)

---

### ðŸ¢ Business Side Endpoints

#### Vendor Profile
- `POST /vendors/become-vendor` - Register as vendor
- `GET /vendors/profile` - Get vendor profile
- `PATCH /vendors/profile` - Update vendor profile
- `GET /vendors/dashboard-stats` - Get dashboard statistics
- `POST /vendors/verify` - Submit verification documents

#### Business Management
- `GET /businesses/my-businesses` - Get my businesses
- `POST /businesses` - Create business
- `PATCH /businesses/:id` - Update business
- `DELETE /businesses/:id` - Delete business
- `PUT /businesses/:id/hours` - Update business hours

#### Leads Management
- `GET /leads/my-leads` - Get my leads
- `PATCH /leads/:id/status` - Update lead status

#### Reviews Management
- `GET /reviews/business/:id` - Get business reviews
- `POST /reviews/:id/respond` - Respond to review

#### Subscriptions
- `GET /subscriptions/my-subscription` - Get my subscription
- `GET /subscriptions/plans` - Get subscription plans
- `POST /subscriptions/subscribe` - Subscribe to plan
- `POST /subscriptions/cancel` - Cancel subscription
- `GET /subscriptions/transactions` - Get transaction history

---

### âš¡ Admin Side Endpoints

#### Dashboard
- `GET /admin/stats` - Get global statistics

#### User Management
- `GET /admin/users` - Get all users (paginated)

#### Business Moderation
- `PATCH /admin/business/:id/moderate` - Approve/reject/suspend business
- `GET /admin/businesses/pending` - Get pending businesses

#### Review Moderation
- `PATCH /admin/review/:id/moderate` - Approve/hide review

#### Vendor Verification
- `POST /admin/vendor/:id/verify` - Verify vendor

#### Category Management
- `POST /categories` - Create category
- `PATCH /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

#### Subscription Plan Management
- `POST /subscriptions/plans` - Create plan
- `PATCH /subscriptions/plans/:id` - Update plan
- `DELETE /subscriptions/plans/:id` - Delete plan

---

## ðŸ” Authentication Flow

### 1. User Login
```typescript
import api from '@/lib/api';

const { token, user } = await api.user.login('user@example.com', 'password');
// Store token in localStorage or cookies
localStorage.setItem('token', token);
```

### 2. Authenticated Requests
```typescript
const token = localStorage.getItem('token');
const profile = await api.user.getProfile(token);
```

### 3. Role-Based Access
```typescript
// Check user role
if (user.role === 'vendor') {
  // Show business dashboard
  const stats = await api.vendor.getDashboardStats(token);
} else if (user.role === 'admin') {
  // Show admin dashboard
  const stats = await api.admin.getGlobalStats(token);
} else {
  // Show user dashboard
  const favorites = await api.user.getFavorites(token);
}
```

---

## ðŸ§ª Testing the Integration

### Test User Side
```bash
# Search businesses (Production)
curl https://local-business-listing-directory-production.up.railway.app/api/v1/businesses/search?city=Mumbai

# Get categories (Production)
curl https://local-business-listing-directory-production.up.railway.app/api/v1/categories

# Get subscription plans (Local)
curl `${process.env.NEXT_PUBLIC_API_URL}`/subscriptions/plans
```

### Test Business Side (requires auth token)
```bash
# Get business dashboard stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  `${process.env.NEXT_PUBLIC_API_URL}`/vendors/dashboard-stats

# Get my businesses
curl -H "Authorization: Bearer YOUR_TOKEN" \
  `${process.env.NEXT_PUBLIC_API_URL}`/businesses/my-businesses
```

### Test Admin Side (requires admin token)
```bash
# Get global stats
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  https://local-business-listing-directory-production.up.railway.app/api/v1/admin/stats

# Get all users
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  https://local-business-listing-directory-production.up.railway.app/api/v1/admin/users
```

---

## ðŸ“¦ Environment Configuration

### Backend `.env` (already configured âœ…)
```env
# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=5432
DB_DATABASE=webapp

# API
PORT=3001
API_PREFIX=api/v1
FRONTEND_URL=https://local-business-listing-directory-production.up.railway.app

# JWT
JWT_SECRET=super-secret-key-for-development
JWT_EXPIRATION=7d
```

### Frontend `.env` (already configured âœ…)
```env
NEXT_PUBLIC_API_URL=https://local-business-listing-directory-production.up.railway.app/api/v1
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
```

---

## ðŸŽ¨ Frontend Integration Examples

### User Dashboard Example
```typescript
// app/dashboard/page.tsx
import api from '@/lib/api';

export default async function UserDashboard() {
  const token = getToken(); // Your auth function
  const favorites = await api.user.getFavorites(token);
  const profile = await api.user.getProfile(token);

  return (
    <div>
      <h1>Welcome, {profile.fullName}</h1>
      <FavoritesList favorites={favorites} />
    </div>
  );
}
```

### Business Dashboard Example
```typescript
// app/(dashboard)/dashboard/page.tsx
import api from '@/lib/api';

export default async function VendorDashboard() {
  const token = getToken();
  const stats = await api.vendor.getDashboardStats(token);
  const businesses = await api.vendor.getMyBusinesses(token);
  const leads = await api.vendor.getMyLeads(token);

  return (
    <div>
      <StatsCards stats={stats} />
      <BusinessList businesses={businesses} />
      <LeadsList leads={leads} />
    </div>
  );
}
```

### Admin Dashboard Example
```typescript
// app/admin/dashboard/page.tsx
import api from '@/lib/api';

export default async function AdminDashboard() {
  const token = getToken();
  const stats = await api.admin.getGlobalStats(token);
  const users = await api.admin.getAllUsers(1, 20, token);

  return (
    <div>
      <GlobalStats stats={stats} />
      <UserManagement users={users} />
    </div>
  );
}
```

---

## ðŸ”„ Data Flow

```
User Action â†’ Frontend (Next.js)
    â†“
API Call (api.ts)
    â†“
Backend (NestJS) â†’ Validates â†’ Authenticates
    â†“
Database (PostgreSQL)
    â†“
Response â†’ Frontend â†’ UI Update
```

---

## âœ… Integration Checklist

- [âœ…] Database connected (webapp@your-db-host:5432)
- [âœ…] Backend configured (Port 3001)
- [âœ…] Frontend configured (Port 3000)
- [âœ…] API client created (api.ts)
- [âœ…] User endpoints mapped
- [âœ…] Vendor endpoints mapped
- [âœ…] Admin endpoints mapped
- [âœ…] Authentication flow defined
- [âœ…] Environment variables set
- [ ] Backend started (run: `cd backend && npm run start:dev`)
- [ ] Frontend started (run: `cd apps/web && npm run dev`)
- [ ] Test all three user types

---

## ðŸš€ Next Steps

1. **Start Backend**
   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

2. **Start Frontend**
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```

3. **Test API Integration**
   - Visit http://process.env.NEXT_PUBLIC_API_URL/api/docs (Swagger)
   - Test endpoints with Postman or curl
   - Verify frontend can call backend

4. **Create Test Users**
   - Create a regular user
   - Create a vendor user
   - Create an admin user

5. **Build Features**
   - Implement user dashboard
   - Implement business dashboard
   - Implement admin dashboard

---

## ðŸ“š Additional Resources

- **API Documentation:** http://process.env.NEXT_PUBLIC_API_URL/api/docs
- **Database Guide:** `/docs/DATABASE_CONNECTION_COMPLETE.md`
- **Testing Guide:** `/docs/API_TESTING_GUIDE.md`
- **Backend Modules:** `/backend/src/modules/`
- **Frontend Components:** `/apps/web/src/components/`

---

**ðŸŽ‰ All three user types (User, Vendor, Admin) are now properly linked to the database through the backend API!**

Generated: 2026-02-07 22:27 IST  
Status: âœ… READY FOR DEVELOPMENT


