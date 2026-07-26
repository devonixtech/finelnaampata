# NAAMPATA Mobile App - Software Requirements Specification (SRS)

**Version:** 2.0  
**Date:** July 23, 2026  
**Platform:** React Native 0.76+ (Bare Workflow / Gradle / Android Studio / Xcode)  
**Navigation:** React Navigation v6 (Stack + Bottom Tabs)  
**Styling:** NativeWind v4 (Tailwind CSS for React Native)  
**State:** Zustand + TanStack React Query v5  
**Backend:** NestJS REST API at `https://local-business-listing-directory-production.up.railway.app/api/v1`  
**Database:** PostgreSQL (Railway hosted)  
**Push Notifications:** Firebase Cloud Messaging (FCM) via `@react-native-firebase/messaging`  
**Maps:** `react-native-maps` (Google Maps provider)  
**Payment:** Stripe (Checkout Sessions + Webhooks)  
**Image Upload:** Cloudinary (upload via signed URLs)  
**Build:** Gradle (Android) + Xcode (iOS) + Fastlane (CI/CD)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Navigation Structure (React Navigation)](#3-navigation-structure-react-navigation)
4. [Screen Catalog - Public Screens](#4-screen-catalog---public-screens)
5. [Screen Catalog - Auth Screens](#5-screen-catalog---auth-screens)
6. [Screen Catalog - Dashboard (Vendor)](#6-screen-catalog---dashboard-vendor)
7. [Screen Catalog - Dashboard (User)](#7-screen-catalog---dashboard-user)
8. [Screen Catalog - Settings](#8-screen-catalog---settings)
9. [Screen Catalog - Listing Wizard (20 Steps)](#9-screen-catalog---listing-wizard-20-steps)
10. [Screen Catalog - Admin](#10-screen-catalog---admin)
11. [API Integration Map](#11-api-integration-map)
12. [State Management](#12-state-management)
13. [Auth Flow](#13-auth-flow)
14. [Design System & UI Guidelines](#14-design-system--ui-guidelines)
15. [Component Library](#15-component-library)
16. [Real-Time Features](#16-real-time-features)
17. [Push Notifications](#17-push-notifications)
18. [Offline Support](#18-offline-support)
19. [Platform-Specific Considerations](#19-platform-specific-considerations)
20. [File & Folder Structure](#20-file--folder-structure)
21. [Feature Parity Checklist](#21-feature-parity-checklist)
22. [Phased Development Plan](#22-phased-development-plan)
23. [Testing Strategy](#23-testing-strategy)
24. [Environment Variables](#24-environment-variables)
25. [Build & Deployment](#25-build--deployment)

---

## 1. Project Overview

### 1.1 Purpose

NAAMPATA is a local business directory platform. The mobile app must replicate ALL features of the existing web platform (85+ pages, ~195 API endpoints) with a native mobile experience. The app uses the same NestJS backend and PostgreSQL database as the web platform.

**No Expo.** This is a bare React Native project with full native control via Gradle (Android) and Xcode (iOS).

### 1.2 Target Users

| Role | Description |
|------|-------------|
| **Guest** | Anonymous user browsing businesses, search, categories, cities |
| **User** | Registered user who saves businesses, writes reviews, sends leads, chats |
| **Vendor** | Business owner who creates/manages listings, deals, events, views analytics |
| **Admin** | Platform administrator managing users, businesses, categories, plans |
| **SuperAdmin** | Full system access including role changes, system settings |

### 1.3 Core Value Proposition

- Find local businesses instantly
- Compare businesses via reviews, ratings, Q&A
- Contact businesses via call, WhatsApp, email, chat
- Manage business listings, deals, events, promotions
- Real-time messaging between customers and vendors

---

## 2. Tech Stack & Architecture

### 2.1 Mobile Tech Stack

| Component | Technology | Reason |
|-----------|-----------|--------|
| **Framework** | React Native 0.76+ (Bare Workflow) | Full native control, Gradle builds |
| **Language** | TypeScript 5.x | Type safety across codebase |
| **Navigation** | React Navigation v6 (Native Stack + Bottom Tabs) | Industry standard, full native feel |
| **Styling** | NativeWind v4 (Tailwind CSS for RN) | Match web design system exactly |
| **State** | Zustand v5 + TanStack React Query v5 | Zustand for global state, RQ for server cache |
| **Forms** | React Hook Form v7 + Zod | Same validation as web |
| **Secure Storage** | `react-native-keychain` | iOS Keychain / Android Keystore |
| **HTTP** | Axios + interceptors | Auto-attach JWT, refresh tokens |
| **Real-time** | `socket.io-client` | Chat, notifications (same as web) |
| **Maps** | `react-native-maps` (Google Maps provider) | Native map for listing detail, search proximity |
| **Google Auth** | `@react-native-google-signin/google-signin` | Native Google Sign-In |
| **Push Notifications** | `@react-native-firebase/messaging` | FCM push registration + handling |
| **Firebase Analytics** | `@react-native-firebase/analytics` | User behavior tracking |
| **Firebase Crashlytics** | `@react-native-firebase/crashlytics` | Crash reporting |
| **Camera/Gallery** | `react-native-image-crop-picker` | Upload photos for listings, reviews |
| **Location** | `react-native-geolocation-service` | GPS for nearby businesses, auto-detect city |
| **Splash Screen** | `react-native-bootsplash` | Branded launch screen |
| **Animations** | `react-native-reanimated` v3 | Smooth transitions, skeleton loaders |
| **Gestures** | `react-native-gesture-handler` | Swipe, drag, pull-to-refresh |
| **Icons** | `react-native-vector-icons` (MaterialIcons, FontAwesome) | Same icons as web |
| **Fonts** | Custom font linking via Gradle/Xcode | Inter font family |
| **Image Cache** | `react-native-fast-image` | Fast image loading + caching |
| **Async Storage** | `@react-native-async-storage/async-storage` | General-purpose local storage |
| **Deep Links** | `react-native-linking` | Share business/offer links that open in-app |
| **CodePush** | `appcenter-codepush` | OTA updates without app store review |
| **CI/CD** | Fastlane + GitHub Actions | Automated builds, testing, deployment |
| **Build (Android)** | Gradle 8.x + Android SDK 34+ | Native Android builds |
| **Build (iOS)** | Xcode 15+ + CocoaPods | Native iOS builds |
| **Testing** | Jest + React Native Testing Library + Detox | Unit, integration, E2E |

### 2.2 Why Bare React Native (Not Expo)

| Reason | Detail |
|--------|--------|
| **Full Gradle control** | Custom native modules, ProGuard rules, build variants |
| **Firebase native SDK** | Direct `@react-native-firebase/*` packages, no Expo wrapper overhead |
| **Custom native code** | Any time we need a native module, we own the code |
| **CI/CD with Fastlane** | Automated signing, builds, store uploads |
| **CodePush for OTA** | Instant JS bundle updates without store review |
| **Google Maps native** | Full Maps SDK features, custom markers, clustering |
| **No Expo dependency lock-in** | Zero risk of Expo breaking changes affecting builds |
| **Smaller binary size** | No Expo runtime overhead |

### 2.3 Architecture Pattern

```
React Native App (Bare Workflow)
    |
    +-- Presentation Layer (Screens, Components)
    |       |
    +-- Business Logic Layer (Hooks, Zustand Stores)
    |       |
    +-- Data Layer (API Services, React Query)
    |       |
    +-- Infrastructure (Axios, Socket.io, Keychain, Firebase)
            |
            v
    NestJS Backend API (same as web)
            |
            v
    PostgreSQL + Redis + Elasticsearch
```

### 2.4 API Base URL

```
Production: https://local-business-listing-directory-production.up.railway.app/api/v1
Development: http://10.0.2.2:3001/api/v1  (Android emulator)
             http://localhost:3001/api/v1    (iOS simulator)
```

---

## 3. Navigation Structure (React Navigation)

### 3.1 Root Navigator

```typescript
// src/navigation/RootNavigator.tsx
const RootStack = createNativeStackNavigator();

function RootNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Splash" component={SplashScreen} />
      <RootStack.Screen name="Auth" component={AuthStack} />
      <RootStack.Screen name="Main" component={MainTabNavigator} />
      <RootStack.Screen name="Dashboard" component={DashboardStack} />
      <RootStack.Screen name="Admin" component={AdminStack} />
      <RootStack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
      <RootStack.Screen name="OfferDetail" component={OfferDetailScreen} />
      <RootStack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
      <RootStack.Screen name="CityDetail" component={CityDetailScreen} />
      <RootStack.Screen name="Pricing" component={PricingScreen} />
      <RootStack.Screen name="ExpertQuote" component={ExpertQuoteScreen} />
      <RootStack.Screen name="About" component={AboutScreen} />
      <RootStack.Screen name="Contact" component={ContactScreen} />
      <RootStack.Screen name="Legal" component={LegalScreen} />
    </RootStack.Navigator>
  );
}
```

### 3.2 Auth Stack (Not Logged In)

```typescript
// src/navigation/AuthStack.tsx
const Auth = createNativeStackNavigator();

function AuthStack() {
  return (
    <Auth.Navigator screenOptions={{ headerShown: false }}>
      <Auth.Screen name="Login" component={LoginScreen} />
      <Auth.Screen name="Register" component={RegisterScreen} />
      <Auth.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Auth.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    </Auth.Navigator>
  );
}
```

### 3.3 Main Tab Navigator (Bottom Tabs)

```typescript
// src/navigation/MainTabNavigator.tsx
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF7A30',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { paddingBottom: 8, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialIcons name="search" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Offers"
        component={OffersScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialIcons name="local-offer" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialIcons name="favorite-border" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
```

### 3.4 Dashboard Stack (Vendor/User)

```typescript
// src/navigation/DashboardStack.tsx
const Dashboard = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Dashboard.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#112D4E' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Dashboard.Screen name="DashboardHome" component={DashboardScreen} />
      <Dashboard.Screen name="Settings" component={SettingsScreen} />
      <Dashboard.Screen name="AddListing" component={AddListingWizard} />
      <Dashboard.Screen name="EditListing" component={EditListingScreen} />
      <Dashboard.Screen name="Leads" component={LeadsScreen} />
      <Dashboard.Screen name="Messages" component={MessagesScreen} />
      <Dashboard.Screen name="Chat" component={ChatScreen} />
      <Dashboard.Screen name="Reviews" component={ReviewsScreen} />
      <Dashboard.Screen name="Deals" component={DealsScreen} />
      <Dashboard.Screen name="CreateDeal" component={CreateDealScreen} />
      <Dashboard.Screen name="DealDetail" component={DealDetailScreen} />
      <Dashboard.Screen name="ManageEvents" component={EventsScreen} />
      <Dashboard.Screen name="CreateEvent" component={CreateEventScreen} />
      <Dashboard.Screen name="EventDetail" component={EventDetailScreen} />
      <Dashboard.Screen name="Following" component={FollowingScreen} />
      <Dashboard.Screen name="Analytics" component={AnalyticsScreen} />
      <Dashboard.Screen name="Subscription" component={SubscriptionScreen} />
      <Dashboard.Screen name="OfferPlans" component={OfferPlansScreen} />
      <Dashboard.Screen name="Notifications" component={NotificationsScreen} />
      <Dashboard.Screen name="Notes" component={NotesScreen} />
      <Dashboard.Screen name="Affiliate" component={AffiliateScreen} />
      <Dashboard.Screen name="DeleteAccount" component={DeleteAccountScreen} />
    </Dashboard.Navigator>
  );
}
```

### 3.5 Admin Stack

```typescript
// src/navigation/AdminStack.tsx
const Admin = createNativeStackNavigator();

function AdminStack() {
  return (
    <Admin.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#112D4E' },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Admin.Screen name="AdminHome" component={AdminDashboardScreen} />
      <Admin.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Admin.Screen name="AdminUserDetail" component={AdminUserDetailScreen} />
      <Admin.Screen name="AdminBusinesses" component={AdminBusinessesScreen} />
      <Admin.Screen name="AdminBusinessDetail" component={AdminBusinessDetailScreen} />
      <Admin.Screen name="AdminCategories" component={AdminCategoriesScreen} />
      <Admin.Screen name="AdminCities" component={AdminCitiesScreen} />
      <Admin.Screen name="AdminPlans" component={AdminPlansScreen} />
      <Admin.Screen name="AdminSubscriptions" component={AdminSubscriptionsScreen} />
      <Admin.Screen name="AdminReviews" component={AdminReviewsScreen} />
      <Admin.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
      <Admin.Screen name="AdminDemand" component={AdminDemandScreen} />
      <Admin.Screen name="AdminReferrals" component={AdminReferralsScreen} />
      <Admin.Screen name="AdminSettings" component={AdminSettingsScreen} />
    </Admin.Navigator>
  );
}
```

### 3.6 Role-Based Navigation

| Role | Visible Tabs | Additional Screens |
|------|-------------|-------------------|
| Guest | Home, Search, Offers | Login, Register, Business Detail |
| User | Home, Search, Offers, Saved, Profile | Dashboard, Settings, Messages, Leads |
| Vendor | Home, Search, Offers, Saved, Profile (Dashboard) | All vendor screens, Add Listing |
| Admin | Same as Vendor + Admin button in Profile | Admin stack screens |

---

## 4. Screen Catalog - Public Screens

### 4.1 Home Screen

**API Calls:** `GET /categories/popular`, `GET /businesses/search?featured=true`, `GET /offers/public/search`, `GET /cities/popular`

| Section | UI Elements | Notes |
|---------|------------|-------|
| **Hero** | Gradient header, headline text, full search bar (country dropdown, city dropdown, text input with autocomplete), two CTA cards ("Hot Local Deals", "Get Expert Quotes"), feature highlights bar | Search bar opens dedicated Search tab on tap |
| **Popular Categories** | Horizontal FlatList of category cards (icon, name, count) | Tap navigates to Search with category filter |
| **Featured Businesses** | 2-column FlatList of BusinessCard components | Pagination (Load More / infinite scroll) |
| **How It Works** | 3-step cards (Search, Compare, Contact) | Static content |
| **Latest Offers & Events** | Horizontal FlatList of OfferCard components | Tap navigates to offer detail |
| **Top Cities** | 2-column FlatList of city cards with hero images | Tap navigates to city businesses |
| **Testimonials** | Animated horizontal auto-scrolling FlatList of review cards | Fallback testimonials if no community reviews |
| **Business CTA** | Dark banner "Own a Business?" with Sign Up button | Only for non-vendor users |

### 4.2 Search Screen

**API Calls:** `GET /search?q=...&city=...&country=...&categoryId=...&sortBy=...&page=...&limit=...`

| Element | Description |
|---------|-------------|
| **Search Bar** | Persistent TextInput with search icon, clear button |
| **Filter Chips** | Horizontal ScrollView: Country, City, Category, Sort By |
| **Sort Options** | Recommended, Nearest, Top Rated, Most Reviewed, Most Contacted |
| **Results List** | FlatList with PullToRefresh and infinite scroll |
| **Empty State** | Illustration + "No businesses found" |
| **Map Toggle** | Floating button to switch list/map view |

**Filter Modal (Bottom Sheet):** Country picker, City picker (filtered by country), Category picker, Rating filter (1-5), Price range, Open Now toggle, Verified Only toggle, Featured Only toggle

### 4.3 Offers & Events Tab

**API Calls:** `GET /offers/public/search`, `GET /deals/public/search`, `GET /events/public/search`

| Element | Description |
|---------|-------------|
| **Sub-Tab Bar** | Three sub-tabs: All, Deals, Events |
| **Filter Chips** | City, Category, Featured, Date Range |
| **Results Grid** | 2-column FlatList of OfferCard components |
| **Pull-to-Refresh** | Refresh results |
| **Infinite Scroll** | Load more on scroll end |

### 4.4 Saved Screen

**API Calls:** `GET /users/favorites`, `GET /users/saved-offers-events`

| Element | Description |
|---------|-------------|
| **Sub-Tab Bar** | Two sub-tabs: Businesses, Offers & Events |
| **Saved Businesses** | FlatList with swipe-to-delete (react-native-gesture-handler) |
| **Saved Offers** | FlatList with swipe-to-delete |
| **Empty State** | "Nothing saved yet" + browse CTA |
| **Login Prompt** | If not logged in, show login button |

### 4.5 Business Detail Screen

**API Calls:** `GET /businesses/slug/:slug`, `GET /reviews/business/:idOrSlug`, `GET /qa/business/:businessId`, `GET /businesses/:id/similar`, `GET /follows/:businessId/check`

| Section | UI Elements |
|---------|------------|
| **Header** | Back button, share button, heart/follow toggle, business name |
| **Image Carousel** | Horizontal FlatList (react-native-reanimated layout) with pagination dots |
| **Quick Actions** | Call, WhatsApp, Email, Get Directions buttons |
| **Info Card** | Business name, rating stars, review count, verified badge, featured badge, address, hours |
| **About** | Full description, year established, employee count, price range |
| **Business Hours** | 7-day schedule with open/close times |
| **Amenities** | Grid of amenity chips (Wi-Fi, Parking, AC, etc.) |
| **Social Links** | Clickable social media icons |
| **Reviews** | Recent reviews with "See All" link, Write Review button |
| **Q&A** | Questions and answers section |
| **Offers & Events** | Active deals and events from this business |
| **Similar Businesses** | Horizontal FlatList of similar BusinessCard components |
| **Map** | react-native-maps View showing business location with marker |
| **Contact Form** | Name, phone, email, message - sends lead |

### 4.6 Categories Screen

**API Calls:** `GET /categories`, `GET /categories/popular`

| Element | Description |
|---------|-------------|
| **Search** | TextInput to filter categories |
| **Category Grid** | FlatList of category cards (icon, name, business count) |
| **Popular Section** | Highlighted popular categories at top |

### 4.7 Category Detail Screen

**API Calls:** `GET /categories/slug/:slug`, `GET /businesses/search?category={slug}`

| Element | Description |
|---------|-------------|
| **Header** | Category name, description, business count |
| **Subcategories** | If has children, show subcategory list |
| **Business List** | FlatList of businesses in this category |
| **Sort/Filter** | Sort and filter options |

### 4.8 Cities Screen

**API Calls:** `GET /cities`, `GET /cities/popular`, `GET /cities/countries`

| Element | Description |
|---------|-------------|
| **Country Filter** | Picker to filter by country |
| **Popular Cities** | Highlighted grid of popular cities |
| **All Cities** | Alphabetical list of all cities |

### 4.9 City Detail Screen

**API Calls:** `GET /businesses/search?city={name}`

| Element | Description |
|---------|-------------|
| **City Header** | City name, hero image, business count |
| **Business List** | FlatList of businesses in this city |
| **Sort/Filter** | Category filter, sort options |

### 4.10 Expert Quote Screen

**API Calls:** `POST /expert-quote`

| Element | Description |
|---------|-------------|
| **Form** | Name, Email, Phone, Category (picker), Description (multiline), Preferred Contact, City |
| **Submit** | Button with loading state |
| **Success** | Success animation / confirmation |

### 4.11 Pricing Screen

**API Calls:** `GET /subscriptions/plans`, `GET /subscriptions/pricing/plans`

| Element | Description |
|---------|-------------|
| **Plan Cards** | Subscription plan cards with features, pricing, CTA |
| **Monthly/Yearly Toggle** | Segmented control for billing cycle |
| **Feature Comparison** | Table comparing plans |

### 4.12 Legal Screen

**Static content** rendered from local markdown or fetched from API.

| Slugs |
|-------|
| privacy, terms-users, terms-business, refund-policy, content-moderation, cookie-policy, dpa, affiliate-policy, dmca |

---

## 5. Screen Catalog - Auth Screens

### 5.1 Login Screen

**API Calls:** `POST /auth/login`, `POST /auth/google`

| Element | Description |
|---------|-------------|
| **Email/Phone Field** | TextInput with validation |
| **Password Field** | SecureTextEntry with show/hide toggle |
| **Login Button** | Primary CTA with ActivityIndicator |
| **Google Sign-In** | `@react-native-google-signin/google-signin` button |
| **Forgot Password** | TouchableOpacity -> ForgotPassword screen |
| **Sign Up** | TouchableOpacity -> Register screen |
| **Divider** | "Or continue with" with horizontal lines |

### 5.2 Register Screen

**API Calls:** `POST /auth/register`

| Element | Description |
|---------|-------------|
| **Full Name** | TextInput |
| **Email** | TextInput with validation |
| **Password** | SecureTextEntry with strength indicator |
| **Confirm Password** | SecureTextEntry |
| **Phone** | Optional TextInput with country code picker |
| **Role Toggle** | "I'm a Customer" / "I'm a Business Owner" segmented control |
| **Terms Checkbox** | "I agree to Terms & Privacy Policy" |
| **Register Button** | Primary CTA |
| **Google Sign-Up** | Google button |
| **Login Link** | "Already have an account? Log in" |

### 5.3 Email Verification Screen

**API Calls:** `POST /auth/verify-email`, `POST /auth/resend-otp`

| Element | Description |
|---------|-------------|
| **OTP Input** | 6 individual TextInput boxes (auto-focus next) |
| **Verify Button** | Primary CTA |
| **Resend Code** | "Resend code" with countdown timer (60s) |

### 5.4 Forgot Password Screen

**API Calls:** `POST /auth/forgot-password`, `POST /auth/reset-password`

| Element | Description |
|---------|-------------|
| **Email Input** | Enter email |
| **Send Code Button** | Primary CTA |
| **OTP Input** | 6-digit code |
| **New Password** | SecureTextEntry |
| **Confirm Password** | SecureTextEntry |
| **Reset Button** | Primary CTA |

---

## 6. Screen Catalog - Dashboard (Vendor)

### 6.1 Dashboard Home

**API Calls:** `GET /vendors/dashboard-stats`, `GET /vendors/profile`, `GET /leads/vendor?limit=5`, `GET /reviews?limit=5`, `GET /chat/conversations/vendor?limit=5`

| Section | Content |
|---------|---------|
| **Welcome Header** | "Hello, {name}" + Add New Listing button |
| **Plan Status Banner** | Current plan, expiry, days remaining |
| **Profile Completion** | ProgressBar + missing field badges |
| **Stats Grid** | 5 cards: Listings, Views, Chats (unread), Leads, Reviews |
| **Leads Inbox** | Last 5 leads with status badges |
| **Analytics Chart** | Performance line chart (react-native-chart-kit) |
| **Saved Businesses** | Top 3 saved |
| **Following** | Top 3 followed |
| **Recent Reviews** | Last 5 reviews |
| **Demand Insights** | Hot demand widget |
| **Recent Chats** | Last 5 conversations |
| **Referral Card** | Referral code, copy link, apply input |

### 6.2 Leads Screen

**API Calls:** `GET /leads/vendor`, `GET /leads/vendor/stats`, `PATCH /leads/:id/status`, `PATCH /leads/:id/reply`

| Element | Description |
|---------|-------------|
| **Stats Bar** | Total, New, Contacted, Converted counts |
| **Filter Tabs** | All, New, Contacted, Converted, Lost |
| **Lead List** | FlatList of lead cards |
| **Lead Detail** | Bottom sheet or push: contact info, message, reply input, status changer, CRM notes |

### 6.3 Messages / Chat List

**API Calls:** `GET /chat/conversations/vendor`

| Element | Description |
|---------|-------------|
| **Conversation List** | FlatList: avatar, name, last message preview, time, unread badge |
| **Search** | Filter conversations by name |

### 6.4 Chat Screen

**API Calls:** `GET /chat/conversations/:id/messages`, `POST /chat/conversations/:id/messages`, `PATCH /chat/conversations/:id/mark-as-read`

| Element | Description |
|---------|-------------|
| **Header** | Business name, online status, avatar |
| **Message List** | FlatList (inverted) of message bubbles |
| **Input Bar** | TextInput, send button |
| **Notes Tab** | Business notes for this conversation |

### 6.5 Add Listing Wizard (20 Steps)

**API Calls:** `POST /businesses`, `PATCH /businesses/:id`, `GET /categories`, `GET /business-setup/questions`

**20 Steps - each is a screen navigated via step index:**

| Step | Title | Key Fields |
|------|-------|-----------|
| 1 | Name & Tagline | Business name, tagline |
| 2 | Business Type | Physical Location, Home-Based, Online, On-Site, Mobile (multi-select chips) |
| 3 | Nature of Business | 10 options (sell physical, sell digital, services, rent, bookings, events, etc.) |
| 4 | Operational Structure | Grouped sections: Producer (8), Sales (8), Intermediary (6), Service (12), Org (8) |
| 5 | Category | CategorySearchSelect with search, loading, subcategories |
| 6 | Target Market | B2C, B2B, B2G, D2C, Wholesale, International |
| 7 | Address | Country picker, State picker (filtered), City, Address lines, Pincode (validated) |
| 8 | Map Location | react-native-maps with marker, geocoded from address, Load Map + Get Directions |
| 9 | Contact | Phone (with dial code), WhatsApp, Email, Website |
| 10 | Business Hours | 7-day: isOpen toggle per day, time pickers for open/close |
| 11 | Description | Short description, Full description (multiline TextInput) |
| 12 | Experience & Team | Year established, Employee count (text), Price range, Languages (comma-separated) |
| 13 | Online Presence | Social links: platform picker + URL per platform |
| 14 | Amenities | Location Access (8), Facilities (15), Staff (7), Payment (8) - multi-select chips |
| 15 | Industry Sub-Type | Industrial/Manufacturing (10), Agriculture (7) - grouped |
| 16 | Keywords | Search keywords (comma-separated) |
| 17 | FAQs | Add/remove FAQ pairs (question + answer) |
| 18 | Expansion | Franchise opportunities, dealer inquiries, importer/exporter toggle |
| 19 | Media | Logo picker, Cover picker, Photos picker (multiple), Image captions |
| 20 | Review & Submit | Summary of all fields, consent checkboxes, submit |

**UI Pattern per step:**
- ProgressBar at top (segmented, current / 20)
- Step title and description
- Form fields
- Next / Back / Save Draft buttons at bottom
- Validation on Next
- Draft auto-save every 30 seconds

### 6.6 Deals Management

**API Calls:** `GET /deals/vendor`, `POST /deals`, `PATCH /deals/:id`, `DELETE /deals/:id`

| Screen | Description |
|--------|-------------|
| **Deal List** | FlatList of deal cards with status badges |
| **Create Deal** | Form: title, description, business picker, dates, badge, image, highlights, terms |
| **Deal Detail** | Full info, edit, delete, publish actions |

### 6.7 Events Management

**API Calls:** `GET /events/vendor`, `POST /events`, `PATCH /events/:id`, `DELETE /events/:id`

| Screen | Description |
|--------|-------------|
| **Event List** | FlatList of event cards |
| **Create Event** | Form: title, description, business, dates, image, highlights, terms |
| **Event Detail** | Full info, edit, delete, publish |

### 6.8 Reviews Screen

**API Calls:** `GET /reviews?vendorId=...`

| Element | Description |
|---------|-------------|
| **Filter Tabs** | All, 5-star, 4-star, 3-star, 2-star, 1-star |
| **Review List** | Business name, reviewer, stars, comment, date, vendor response |
| **Response Action** | "Reply" button -> text input |

### 6.9 Following Screen

**API Calls:** `GET /follows/my`

| Element | Description |
|---------|-------------|
| **Business List** | FlatList of followed businesses |
| **Unfollow** | Swipe or button |

### 6.10 Analytics Screen

**API Calls:** `GET /vendors/dashboard-stats`

| Element | Description |
|---------|-------------|
| **Period Selector** | 7d, 30d, 90d, 1y |
| **Metrics Cards** | Views, Leads, Reviews, Chats |
| **Charts** | Line (views), Bar (leads), Pie (ratings) via react-native-chart-kit or victory-native |

### 6.11 Subscription Screen

**API Calls:** `GET /subscriptions/active`, `GET /subscriptions/my-invoices`, `POST /subscriptions/checkout`

| Element | Description |
|---------|-------------|
| **Current Plan** | Name, features, expiry, days remaining |
| **Upgrade** | Navigate to pricing |
| **Invoices** | List with download |
| **Cancel** | Cancel subscription |

### 6.12 Affiliate Screen

**API Calls:** `GET /affiliate/stats`, `GET /affiliate/referrals`, `POST /affiliate/join`, `POST /affiliate/payouts`

| Element | Description |
|---------|-------------|
| **Stats** | Balance, earnings, referrals |
| **Referral Link** | Copyable + share via react-native-share |
| **Referral History** | List with status |
| **Withdraw** | Payout form (amount, method, details) |
| **Payout History** | List of payouts |

### 6.13 Notifications Screen

**API Calls:** `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`

| Element | Description |
|---------|-------------|
| **Notification List** | FlatList: icon, title, message, time, read/unread |
| **Mark All Read** | Button in header |

### 6.14 Delete Account Screen

**API Calls:** `DELETE /users/profile`, `POST /users/profile/cancel-deletion`

| Element | Description |
|---------|-------------|
| **Warning** | "30-day grace period" text |
| **Delete Button** | Red, requires password |
| **Cancel** | If scheduled, cancel button |

---

## 7. Screen Catalog - Dashboard (User)

| Section | Content |
|---------|---------|
| **Stats Grid** | Saved Businesses, Messages, Reviews, Notifications |
| **Business CTA** | "Own a Business?" banner |
| **My Inquiries** | User's sent inquiries |
| **My Job Leads** | User's broadcast submissions |
| **Alerts** | Notifications list |
| **Recent Reviews** | User's posted reviews |
| **Saved Businesses** | Top 3 saved |
| **Following** | Top 3 followed |

---

## 8. Screen Catalog - Settings

**API Calls:** `GET /users/profile`, `PATCH /users/profile`, `PATCH /users/password`, `PATCH /vendors/profile`

| Section | Fields | Visibility |
|---------|--------|-----------|
| **Personal Info** | Avatar (image picker), Full Name, Phone, Country, State, City | All |
| **Business Info** | Business Name, Email, Phone, Address, Timezone | Vendors |
| **Business Hours** | 7-day toggle + time pickers | Vendors |
| **Social Media** | Platform picker + URL (premium gated) | Vendors |
| **Security** | Current Password, New Password, Confirm | All |
| **Danger Zone** | Delete Account (30-day grace) | All |
| **Notification Settings** | Email + push toggles | All |

---

## 9. Screen Catalog - Listing Wizard (20 Steps)

*See Section 6.5 for complete step-by-step breakdown.*

---

## 10. Screen Catalog - Admin

### 10.1 Admin Dashboard
`GET /admin/stats` - Total Users, Businesses, Reviews, Subscriptions, Revenue

### 10.2 Admin Users
`GET /admin/users`, `PATCH /admin/users/:id/status`, `DELETE /admin/users/:id`

### 10.3 Admin Businesses
`GET /admin/businesses`, `PATCH /admin/business/:id/featured`, `PATCH /admin/business/:id/verify-listing`, `PATCH /admin/business/:id/suspension`

### 10.4 Admin Categories
`GET /categories/admin`, `POST /categories/admin`, `PATCH /categories/admin/:id`, `DELETE /categories/admin/:id`

### 10.5 Admin Cities
`GET /cities/admin`, `POST /cities/admin`, `POST /cities/admin/bulk-import`

### 10.6 Admin Plans & Subscriptions
`GET /subscriptions/plans/admin`, `GET /subscriptions/admin/all`, `POST /subscriptions/admin/assign`

### 10.7 Admin Reviews
`GET /reviews/admin/all`, `PATCH /reviews/admin/:id/moderate`

### 10.8 Admin Analytics
`GET /admin/search-analytics/*`, `GET /admin/heatmap-data`

### 10.9 Admin Demand
`GET /demand/summary-ai`, `GET /demand/insights`, `GET /demand/overview`, `GET /demand/heatmap`

### 10.10 Admin Referrals
`GET /affiliate/admin/stats`, `GET /affiliate/admin/affiliates`, `PATCH /affiliate/admin/payouts/:id`

### 10.11 Admin Settings
`GET /admin/settings`, `PATCH /admin/settings`

---

## 11. API Integration Map

### 11.1 API Response Shapes

```typescript
// Paginated response
interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number; };
}

// Business
interface Business {
  id: string; vendorId: string; title: string; slug: string;
  description: string; shortDescription: string; email: string;
  phone: string; whatsapp: string; website: string; address: string;
  city: string; state: string; country: string; pincode: string;
  latitude: number; longitude: number; logoUrl: string; coverImageUrl: string;
  images: string[]; videos: string[]; yearEstablished: number;
  employeeCount: string; priceRange: string; status: string;
  isVerified: boolean; isFeatured: boolean; isSponsored: boolean;
  averageRating: number; totalReviews: number; totalViews: number;
  totalLeads: number; followersCount: number; businessType: string[];
  coreBusinessNature: string[]; operationalStructure: string[];
  targetMarket: string[]; facilities: string[]; paymentMethods: string[];
  businessLanguages: string[]; socialLinks: SocialLink[];
  faqs: FAQ[]; category: Category; businessHours: BusinessHours[];
  createdAt: string; updatedAt: string;
}

// Auth tokens
interface AuthTokens {
  user: User; accessToken: string; refreshToken: string;
}

// User
interface User {
  id: string; email: string; fullName: string; phone: string;
  avatarUrl: string; role: 'user' | 'vendor' | 'admin' | 'superadmin';
  isActive: boolean; country: string; city: string; state: string;
}

// Vendor
interface Vendor {
  id: string; userId: string; businessName: string; businessEmail: string;
  businessPhone: string; businessAddress: string; bio: string;
  country: string; city: string; state: string; slug: string; timezone: string;
}

// Review
interface Review {
  id: string; businessId: string; userId: string; rating: number;
  title: string; comment: string; images: string[]; helpfulCount: number;
  isApproved: boolean; user: User; createdAt: string;
}

// Lead
interface Lead {
  id: string; businessId: string; userId: string;
  type: 'call' | 'whatsapp' | 'email' | 'chat' | 'website';
  status: 'new' | 'contacted' | 'converted' | 'lost';
  name: string; email: string; phone: string; message: string;
  source: string; createdAt: string;
}

// Chat
interface Conversation {
  id: string; userId: string; businessId: string; vendorId: string;
  lastMessage: string; lastMessageAt: string; unreadCount: number;
}
interface Message {
  id: string; conversationId: string; senderId: string;
  content: string; isRead: boolean; createdAt: string;
}

// Offer/Event/Deal
interface OfferEvent {
  id: string; vendorId: string; businessId: string; title: string;
  description: string; type: 'offer' | 'event' | 'page';
  offerBadge: string; imageUrl: string; startDate: string;
  endDate: string; expiryDate: string;
  status: 'scheduled' | 'active' | 'expired';
  isActive: boolean; isFeatured: boolean; placements: string[];
  highlights: string[]; terms: string[];
}
```

---

## 12. State Management

### 12.1 Zustand Stores

| Store | State | Actions |
|-------|-------|---------|
| `useAuthStore` | user, tokens, isAuthenticated, isLoading | login(), register(), googleLogin(), logout(), refreshToken() |
| `useLocationStore` | country, state, city, latitude, longitude | setLocation(), setCountry(), detectLocation() |
| `useSearchStore` | query, categoryId, city, country, sortBy, filters | setQuery(), setFilters(), resetFilters() |
| `useChatStore` | conversations, activeConversation, unreadTotal | setConversations(), setActive(), updateUnread() |
| `useWizardStore` | currentStep, formData (20 steps), savedDraftId | setStep(), updateField(), saveDraft(), loadDraft() |

### 12.2 React Query Hooks

| Query Key | Endpoint | Purpose |
|-----------|----------|---------|
| `categories.popular` | `/categories/popular` | Homepage categories |
| `categories.all` | `/categories` | All categories |
| `cities.popular` | `/cities/popular` | Homepage cities |
| `business.search` | `/businesses/search` | Search results |
| `business.detail` | `/businesses/slug/:slug` | Business profile |
| `reviews.business` | `/reviews/business/:idOrSlug` | Business reviews |
| `offers.search` | `/offers/public/search` | Offers list |
| `leads.vendor` | `/leads/vendor` | Vendor leads |
| `chat.conversations` | `/chat/conversations/vendor` | Chat list |
| `vendor.stats` | `/vendors/dashboard-stats` | Dashboard stats |
| `subscriptions.active` | `/subscriptions/active` | Current subscription |
| `notifications` | `/notifications` | User notifications |
| `favorites` | `/users/favorites` | Saved businesses |

### 12.3 Secure Storage Keys (react-native-keychain)

| Service | Key | Value |
|---------|-----|-------|
| `com.naampata.auth` | `accessToken` | JWT string |
| `com.naampata.auth` | `refreshToken` | JWT string |
| `com.naampata.auth` | `user` | JSON string |
| `com.naampata.location` | `location` | JSON string |
| `com.naampata.push` | `fcmToken` | string |

---

## 13. Auth Flow

### 13.1 Login Flow

```
User enters email + password
  -> POST /auth/login
  -> Store tokens in react-native-keychain (iOS Keychain / Android Keystore)
  -> Store user in Keychain + Zustand
  -> Navigate based on role:
     - user -> MainTab (Profile tab = user dashboard)
     - vendor -> MainTab (Profile tab = vendor dashboard)
     - admin/superadmin -> AdminStack
```

### 13.2 Google Sign-In Flow

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure (in App.tsx or index.js)
GoogleSignin.configure({
  webClientId: '726476736350-...apps.googleusercontent.com',
  offlineAccess: true,
});

// Sign in
const { idToken } = await GoogleSignin.signIn();
// Send to backend
const { user, accessToken, refreshToken } = await api.post('/auth/google', { credential: idToken });
// Store + navigate
```

### 13.3 Token Refresh Flow

```
API returns 401
  -> Axios interceptor catches
  -> Read refreshToken from Keychain
  -> POST /auth/refresh { refreshToken }
  -> Store new tokens
  -> Retry original request
  -> If refresh fails: logout, navigate to Auth stack
```

---

## 14. Design System & UI Guidelines

### 14.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#112D4E` | Headers, dark backgrounds, primary buttons |
| `accent` | `#FF7A30` | CTAs, links, highlights, badges |
| `accentHover` | `#E86920` | Pressed state |
| `background` | `#F8FAFC` | Screen backgrounds |
| `surface` | `#FFFFFF` | Cards, modals |
| `textPrimary` | `#1E293B` | Headings |
| `textSecondary` | `#64748B` | Body text |
| `textMuted` | `#94A3B8` | Captions, placeholders |
| `border` | `#E2E8F0` | Dividers, borders |
| `success` | `#22C55E` | Verified badges, success states |
| `warning` | `#F59E0B` | Pending states |
| `danger` | `#EF4444` | Delete, errors |
| `star` | `#FBBF24` | Rating stars |

### 14.2 Typography

| Style | Font | Weight | Size |
|-------|------|--------|------|
| H1 | Inter | 900 | 28-32px |
| H2 | Inter | 700 | 22-24px |
| H3 | Inter | 700 | 18-20px |
| Body | Inter | 400 | 14-16px |
| Caption | Inter | 400 | 12px |
| Small | Inter | 500 | 10-11px |
| Button | Inter | 600 | 14-16px |

### 14.3 Spacing

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 24px |
| 2xl | 32px |
| 3xl | 48px |

### 14.4 Animations (react-native-reanimated)

| Element | Animation |
|---------|-----------|
| Screen transitions | Slide from right (native stack default) |
| Card press | `withSpring(scale: 0.97)` |
| Skeleton loaders | Shimmer wave (reanimated) |
| Modal open | Slide up + backdrop fade |
| Heart/follow | Scale bounce + color change |
| Toast notifications | Slide down from top |
| Marquee testimonials | Animated horizontal scroll |
| Bottom sheet | Gesture-driven slide (react-native-bottom-sheet) |

---

## 15. Component Library

### 15.1 Shared Components

| Component | Props | Description |
|-----------|-------|-------------|
| `BusinessCard` | business, onPress, showDistance? | Card with image, name, rating, address |
| `OfferCard` | offer, onPress | Card with image, title, badge, dates |
| `CategoryCard` | category, onPress, count? | Card with icon, name, count |
| `CityCard` | city, onPress | Card with hero image, name |
| `ReviewCard` | review, onPress, onHelpful? | Avatar, name, stars, comment |
| `LeadCard` | lead, onPress | Type icon, name, status, time |
| `ChatBubble` | message, isOwn | Message bubble styling |
| `ConversationItem` | conversation, onPress | Avatar, preview, time, badge |
| `SearchBar` | value, onChange, onSubmit | TextInput with icon, clear |
| `FilterChip` | label, selected, onPress | Horizontal pill |
| `EmptyState` | title, subtitle, actionLabel?, onAction? | Illustration + message |
| `Avatar` | uri?, name, size? | Circular image + initials fallback |
| `Badge` | count, max? | Notification badge |
| `StarRating` | rating, size?, interactive?, onChange? | Stars display/input |
| `ProgressBar` | progress, color?, height? | Linear progress |
| `ImageCarousel` | images, initialIndex? | Horizontal swiper |
| `MapPreview` | latitude, longitude, title? | Small map with marker |
| `StepProgress` | currentStep, totalSteps | Wizard progress bar |
| `FormInput` | label, error, ...TextInputProps | Labeled input + validation |
| `FormSelect` | label, options, value, onChange | Picker/dropdown |
| `FormMultiSelect` | label, options, selected, onChange | Multi-select chips |
| `DatePicker` | label, value, onChange | Date picker |
| `PhoneInput` | value, onChange, countryCode? | Phone + country code |

### 15.2 Layout Components

| Component | Description |
|-----------|-------------|
| `ScreenContainer` | SafeAreaView + standard padding |
| `KeyboardAvoidingView` | iOS/Android keyboard handling wrapper |
| `SectionHeader` | Title + optional "See All" |
| `Card` | White rounded card with shadow |
| `Divider` | Horizontal line |

---

## 16. Real-Time Features

### 16.1 Socket.io

```typescript
import { io } from 'socket.io-client';

const socket = io('https://local-business-listing-directory-production.up.railway.app', {
  auth: { token: accessToken },
  transports: ['websocket'],
});

socket.on('newMessage', handleMessage);
socket.on('conversationUpdated', handleConversationUpdate);
socket.on('notification', handleNotification);
```

### 16.2 Heartbeat

```typescript
// Mark online every 30 seconds
setInterval(() => {
  socket.emit('ping');
  api.post('/auth/ping');
}, 30000);
```

---

## 17. Push Notifications

### 17.1 Setup (Firebase)

```typescript
import messaging from '@react-native-firebase/messaging';

// Request permission
const authStatus = await messaging().requestPermission();
const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED;

// Get FCM token
const token = await messaging().getToken();
await api.post('/users/profile/device-token', { token });

// Handle foreground messages
messaging().onMessage(async remoteMessage => {
  // Show local notification
  showLocalNotification(remoteMessage);
});

// Handle background/quit messages
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // Process in background
});

// Handle notification tap
messaging().onNotificationOpenedApp(remoteMessage => {
  // Navigate to relevant screen
  navigateFromNotification(remoteMessage);
});
```

### 17.2 Notification Types

| Type | Trigger | Action |
|------|---------|--------|
| `new_message` | Chat message | Navigate to chat |
| `new_review` | Review on business | Navigate to reviews |
| `lead_received` | New lead | Navigate to leads |
| `offers` | New deals nearby | Navigate to offers |
| `subscription_expiry` | Plan expiring | Navigate to subscription |
| `system_alerts` | Announcements | Show in-app |

---

## 18. Offline Support

| Data | Strategy |
|------|----------|
| Auth tokens | Keychain (always available) |
| User profile | Keychain cache |
| Last search results | AsyncStorage |
| Categories/Cities | AsyncStorage (refresh daily) |
| Last 20 conversations | AsyncStorage |
| Last 50 messages/conversation | AsyncStorage |

**Offline UI:** "Offline" banner, cached data display, queue actions for retry, retry button on failures.

---

## 19. Platform-Specific Considerations

### 19.1 Android (Gradle)

| Item | Detail |
|------|--------|
| **build.gradle** | `minSdkVersion 24`, `targetSdkVersion 34`, `compileSdkVersion 34` |
| **ProGuard** | Rules for react-native-maps, Firebase, OkHttp |
| **Google Services** | `google-services.json` in `android/app/` |
| **Signing** | Keystore for release builds (Fastlane manages) |
| **Permissions** | INTERNET, ACCESS_FINE_LOCATION, CAMERA, READ_EXTERNAL_STORAGE |
| **Deep Links** | Intent filters in AndroidManifest.xml |
| **Splash** | `react-native-bootsplash` (native splash screen) |

### 19.2 iOS (Xcode)

| Item | Detail |
|------|--------|
| **Minimum iOS** | iOS 14.0+ |
| **Pods** | `GoogleService-Info.plist` in iOS directory |
| **Signing** | Apple Developer cert + provisioning profile (Fastlane) |
| **Permissions** | NSLocationWhenInUse, NSCamera, NSPhotoLibrary |
| **ATS** | Allow HTTP for dev, HTTPS for prod |
| **Universal Links** | Associated domains |

### 19.3 Shared

| Item | Detail |
|------|--------|
| **Camera** | `react-native-image-crop-picker` with permission handling |
| **Location** | `react-native-geolocation-service` with permission |
| **Network** | `@react-native-community/netinfo` for connectivity status |
| **Share** | `react-native-share` for referral links, business links |

---

## 20. File & Folder Structure

```
naampata-mobile/
  android/                          -- Android native project (Gradle)
    app/
      build.gradle                  -- App-level Gradle config
      google-services.json         -- Firebase config
      src/main/
        AndroidManifest.xml        -- Permissions, deep links
        java/com/naampata/app/     -- Native modules (if needed)
        res/                        -- Drawable, values, mipmap
    build.gradle                    -- Project-level Gradle
    gradle.properties               -- Gradle properties
    settings.gradle                 -- Module includes
  
  ios/                              -- iOS native project (Xcode)
    Naampata/
      AppDelegate.mm
      GoogleService-Info.plist     -- Firebase config
      Info.plist                    -- Permissions, deep links
    Naampata.xcodeproj
    Podfile                        -- CocoaPods dependencies
  
  src/
    navigation/
      RootNavigator.tsx             -- Root stack (Auth vs Main vs Dashboard vs Admin)
      AuthStack.tsx                 -- Login, Register, Forgot, Verify
      MainTabNavigator.tsx          -- Bottom tabs (Home, Search, Offers, Saved, Profile)
      DashboardStack.tsx            -- All dashboard screens
      AdminStack.tsx                -- All admin screens
      linking.ts                    -- Deep link configuration
      types.ts                      -- Navigation type definitions
    
    screens/
      splash/
        SplashScreen.tsx
      auth/
        LoginScreen.tsx
        RegisterScreen.tsx
        ForgotPasswordScreen.tsx
        VerifyEmailScreen.tsx
      main/
        HomeScreen.tsx
        SearchScreen.tsx
        OffersScreen.tsx
        SavedScreen.tsx
        ProfileScreen.tsx
      business/
        BusinessDetailScreen.tsx
      categories/
        CategoriesScreen.tsx
        CategoryDetailScreen.tsx
      cities/
        CitiesScreen.tsx
        CityDetailScreen.tsx
      offers/
        OfferDetailScreen.tsx
      pricing/
        PricingScreen.tsx
      expert-quote/
        ExpertQuoteScreen.tsx
      static/
        AboutScreen.tsx
        ContactScreen.tsx
        LegalScreen.tsx
      dashboard/
        DashboardScreen.tsx
        SettingsScreen.tsx
        LeadsScreen.tsx
        MessagesScreen.tsx
        ChatScreen.tsx
        ReviewsScreen.tsx
        FollowingScreen.tsx
        AnalyticsScreen.tsx
        SubscriptionScreen.tsx
        OfferPlansScreen.tsx
        NotificationsScreen.tsx
        NotesScreen.tsx
        AffiliateScreen.tsx
        DeleteAccountScreen.tsx
      wizard/
        AddListingWizard.tsx        -- Wizard container + step navigation
        steps/
          Step01NameTagline.tsx
          Step02BusinessType.tsx
          Step03BusinessNature.tsx
          Step04OperationalStructure.tsx
          Step05Category.tsx
          Step06TargetMarket.tsx
          Step07Address.tsx
          Step08Map.tsx
          Step09Contact.tsx
          Step10Hours.tsx
          Step11Description.tsx
          Step12Experience.tsx
          Step13OnlinePresence.tsx
          Step14Amenities.tsx
          Step15IndustrySubType.tsx
          Step16Keywords.tsx
          Step17FAQs.tsx
          Step18Expansion.tsx
          Step19Media.tsx
          Step20ReviewSubmit.tsx
      deals/
        DealsScreen.tsx
        CreateDealScreen.tsx
        DealDetailScreen.tsx
      events/
        EventsScreen.tsx
        CreateEventScreen.tsx
        EventDetailScreen.tsx
      admin/
        AdminDashboardScreen.tsx
        AdminUsersScreen.tsx
        AdminUserDetailScreen.tsx
        AdminBusinessesScreen.tsx
        AdminBusinessDetailScreen.tsx
        AdminCategoriesScreen.tsx
        AdminCitiesScreen.tsx
        AdminPlansScreen.tsx
        AdminSubscriptionsScreen.tsx
        AdminReviewsScreen.tsx
        AdminAnalyticsScreen.tsx
        AdminDemandScreen.tsx
        AdminReferralsScreen.tsx
        AdminSettingsScreen.tsx
    
    components/
      business/
        BusinessCard.tsx
        BusinessHours.tsx
        BusinessMap.tsx
        SimilarBusinesses.tsx
      offer/
        OfferCard.tsx
        OfferFilter.tsx
      category/
        CategoryCard.tsx
        CategoryPicker.tsx
      city/
        CityCard.tsx
        CityPicker.tsx
      review/
        ReviewCard.tsx
        StarRating.tsx
        ReviewForm.tsx
      chat/
        ChatBubble.tsx
        ConversationItem.tsx
        ChatInput.tsx
      lead/
        LeadCard.tsx
        LeadForm.tsx
      common/
        SearchBar.tsx
        FilterChip.tsx
        EmptyState.tsx
        LoadingSpinner.tsx
        SkeletonLoader.tsx
        Avatar.tsx
        Badge.tsx
        Modal.tsx
        BottomSheet.tsx
        Toast.tsx
        ImageCarousel.tsx
        MapPreview.tsx
        StepProgress.tsx
        FormInput.tsx
        FormSelect.tsx
        FormMultiSelect.tsx
        DatePicker.tsx
        PhoneInput.tsx
        Card.tsx
        Divider.tsx
        SectionHeader.tsx
      layout/
        ScreenContainer.tsx
        KeyboardAvoidingContainer.tsx
    
    api/
      client.ts                     -- Axios instance + interceptors
      auth.ts
      businesses.ts
      categories.ts
      cities.ts
      users.ts
      vendors.ts
      leads.ts
      reviews.ts
      comments.ts
      offers.ts
      deals.ts
      events.ts
      expertQuote.ts
      subscriptions.ts
      promotions.ts
      notifications.ts
      chat.ts
      affiliate.ts
      qa.ts
      admin.ts
      search.ts
      demand.ts
      follows.ts
      broadcasts.ts
      cloudinary.ts
      location.ts
    
    stores/
      authStore.ts
      locationStore.ts
      searchStore.ts
      chatStore.ts
      wizardStore.ts
    
    hooks/
      useAuth.ts
      useLocation.ts
      useDebounce.ts
      useInfiniteScroll.ts
      useSocket.ts
      useRefreshOnFocus.ts
    
    constants/
      colors.ts
      spacing.ts
      listingOptions.ts
      countries.ts
      socialPlatforms.ts
      phoneCodes.ts
    
    utils/
      formatters.ts
      validators.ts
      storage.ts                    -- react-native-keychain helpers
      permissions.ts
      imageUtils.ts
      notificationHandler.ts
    
    services/
      socket.ts
      firebase.ts                   -- Firebase config init
      analytics.ts
      crashlytics.ts
      deepLinking.ts
      codePush.ts
    
    theme/
      index.ts                      -- NativeWind theme config
      colors.ts
      typography.ts
      spacing.ts
  
  assets/
    images/                         -- Splash, onboarding, empty states
    fonts/
      Inter-Regular.ttf
      Inter-Medium.ttf
      Inter-SemiBold.ttf
      Inter-Bold.ttf
      Inter-Black.ttf
  
  __tests__/
    components/                     -- Component tests
    screens/                        -- Screen tests
    api/                            -- API service tests
    stores/                         -- Store tests
    utils/                          -- Utility tests
  
  e2e/                              -- Detox E2E tests
    auth.test.ts
    search.test.ts
    listing.test.ts
    chat.test.ts
  
  android/                          -- Android native project
  ios/                              -- iOS native project
  
  .env.development                  -- Dev env vars
  .env.production                   -- Prod env vars
  .env.staging                      -- Staging env vars
  .gitignore
  .ruby-version                     -- Ruby version for Fastlane
  babel.config.js
  metro.config.js
  react-native.config.js
  tailwind.config.js
  tsconfig.json
  package.json
  Gemfile                           -- Ruby gems (Fastlane)
  Fastfile                          -- Fastlane config
  Appfile                           -- Fastlane app config
```

---

## 21. Feature Parity Checklist

### 21.1 Public Features

| # | Feature | Web | Mobile |
|---|---------|-----|--------|
| 1 | Homepage with search | Done | Must build |
| 2 | Business search with filters | Done | Must build |
| 3 | Category browsing | Done | Must build |
| 4 | City browsing | Done | Must build |
| 5 | Business detail page | Done | Must build |
| 6 | Offers & Events browsing | Done | Must build |
| 7 | Expert Quote form | Done | Must build |
| 8 | Pricing page | Done | Must build |
| 9 | About / Contact / Legal | Done | Must build |

### 21.2 Auth Features

| # | Feature | Web | Mobile |
|---|---------|-----|--------|
| 10 | Email/Password login | Done | Must build |
| 11 | Google OAuth | Done | Must build (native SDK) |
| 12 | Registration with role | Done | Must build |
| 13 | Email OTP verification | Done | Must build |
| 14 | Forgot password | Done | Must build |
| 15 | Token refresh | Done | Must build |

### 21.3 Dashboard (Vendor)

| # | Feature | Web | Mobile |
|---|---------|-----|--------|
| 16 | Dashboard stats | Done | Must build |
| 17 | Add Listing (20 steps) | Done | Must build |
| 18 | Edit Listing | Done | Must build |
| 19 | Manage Deals | Done | Must build |
| 20 | Manage Events | Done | Must build |
| 21 | View Leads | Done | Must build |
| 22 | Chat/Messaging | Done | Must build |
| 23 | Reviews management | Done | Must build |
| 24 | Following | Done | Must build |
| 25 | Analytics | Done | Must build |
| 26 | Subscription | Done | Must build |
| 27 | Affiliate | Done | Must build |
| 28 | Notifications | Done | Must build |
| 29 | Notes | Done | Must build |
| 30 | Comments | Done | Must build |
| 31 | Demand insights | Done | Must build |
| 32 | Saved businesses | Done | Must build |
| 33 | Delete account | Done | Must build |

### 21.4 Settings

| # | Feature | Web | Mobile |
|---|---------|-----|--------|
| 34 | Personal info | Done | Must build |
| 35 | Business info | Done | Must build |
| 36 | Business hours | Done | Must build |
| 37 | Social media links | Done | Must build |
| 38 | Password change | Done | Must build |
| 39 | Notification settings | Done | Must build |

### 21.5 Admin

| # | Feature | Web | Mobile |
|---|---------|-----|--------|
| 40 | Admin dashboard | Done | Must build |
| 41 | User management | Done | Must build |
| 42 | Business management | Done | Must build |
| 43 | Category management | Done | Must build |
| 44 | City management | Done | Must build |
| 45 | Plan management | Done | Must build |
| 46 | Review moderation | Done | Must build |
| 47 | Analytics | Done | Must build |
| 48 | Demand insights | Done | Must build |
| 49 | Referral management | Done | Must build |
| 50 | System settings | Done | Must build |

---

## 22. Phased Development Plan

### Phase 1: Foundation (Weeks 1-3)

| Task | Details |
|------|---------|
| Project init | `npx react-native init Naampata --template react-native-template-typescript` |
| Install deps | React Navigation, NativeWind, Axios, Zustand, React Query, react-native-keychain |
| Android setup | Gradle config, google-services.json, Firebase, permissions |
| iOS setup | CocoaPods, GoogleService-Info.plist, permissions |
| Design system | Colors, typography, spacing, common components |
| Navigation | Root stack, auth stack, main tabs, dashboard stack |
| Auth screens | Login, register, forgot password, email verify |
| API client | Axios + interceptors + token refresh + Keychain |
| Auth store | Zustand + Keychain |
| Home screen | Hero, search bar, categories, featured businesses |

### Phase 2: Core Features (Weeks 4-6)

| Task | Details |
|------|---------|
| Search | Full search with filters, sort, pagination |
| Business detail | Full profile, images, hours, map, actions |
| Categories | List, detail with business listing |
| Cities | List, detail with business listing |
| Offers/Events | Browse deals, events, offers |
| Saved businesses | Save/unsave with animation |
| Push notifications | FCM setup, notification handling |
| Google Sign-In | Native Google auth integration |

### Phase 3: Dashboard (Weeks 7-9)

| Task | Details |
|------|---------|
| Dashboard home | Stats, profile completion, plan status |
| Add listing wizard | All 20 steps with form validation |
| Edit listing | Pre-filled wizard |
| Leads | List, stats, status management, reply |
| Reviews | View, respond, helpful votes |
| Settings | All sections |
| Following | Follow/unfollow |

### Phase 4: Real-Time (Weeks 10-11)

| Task | Details |
|------|---------|
| Chat | Socket.io, conversations, messages |
| Notifications | Real-time in-app |
| Online status | Heartbeat |

### Phase 5: Monetization (Week 12)

| Task | Details |
|------|---------|
| Subscription | Plans, Stripe checkout (web redirect) |
| Invoices | List, detail |
| Offer plans | Promotion purchase |
| Analytics | Charts, metrics |

### Phase 6: Advanced (Weeks 13-14)

| Task | Details |
|------|---------|
| Affiliate | Stats, referrals, payout |
| Expert Quote | Form |
| Q&A | Ask, answer |
| Broadcasts | Job leads |
| Demand insights | Trends |

### Phase 7: Admin (Weeks 15-16)

| Task | Details |
|------|---------|
| Admin dashboard | Global stats |
| User/Business CRUD | Management screens |
| Category/City | CRUD, bulk import |
| Review moderation | Approve/reject |
| Settings | System config |
| Analytics | Search analytics, heatmap |

### Phase 8: Polish & Launch (Weeks 17-18)

| Task | Details |
|------|---------|
| Animations | All transitions, micro-interactions |
| Skeleton loaders | All list/detail screens |
| Offline support | Cache, offline UI |
| Deep linking | Share links, universal links |
| Performance | FlashList, lazy loading, image caching |
| CodePush | OTA update setup |
| Fastlane CI/CD | Automated builds |
| Testing | Jest, RNTL, Detox E2E |
| App store prep | Screenshots, descriptions |
| Beta testing | Internal testing |
| Submission | App Store + Play Store |

---

## 23. Testing Strategy

### 23.1 Unit Tests (Jest)

- API service functions (mock Axios)
- Zustand store actions
- Utility functions (formatters, validators)
- Custom hooks (renderHook)

### 23.2 Component Tests (React Native Testing Library)

- BusinessCard renders correctly
- StarRating displays correct stars
- FormInput shows validation errors
- FilterChip toggles state

### 23.3 E2E Tests (Detox)

- Registration + email verification
- Login + dashboard navigation
- Search + filter + view business
- Add listing (full 20-step flow)
- Send lead + receive reply
- Chat conversation
- Purchase subscription
- Admin user management

---

## 24. Environment Variables

### Using `react-native-config`

```bash
# .env.development
API_URL=http://10.0.2.2:3001/api/v1
GOOGLE_WEB_CLIENT_ID=726476736350-...apps.googleusercontent.com
GOOGLE_MAPS_API_KEY=AIzaSyDpi-Led6ys2g4-q0lP_EsW6I3WJTm9wqg
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
CLOUDINARY_CLOUD_NAME=dlouu9rac
CLOUDINARY_UPLOAD_PRESET=naampata
STRIPE_PUBLISHABLE_KEY=pk_test_...
CODE_PUSH_DEPLOYMENT_KEY_ANDROID=...
CODE_PUSH_DEPLOYMENT_KEY_IOS=...

# .env.production
API_URL=https://local-business-listing-directory-production.up.railway.app/api/v1
# ... (production keys)
```

### Accessing in Code

```typescript
import Config from 'react-native-config';

const API_URL = Config.API_URL;
```

---

## 25. Build & Deployment

### 25.1 Android Build (Gradle)

```bash
# Debug
cd android && ./gradlew assembleDebug

# Release
cd android && ./gradlew assembleRelease

# Install on device
adb install android/app/build/outputs/apk/release/app-release.apk
```

### 25.2 iOS Build (Xcode)

```bash
cd ios && pod install
xcodebuild -workspace Naampata.xcworkspace -scheme Naampata -configuration Release
```

### 25.3 Fastlane (Automated)

```ruby
# Fastfile
default_platform(:android)

platform :android do
  lane :build_debug do
    gradle(task: "assembleDebug")
  end

  lane :build_release do
    gradle(task: "assembleRelease")
    upload_to_play_store(track: 'internal')
  end
end

platform :ios do
  lane :build_release do
    build_ios_app(scheme: "Naampata")
    upload_to_app_store
  end
end
```

### 25.4 CodePush (OTA Updates)

```bash
# Install App Center CLI
npm install -g appcenter-cli

# Push JS bundle update
appcenter release react-native -a <owner>/<app> -d Production --bundle ./android/app/build/outputs/assets/index.android.bundle
```

### 25.5 CI/CD Pipeline (GitHub Actions)

```yaml
name: Build & Deploy
on:
  push:
    branches: [main]

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: 17
          distribution: temurin
      - run: cd android && ./gradlew assembleRelease
      - uses: actions/upload-artifact@v4
        with:
          name: android-release
          path: android/app/build/outputs/apk/release/

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd ios && pod install
      - run: xcodebuild -workspace ios/Naampata.xcworkspace -scheme Naampata -configuration Release
```

---

**End of SRS Document - v2.0 (React Native Bare + Gradle)**
