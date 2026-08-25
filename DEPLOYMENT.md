# Deployment Guide

## Prerequisites

1. **Neon PostgreSQL** - Your database is already set up
2. **Vercel Account** - For frontend deployment
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

### Frontend (Vercel)

```bash
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
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

### 3. Frontend Deployment (Vercel)

1. Push to GitHub
2. Import repo to Vercel
3. Set root directory to `apps/frontend`
4. Set `NEXT_PUBLIC_API_URL` environment variable
5. Deploy

---

## Post-Deployment

1. Update `CORS_ORIGIN` in backend to match frontend URL
2. Test API endpoints
3. Verify image uploads work
4. Test authentication flow

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