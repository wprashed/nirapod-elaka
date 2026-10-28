# নিরাপদ এলাকা (NirapodElaka)

**A Mobile-First Community Hazard & Disruption Reporting Platform for Bangladesh**

[![CI](https://github.com/wprashed/nirapod-elaka/actions/workflows/ci.yml/badge.svg)](https://github.com/wprashed/nirapod-elaka/actions)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fwprashed%2Fnirapod-elaka)

NirapodElaka is an open, civic-tech web application that empowers residents across Bangladesh—starting with Dhaka neighborhoods—to report, discover, and verify localized hazards and disruptions in real time.

> **Important Public Notice:** NirapodElaka is an independent civic utility tool. It is **not** an official government agency, civil defense unit, or emergency dispatch service. For life-threatening emergencies, medical distress, fire, or police assistance in Bangladesh, immediately call **999** (National Emergency Helpline).

---

## 1. Quick Testing Credentials (Pre-Seeded)

The platform includes 3 pre-seeded role accounts for immediate testing:

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **Root Civic Admin** | `admin@nirapod.local` | `Admin@123456` | Full administrative dashboard (`/admin`), user management, role elevation, suspension, audit trail |
| **City Moderator** | `moderator@nirapod.local` | `Mod@123456` | Moderation desk (`/moderation`), queue review, hazard confirmation, status resolution |
| **Verified Commuter** | `user@nirapod.local` | `User@123456` | Hazard reporting, verification, personal dashboard (`/dashboard`) |

---

## 2. Civic Gamification & Reputation Engine

NirapodElaka features a constructive, safety-first gamification model designed to incentivize accurate contributions:

- **Progression Tiers:**
  - **Level 1 — Neighborhood Neighbor (পাড়া প্রতিবেশী):** 0–49 pts
  - **Level 2 — Dhaka Scout (ঢাকা স্কাউট):** 50–149 pts
  - **Level 3 — Civic Guardian (নাগরিক অভিভাবক):** 150–349 pts
  - **Level 4 — City Sentinel (নগর প্রহরী):** 350–699 pts
  - **Level 5 — Urban Champion (শহর রক্ষক):** 700+ pts

- **Points System:**
  - `+25 pts`: Submitting a verified hazard report
  - `+10 pts`: Bonus for attaching photo evidence
  - `+10 pts`: On-the-ground hazard confirmation
  - `+15 pts`: Submitting a condition or resolution update

- **Civic Badges:**
  - 🌱 **First Alert (প্রথম সঙ্কেত):** First verified hazard report
  - 💧 **Flood Scout (জলপ্রহরী):** Reporting or verifying monsoon waterlogging
  - 🚧 **Route Guardian (পথের দিশারী):** Reporting blocked streets, fallen trees, or traffic jams
  - 🔍 **Truth Sentinel (সত্যায়ন প্রহরী):** 3+ confirmations keeping reports accurate
  - ⚡ **Live Reporter (তাজা খবর):** On-the-ground condition updates
  - 🏆 **Dhaka Hero (ঢাকা হিরো):** Reaching 150+ civic points protecting neighbors

---

## 3. Security & Authentication Architecture

1. **Cryptographic Password Hashing:**
   - Powered by **PBKDF2** using `SHA-512` over **100,000 iterations** with a unique 16-byte cryptographic salt per citizen.
   - Guaranteed immunity against rainbow tables and offline dictionary attacks.

2. **Tamper-Proof HMAC-SHA256 Session Tokens:**
   - Signed session tokens containing encrypted user claims and 7-day expiration.
   - Stored in **HTTP-only, SameSite=Lax, Secure** cookies (`nirapod_session`), preventing client-side XSS cookie theft.
   - Timing-safe signature verification (`crypto.timingSafeEqual`) prevents timing attack exploits.

3. **Role-Based Access Control (RBAC):**
   - Strictly enforced **server-side** via `requireAdmin()`, `requireModerator()`, and `requireAuth()`.
   - Admin routes (`/api/v1/admin/*`, `/admin`) verify live database/store role and active status on every request.

4. **Anti-Abuse & Brute Force Protection:**
   - In-memory sliding window rate limits:
     - Login attempts: max 8 attempts / 10 minutes per IP.
     - Account registrations: max 10 / hour per IP.
     - Anonymous hazard submissions: max 5 / hour per IP.

5. **Salted IP Fingerprinting:**
   - Raw IP addresses are **never** persisted. Hashes rotate daily (`SHA256(IP + Date + Salt)`), preventing cross-day citizen tracking.

6. **Input Sanitization & XSS Guards:**
   - All text inputs (titles, descriptions, community updates, user names) pass through HTML entity stripping and script filtering.

---

## 4. Dedicated Admin Dashboard (`/admin`)

The protected **Admin Desk** provides:

- **System Telemetry & KPI Cards:**
  - Registered citizens count, active vs. suspended accounts, moderators count.
  - Total hazard reports, active disruptions, resolved conditions, community confirms, and dispute tallies.
  - Live system runtime telemetry (memory usage, Node version, environment status).

- **User Governance Tab:**
  - Search registered citizens by name or email.
  - Interactive role elevation (`user` ↔ `moderator` ↔ `admin`) requiring a **mandatory written audit rationale**.
  - Account suspension & reactivation with recorded reasons.
  - Real-time submission and verification statistics per citizen.

- **Security & Administrative Audit Trail Tab:**
  - Immutable record of every administrative action with action filtering and search.

- **System Policies Tab:**
  - Direct overview of rate limits, salted IP policies, and encryption standards.

---

## 5. Key Application Features

1. **Interactive Community Map (`/`):**
   - High-contrast OpenStreetMap integration using Leaflet with custom SVG/DivIcon markers for all 9 hazard categories.
   - Quick-jump neighborhood chips for Dhaka (*Dhanmondi*, *Mirpur*, *Gulshan*, *Uttara*, *Farmgate*, *Malibagh*, *Old Dhaka*).

2. **Citizen Hazard Reporting (`/report/new`):**
   - Requires citizen authentication to prevent spam and build trust.
   - Single-click interactive map pin dropping + browser GPS locator with timeout fallback.
   - Automatic OpenStreetMap Nominatim reverse geocoding on pin drop.
   - **Live duplicate hazard warning:** alerts when an existing disruption exists within 1 km.
   - Client-side canvas compression and magic-byte image validation.

3. **Report Details & Verification (`/report/[id]`):**
   - Relative + absolute Bangladesh Standard Time (BST).
   - "May be outdated" banner for unconfirmed hazards (>24 hours).
   - Ground actions: *"Still happening"* (Confirm), *"Resolved"*, and *"Information is incorrect"* (Dispute).
   - Structured updates thread with live points rewards.

4. **Civic Moderation Desk (`/moderation`):**
   - Multi-select bulk actions (Bulk Approve, Resolve, Archive).
   - Interactive abuse report triage (Dismiss, Takedown).

---

## 6. Running the Application & Tests

```bash
cd /Users/rashed/Projects/nirapod-elaka

# Run test suite (25 unit & integration tests)
npm test

# Run Next.js production build
npm run build

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.
