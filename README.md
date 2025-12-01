# Grace Community Food Bank Management System

A comprehensive web application for managing food bank registrations and distributions at a Christian church. The system handles administrator operations, staff management, and citizen registrations through QR codes with robust validation and SMS notifications.

![Food Bank System](https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=80)

## 🌟 Features

### For Citizens
- **Easy Registration**: Mobile-optimized self-service registration
- **QR Code Access**: Scan QR codes to quickly access event registration
- **SMS Confirmations**: Automatic SMS notifications with order numbers
- **Real-time Availability**: See remaining food bags for each event
- **14-Day Cooldown**: Fair distribution with one registration per 14 days

### For Staff
- **Manual Registration**: Register walk-in citizens on-site
- **Event Monitoring**: View active events and registration status
- **Search Functionality**: Quick lookup of registrations by order number or name
- **Capacity Tracking**: Real-time view of event capacity and availability

### For Administrators
- **Event Management**: Create and manage food distribution events
- **QR Code Generation**: Generate time-limited QR codes for events
- **Analytics Dashboard**: View statistics and trends
- **User Management**: Manage staff accounts (future feature)
- **Reporting**: Export registration data (future feature)

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Vinxi (full-stack TypeScript framework)
- **API**: tRPC for type-safe API calls
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Zod schemas
- **SMS**: Twilio API (configurable)

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: TanStack Router (file-based routing)
- **State Management**: Zustand with persistence
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Database
- **Primary**: PostgreSQL 13+
- **ORM**: Prisma
- **Migrations**: Automatic with `prisma db push`

## 📋 Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL 13+
- Docker and Docker Compose (for local development)
- Twilio account (optional, for SMS notifications)

## 🪟 Windows Setup

If you're on Windows, you'll need to install Windows Subsystem for Linux (WSL) to run the bash scripts in this project.

### Install WSL2

1. **Open PowerShell as Administrator** and run:
   ```powershell
   wsl --install
   ```

2. **Restart your computer** when prompted.

3. **After restart**, a terminal window will open automatically to complete the Linux distribution installation. If it doesn't:
   - Open PowerShell or Command Prompt
   - Run: `wsl`
   - This will complete the Ubuntu installation

4. **Create a Linux user account**:
   - Enter a username (e.g., your name in lowercase)
   - Enter a password (you'll use this for sudo commands)
   - Confirm the password

5. **Verify installation**:
   ```bash
   wsl --list --verbose
   ```
   You should see Ubuntu (or your chosen distribution) listed with version 2.

### Alternative: Install a Specific Distribution

If you want to choose a specific Linux distribution:

1. **List available distributions**:
   ```powershell
   wsl --list --online
   ```

2. **Install your preferred distribution** (e.g., Ubuntu):
   ```powershell
   wsl --install -d Ubuntu
   ```

### Using WSL for Development

Once WSL is installed:

1. **Open your WSL terminal**:
   - Search for "Ubuntu" (or your distribution name) in the Start menu
   - Or type `wsl` in PowerShell/Command Prompt

2. **Navigate to your project**:
   ```bash
   # Your Windows C: drive is mounted at /mnt/c/
   cd /mnt/c/Users/YourUsername/path/to/food-bank-system
   ```

3. **Run the setup commands** from the Quick Start section below in your WSL terminal.

### Install Docker Desktop for Windows

1. Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. During installation, ensure "Use WSL 2 instead of Hyper-V" is selected
3. After installation, open Docker Desktop settings:
   - Go to Settings → Resources → WSL Integration
   - Enable integration with your WSL distribution (e.g., Ubuntu)
4. Restart Docker Desktop

Now you're ready to proceed with the Quick Start guide below!

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd food-bank-system
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Copy the `.env` file and update with your values:

```env
# Application
APP_NAME=food-bank-system
NODE_ENV=development

# Authentication
ADMIN_PASSWORD=your_secure_admin_password_here
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_chars_here
BCRYPT_ROUNDS=10

# Twilio (Optional - for SMS notifications)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

### 4. Start the Development Environment

```bash
# Start PostgreSQL with Docker
pnpm run docker-compose up -d

# Run database migrations
pnpm run db:push

# Start the development server
pnpm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3000/trpc

### 5. Default Admin Credentials

```
Username: admin
Password: [value from ADMIN_PASSWORD in .env]
```

## 📊 Database Schema

### User
- Stores admin and staff accounts
- Role-based access control (ADMIN, STAFF, CITIZEN)
- Bcrypt-hashed passwords

### Event
- Food distribution events
- Capacity tracking (availableBags, registeredCount)
- Status management (ACTIVE, INACTIVE, COMPLETED)
- Date/time windows for registration

### Registration
- Citizen registrations for events
- Unique order numbers
- Phone number validation (E.164 format)
- 14-day cooldown enforcement
- Check-in tracking

### QRSession
- Time-limited QR codes for events
- Expiration tracking
- Active/inactive status

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ADMIN_PASSWORD` | Plain-text admin password | `SecurePass123!` |
| `JWT_SECRET` | Secret for JWT token signing (min 32 chars) | `your-super-secure-secret-here` |
| `BCRYPT_ROUNDS` | Salt rounds for password hashing | `10` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio account SID for SMS | - |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | - |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | `+1234567890` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `info` |

### Environment Variable Notes

**ADMIN_PASSWORD**: 
- Current value: `D8fTGBZj5uU12JndZCN3Hk`
- **MUST BE CHANGED** before production deployment
- Used to create the initial admin account

**JWT_SECRET**:
- Current value: Secure random string
- **MUST BE CHANGED** before production deployment
- Used to sign authentication tokens

**TWILIO Credentials**:
- Current values: Placeholders
- **MUST BE CONFIGURED** for SMS functionality to work
- Application works without SMS, but users won't receive confirmations

## 🔌 API Endpoints (tRPC Procedures)

### Authentication
- `login`: Authenticate users with username/password
  - Input: `{ username: string, password: string }`
  - Output: `{ token: string, user: User }`

### Events
- `getActiveEvents`: Fetch all active events
  - Input: None
  - Output: `Event[]`

- `createEvent`: Create a new event (Admin only)
  - Input: `{ authToken, name, description?, availableBags, startDatetime, endDatetime }`
  - Output: `{ success: boolean, event: Event }`

- `generateQRCode`: Generate QR code for an event (Admin only)
  - Input: `{ authToken, eventId, expirationHours }`
  - Output: `{ success: boolean, qrData: string, registrationUrl: string }`

- `getEventBySession`: Get event details from QR session code
  - Input: `{ sessionCode: string }`
  - Output: `Event`

### Registrations
- `registerCitizen`: Register a citizen for an event
  - Input: `{ eventId, fullName, phoneNumber, email? }`
  - Output: `{ success: boolean, orderNumber: string, message: string }`

## 🚢 Deployment

### Backend Deployment (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm start`
   - **Environment**: Node 18+

4. Add environment variables in Render dashboard
5. Create a PostgreSQL database on Render and link it

### Frontend Deployment (Vercel)

1. Import project to Vercel
2. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `dist`

3. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-backend.onrender.com
   ```

### Database Setup (Production)

**Option 1: Render PostgreSQL**
- Create PostgreSQL instance on Render
- Copy connection string to `DATABASE_URL` in backend environment

**Option 2: AWS RDS**
- Create PostgreSQL instance on AWS RDS
- Configure security groups for backend access
- Use connection string in backend environment

## 🧪 Testing the Application

### Test User Registration Flow

1. Navigate to home page
2. Click "Register for Food Distribution"
3. Select an event (create one first as admin)
4. Fill in the form:
   - Full Name: John Doe
   - Phone: (555) 123-4567
   - Email: john@example.com (optional)
5. Submit and verify order number appears

### Test Admin Flow

1. Login with admin credentials
2. Create a new event:
   - Name: Weekly Food Distribution
   - Available Bags: 100
   - Start/End dates: Current week
3. Generate QR code for the event
4. View the registration statistics

### Test Staff Flow

1. Login with staff credentials (create staff user as admin)
2. Register a walk-in citizen manually
3. Search for registrations
4. View event capacity

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Landing    │  │    Login     │  │   Register   │      │
│  │     Page     │  │     Page     │  │     Page     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │    Admin     │  │    Staff     │                         │
│  │  Dashboard   │  │  Dashboard   │                         │
│  └──────────────┘  └──────────────┘                         │
└────────────────────────┬────────────────────────────────────┘
                         │ tRPC (Type-safe API)
┌────────────────────────┴────────────────────────────────────┐
│                    Backend (Node.js + tRPC)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  tRPC Procedures                      │   │
│  │  • login          • getActiveEvents                   │   │
│  │  • createEvent    • registerCitizen                   │   │
│  │  • generateQRCode • getEventBySession                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Business Logic Layer                     │   │
│  │  • Authentication (JWT + bcrypt)                      │   │
│  │  • Validation (Zod schemas)                           │   │
│  │  • Phone normalization (E.164)                        │   │
│  │  • 14-day cooldown check                              │   │
│  │  • Capacity management                                │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ Prisma ORM
┌────────────────────────┴────────────────────────────────────┐
│                   PostgreSQL Database                        │
│  ┌──────┐  ┌──────┐  ┌──────────────┐  ┌──────────┐        │
│  │ User │  │Event │  │ Registration │  │QRSession │        │
│  └──────┘  └──────┘  └──────────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🔒 Security Features

### Implemented
- ✅ JWT authentication with 24-hour expiration
- ✅ Bcrypt password hashing (10 rounds)
- ✅ Role-based access control (ADMIN, STAFF, CITIZEN)
- ✅ Input validation with Zod schemas
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ Phone number normalization
- ✅ CORS configuration
- ✅ Rate limiting (via framework)

### Recommended for Production
- 🔲 HTTPS/TLS encryption
- 🔲 Rate limiting per IP (100 req/15min recommended)
- 🔲 CSRF protection
- 🔲 Security headers (Helmet.js)
- 🔲 Database connection pooling
- 🔲 API request logging
- 🔲 Audit trail for admin actions

## 📱 SMS Integration (Twilio)

The system supports SMS notifications via Twilio. To enable:

1. Sign up for Twilio account
2. Get Account SID, Auth Token, and Phone Number
3. Add to environment variables
4. SMS will be sent automatically on successful registration

**Note**: The application works without Twilio configured, but SMS confirmations will be skipped.

## 🎨 Design Philosophy

- **Mobile-First**: Optimized for mobile devices (citizen registration)
- **Accessible**: WCAG 2.1 AA compliance target
- **Intuitive**: Clear navigation and user flows
- **Professional**: Clean, modern design with Tailwind CSS
- **Responsive**: Works on all screen sizes

## 🔄 Business Rules

### Registration Rules
1. **One registration per phone number per 14 days**
   - Enforced at database level
   - Prevents abuse of the system

2. **Event capacity limits**
   - Registrations close when capacity reached
   - Real-time capacity tracking

3. **Time-window restrictions**
   - Events only accept registrations during active period
   - Automatic status updates

4. **Phone number validation**
   - E.164 format normalization
   - US numbers: +1 prefix added automatically

### Data Integrity
- All timestamps in UTC
- Unique order numbers (timestamp + random)
- Foreign key constraints
- Indexed queries for performance

## 🚧 Future Enhancements

### Phase 1 (Implemented)
- ✅ Core authentication system
- ✅ Event management
- ✅ Citizen registration
- ✅ QR code generation
- ✅ Admin & staff dashboards

### Phase 2 (Planned)
- 🔲 Advanced reporting with charts
- 🔲 Excel/CSV export functionality
- 🔲 Email notifications
- 🔲 Staff user management by admins
- 🔲 Event editing and deletion
- 🔲 Registration check-in system
- 🔲 QR code scanner (mobile camera)

### Phase 3 (Future)
- 🔲 Multi-language support
- 🔲 SMS two-way communication
- 🔲 Automated event scheduling
- 🔲 Volunteer management
- 🔲 Donation tracking
- 🔲 Integration with food inventory systems

## 📝 Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Start production server
pnpm start

# Database commands
pnpm run db:push        # Push schema changes
pnpm run db:studio      # Open Prisma Studio

# Docker commands
pnpm run docker-compose up -d     # Start services
pnpm run docker-compose down      # Stop services

# Code quality
pnpm run check-code     # Run linting and type checking
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For support, please contact:
- Email: admin@foodbank.church
- Phone: (555) 123-4567

## 🙏 Acknowledgments

- Grace Community Church for the mission
- All volunteers and staff members
- The open-source community for the amazing tools

---

**Built with ❤️ for Grace Community Food Bank**
