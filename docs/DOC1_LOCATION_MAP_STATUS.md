# NAAMPATA - Doc1 (Location & Map) Implementation Status

Last Updated: 2026-05-25

## 1) Quick Reference - What to Use

- Web business profile map -> Google Maps Embed API: **DONE**
- Mobile map -> Google Maps SDK: **LIVE-ENV VERIFY** (mobile module verification required)
- User location -> Device GPS only: **DONE (web flow aligned)**
- Address input -> Manual address + country/state/city + coordinates: **DONE**
- Address to coordinates -> backend queue flow: **DONE**
- Combined search -> Elasticsearch + PostGIS: **DONE (code path enforced)**
- Navigation -> Open in Google Maps external link: **DONE**
- Mobile fallback -> OSM static tile fallback: **LIVE-ENV VERIFY** (Flutter/mobile scope)

## 2) Banned APIs - Never Use

- Maps JavaScript Dynamic Map usage in add-listing flow: **REMOVED / DONE**
- Nearby Search API usage: **NOT FOUND (DONE)**
- Place Details API usage: **NOT FOUND (DONE)**
- Distance Matrix API usage: **NOT FOUND (DONE)**
- Directions API usage: **NOT FOUND (DONE)**
- Geolocation API usage: **NOT FOUND (DONE)**

## 3) Rules

### 3.1 Maps Display
- Web uses Embed API on profile pages: **DONE**
- No forced auto map load on add-listing dynamic map: **DONE**
- `business-setup` Google dynamic map canvas + marker flow: **REMOVED / DONE**
- `add-listing` Google Places autocomplete flow: **REMOVED / DONE**
- `admin/cities` Google autocomplete import flow: **REMOVED / DONE**
- `admin/heatmap` Google visualization heatmap dependency: **REMOVED / DONE**
- Mobile OSM fallback checklist: **LIVE-ENV VERIFY**

### 3.2 User Location
- GPS-based detect with fallback behavior present: **DONE**
- `business-setup` uses GPS-only detect (no IP fallback): **DONE**
- Do not request on app launch + do not persist beyond session: **LIVE-ENV VERIFY** (runtime policy check)

### 3.3 Address Input (Registration Only)
- Trigger after 3+ characters: **DONE**
- 300ms debounce: **DONE**
- Session token usage: **DONE**
- Store limited normalized fields only: **PARTIAL** (needs final persistence audit table-by-table)

### 3.4 Geocoding Queue
- Frontend geocoding avoided; backend queue flow used: **DONE**
- Deduplicate before external geocode call: **DONE**
- Retry up to 3 + admin alert on final fail: **DONE**
- Worker concurrency max 10 + 100ms interval: **DONE**
- Exact BullMQ package adoption: **PARTIAL** (current queue behavior implemented; BullMQ parity can be swapped if required)

### 3.5 Search & Nearby (Elasticsearch + PostGIS)
- ES relevance + DB geo filter enforced together: **DONE**
- Status=active/approved filtering in search path: **DONE**
- PostGIS `ST_DWithin` geography radius filter: **DONE**
- Pass ES IDs into geo stage (no full-table geo scan): **DONE**
- Radius options 1/5/10/25/50 km: **DONE**
- ES deep pagination `search_after`: **DONE** (token-based path implemented)

### 3.6 Redis Cache (Search Results)
- Key format `search:{city}:{category}:{radius}:{query_hash}`: **DONE**
- Search TTL 15 minutes: **DONE**
- Invalidation on create/update/delete + status/category related admin actions: **DONE**
- SCAN+DEL requirement and no KEYS production usage: **DONE (index-based invalidation path)**
- Cache warming off-peak top combos: **DONE**

### 3.7 Navigation
- Open in Google Maps button/link behavior: **DONE**
- No in-app routes/directions usage: **DONE**

### 3.8 Duplicate Business Detection
- 2+ signal rule with soft/confirm style behavior: **DONE**
- Name/address fuzzy match and phone normalization path: **DONE**
- E.164 normalization path: **DONE**

### 3.9 Provider Abstraction Layer
- `GeocoderService`, `PlacesService`, `MapProviderService`, `SearchLocationService`: **DONE**

### 3.10 Cost Controls
- Hard daily quota limits in Google Cloud Console: **LIVE-ENV VERIFY**
- Billing alerts 50%/90%: **LIVE-ENV VERIFY**

### 3.11 OSM Fair-Use (Mobile fallback only)
- 24h tile cache + attribution + migration trigger process: **LIVE-ENV VERIFY** (mobile scope)

## 4) Remaining Items (Doc1-Specific)

1. Mobile/Flutter-only OSM fallback runtime checks and attribution screen verification.
2. Cloud console quota/alert checks in production project.
3. Optional: replace in-process queue with strict BullMQ implementation if client requires literal BullMQ package parity.
4. Mobile/Flutter OSM fallback live-app verification (external scope if mobile repo separate).

## Final Summary

- Backend/Web Doc1 implementation status: **Substantially Completed**
- Production/live-environment items: **Pending Verification**
- Risk level for Doc1 backend/web release: **Low**, with noted live-env checks above.
