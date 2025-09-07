# TraceLite - Laboratory Management System

TraceLite is a modern, full-stack web application for managing laboratory operations including receipts, lab tests, reports, invoices, and owner tracking. Built with React TypeScript frontend and Node.js Express backend.

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + SQLite
- **Authentication**: JWT tokens with bcrypt password hashing
- **Database**: SQLite with comprehensive schema for lab operations
- **API**: RESTful endpoints with CORS support

## 📋 Features

### Admin Portal
- **Dashboard**: Overview of laboratory operations
- **Receipts Management**: Create, view, edit, and track sample receipts
- **Lab Tests**: Manage test results and patient data
- **Reports**: Generate and view comprehensive lab reports
- **Invoices**: Handle billing and invoice management
- **Owner Tracking**: Monitor sample/report status by owners

### Owner Portal
- **Sample Tracking**: Track samples using receipt numbers or phone numbers
- **OTP Authentication**: Secure access via email/SMS verification
- **Document Access**: View and download reports and receipts
- **Status Updates**: Real-time notifications on sample progress

### Key Capabilities
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **Real-time Updates**: Live status tracking and notifications
- **Secure Authentication**: JWT-based auth with role-based access
- **Data Validation**: Comprehensive form validation and error handling
- **Export Features**: PDF generation for reports and receipts
- **Search & Filter**: Advanced filtering across all modules

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nvijayanand79/tracklite.git
   cd tracklite
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies (for concurrent development)
   npm install
   
   # Install frontend dependencies
   cd web
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ../..
   ```

3. **Initialize the database**
   ```bash
   # The SQLite database will be automatically created on first run
   # Demo data will be populated automatically
   ```

4. **Start the development environment**
   ```bash
   # From the root directory - starts both frontend and backend
   npm run dev
   ```

   This will start:
   - Frontend (React + Vite): `http://localhost:5173`
   - Backend API (Express): `http://localhost:3001`

## 🛠️ Development Setup

### Environment Configuration

Create a `.env` file in the root directory (optional):
```env
# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Development Settings
NODE_ENV=development
```

### Database Setup

The application uses SQLite with the following key tables:
- `receipts` - Sample receipt tracking
- `labtests` - Test results and patient data
- `reports` - Generated lab reports
- `invoices` - Billing and invoice management
- `owners` - Owner portal users and authentication

Database is automatically initialized with demo data on first startup.

### Development Commands

```bash
# Root level (concurrent development)
npm run dev          # Start both frontend and backend
npm run build        # Build frontend for production
npm start           # Start production server

# Frontend only (web/ directory)
cd web
npm run dev         # Start Vite dev server (port 5173)
npm run build       # Build for production
npm run preview     # Preview production build

# Backend only (web/server/ directory)
cd web/server
npm run dev         # Start with nodemon (auto-reload)
npm start          # Start production server
npm run serve      # Build frontend + start server
```

## 📁 Project Structure

```
tracklite/
├── web/                          # Frontend React application
│   ├── src/
│   │   ├── components/           # Reusable React components
│   │   ├── pages/               # Page components and routes
│   │   │   ├── Dashboard.tsx    # Main dashboard
│   │   │   ├── ReceiptsList.tsx # Receipts management
│   │   │   ├── LabTestsList.tsx # Lab tests management
│   │   │   ├── ReportsList.tsx  # Reports management
│   │   │   ├── InvoicesList.tsx # Invoices management
│   │   │   └── OwnerTrack.tsx   # Owner tracking portal
│   │   ├── services/            # API services and utilities
│   │   │   └── api.ts          # Axios configuration and API calls
│   │   └── utils/              # Utility functions
│   ├── server/                 # Backend Node.js application
│   │   ├── index.js           # Main server file with all endpoints
│   │   ├── package.json       # Backend dependencies
│   │   └── public/           # Static files for production
│   ├── package.json          # Frontend dependencies
│   └── vite.config.ts        # Vite configuration
├── package.json              # Root dependencies (concurrently)
├── tracelite.db             # SQLite database file
└── README.md               # This file
```

## 🔐 Authentication & Security

### Admin Authentication
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: Full access to all admin features

### Owner Portal Authentication
- **Email-based OTP**: Secure login via email verification
- **Development OTP**: `123456` (for testing purposes)
- **Token Expiry**: 30 minutes (configurable)

### Security Features
- JWT token-based authentication
- Bcrypt password hashing
- CORS protection
- Input validation and sanitization
- Role-based access control

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/owner/auth/request-otp` - Request OTP for owner
- `POST /api/owner/auth/verify-otp` - Verify OTP and login

### Receipts
- `GET /api/receipts` - Get all receipts
- `GET /api/receipts/:id` - Get specific receipt
- `POST /api/receipts` - Create new receipt
- `PUT /api/receipts/:id` - Update receipt

### Lab Tests
- `GET /api/labtests` - Get all lab tests
- `GET /api/labtests/:id` - Get specific test
- `POST /api/labtests` - Create new test
- `PUT /api/labtests/:id` - Update test
- `GET /api/labtests/available-for-reports` - Get tests available for reporting

### Reports
- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get specific report
- `POST /api/reports` - Create new report

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get specific invoice
- `POST /api/invoices` - Create new invoice

### Owner Portal
- `GET /api/owner/track/:query` - Track samples by receipt/phone
- `GET /api/owner/reports` - Get owner's reports
- `GET /api/owner/documents` - Get owner's documents

## 🎯 Usage Guide

### Admin Portal Access
1. Navigate to `http://localhost:5173`
2. Login with admin credentials
3. Access all management features from the sidebar navigation

### Owner Portal Access
1. Navigate to `http://localhost:5173/owner/track`
2. Enter email for OTP verification
3. Use OTP code `123456` for development
4. Track samples and access documents

### Creating Sample Data
The application automatically creates demo data including:
- Sample receipts with different statuses
- Mock lab test results
- Generated reports
- Sample invoices
- Owner tracking examples

## 🚀 Production Deployment

### Build for Production
```bash
# Build frontend and prepare for production
cd web
npm run build

# Build and serve with backend
cd server
npm run serve
```

### Production Environment Variables
```env
JWT_SECRET_KEY=your-production-secret-key-here
NODE_ENV=production
PORT=3001
```

### Deployment Options
- **Self-hosted**: Deploy on VPS with PM2 or similar
- **Docker**: Containerized deployment (Dockerfile included)
- **Cloud Platforms**: Vercel, Netlify, Heroku, etc.

## 🧪 Testing

The application includes:
- Demo data for testing all features
- Development OTP codes for easy testing
- Comprehensive error handling and validation
- Console logging for debugging

### Test Credentials
- **Admin**: admin@example.com / admin123
- **Owner OTP**: 123456 (development mode)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill processes on ports 5173 or 3001
npx kill-port 5173
npx kill-port 3001
```

**Database Issues**
```bash
# Delete and recreate database
rm tracelite.db
# Restart server to recreate with demo data
```

**Module Not Found Errors**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# For web directory
cd web && rm -rf node_modules package-lock.json && npm install

# For server directory  
cd web/server && rm -rf node_modules package-lock.json && npm install
```

### Development Tips
- Check browser console for frontend errors
- Check terminal output for backend errors
- Use browser dev tools for API request inspection
- Database file location: `./tracelite.db`

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check existing documentation
- Review API endpoints and error messages
- Enable debug logging in development mode

---

**TraceLite** - Streamlining Laboratory Management Operations
