# TraceLite Setup Instructions

Welcome to TraceLite! This document provides comprehensive setup instructions for getting the laboratory management system running on your machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
1. **Node.js** (v16.0.0 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`
   - Recommended: Latest LTS version

2. **Git** (for cloning the repository)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

### System Requirements
- **Operating System**: Windows 10/11, macOS, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: At least 500MB free space
- **Network**: Internet connection for downloading dependencies

## 🚀 Quick Setup (Recommended)

### Windows Users
1. **Clone the repository**
   ```cmd
   git clone https://github.com/nvijayanand79/tracklite.git
   cd tracklite
   ```

2. **Run the setup script**
   ```cmd
   setup.bat
   ```
   This will automatically:
   - Check Node.js installation
   - Install all required dependencies
   - Verify the setup

3. **Start the demo**
   ```cmd
   start-demo.bat
   ```

### macOS/Linux Users
1. **Clone the repository**
   ```bash
   git clone https://github.com/nvijayanand79/tracklite.git
   cd tracklite
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd web && npm install && cd ..
   
   # Install backend dependencies
   cd web/server && npm install && cd ../..
   ```

3. **Start the application**
   ```bash
   npm run dev
   ```

## 🔧 Manual Setup (Advanced)

If you prefer to set up manually or encounter issues with the automated scripts:

### Step 1: Verify Prerequisites
```bash
# Check Node.js version (should be v16+)
node --version

# Check npm version
npm --version

# Check Git
git --version
```

### Step 2: Clone and Navigate
```bash
git clone https://github.com/nvijayanand79/tracklite.git
cd tracklite
```

### Step 3: Install Dependencies

#### Root Dependencies (for concurrent development)
```bash
npm install
```
This installs `concurrently` which allows running frontend and backend simultaneously.

#### Frontend Dependencies
```bash
cd web
npm install
cd ..
```
This installs React, TypeScript, Vite, Tailwind CSS, and other frontend dependencies.

#### Backend Dependencies
```bash
cd web/server
npm install
cd ../..
```
This installs Express, SQLite, JWT, bcrypt, and other backend dependencies.

### Step 4: Environment Configuration (Optional)

Create a `.env` file in the root directory if you want custom configuration:
```env
# JWT Secret (change in production)
JWT_SECRET_KEY=your-secret-key-here

# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Development mode
NODE_ENV=development
```

### Step 5: Start the Application

#### Development Mode (Recommended)
```bash
npm run dev
```
This starts both frontend and backend with hot-reload enabled.

#### Production Mode
```bash
# Build frontend
cd web && npm run build && cd ..

# Start production server
cd web/server && npm start
```

## 🌐 Accessing the Application

Once the setup is complete and the application is running:

### Admin Portal
- **URL**: http://localhost:5173
- **Email**: admin@example.com
- **Password**: admin123
- **Features**: Full access to all management features

### Owner Portal
- **URL**: http://localhost:5173/owner/track
- **Authentication**: Email + OTP verification
- **Development OTP**: 123456 (for testing)
- **Features**: Sample tracking, document access

### API Documentation
- **Base URL**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health
- **Swagger/Docs**: Not implemented (future feature)

## 📁 Project Structure Understanding

```
tracklite/
├── web/                        # Frontend application
│   ├── src/                   # React TypeScript source
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   └── services/         # API services
│   ├── server/               # Backend Node.js server
│   │   ├── index.js         # Main server file
│   │   └── package.json     # Server dependencies
│   └── package.json         # Frontend dependencies
├── package.json             # Root dependencies
├── tracelite.db            # SQLite database
├── setup.bat               # Windows setup script
└── start-demo.bat         # Windows demo launcher
```

## 🗄️ Database Information

### Database Type
- **Engine**: SQLite 3
- **File**: `tracelite.db` (created automatically)
- **Location**: Root directory

### Tables Created
- `receipts` - Sample receipt management
- `labtests` - Laboratory test data
- `reports` - Generated reports
- `invoices` - Billing and invoicing
- `owners` - Owner portal users

### Demo Data
The application automatically creates sample data including:
- 4 sample receipts with different statuses
- Laboratory test results
- Generated reports
- Sample invoices
- Test users for both admin and owner portals

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use
```bash
# Error: Port 5173 is already in use
# Solution: Kill the process or use different port
npx kill-port 5173
npx kill-port 3001

# Or start on different port
cd web && npm run dev -- --port 5174
```

#### 2. Node.js Version Issues
```bash
# Error: Unsupported Node.js version
# Solution: Update Node.js to v16 or higher
node --version
# If version is below v16, download latest from nodejs.org
```

#### 3. Permission Errors (Windows)
```cmd
# Error: EACCES permission denied
# Solution: Run as administrator or check file permissions
# Right-click Command Prompt -> "Run as administrator"
```

#### 4. Module Not Found Errors
```bash
# Error: Cannot find module 'xyz'
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# For Windows
rmdir /s node_modules
del package-lock.json
npm install
```

#### 5. Database Locked Errors
```bash
# Error: Database is locked
# Solution: Close any SQLite browser connections
# Or delete and recreate database
rm tracelite.db
# Database will be recreated on next startup
```

#### 6. Build Errors
```bash
# Error: Build failed
# Solution: Clear TypeScript cache and rebuild
cd web
npx tsc --build --clean
npm run build
```

### Advanced Troubleshooting

#### Enable Debug Logging
```bash
# Set environment variable for detailed logs
set DEBUG=tracelite:*  # Windows
export DEBUG=tracelite:*  # macOS/Linux
npm run dev
```

#### Reset Everything
```bash
# Complete reset (careful - this removes all data)
rm -rf node_modules web/node_modules web/server/node_modules
rm -rf package-lock.json web/package-lock.json web/server/package-lock.json
rm tracelite.db
npm install
cd web && npm install && cd server && npm install && cd ../..
npm run dev
```

#### Check Running Processes
```bash
# Check what's running on ports
netstat -ano | findstr :5173  # Windows
netstat -an | grep 5173       # macOS/Linux

# Kill specific process
taskkill /F /PID <process_id>  # Windows
kill -9 <process_id>          # macOS/Linux
```

## 🔐 Security Considerations

### Development vs Production

#### Development Mode
- Default JWT secret (change in production)
- CORS enabled for all origins
- Debug logging enabled
- Fixed OTP codes for testing

#### Production Checklist
- [ ] Change JWT_SECRET_KEY to a secure random string
- [ ] Disable debug logging
- [ ] Configure proper CORS origins
- [ ] Set up real OTP delivery (email/SMS)
- [ ] Use environment variables for sensitive data
- [ ] Set up HTTPS
- [ ] Configure database backups

### Default Credentials
```
Admin Portal:
- Email: admin@example.com
- Password: admin123

Owner Portal:
- Development OTP: 123456
- Real OTP: Sent via email/SMS (production)
```

**⚠️ Important**: Change default credentials before production deployment!

## 🤝 Getting Help

### Self-Help Resources
1. **Console Logs**: Check browser console and terminal output
2. **Network Tab**: Inspect API requests in browser dev tools
3. **Database**: Use SQLite browser to inspect database state
4. **Documentation**: Refer to README.md for additional information

### Reporting Issues
If you encounter issues not covered here:
1. Check existing GitHub issues
2. Provide detailed error messages
3. Include system information (OS, Node.js version)
4. Include steps to reproduce the issue

### Community Support
- **GitHub Issues**: Primary support channel
- **Documentation**: Keep this file updated with new solutions
- **Contributing**: PRs welcome for improvements

## 🎯 Next Steps

After successful setup:
1. **Explore Features**: Test all modules (receipts, lab tests, reports, etc.)
2. **Customize**: Modify branding, add features, or integrate with existing systems
3. **Deploy**: Set up production environment with proper security
4. **Monitor**: Implement logging and monitoring for production use

---

**Success!** You should now have TraceLite running locally. The application will be available at http://localhost:5173 with the API running on http://localhost:3001.

Happy tracking! 🧪📊
