# BusinessDetailClient.tsx - Google Business Profile Redesign Plan

## Overview
Major redesign of `apps/web/app/business/[businessSlug]/BusinessDetailClient.tsx` (3188 lines) to match Google Business profile style.

## File Structure Analysis

### Current Structure (Lines 1-3188)
- **Lines 1-65**: Imports
- **Lines 66-157**: Helper components (WhatsAppIcon, VendorOnlineBadge, TrustBadge, BusinessOpenBadge)
- **Lines 154-225**: Component interface + state declarations
- **Lines 227-911**: Effects, handlers, utility computations (isOwner, imagePaths, galleryImages, etc.)
- **Lines 913-3188**: JSX return section (THE PART TO REDESIGN)

### Existing Functionality to Preserve
- All state variables (review, enquiry, lightbox, share, report, Q&A, etc.)
- All handlers (handleLike, handleShare, handleContactIntent, handleEnquirySubmit, handleReviewSubmit, etc.)
- All effects (loadBusiness, loadQA, checkUserStates, pre-fill enquiry)
- All modals (review, enquiry, lightbox, share, report)
- Mobile sticky action bar
- Offers section
- Chat integration (ChatTrigger)

### New Components to Import
```tsx
import PopularTimesChart from '@/components/business/PopularTimesChart';
import ReviewDistribution from '@/components/business/ReviewDistribution';
```

### New State to Add
```tsx
const [categories, setCategories] = useState<any[]>([]);
const [categorySearch, setCategorySearch] = useState('');
```

### New Effect to Add
```tsx
useEffect(() => {
  const loadCategories = async () => {
    try {
      const data = await api.categories.getPopular(20);
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };
  loadCategories();
}, []);
```

---

## New JSX Layout Structure

### DESKTOP (lg+): 3-column layout
```
┌──────────┬─────────────────────────────┬──────────┐
│ Categories│ Hero Photos + Map           │ Business │
│ Sidebar   │                             │ Profile  │
│           │ Business Name + Info        │ Card     │
│ (256px)   │ Action Buttons              │          │
│           │ Tabs + Content              │ Contact  │
│           │                             │ Card     │
└──────────┴─────────────────────────────┴──────────┘
```

### MOBILE: Single column (no categories sidebar)

---

## Detailed JSX Plan

### 1. Outer Container
```tsx
<div className="min-h-screen bg-white">
  <Navbar />
  {/* Pending banner - KEEP AS IS */}
  {/* Breadcrumbs - KEEP AS IS */}
  
  <main className="max-w-[1400px] mx-auto px-4 py-6">
    <div className="flex gap-8">
      
      {/* LEFT: Categories Sidebar (hidden mobile, lg:block) */}
      <CategoriesSidebar />
      
      {/* CENTER: Main Content */}
      <div className="flex-1 min-w-0">
        <HeroSection />
        <BusinessInfoHeader />
        <QuickActionButtons />
        <TabBar />
        <TabContent />
      </div>
      
      {/* RIGHT: Business Profile + Contact (hidden xl:block) */}
      <RightSidebar />
      
    </div>
  </main>
  
  {/* Offers section - KEEP AS IS */}
  {/* Mobile sticky bar - KEEP AS IS */}
  <Footer />
  {/* All modals - KEEP AS IS */}
</div>
```

### 2. Categories Sidebar (NEW - Left Column)
```tsx
<aside className="hidden lg:block w-64 shrink-0">
  <div className="sticky top-28">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-slate-900">Categories</h2>
      <Link href="/search" className="text-sm text-blue-600 hover:text-blue-700">View all</Link>
    </div>
    
    {/* Search input */}
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input placeholder="Search categories..." className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm" />
    </div>
    
    {/* Category list */}
    <div className="space-y-1">
      {filteredCategories.map((cat) => (
        <Link key={cat.id} href={`/search?category=${cat.slug}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
          {/* Colorful circular icon */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getColorForIndex(idx)}`}>
            <DynamicIcon name={cat.icon} className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{cat.name}</p>
            <p className="text-xs text-slate-400">{cat.businessCount?.toLocaleString()} businesses</p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
        </Link>
      ))}
    </div>
  </div>
</aside>
```

### 3. Hero Section (REDESIGNED)
```tsx
{/* Hero: 60/40 split */}
<div className="flex gap-2 rounded-2xl overflow-hidden mb-4" style={{ height: '400px' }}>
  {/* Left ~60%: Large hero image */}
  <div className="flex-[3] relative cursor-pointer group" onClick={() => openLightbox(0)}>
    <img src={galleryImages[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
  
  {/* Right ~40%: Map + smaller photos */}
  <div className="flex-[2] flex flex-col gap-2">
    {/* Map embed at top */}
    <div className="flex-1 rounded-xl overflow-hidden bg-slate-100 relative">
      {mapEmbedUrl ? (
        <iframe src={mapEmbedUrl} className="w-full h-full border-0" />
      ) : (
        <div className="flex items-center justify-center h-full">
          <MapPin className="w-8 h-8 text-slate-300" />
        </div>
      )}
    </div>
    
    {/* 2-3 smaller photos below */}
    <div className="flex gap-2 h-1/3">
      {galleryImages.slice(1, 3).map((img, i) => (
        <div key={i} className="flex-1 rounded-xl overflow-hidden cursor-pointer" onClick={() => openLightbox(i + 1)}>
          <img src={img} className="w-full h-full object-cover hover:scale-105 transition-transform" />
        </div>
      ))}
      {galleryImages.length > 3 && (
        <div className="flex-1 rounded-xl overflow-hidden cursor-pointer bg-slate-900/60 relative" onClick={() => openLightbox(3)}>
          <img src={galleryImages[3]} className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold">+{galleryImages.length - 3} photos</span>
          </div>
        </div>
      )}
    </div>
  </div>
</div>

{/* Thumbnail strip */}
<div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
  {galleryImages.map((img, i) => (
    <button key={i} onClick={() => openLightbox(i)}
      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${i === 0 ? 'border-blue-500' : 'border-transparent hover:border-slate-300'}`}>
      <img src={img} className="w-full h-full object-cover" />
    </button>
  ))}
</div>
```

### 4. Business Info Header (REDESIGNED)
```tsx
{/* Business Name + Verified Badge */}
<div className="flex items-center gap-3 mb-2">
  <h1 className="text-3xl font-bold text-slate-900">{business.title}</h1>
  {business.isVerified && (
    <ShieldCheck className="w-6 h-6 text-blue-500" />
  )}
</div>

{/* Rating + Category */}
<div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
  <span className="font-medium">{business.averageRating}</span>
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} className={`w-4 h-4 ${i <= Math.round(business.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
    ))}
  </div>
  <span>({business.totalReviews})</span>
  <span className="text-slate-300">·</span>
  <span>{business.category?.name}</span>
</div>

{/* Status */}
<div className="flex items-center gap-2 text-sm mb-2">
  <BusinessOpenBadge business={business} />
  {business.address && (
    <span className="text-slate-500">{business.address}, {business.city}</span>
  )}
</div>
```

### 5. Quick Action Buttons (NEW)
```tsx
<div className="flex flex-wrap gap-2 mt-4 mb-8">
  {business.website && (
    <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
      target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
      <Globe className="w-4 h-4" /> Website
    </a>
  )}
  {openInGoogleMapsUrl && (
    <a href={openInGoogleMapsUrl} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
      <Navigation className="w-4 h-4" /> Directions
    </a>
  )}
  {business.phone && (
    <button onClick={() => handleContactIntent('call')}
      className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
      <Phone className="w-4 h-4" /> Call
    </button>
  )}
  <button onClick={handleLike}
    className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-full text-sm font-medium transition-colors ${isFavorite ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} /> Save
  </button>
  <button onClick={handleShare}
    className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
    <Share2 className="w-4 h-4" /> Share
  </button>
</div>
```

### 6. Tab Bar (REDESIGNED - underline style)
```tsx
const tabs = ['Overview', 'Reviews', 'Photos', 'About'];

<div className="border-b border-slate-200 flex gap-8 mb-8 overflow-x-auto scrollbar-hide">
  {tabs.map(tab => (
    <button key={tab} onClick={() => setActiveTab(tab)}
      className={`pb-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
        activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}>
      {tab}
    </button>
  ))}
</div>
```

### 7. Overview Tab Content (REDESIGNED)
Two-column layout:
- LEFT: Business Information card (address, hours, phone, website, categories, price range)
- RIGHT: PopularTimesChart component

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Business Information Card */}
  <div className="bg-white rounded-2xl p-6 border border-slate-100">
    <h3 className="text-lg font-semibold text-slate-900 mb-4">Business Information</h3>
    <div className="space-y-4">
      {/* Address */}
      <div className="flex items-start gap-3">
        <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-slate-900">{business.address}</p>
          <p className="text-sm text-slate-500">{business.city}, {business.state}</p>
        </div>
      </div>
      {/* Hours */}
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-slate-400 mt-0.5" />
        <div>
          <BusinessOpenBadge business={business} />
          {/* Expandable full hours */}
        </div>
      </div>
      {/* Phone */}
      {business.phone && (
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-slate-400" />
          <a href={`tel:${business.phone}`} className="text-sm text-blue-600 hover:underline">{business.phone}</a>
        </div>
      )}
      {/* Website */}
      {business.website && (
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-slate-400" />
          <a href={...} target="_blank" className="text-sm text-blue-600 hover:underline">{business.website}</a>
        </div>
      )}
      {/* Categories as tags */}
      <div className="flex items-center gap-3">
        <Tag className="w-5 h-5 text-slate-400" />
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">{business.category?.name}</span>
        </div>
      </div>
    </div>
  </div>
  
  {/* Popular Times Chart */}
  <PopularTimesChart businessHours={business.businessHours} />
</div>
```

### 8. About Tab (NEW)
```tsx
<div className="space-y-6">
  {/* About Card */}
  <div className="bg-white rounded-2xl p-6 border border-slate-100">
    <h3 className="text-lg font-semibold text-slate-900 mb-4">About</h3>
    <p className="text-slate-600 leading-relaxed">
      {aboutExpanded ? business.description : business.description?.slice(0, 300)}
    </p>
    {business.description?.length > 300 && (
      <button onClick={() => setAboutExpanded(!aboutExpanded)} className="text-blue-600 text-sm font-medium mt-2">
        {aboutExpanded ? 'Show less' : 'Show more'}
      </button>
    )}
  </div>
  
  {/* Highlights Card */}
  {business.businessAmenities?.length > 0 && (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Highlights</h3>
      <div className="grid grid-cols-2 gap-3">
        {business.businessAmenities.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm text-slate-700">{item.amenity?.name}</span>
          </div>
        ))}
      </div>
    </div>
  )}
</div>
```

### 9. Reviews Tab (ENHANCED)
```tsx
<div className="space-y-6">
  {/* Review Distribution */}
  <ReviewDistribution reviews={comments} />
  
  {/* Existing reviews list, sort, write review button */}
  {/* KEEP ALL EXISTING REVIEW FUNCTIONALITY */}
</div>
```

### 10. Photos Tab (NEW)
```tsx
{/* Photo category filter */}
<div className="flex gap-2 mb-6 overflow-x-auto">
  {['All', 'By business', 'Exterior', 'Interior'].map(cat => (
    <button className={`px-4 py-2 rounded-full text-sm font-medium ${selectedPhotoCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
      {cat}
    </button>
  ))}
</div>

{/* Photo grid */}
<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
  {galleryImages.map((img, i) => (
    <div key={i} className="aspect-square rounded-xl overflow-hidden cursor-pointer" onClick={() => openLightbox(i)}>
      <img src={img} className="w-full h-full object-cover hover:scale-105 transition-transform" />
    </div>
  ))}
</div>
```

### 11. Services Tab (NEW)
```tsx
<div className="space-y-4">
  {business.subcategories?.map(sub => (
    <div key={sub.id} className="bg-white rounded-2xl p-5 border border-slate-100">
      <h4 className="font-medium text-slate-900">{sub.name}</h4>
      {sub.description && <p className="text-sm text-slate-500 mt-1">{sub.description}</p>}
    </div>
  ))}
  {!business.subcategories?.length && (
    <p className="text-slate-500 text-center py-12">No services listed</p>
  )}
</div>
```

### 12. Right Sidebar (PRESERVED)
Keep the existing Business Profile card and Contact card, but restructure for Google-style:
- Business Profile card (avatar, name, follow button, status)
- Contact card (call, sms, whatsapp, email, chat, enquiry)
- Social links
- Business hours
- Website link

---

## Implementation Steps

### Step 1: Add New Imports (after line 49)
```tsx
import PopularTimesChart from '@/components/business/PopularTimesChart';
import ReviewDistribution from '@/components/business/ReviewDistribution';
```

### Step 2: Add New State (after line 225)
```tsx
const [categories, setCategories] = useState<any[]>([]);
const [categorySearch, setCategorySearch] = useState('');
const [aboutExpanded, setAboutExpanded] = useState(false);
const [selectedPhotoCategory, setSelectedPhotoCategory] = useState('All');
const [showFullHours, setShowFullHours] = useState(false);
```

### Step 3: Add Categories Loading Effect (after existing effects)
```tsx
useEffect(() => {
  const loadCategories = async () => {
    try {
      const data = await api.categories.getPopular(20);
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };
  loadCategories();
}, []);
```

### Step 4: Replace JSX Return Section (lines 913-3188)
Rewrite the entire JSX return with the new Google Business layout while preserving all existing modals and functionality.

### Step 5: Add Filtered Categories Memo (before JSX)
```tsx
const filteredCategories = useMemo(() => {
  if (!categorySearch) return categories;
  return categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()));
}, [categories, categorySearch]);
```

---

## Color Palette for Category Icons
```tsx
const CATEGORY_COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
  'bg-amber-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-orange-500', 'bg-cyan-500', 'bg-rose-500', 'bg-violet-500',
];
```

## Responsive Breakpoints
- **Mobile (< lg)**: Single column, no sidebar categories
- **lg (1024px+)**: Categories sidebar appears
- **xl (1280px+)**: Right sidebar appears

## Tabs Design
- Overview | Reviews | Photos | About
- Underline-style active indicator (blue)
- Horizontal scrollable on mobile

## Preserved Elements
- Pending approval banner
- Breadcrumbs
- ChatTrigger integration
- All 5 modals (review, enquiry, lightbox, share, report)
- Mobile sticky action bar
- Special offers section
- Follow button
- All existing handlers and state
