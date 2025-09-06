# TraceLite Demo Guide

Welcome to the TraceLite demonstration! This guide explains all functionalities and how to test the enterprise-ready system with automated initialization and universal UUID compatibility.

## 🚀 Quick Start

Simply run `start-demo.bat` - it will automatically:
- Install all dependencies (Python packages, Node.js packages)
- Initialize enterprise-grade UUID system for deployment compatibility
- Create and seed fresh demo data with automated startup initialization
- Launch both API and web app with CORS configured
- Display access URLs and demo credentials

**No manual setup required! Enterprise-ready out of the box!**

---

## 🔗 Access Points

After running `start-demo.bat`:

- **Web App:** [http://localhost:5173](http://localhost:5173)
- **API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check:** [http://localhost:8000/healthz](http://localhost:8000/healthz)

---

## ✨ New Enterprise Features

### 🔧 **Universal UUID Compatibility**
- **Demo:** All tracking IDs work seamlessly (both UUIDs and lab numbers like `LAB-2024-001`)
- **Test:** Try tracking `LAB-2024-001` and `AWB123456789` - both work perfectly
- **Benefit:** Resolves deployment issues across different machines and environments

### 🚀 **Automated Startup Initialization**  
- **Demo:** Fresh demo data created automatically on every server startup
- **Test:** Restart the API server - demo data is recreated automatically
- **Benefit:** Consistent demo environment without manual data management

### 🌐 **Production-Ready Architecture**
- **Demo:** CORS configured for cross-origin requests
- **Test:** API works from different domains and development environments
- **Benefit:** Ready for GitHub Codespaces, WSL, and production deployment

---

## 🎯 Core Functionalities

### 1. Owner Tracking Portal (Enhanced)
- **What:** Real-time sample tracking with OTP authentication
- **How to test:**
  1. Navigate to the "Owner Track" page in the web app
  2. **Try these tracking IDs:**
     - `LAB-2024-001` (Completed with approved report)
     - `LAB-2024-002` (Completed with approved report)
     - `LAB-2024-003` (In Progress with draft report)
     - `AWB123456789` (Courier tracking for TechStart Inc)
  3. View real-time status updates with timeline
  4. **Test Authentication:**
     - Email: `contact@acme.com` or `lab@techstart.com`
     - OTP: `123456` (demo mode)

### 2. Receipt Management (UUID Enhanced)
- **What:** Digital receipts with enterprise UUID tracking
- **How to test:**
  1. Go to API docs: `/receipts` endpoints
  2. Try `GET /receipts` to view all receipts
  3. **View demo receipts:**
     - Acme Corp (Main Lab, 2 boxes, Person delivery)
     - TechStart Inc (Research Lab, 3 boxes, Courier AWB123456789)
     - GreenEnergy Solutions (Environmental Lab, 1 box, Person delivery)
  4. Use `POST /receipts` to create a new receipt with automatic UUID assignment

### 3. Lab Test Management (Status Tracking)
- **What:** Track laboratory tests with automated status progression
- **How to test:**
  1. Visit `/labtests` endpoints in API docs  
  2. **View test progression:**
     - `LAB-2024-001`: Dr. Smith → COMPLETED → SIGNED_OFF
     - `LAB-2024-002`: Dr. Johnson → COMPLETED → SIGNED_OFF  
     - `LAB-2024-003`: Dr. Williams → IN_PROGRESS → DRAFT
  3. Update test progress through the API with enum validation
  4. Test tracking endpoints with non-UUID lab numbers

### 4. Report Generation (Approval Workflow)
- **What:** Automated report creation with approval workflow and document management
- **How to test:**
  1. Check `/reports` endpoints in API docs
  2. **View demo reports:**
     - Report for `LAB-2024-001`: APPROVED by Dr. Admin → DELIVERED via EMAIL → Available for download
     - Report for `LAB-2024-002`: APPROVED by Dr. Admin → DISPATCHED via COURIER → Available for download
     - Report for `LAB-2024-003`: DRAFT status → PENDING communication → Not yet available
  3. Test download functionality for approved reports
  4. View communication status and delivery tracking

### 5. Invoice Processing (Payment Tracking)
- **What:** Automated billing and payment tracking with status management  
- **How to test:**
  1. Explore `/invoices` endpoints in API docs
  2. **View demo invoices:**
     - `INV-2025-0001` for LAB-2024-001: $250.00 → PAID (payment completed)
     - `INV-2025-0002` for LAB-2024-002: $350.00 → SENT (awaiting payment)
  3. Track payment status and invoice history
  4. Test invoice creation tied to completed reports

---

## 🧪 Demo Data (Auto-Generated)

The system automatically creates fresh demo data on startup with enterprise UUID handling:

### Sample Companies & Receipts
- **Acme Corp** - Main Lab, 2 boxes, Person delivery (contact@acme.com)
- **TechStart Inc** - Research Lab, 3 boxes, Courier AWB123456789 (lab@techstart.com)  
- **GreenEnergy Solutions** - Environmental Lab, 1 box, Person delivery

### Demo Login Credentials

#### 📱 Owner Portal Authentication (OTP-based)
- **Primary Demo Email:** `contact@acme.com`
- **Secondary Demo Email:** `lab@techstart.com`
- **OTP Code:** `123456` (demo mode - always works)
- **Role:** Owner/Customer
- **Purpose:** Track sample status, view approved reports, download documents
- **API Endpoints:**
  - `POST /auth/owner/email-otp-init` (request OTP)
  - `POST /auth/owner/email-otp-verify` (verify OTP)

#### 📞 Phone OTP Alternative
- **Method:** Phone + OTP  
- **Demo Phone:** Any valid phone number format
- **OTP Code:** Check console output after requesting
- **API Endpoints:**
  - `POST /auth/owner/otp-init` (request OTP)
  - `POST /auth/owner/otp-verify` (verify OTP)

### Sample Tracking IDs (Universal Compatibility)
- **Lab Document Numbers:**
  - `LAB-2024-001` → Acme Corp sample (COMPLETED, report approved, invoice paid)
  - `LAB-2024-002` → TechStart Inc sample (COMPLETED, report approved, invoice sent)
  - `LAB-2024-003` → GreenEnergy sample (IN_PROGRESS, draft report)
- **Courier Tracking:**
  - `AWB123456789` → TechStart Inc courier delivery tracking

### Database Reset
- **Automatic:** Fresh data created on every server startup
- **Manual:** Run `cd api && python init_demo_data.py`

---

## 📋 Demo Script

### For Sales/Customer Demos:

1. **Start with the problem:**
   - "Current lab tracking is manual and error-prone"
   - "Customers lose track of their samples"
   - "No real-time visibility into lab processes"

2. **Show the Owner Portal:**
   - Navigate to Owner Track page
   - Enter tracking ID: `LAB-2024-001`
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

## 🌐 Public Deployment Configuration

TrackLite is designed to work seamlessly in both local development and public cloud environments (GitHub Codespaces, VS Code Server, etc.).

### Environment Setup for Public URLs

1. **Frontend Configuration:**
   - The web app automatically detects the API URL based on the hostname
   - For localhost: Uses `http://localhost:8000`
   - For public IPs: Uses the current hostname with port 8000
   - Manual override: Create `web/.env` with `VITE_API_BASE_URL=http://your-public-ip:8000`

2. **Backend CORS Configuration:**
   - Supports wildcard origins for common cloud platforms:
     - `*.github.dev` (GitHub Codespaces)
     - `*.github.com` (GitHub)
     - `*.vscode.dev` (VS Code Server)
   - Allows all origins for maximum compatibility

3. **Testing Public Deployment:**
   - Clear browser cache before testing
   - Check browser console for CORS errors
   - Verify API health at `http://your-public-ip:8000/healthz`
   - Test login functionality with admin credentials

### Example Public Deployment URLs:
- **Web App:** `https://your-codespace-name.github.dev:3000`
- **API:** `https://your-codespace-name.github.dev:8000`
- **API Docs:** `https://your-codespace-name.github.dev:8000/docs`

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
