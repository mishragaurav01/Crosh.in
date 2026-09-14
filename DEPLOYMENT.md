# Deployment Guide

## Prerequisites

1. **Neon PostgreSQL** - Your database is already set up
2. **Netlify Account** - For frontend deployment
3. **Railway/Render Account** - For backend deployment

---

## Environment Variables

### Backend (Railway/Render)

Set these in your hosting dashboard:

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:xxx@ep-xxx.neon.tech/neondb?sslmode=require

# CORS - Your frontend URL
CORS_ORIGIN=https://your-frontend.vercel.app

# S3 Storage (Supabase)
S3_ENDPOINT=https://xxx.supabase.co/storage/v1/s3
S3_REGION=ap-southeast-2
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
S3_BUCKET=crosh-dev
S3_PUBLIC_BASE_URL=https://xxx.supabase.co/storage/v1/object/public/crosh-dev

# Email (Resend)
RESEND_API_KEY=re_xxx
EMAIL_FROM=Crosh <onboarding@resend.dev>
```

### Frontend (Netlify)

```bash
NEXT_PUBLIC_API_URL=https://crosh-in.onrender.com
```

---

## Deployment Steps

### 1. Database Migration

```bash
cd packages/db
bunx prisma migrate deploy
```

### 2. Backend Deployment

**Option A: Railway**
1. Push to GitHub
2. Connect repo to Railway
3. Set environment variables
4. Deploy

**Option B: Render**
1. Push to GitHub
2. Connect repo to Render
3. Use the provided `render.yaml`
4. Set environment variables

### 3. Frontend Deployment (Netlify)

1. Push to GitHub
2. Import repo to Netlify
3. Set base directory to `apps/frontend` (framework preset: Next.js, using
   `@netlify/plugin-nextjs`)
4. Set `NEXT_PUBLIC_API_URL` environment variable
5. Deploy

> Next.js 16 deploys to Netlify via the Next runtime adapter. Do NOT use
> `output: "standalone"` — the `.next` output convention differs on Netlify
> (see commit `8fc4702`).

---

## Post-Deployment

1. Update `CORS_ORIGIN` in backend to match frontend URL
2. Test API endpoints
3. Verify image uploads work
4. Test authentication flow

---

## Keep-Alive (Render Backend)

Render's free tier spins the service down after ~15 minutes of inactivity,
causing a cold start on the next request. We keep it awake with an external
cron scheduler hitting the health endpoint — **not** GitHub Actions (its
`scheduled` runs are best-effort and unreliable at sub-hour cadences).

**Setup (cron-job.org):**

1. Create a free account at https://cron-job.org
2. Create a new cron job:
   - **URL:** `https://crosh-in.onrender.com/health` (GET; see
     `apps/backend/index.ts` for the endpoint)
   - **Schedule:** every 10 minutes
   - **Notifications:** enable failure email (and recovery) to be alerted on
     outage
3. Run a test execution and confirm the execution history fills every ~10 min.
4. Verify in the Render dashboard that the service stops spinning down.

**Health endpoint**: `GET /health` at `apps/backend/index.ts`. Keep it
dependency-free (no DB/auth) so it represents the process being up, cheaply.

---

## Troubleshooting

### CORS Errors
- Ensure `CORS_ORIGIN` matches your frontend URL exactly
- Include protocol (`https://`)

### Database Connection
- Verify `DATABASE_URL` is correct
- Check Neon dashboard for connection limits

### Image Uploads
- Verify S3 credentials are correct
- Check bucket permissions