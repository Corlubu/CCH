# Deployment Guide

This guide provides step-by-step instructions for deploying the Grace Community Food Bank Management System to production.

## 📋 Pre-Deployment Checklist

- [ ] PostgreSQL database provisioned
- [ ] Twilio account created (optional)
- [ ] Domain names configured (optional)
- [ ] SSL certificates ready (handled by platforms)
- [ ] Environment variables documented
- [ ] Admin password changed from default

## 🗄️ Database Setup

### Option 1: Render PostgreSQL (Recommended for simplicity)

1. **Create PostgreSQL Instance**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "PostgreSQL"
   - Configure:
     - Name: `food-bank-db`
     - Database: `food_bank`
     - User: `food_bank_user`
     - Region: Choose closest to your users
     - Plan: Free tier for testing, paid for production

2. **Note Connection Details**
   - Internal Database URL (for backend)
   - External Database URL (for local access)
   - Save these securely

### Option 2: AWS RDS PostgreSQL

1. **Create RDS Instance**
   - Go to AWS RDS Console
   - Click "Create database"
   - Choose PostgreSQL 13+
   - Configure:
     - DB instance identifier: `food-bank-db`
     - Master username: `postgres`
     - Master password: [secure password]
     - DB instance class: db.t3.micro (or larger)
     - Storage: 20 GB SSD

2. **Configure Security Group**
   - Allow inbound PostgreSQL (port 5432) from:
     - Your backend server IP (Render provides static IPs on paid plans)
     - Your local IP (for management)

3. **Note Connection String**
   ```
   postgresql://username:password@endpoint:5432/database_name
   ```

## 🖥️ Backend Deployment (Render)

### Step 1: Prepare Repository

1. Ensure your code is pushed to GitHub/GitLab/Bitbucket
2. Verify `package.json` has correct scripts:
   ```json
   {
     "scripts": {
       "build": "vinxi build",
       "start": "vinxi start"
     }
   }
   ```

### Step 2: Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your repository
4. Configure:
   - **Name**: `food-bank-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm start`
   - **Plan**: Free tier for testing, paid for production

### Step 3: Configure Environment Variables

Add these environment variables in Render:

```env
# Required
NODE_ENV=production
ADMIN_PASSWORD=[CHANGE THIS - Your secure admin password]
JWT_SECRET=[CHANGE THIS - Minimum 32 characters]
BCRYPT_ROUNDS=10

# Database (from Render PostgreSQL or AWS RDS)
DATABASE_URL=[Your database connection string]

# Optional - Twilio
TWILIO_ACCOUNT_SID=[Your Twilio Account SID]
TWILIO_AUTH_TOKEN=[Your Twilio Auth Token]
TWILIO_PHONE_NUMBER=[Your Twilio Phone Number]

# CORS
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# Logging
LOG_LEVEL=info
```

**Important**: 
- Replace `[CHANGE THIS]` values with secure, unique values
- Never commit these values to Git
- Use Render's "Generate" feature for secrets

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for initial deployment (5-10 minutes)
3. Note your backend URL: `https://food-bank-api.onrender.com`

### Step 5: Verify Backend

```bash
# Test health endpoint
curl https://food-bank-api.onrender.com/trpc/getActiveEvents

# Should return JSON response (empty array initially)
```

## 🌐 Frontend Deployment (Vercel)

### Step 1: Prepare for Deployment

1. Update API URL in your code if needed
2. Ensure build works locally:
   ```bash
   pnpm run build
   ```

### Step 2: Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: (leave empty)
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

### Step 3: Configure Environment Variables

Add in Vercel project settings:

```env
VITE_API_URL=https://food-bank-api.onrender.com
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for deployment (2-5 minutes)
3. Note your frontend URL: `https://your-project.vercel.app`

### Step 5: Update Backend CORS

1. Go back to Render dashboard
2. Update `CORS_ORIGIN` environment variable:
   ```
   CORS_ORIGIN=https://your-project.vercel.app
   ```
3. Save and wait for backend to redeploy

## 🔐 Post-Deployment Security

### 1. Change Default Credentials

```bash
# Login to admin account
# Navigate to: https://your-project.vercel.app/login
# Username: admin
# Password: [your ADMIN_PASSWORD]

# Immediately change the password through the UI (future feature)
# Or update ADMIN_PASSWORD in Render and redeploy
```

### 2. Configure Twilio (if using SMS)

1. Sign up at [Twilio](https://www.twilio.com)
2. Get a phone number
3. Copy credentials:
   - Account SID
   - Auth Token
   - Phone Number
4. Add to Render environment variables
5. Redeploy backend

### 3. Set Up Custom Domain (Optional)

**For Backend (Render)**:
1. Go to Settings → Custom Domain
2. Add your domain (e.g., `api.foodbank.church`)
3. Update DNS records as instructed
4. SSL certificate is automatic

**For Frontend (Vercel)**:
1. Go to Settings → Domains
2. Add your domain (e.g., `foodbank.church`)
3. Update DNS records as instructed
4. SSL certificate is automatic

### 4. Enable Monitoring

**Render**:
- Enable notifications for deployment failures
- Set up uptime monitoring (external service like UptimeRobot)

**Vercel**:
- Enable deployment notifications
- Monitor build times and errors

## 🧪 Post-Deployment Testing

### 1. Test Landing Page
```
✓ Visit https://your-project.vercel.app
✓ Verify images load
✓ Verify "Staff Login" button works
✓ Verify "Register for Food Distribution" button works
```

### 2. Test Admin Login
```
✓ Navigate to /login
✓ Login with admin credentials
✓ Verify redirect to /admin dashboard
✓ Create a test event
✓ Generate QR code
✓ Verify statistics display
```

### 3. Test Citizen Registration
```
✓ Navigate to /register
✓ Select the test event
✓ Fill in registration form
✓ Submit and verify order number
✓ Check if SMS was sent (if Twilio configured)
```

### 4. Test Staff Functions
```
✓ Create a staff user (future feature) or use admin
✓ Login and navigate to /staff
✓ Register a walk-in citizen
✓ Search for registrations
✓ Verify event capacity updates
```

## 📊 Database Migrations

The application uses Prisma with `db push` for automatic migrations.

**Initial Setup**:
```bash
# Prisma will automatically create tables on first run
# This happens during the first backend deployment
```

**Schema Changes**:
1. Update `prisma/schema.prisma`
2. Commit and push changes
3. Render will automatically run `prisma db push` during build

## 🔄 Continuous Deployment

### Automatic Deployments

**Backend (Render)**:
- Automatically deploys on push to `main` branch
- Build logs available in Render dashboard
- Rollback available if deployment fails

**Frontend (Vercel)**:
- Automatically deploys on push to `main` branch
- Preview deployments for pull requests
- Instant rollback to previous deployments

### Manual Deployments

**Backend**:
```bash
# Trigger manual deploy in Render dashboard
# Or push an empty commit
git commit --allow-empty -m "Trigger deploy"
git push origin main
```

**Frontend**:
```bash
# Trigger manual deploy in Vercel dashboard
# Or use Vercel CLI
vercel --prod
```

## 🚨 Troubleshooting

### Backend Issues

**Database Connection Errors**:
```bash
# Verify DATABASE_URL is correct
# Check database is running (Render dashboard)
# Verify IP whitelist (if using AWS RDS)
```

**Build Failures**:
```bash
# Check build logs in Render
# Verify all dependencies in package.json
# Test build locally: pnpm run build
```

**Runtime Errors**:
```bash
# Check application logs in Render
# Verify all environment variables are set
# Check for missing required variables
```

### Frontend Issues

**Build Failures**:
```bash
# Check build logs in Vercel
# Verify VITE_API_URL is set correctly
# Test build locally: pnpm run build
```

**API Connection Errors**:
```bash
# Verify CORS_ORIGIN in backend matches frontend URL
# Check backend is running and accessible
# Test API directly: curl https://your-backend.onrender.com/trpc/getActiveEvents
```

## 📈 Scaling Considerations

### When to Scale

- **Backend**: 
  - Response times > 2 seconds
  - CPU usage consistently > 80%
  - Memory usage approaching limits

- **Database**:
  - Query times > 500ms
  - Connection pool exhausted
  - Storage > 80% capacity

### Scaling Options

**Render**:
- Upgrade to paid plan for:
  - More CPU/RAM
  - Faster builds
  - Custom domains
  - Static IPs

**Database**:
- Increase storage
- Upgrade instance type
- Enable read replicas
- Implement connection pooling

## 🔒 Security Checklist

- [ ] Admin password changed from default
- [ ] JWT secret is unique and secure (32+ characters)
- [ ] Database credentials are secure
- [ ] CORS is properly configured
- [ ] HTTPS is enabled (automatic on Render/Vercel)
- [ ] Twilio credentials are secure (if used)
- [ ] No secrets in Git repository
- [ ] Environment variables documented
- [ ] Backup strategy in place
- [ ] Monitoring enabled

## 📞 Support

If you encounter issues during deployment:

1. Check the troubleshooting section
2. Review platform documentation:
   - [Render Docs](https://render.com/docs)
   - [Vercel Docs](https://vercel.com/docs)
3. Check application logs
4. Contact support: admin@foodbank.church

---

**Deployment Complete! 🎉**

Your food bank management system is now live and ready to serve your community.
