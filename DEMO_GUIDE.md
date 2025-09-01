# TrackLite Demo Guide

Welcome to the TrackLite demonstration! This guide explains all functionalities and how to test them during the demo.

## 🚀 Quick Start

Simply run `start-demo.bat` - it will automatically:
- Install all dependencies (Python packages, Node.js packages)
- Create and seed the demo database
- Launch both API and web app
- Display access URLs

**No manual setup required!**

---

## 🔗 Access Points

After running `start-demo.bat`:

- **Web App:** [http://localhost:5173](http://localhost:5173)
- **API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check:** [http://localhost:8000/healthz](http://localhost:8000/healthz)

---

## 🎯 Core Functionalities

### 1. Owner Tracking Portal
- **What:** Allows business owners to track their samples through the lab process
- **How to test:**
  1. Navigate to the "Owner Track" page in the web app
  2. Enter a sample tracking ID or receipt number
  3. View real-time status updates

### 2. Receipt Management
- **What:** Digital receipts for samples submitted to the lab
- **How to test:**
  1. Go to API docs: `/receipts` endpoints
  2. Try `GET /receipts` to view all receipts
  3. Use `POST /receipts` to create a new receipt

### 3. Lab Test Management
- **What:** Track laboratory tests and their progress
- **How to test:**
  1. Visit `/labtests` endpoints in API docs
  2. View test status, results, and timelines
  3. Update test progress through the API

### 4. Report Generation
- **What:** Automated report creation for completed tests
- **How to test:**
  1. Check `/reports` endpoints
  2. Generate PDF reports for completed tests
  3. View report history and download links

### 5. Invoice Processing
- **What:** Billing and payment tracking for lab services
- **How to test:**
  1. Explore `/invoices` endpoints
  2. Create invoices tied to completed tests
  3. Track payment status

---

## 🧪 Demo Data

The system comes pre-populated with:

### Sample Customers
- **Alice Demo** (alice@example.com)
- **Bob Demo** (bob@example.com)  
- **Charlie Demo** (charlie@example.com)

### Demo Login Credentials

#### 🔐 Admin Login (Full System Access)
- **Method:** Email + Password
- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Role:** Administrator
- **Purpose:** Access admin panel, system management, all features
- **API Endpoint:** `POST /auth/login`

#### 📱 Owner Login (Limited Tracking Access)
- **Method:** Email/Phone + OTP
- **Demo Emails:** `contact@acme.com` or `lab@techstart.com`
- **OTP Code:** `123456` (always generated for demo)
- **Role:** Owner/Customer
- **Purpose:** Track sample status, view receipts
- **API Endpoints:**
  - `POST /auth/owner/email-otp-init` (request OTP)
  - `POST /auth/owner/email-otp-verify` (verify OTP)

#### 📞 Phone OTP Login (Alternative)
- **Method:** Phone + OTP
- **Demo Phone:** Any phone number
- **OTP Code:** Check console output after requesting
- **API Endpoints:**
  - `POST /auth/owner/otp-init` (request OTP)
  - `POST /auth/owner/otp-verify` (verify OTP)

### Sample Tracking IDs
- `RCP-001` / `LAB-2024-001`
- `RCP-002` / `LAB-2024-002`
- `RCP-003` / `LAB-2024-003`

---

## 📋 Demo Script

### For Sales/Customer Demos:

1. **Start with the problem:**
   - "Current lab tracking is manual and error-prone"
   - "Customers lose track of their samples"
   - "No real-time visibility into lab processes"

2. **Show the Owner Portal:**
   - Navigate to Owner Track page
   - Enter tracking ID: `RCP-001`
   - Show real-time status updates

3. **Demonstrate API capabilities:**
   - Open [http://localhost:8000/docs](http://localhost:8000/docs)
   - Show comprehensive API for integration
   - Test a few endpoints live

4. **Highlight key benefits:**
   - Real-time tracking
   - Automated workflows
   - API-first architecture
   - Easy integration with existing systems

### For Technical Demos:

1. **Architecture Overview:**
   - FastAPI backend with async support
   - React frontend with TypeScript
   - SQLite database (easily upgradable to PostgreSQL)
   - REST API with OpenAPI documentation

2. **Code Structure:**
   - Show modular router design
   - Demonstrate Pydantic schemas
   - Explain database models

3. **Admin Access:**
   - Login as admin: `admin@example.com` / `admin123`
   - Show admin panel and system management features

4. **Deployment Options:**
   - Local development (current setup)
   - Docker containers available
   - Cloud-ready (Codespaces included)

---

## 🔧 Troubleshooting

### Common Issues:

1. **"Login not working on public URLs" (GitHub Codespaces, etc.):**
   - The API now supports wildcard CORS origins for `*.github.dev`, `*.github.com`, `*.vscode.dev`
   - If you're still getting CORS errors, check the browser console for specific error messages
   - Make sure you're using HTTPS URLs for the frontend

2. **"admin@example.com login not working":**
   - Make sure you're using the **password login** endpoint: `POST /auth/login`
   - Use email: `admin@example.com` and password: `admin123`
   - This is NOT an OTP login - it's direct password authentication

3. **"OTP login not working":**
   - For email OTP: Use `contact@acme.com` or `lab@techstart.com`
   - OTP is always `123456` for demo purposes
   - First call `/auth/owner/email-otp-init`, then `/auth/owner/email-otp-verify`

4. **"Wrong endpoint":**
   - Admin login: `POST /auth/login` (email + password)
   - Owner login: `POST /auth/owner/email-otp-init` then `POST /auth/owner/email-otp-verify` (email + OTP)

5. **"Token expired":**
   - Admin tokens expire in 30 minutes
   - Owner tokens expire in 15 minutes
   - Simply login again to get a new token

6. **"Module not found" errors:**
   - Re-run `start-demo.bat` - it will reinstall dependencies

7. **Port already in use:**
   - Stop any existing services on ports 5173 or 8000
   - Or change ports in the configuration

8. **Database errors:**
   - Delete `demo.db` file and re-run the demo
   - Check that SQLite is working properly

9. **Web app not loading:**
   - Ensure Node.js 20+ is installed
   - Check the "TrackLite Web" terminal window for errors

---

## 📞 Next Steps

After the demo:

1. **For Customers:**
   - Discuss customization requirements
   - Plan data migration strategy
   - Set up pilot deployment

2. **For Developers:**
   - Review code structure
   - Understand API endpoints
   - Plan feature extensions

---

**Questions? Check the terminal windows for real-time logs or review the API documentation at [http://localhost:8000/docs](http://localhost:8000/docs)**
