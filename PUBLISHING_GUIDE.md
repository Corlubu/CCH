# Publishing Guide

This guide provides clear, step-by-step instructions for running your Food Bank Management System in two scenarios:
1. **Localhost** (Development/Testing)
2. **The Web** (Production Deployment)

---

## 📍 Part 1: Publishing to Localhost (Development)

Running on localhost is perfect for development, testing, and demonstrations.

### Prerequisites

Before you begin, ensure you have:
- ✅ **Node.js 18+** installed
- ✅ **pnpm** package manager installed (`npm install -g pnpm`)
- ✅ **Docker Desktop** installed and running
- ✅ **Git** installed (to clone the repository)

**Windows Users**: You'll need WSL2 (Windows Subsystem for Linux). See the [Windows Setup section in README.md](README.md#-windows-setup) for installation instructions.

### Step 1: Clone and Install

```bash
# Clone the repository (if you haven't already)
git clone <your-repository-url>
cd food-bank-system

# Install dependencies
pnpm install
```

### Step 2: Configure Environment Variables

The `.env` file should already exist in your project root. Verify it contains:

```env
# Application
NODE_ENV=development

# Authentication (IMPORTANT: Change these for security)
ADMIN_PASSWORD=your_secure_password_here
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_chars_here
BCRYPT_ROUNDS=10

# Twilio (Optional - leave as-is if you don't need SMS)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

**Important**: 
- Change `ADMIN_PASSWORD` to a secure password you'll use to log in
- Change `JWT_SECRET` to a random string (32+ characters)
- Twilio settings are optional - the app works without SMS

### Step 3: Start the Application

```bash
# Start all services (database, app, etc.) with Docker
./scripts/run
```

This single command will:
- ✅ Start PostgreSQL database
- ✅ Start Redis cache
- ✅ Start MinIO object storage
- ✅ Apply database schema
- ✅ Seed initial admin user
- ✅ Start the application server
- ✅ Start Nginx reverse proxy

**Wait 30-60 seconds** for all services to initialize.

### Step 4: Access the Application

Once running, you can access:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Main Application** | http://localhost:8000 | N/A |
| **Login Page** | http://localhost:8000/login | Username: `admin`<br>Password: (your `ADMIN_PASSWORD`) |
| **Database Admin** | http://localhost:8000/codapt/db/ | Username: `admin`<br>Password: (your `ADMIN_PASSWORD`) |

### Step 5: Test the Application

1. **Visit** http://localhost:8000
2. **Click** "Staff Login" → Login with admin credentials
3. **Create** a test event in the admin dashboard
4. **Generate** a QR code for the event
5. **Test** citizen registration by clicking "Register for Food Distribution"

### Stopping the Application

```bash
# Stop all services
./scripts/stop

# Or manually stop Docker containers
docker compose -f docker/compose.yaml down
```

### Troubleshooting Localhost

**Port Already in Use**:
```bash
# Check what's using port 8000
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process or change LISTEN_IP in .env
```

**Database Connection Errors**:
```bash
# Restart Docker containers
docker compose -f docker/compose.yaml down
docker compose -f docker/compose.yaml up -d
```

**Permission Errors (Linux/Mac)**:
```bash
# Make scripts executable
chmod +x scripts/run scripts/stop
```

---

## 🌐 Part 2: Publishing to the Web (Production)

Publishing to the web makes your application accessible to anyone with internet access. We use **Render** for the backend and **Vercel** for the frontend.

### Prerequisites

Before deploying to production:
- ✅ Code pushed to **GitHub** (or GitLab/Bitbucket)
- ✅ **Render account** created (https://render.com)
- ✅ **Vercel account** created (https://vercel.com)
- ✅ **Secure passwords** generated for production

### Overview

```
┌─────────────────────────────────────────────────────┐
│                    YOUR USERS                       │
│              (Access via Web Browser)               │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│  VERCEL         │    │  RENDER          │
│  (Frontend)     │◄───┤  (Backend + DB)  │
│  - React UI     │    │  - API Server    │
│  - Static Files │    │  - PostgreSQL    │
└─────────────────┘    └──────────────────┘
```

### Part A: Deploy the Backend (Render)

#### Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `food-bank-db`
   - **Database**: `food_bank`
   - **Region**: Choose closest to your users
   - **Plan**: Free (for testing) or Starter (for production)
4. Click **"Create Database"**
5. **Copy** the "Internal Database URL" (starts with `postgresql://`)

#### Step 2: Create Web Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. **Connect** your GitHub repository
3. Configure:
   - **Name**: `food-bank-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm start`
4. Click **"Create Web Service"** (don't deploy yet)

#### Step 3: Configure Backend Environment Variables

In your Render web service settings, add these environment variables:

```env
# CRITICAL - Must be changed from defaults!
NODE_ENV=production
ADMIN_PASSWORD=<generate-secure-password>
JWT_SECRET=<generate-32-char-random-string>

# Database (from Step 1)
DATABASE_URL=<your-internal-database-url>

# CORS (will update after frontend deployment)
CORS_ORIGIN=https://your-app.vercel.app

# Optional
BCRYPT_ROUNDS=10
LOG_LEVEL=info
```

**Security Note**: 
- Use a password manager to generate `ADMIN_PASSWORD`
- Generate `JWT_SECRET`: `openssl rand -base64 32`
- Never use the development values in production!

#### Step 4: Deploy Backend

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Wait 5-10 minutes for deployment
3. **Copy** your backend URL: `https://food-bank-api.onrender.com`

### Part B: Deploy the Frontend (Vercel)

#### Step 1: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. **Import** your Git repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: (leave empty)
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

#### Step 2: Configure Frontend Environment Variables

In Vercel project settings, add:

```env
VITE_API_URL=https://food-bank-api.onrender.com
```

Use the backend URL from Part A, Step 4.

#### Step 3: Deploy Frontend

1. Click **"Deploy"**
2. Wait 2-5 minutes for deployment
3. **Copy** your frontend URL: `https://your-project.vercel.app`

### Part C: Connect Frontend and Backend

#### Update Backend CORS

1. Go back to **Render Dashboard** → Your backend service
2. Update the `CORS_ORIGIN` environment variable:
   ```
   CORS_ORIGIN=https://your-project.vercel.app
   ```
3. The service will automatically redeploy

### Part D: Post-Deployment Security

#### 1. Test the Application

Visit your Vercel URL: `https://your-project.vercel.app`
- ✅ Homepage loads
- ✅ Can navigate to login page
- ✅ Can log in with admin credentials

#### 2. Change Admin Password

**Option A**: Through the application (recommended)
1. Log in as admin
2. Go to Profile/Settings
3. Change password

**Option B**: Update environment variable
1. Go to Render → Environment Variables
2. Change `ADMIN_PASSWORD` to a new secure password
3. Service will redeploy
4. Log in with new password

#### 3. Verify Environment Variables

Ensure these are set correctly:

**Backend (Render)**:
- ✅ `ADMIN_PASSWORD` - Changed from default
- ✅ `JWT_SECRET` - Unique 32+ character string
- ✅ `DATABASE_URL` - Correct connection string
- ✅ `CORS_ORIGIN` - Matches Vercel URL
- ✅ `NODE_ENV` - Set to `production`

**Frontend (Vercel)**:
- ✅ `VITE_API_URL` - Matches Render backend URL

### Part E: Optional Enhancements

#### Custom Domain (Optional)

**For Frontend (Vercel)**:
1. Go to Vercel → Settings → Domains
2. Add your domain (e.g., `foodbank.church`)
3. Update DNS records as instructed
4. SSL certificate is automatic

**For Backend (Render)**:
1. Go to Render → Settings → Custom Domain
2. Add your domain (e.g., `api.foodbank.church`)
3. Update DNS records as instructed
4. Update `CORS_ORIGIN` to match new frontend domain

#### Enable SMS (Twilio)

1. Sign up at [Twilio](https://www.twilio.com)
2. Get a phone number
3. Copy credentials (Account SID, Auth Token, Phone Number)
4. Add to Render environment variables:
   ```env
   TWILIO_ACCOUNT_SID=<your-sid>
   TWILIO_AUTH_TOKEN=<your-token>
   TWILIO_PHONE_NUMBER=<your-number>
   ```
5. Redeploy backend

---

## 📊 Comparison: Localhost vs Web

| Feature | Localhost | Web (Production) |
|---------|-----------|------------------|
| **Access** | Only on your computer | Accessible from anywhere |
| **URL** | http://localhost:8000 | https://your-domain.com |
| **Database** | Local PostgreSQL (Docker) | Render PostgreSQL |
| **Cost** | Free | Free tier available, paid for scale |
| **Setup Time** | 5-10 minutes | 30-60 minutes (first time) |
| **Use Case** | Development, testing, demos | Production, real users |
| **Data Persistence** | Lost when Docker stops | Permanent |
| **SSL/HTTPS** | No | Yes (automatic) |

---

## 🆘 Getting Help

### Common Issues

**"Cannot connect to database"**
- Localhost: Ensure Docker is running
- Web: Check `DATABASE_URL` is correct

**"CORS error" in browser console**
- Check `CORS_ORIGIN` matches your frontend URL exactly
- Include `https://` in the URL

**"Invalid credentials"**
- Verify `ADMIN_PASSWORD` environment variable
- Try resetting the password

### Support Resources

- **Detailed Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Development Guide**: See [README.md](README.md)
- **Render Documentation**: https://render.com/docs
- **Vercel Documentation**: https://vercel.com/docs

---

## ✅ Quick Checklist

### For Localhost
- [ ] Docker Desktop is installed and running
- [ ] `.env` file is configured
- [ ] Ran `pnpm install`
- [ ] Ran `./scripts/run`
- [ ] Can access http://localhost:8000
- [ ] Can log in with admin credentials

### For Web Deployment
- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created on Render
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] `CORS_ORIGIN` updated on backend
- [ ] `VITE_API_URL` set on frontend
- [ ] Admin password changed from default
- [ ] Application tested and working

---

**You're all set! 🎉**

Choose localhost for development and testing, or deploy to the web when you're ready to serve real users.
