# SMTP (OTP emails) & 4000+ Categories — Setup Guide

Yeh guide batati hai **kya chahiye**, **kahan se milega**, aur **kaise lagana hai**.

---

## Part 1: SMTP — verification / OTP emails

### Kya matlab hai?

Backend jab user register karta hai ya OTP bhejta hai, woh **real email** bhejne ke liye SMTP server use karta hai (jaise Gmail, SendGrid, Mailgun).

Bina in values ke code chal sakta hai lekin **email inbox mein nahi jayegi** — sirf console warning aayegi.

### Kahan set karni hain?

**File:** `backend/.env` (agar nahi hai to `backend/.env.example` copy karke `.env` banao)

**Production (Railway / VPS):** wahi variables project **Environment Variables** panel mein add karo.

### Variables (copy-paste template)

```env
# --- Email / OTP ---
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password-here
MAIL_FROM_ADDRESS=no-reply@yourdomain.com
MAIL_FROM_NAME=NAAMPATA

# Optional: admin alerts
ADMIN_EMAIL=admin@yourdomain.com
```

### Option A — Gmail (testing / chhota volume)

1. Google account → [App Passwords](https://myaccount.google.com/apppasswords) (2FA ON hona chahiye).
2. "Mail" ke liye 16-character password generate karo.
3. `MAIL_USERNAME` = Gmail address  
4. `MAIL_PASSWORD` = woh 16-char app password (normal Gmail password **nahi**).

### Option B — SendGrid / Mailgun / Brevo (production recommended)

| Provider | MAIL_HOST example | Notes |
|----------|-------------------|--------|
| SendGrid | `smtp.sendgrid.net` | API key ko SMTP password ki tarah use karte hain |
| Brevo | `smtp-relay.brevo.com` | Dashboard → SMTP & API |
| Mailgun | `smtp.mailgun.org` | Domain verify karna parta hai |

Provider dashboard se **SMTP username + password** copy karke `.env` mein daalo.

### Test kaise karein?

**Quick test (bina backend chalaye):**
```powershell
cd backend
node scripts/send-test-email-only.js
```
Optional: `$env:TEST_EMAIL="your@email.com"`

1. Backend restart: `cd backend` → `npm run start:dev`
2. Register naya user ya **Resend OTP** on `/verify-email`
3. Logs mein `SMTP mailer configuration is incomplete` **nahi** aana chahiye
4. Inbox (aur spam folder) check karo

**Code location:** `backend/src/modules/auth/mail.service.ts`

---

## Part 2: 4000+ Google Business categories

### Kya matlab hai?

Ab repo mein `categories-list.json` mein **~221** categories hain (Google Places seed). Client doc ke mutabiq **4000+** chahiye — yeh **alag file ya Google API** se aati hain; code khud generate nahi kar sakta bina source ke.

### Do tareeqe (ek choose karo)

---

### Method 0 — Automatic (no client file) — **recommended**

Repo script public GitHub Gist se **~3968** Google Business category names download karta hai:

```powershell
cd "C:\Users\Ahmed Bilal Khan\Desktop\business-directory"
node backend/scripts/download-gmb-categories-from-gist.js
```

Yeh `tmp/gmb-categories.txt` aur `categories-list.json` dono update karta hai. Phir admin se DB import karo (neeche).

> Source: community-maintained list (not Google official API). Google API sync ke liye Method 2 use karo.

---

### Method 1 — Text file (sab se aasaan agar client ke paas export ho)

**Chahiye:** Ek plain text file jisme **har line par ek category name** ho.

**Kahan rakho:**

```
business-directory/
  tmp/
    gmb-categories.txt    ← yahan paste / upload
```

**Example `gmb-categories.txt`:**

```text
Plumber
Electrician
Restaurant
Hair Salon
...
```

**Steps:**

1. Client se Google Business categories ki list mang lo (Excel/CSV ho to sirf **name column** copy karke line-by-line `.txt` banao).
2. File save karo: `tmp/gmb-categories.txt`
3. Repo root se script chalao:

```powershell
cd "C:\Users\Ahmed Bilal Khan\Desktop\business-directory"
node backend/scripts/build-google-categories-list.js
```

4. Output: `categories-list.json` update ho jayega (root par).
5. Database mein import (admin login chahiye):

```http
POST /api/v1/categories/admin/bulk-import-file
Authorization: Bearer <ADMIN_JWT>
```

Ya admin panel se agar bulk import UI wired ho.

**Review pehle dekhna ho:**

```http
GET /api/v1/categories/review-export
```

**Ziyada detail:** `data/GOOGLE_CATEGORIES_README.md`

---

### Method 2 — Google Business Profile API (automatic sync)

**Chahiye:** Google Cloud project + **OAuth access token** with Business Profile permissions.

**Env (backend `.env`):**

```env
GOOGLE_BUSINESS_ACCESS_TOKEN=ya29.xxxxx...
```

Token kaise milega (high level):

1. [Google Cloud Console](https://console.cloud.google.com/) → project banao
2. Enable **Google Business Profile API** (ya relevant Business APIs)
3. OAuth consent + credentials
4. Authorized user se token generate (developer tools / OAuth playground — Google docs follow karo)
5. Token `.env` mein daalo (expire hota hai — production mein refresh flow chahiye)

**Sync call:**

```http
POST /api/v1/categories/admin/sync-google-business-profile
Authorization: Bearer <ADMIN_JWT>
Content-Type: application/json

{ "writeReviewFile": true }
```

Yeh categories fetch karke DB + optional review file update karega.

---

### Method 1 vs 2 — kaunsa?

| | Method 1 (txt file) | Method 2 (Google API) |
|--|---------------------|------------------------|
| Setup | Easy | Hard (OAuth) |
| Cost | Free | Google quota / approval |
| Best for | Client already has export | Long-term auto-updates |

**Agar abhi file nahi hai:** Method 1 ke liye client se list mangwao; tab tak 221 categories production mein chal sakti hain.

---

## Part 3: Google Places (address autocomplete)

Registration / add-listing street search backend se chalti hai (Maps JS nahi).

```env
GOOGLE_MAPS_API_KEY=your_google_cloud_key
```

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs: **Places API**, **Geocoding API** enable.
2. Key restrict karo (HTTP referrer for web optional; server key for backend).
3. Backend restart — test: business-setup Step 8 par 3+ chars type karo.

Bina key ke manual address + OSM draggable map kaam karega.

---

## Part 4: Subscription plan flags (broadcast respond)

Production DB mein paid plan par `canRespondBroadcast: true` hona chahiye.

Dev/local:

```env
SEED_DATABASE=true
```

Backend start → seeder Free/Paid plans update karega (`canRespondBroadcast` included).

---

## Quick checklist

| Task | Done? |
|------|--------|
| `backend/.env` mein `MAIL_USERNAME` + `MAIL_PASSWORD` | ☐ |
| `GOOGLE_MAPS_API_KEY` (Places autocomplete) | ☐ |
| Backend restart + test register OTP | ☐ |
| `SEED_DATABASE=true` once (plans + `canRespondBroadcast`) | ☐ |
| `tmp/gmb-categories.txt` client se li | ☐ |
| `node backend/scripts/build-google-categories-list.js` | ☐ |
| Admin bulk import categories | ☐ |

---

## Related docs in repo

- `data/GOOGLE_CATEGORIES_README.md` — categories workflow
- `docs/DOC1_LOCATION_MAP_STATUS.md` — location/map spec status
- `backend/scripts/build-google-categories-list.js` — build script source
