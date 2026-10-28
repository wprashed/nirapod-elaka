# NirapodElaka — Production Deployment Guide

This guide details the deployment of **NirapodElaka** to production environments.

---

## 1. Hosting Architecture Overview

```
                      [ Users (Mobile / Web) ]
                                 │
                        [ Cloudflare CDN ]
                                 │
                ┌────────────────┴────────────────┐
                ▼                                 ▼
   [ Next.js 14 App Server ]              [ Cloudflare R2 ]
    (Vercel / Railway / VPS)               (Photo Bucket)
                │
                ▼
   [ PostgreSQL 15+ & PostGIS ]
    (Neon / Supabase / Self-hosted)
```

---

## 2. Managed Deployment Options

### Option A: Vercel + Neon (PostGIS) + Cloudflare R2 (Recommended)

1. **Database (Neon / Supabase):**
   - Provision a PostgreSQL project on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
   - In the database SQL console, enable PostGIS:
     ```sql
     CREATE EXTENSION IF NOT EXISTS postgis;
     CREATE EXTENSION IF NOT EXISTS pg_trgm;
     ```
   - Copy the connection string to `DATABASE_URL`.

2. **Image Storage (Cloudflare R2):**
   - In Cloudflare Dashboard, navigate to **R2 Object Storage**.
   - Create a bucket named `nirapod-elaka-uploads`.
   - Under Settings, enable **Public Development URL** or attach a custom domain (e.g., `media.nirapodelaka.org`).
   - Create an API token with *Object Read & Write* permissions.
   - Note the `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_PUBLIC_URL`.

3. **Deploy to Vercel:**
   - Link the repository on Vercel.
   - Configure the Environment Variables in the Vercel Dashboard:
     - `DATABASE_URL`
     - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
     - `USE_LOCAL_STORAGE=false`
     - `NEXT_PUBLIC_DEMO_MODE=false`
   - Trigger deployment (`vercel --prod`).

---

### Option B: Docker on Linux VPS (Ubuntu / Debian)

1. **Install Docker & Compose:**
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-v2
   ```

2. **Clone & Configure:**
   ```bash
   git clone <repo-url> /opt/nirapod-elaka
   cd /opt/nirapod-elaka
   cp .env.example .env.production
   ```

3. **Start PostgreSQL + PostGIS Container:**
   ```bash
   docker compose -f docker-compose.yml up -d postgres
   ```

4. **Build and Run with PM2 or Docker:**
   ```bash
   npm install --production
   npm run build
   npx pm2 start "npm start" --name "nirapod-elaka"
   ```

5. **Nginx Reverse Proxy & SSL (Certbot):**
   ```nginx
   server {
       server_name nirapodelaka.org;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Forwarded-For $remote_addr;
       }
   }
   ```
   ```bash
   sudo certbot --nginx -d nirapodelaka.org
   ```

---

## 3. Database Initialization & PostGIS Script

Run the PostGIS setup migration against your live database:

```bash
psql $DATABASE_URL -f src/db/migrations/0001_postgis.sql
```

This ensures:
1. `ST_DWithin` spatial indexes are created for sub-second bounding box queries.
2. Trigram indexes (`gin_trgm_ops`) are ready for typo-tolerant duplicate hazard detection.
3. Automated triggers sync `latitude` and `longitude` with the native `geography(Point, 4326)` column.

---

## 4. Production Security Checklist

- [x] Rotate all secret keys (`NEXTAUTH_SECRET`, R2 credentials).
- [x] Confirm rate limits are active in `src/lib/rate-limit.ts`.
- [x] Verify image upload sizes are restricted to 5 MB with Sharp format validation.
- [x] Confirm `NEXT_PUBLIC_DEMO_MODE="false"` in live production environments.
- [x] Ensure the 999 Emergency Service Disclaimer remains prominently visible on all pages.
