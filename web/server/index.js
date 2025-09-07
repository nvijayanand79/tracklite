const path = require('path');
const express = require('express');
const morgan = require('morgan');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Authentication configuration
const JWT_SECRET = process.env.JWT_SECRET_KEY || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '30m';

// Dummy user database (matches Python implementation)
const DUMMY_USERS = {
  'admin@example.com': {
    email: 'admin@example.com',
    hashed_password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    full_name: 'Administrator'
  }
};

// OTP storage (in production, this would be Redis or database with expiration)
const otpStorage = {};

// Authentication helper functions
function authenticateUser(email, password) {
  const user = DUMMY_USERS[email];
  if (!user) return null;
  
  if (!bcrypt.compareSync(password, user.hashed_password)) {
    return null;
  }
  
  return {
    email: user.email,
    role: user.role,
    full_name: user.full_name
  };
}

function createAccessToken(data, expiresIn = JWT_EXPIRES_IN) {
  return jwt.sign(data, JWT_SECRET, { expiresIn });
}

function verifyToken(token) {
  try {
    console.log(`🔍 Attempting to decode token: ${token.substring(0, 20)}...`);
    const payload = jwt.verify(token, JWT_SECRET);
    console.log(`✅ Token decoded successfully:`, payload);
    return payload;
  } catch (error) {
    console.log(`❌ JWT Error: ${error.message}`);
    return null;
  }
}

function generateOTP() {
  // For development, always return 123456 (same as Python)
  return '123456';
}

function storeOTP(phone, code) {
  otpStorage[phone] = {
    code,
    expires_at: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    attempts: 0
  };
}

function verifyOTP(phone, code) {
  const stored = otpStorage[phone];
  if (!stored) return false;
  
  if (new Date() > stored.expires_at) {
    delete otpStorage[phone];
    return false;
  }
  
  if (stored.code !== code) return false;
  
  delete otpStorage[phone]; // OTP can only be used once
  return true;
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ detail: 'Access token required' });
  }
  
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ detail: 'Invalid authentication credentials' });
  }
  
  req.user = payload;
  next();
}

// Middleware to ensure admin role
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Not enough permissions' });
  }
  next();
}

// Middleware to ensure owner role
function requireOwner(req, res, next) {
  if (req.user.role !== 'owner') {
    return res.status(403).json({ detail: 'Owner access required' });
  }
  next();
}

const app = express();
app.use(express.json());
app.use(morgan('dev'));

// Add CORS headers for development (in case needed)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Debug middleware to log all API requests
app.use('/api', (req, res, next) => {
  console.log(`🔍 API Request: ${req.method} ${req.path}`);
  console.log('🔍 Headers:', req.headers);
  
  // For now, ignore authorization since we don't have auth set up
  // This will prevent auth-related errors
  if (req.headers.authorization) {
    console.log('🔍 Authorization header detected (ignoring for now):', req.headers.authorization.substring(0, 20) + '...');
  }
  
  next();
});

// Prefer serving the built frontend from web/dist if present (new build),
// otherwise fall back to the bundled server/public directory.
const preferredFrontend = path.resolve(__dirname, '..', 'dist'); // web/dist
const fallbackFrontend = path.join(__dirname, 'public');
const frontendDir = require('fs').existsSync(preferredFrontend) ? preferredFrontend : fallbackFrontend;
console.log('📁 Serving frontend from:', frontendDir);
app.use(express.static(frontendDir));

// Database file - point to repo data db if exists
const dbFile = path.resolve(__dirname, '..', '..', 'tracelite.db');
const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database:', dbFile);
    
    // Initialize database and load demo data
    initializeDatabase().then(() => {
      console.log('🎉 Database initialization complete');
    }).catch((err) => {
      console.error('❌ Database initialization failed:', err);
    });
  }
});

// Initialize database and load demo data
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    console.log('🔧 Initializing database...');
    
    // Create tables if they don't exist
    db.serialize(() => {
      // Create receipts table (if it doesn't exist)
      db.run(`CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        receiver_name TEXT NOT NULL,
        contact_number TEXT NOT NULL,
        branch TEXT NOT NULL,
        company TEXT NOT NULL,
        count_boxes INTEGER NOT NULL,
        receiving_mode TEXT NOT NULL,
        forward_to_central INTEGER DEFAULT 0,
        courier_awb TEXT,
        receipt_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('❌ Error creating receipts table:', err);
        } else {
          console.log('✅ Receipts table ready');
        }
      });

      // Create labtests table for workflow tracking
      db.run(`CREATE TABLE IF NOT EXISTS labtests (
        id TEXT PRIMARY KEY,
        receipt_id TEXT NOT NULL,
        lab_doc_no TEXT,
        lab_person TEXT,
        test_status TEXT DEFAULT 'PENDING',
        lab_report_status TEXT DEFAULT 'PENDING',
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (receipt_id) REFERENCES receipts (id)
      )`, (err) => {
        if (err) {
          console.error('❌ Error creating labtests table:', err);
        } else {
          console.log('✅ Labtests table ready');
        }
      });

      // Create reports table for final workflow step
      db.run(`CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        labtest_id TEXT NOT NULL,
        retesting_requested INTEGER DEFAULT 0,
        final_status TEXT DEFAULT 'DRAFT',
        approved_by TEXT,
        comm_status TEXT DEFAULT 'PENDING',
        comm_channel TEXT DEFAULT 'EMAIL',
        communicated_to_accounts INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (labtest_id) REFERENCES labtests (id)
      )`, (err) => {
        if (err) {
          console.error('❌ Error creating reports table:', err);
        } else {
          console.log('✅ Reports table ready');
        }
      });

      // Create invoices table for billing workflow (matches alembic migration 003)
      db.run(`CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL,
        invoice_no TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'DRAFT',
        amount REAL NOT NULL,
        issued_at DATETIME NOT NULL,
        paid_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports (id)
      )`, (err) => {
        if (err) {
          console.error('❌ Error creating invoices table:', err);
        } else {
          console.log('✅ Invoices table ready (schema matches alembic migration)');
        }
      });

      // Check if we have demo data
      db.get('SELECT COUNT(*) as count FROM receipts', (err, row) => {
        if (err) {
          console.error('❌ Error checking receipts:', err);
          reject(err);
          return;
        }

        console.log(`📊 Found ${row.count} existing receipts`);
        
        // If no data exists, create some demo data
        if (row.count === 0) {
          console.log('📝 Creating demo data...');
          loadDemoData().then(() => {
            resolve();
          }).catch(reject);
        } else {
          resolve();
        }
      });
    });
  });
}

async function loadDemoData() {
  const demoReceipts = [
    {
      id: 'LAB-2024-001',
      receiver_name: 'Acme Corp Representative',
      contact_number: '+1-555-123-0101',
      branch: 'Main Lab',
      company: 'Acme Corp',
      count_boxes: 2,
      receiving_mode: 'PERSON',
      forward_to_central: 0,
      courier_awb: null,
      receipt_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 10 days ago
    },
    {
      id: 'LAB-2024-002',
      receiver_name: 'TechStart Lab Manager',
      contact_number: '+1-555-123-0102',
      branch: 'Research Lab',
      company: 'TechStart Inc',
      count_boxes: 3,
      receiving_mode: 'COURIER',
      forward_to_central: 1,
      courier_awb: 'AWB123456789',
      receipt_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days ago
    },
    {
      id: 'LAB-2024-003',
      receiver_name: 'GreenEnergy Coordinator',
      contact_number: '+1-555-123-0103',
      branch: 'Environmental Lab',
      company: 'GreenEnergy Solutions',
      count_boxes: 1,
      receiving_mode: 'PERSON',
      forward_to_central: 0,
      courier_awb: null,
      receipt_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 5 days ago
    }
  ];

  // Demo lab tests showing workflow progression
  const demoLabTests = [
    {
      id: 'LT-001',
      receipt_id: 'LAB-2024-001',
      lab_doc_no: 'LAB-DOC-001',
      lab_person: 'Dr. Smith',
      test_status: 'COMPLETED',
      lab_report_status: 'READY',
      remarks: 'All chemical analysis completed successfully'
    },
    {
      id: 'LT-002',
      receipt_id: 'LAB-2024-002',
      lab_doc_no: 'LAB-DOC-002',
      lab_person: 'Dr. Johnson',
      test_status: 'IN_PROGRESS',
      lab_report_status: 'PENDING',
      remarks: 'Environmental testing in progress, preliminary results positive'
    },
    {
      id: 'LT-003',
      receipt_id: 'LAB-2024-003',
      lab_doc_no: 'LAB-DOC-003',
      lab_person: 'Dr. Williams',
      test_status: 'STARTED',
      lab_report_status: 'PENDING',
      remarks: 'Sample preparation completed, analysis started'
    }
  ];

  // Demo reports showing final workflow steps
  const demoReports = [
    {
      id: 'RPT-001',
      labtest_id: 'LT-001',
      retesting_requested: 0,
      final_status: 'APPROVED',
      approved_by: 'Dr. Manager',
      comm_status: 'DISPATCHED',
      comm_channel: 'EMAIL',
      communicated_to_accounts: 1
    }
  ];

  return new Promise(async (resolve, reject) => {
    try {
      // Insert receipts
      const receiptStmt = db.prepare(`INSERT INTO receipts (
        id, receiver_name, contact_number, branch, company, count_boxes,
        receiving_mode, forward_to_central, courier_awb, receipt_date,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'), datetime('now'))`);

      for (let i = 0; i < demoReceipts.length; i++) {
        const receipt = demoReceipts[i];
        const daysAgo = (10 - i * 3); // Different creation times
        receiptStmt.run([
          receipt.id,
          receipt.receiver_name,
          receipt.contact_number,
          receipt.branch,
          receipt.company,
          receipt.count_boxes,
          receipt.receiving_mode,
          receipt.forward_to_central,
          receipt.courier_awb,
          receipt.receipt_date,
          daysAgo
        ]);
      }
      receiptStmt.finalize();
      console.log(`✅ Created ${demoReceipts.length} demo receipts`);

      // Insert lab tests
      const labtestStmt = db.prepare(`INSERT INTO labtests (
        id, receipt_id, lab_doc_no, lab_person, test_status, lab_report_status, remarks,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'), datetime('now'))`);

      for (let i = 0; i < demoLabTests.length; i++) {
        const labtest = demoLabTests[i];
        const daysAgo = (8 - i * 2); // Tests started after receipts
        labtestStmt.run([
          labtest.id,
          labtest.receipt_id,
          labtest.lab_doc_no,
          labtest.lab_person,
          labtest.test_status,
          labtest.lab_report_status,
          labtest.remarks,
          daysAgo
        ]);
      }
      labtestStmt.finalize();
      console.log(`✅ Created ${demoLabTests.length} demo lab tests`);

      // Insert reports
      const reportStmt = db.prepare(`INSERT INTO reports (
        id, labtest_id, retesting_requested, final_status, approved_by, comm_status, comm_channel, communicated_to_accounts,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'), datetime('now'))`);

      for (let i = 0; i < demoReports.length; i++) {
        const report = demoReports[i];
        const daysAgo = (5 - i); // Reports generated after tests
        reportStmt.run([
          report.id,
          report.labtest_id,
          report.retesting_requested,
          report.final_status,
          report.approved_by,
          report.comm_status,
          report.comm_channel,
          report.communicated_to_accounts,
          daysAgo
        ]);
      }
      reportStmt.finalize();
      console.log(`✅ Created ${demoReports.length} demo reports`);

      console.log(`🎉 Complete workflow demo data loaded!`);
      console.log(`📋 Demo workflow for LAB-2024-001: Receipt → Lab Test → Report → Dispatched`);
      console.log(`📋 Demo workflow for LAB-2024-002: Receipt → Lab Test (In Progress)`);
      console.log(`📋 Demo workflow for LAB-2024-003: Receipt → Lab Test (Started)`);
      
      resolve();
    } catch (err) {
      console.error('❌ Error loading demo data:', err);
      reject(err);
    }
  });
}

function generateId() {
  // Generate a random 32-character hex string (similar to the existing receipt ID format)
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

// Helper to promisify database operations
function dbAll(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Authentication endpoints
app.options('/api/auth/login', (req, res) => {
  res.json({ message: 'OK' });
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password required' });
    }
    
    const user = authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({ detail: 'Incorrect email or password' });
    }
    
    const accessToken = createAccessToken({
      sub: user.email,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    });
    
    res.json({
      access_token: accessToken,
      token_type: 'bearer',
      user_info: user
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

app.post('/api/auth/owner/otp-init', (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ detail: 'Phone number required' });
    }
    
    const otpCode = generateOTP();
    storeOTP(phone, otpCode);
    
    // Print to console (same as Python implementation)
    console.log('');
    console.log('🔐 OTP LOGIN CODE');
    console.log('='.repeat(30));
    console.log(`Phone: ${phone}`);
    console.log(`Code:  ${otpCode}`);
    console.log('Valid for: 5 minutes');
    console.log('='.repeat(30));
    console.log('');
    
    res.json({
      message: `OTP sent to ${phone}. Check console for code.`,
      expires_in_minutes: 5
    });
  } catch (error) {
    console.error('❌ OTP init error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

app.post('/api/auth/owner/otp-verify', (req, res) => {
  try {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({ detail: 'Phone and code required' });
    }
    
    if (!verifyOTP(phone, code)) {
      return res.status(401).json({ detail: 'Invalid or expired OTP code' });
    }
    
    const accessToken = createAccessToken({
      sub: phone,
      phone: phone,
      role: 'owner',
      scope: 'tracking'
    }, '15m'); // Shorter expiry for owner tokens
    
    const userInfo = {
      phone: phone,
      role: 'owner',
      scope: 'tracking'
    };
    
    res.json({
      access_token: accessToken,
      token_type: 'bearer',
      user_info: userInfo
    });
  } catch (error) {
    console.error('❌ OTP verify error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Additional owner auth endpoints (for compatibility with different frontend calls)
app.post('/api/owner/auth/request-otp', (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ detail: 'Email is required' });
    }
    
    // For now, treat email like phone for OTP generation
    const otpCode = generateOTP();
    storeOTP(email, otpCode);
    
    console.log('');
    console.log('🔐 EMAIL OTP LOGIN CODE');
    console.log('='.repeat(30));
    console.log(`Email: ${email}`);
    console.log(`Code:  ${otpCode}`);
    console.log('Valid for: 5 minutes');
    console.log('='.repeat(30));
    console.log('');
    
    res.json({
      message: `OTP sent to ${email}. Check console for code.`,
      expires_in_minutes: 5
    });
  } catch (error) {
    console.error('❌ Email OTP init error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

app.post('/api/owner/auth/verify-otp', (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ detail: 'Email and code required' });
    }
    
    if (!verifyOTP(email, code)) {
      return res.status(401).json({ detail: 'Invalid or expired OTP code' });
    }
    
    const accessToken = createAccessToken({
      sub: email,
      email: email,
      role: 'owner',
      scope: 'tracking'
    }, '15m');
    
    const userInfo = {
      email: email,
      role: 'owner',
      scope: 'tracking'
    };
    
    res.json({
      access_token: accessToken,
      token_type: 'bearer',
      user_info: userInfo
    });
  } catch (error) {
    console.error('❌ Email OTP verify error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

// Owner preferences endpoint
app.post('/api/owner/preferences', (req, res) => {
  try {
    const { email_notifications, sms_notifications, preferred_language } = req.body;
    
    console.log('📝 Owner preferences updated:', req.body);
    
    // For now, just acknowledge the preferences (could store in database later)
    res.json({
      message: 'Preferences updated successfully',
      preferences: {
        email_notifications: !!email_notifications,
        sms_notifications: !!sms_notifications,
        preferred_language: preferred_language || 'en'
      }
    });
  } catch (error) {
    console.error('❌ Owner preferences error:', error);
    res.status(500).json({ detail: 'Internal server error' });
  }
});

function dbGet(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Receipts
app.get('/api/receipts', async (req, res) => {
  try {
    console.log('📄 Fetching receipts...');
    const rows = await dbAll('SELECT * FROM receipts ORDER BY created_at DESC LIMIT 500');
    console.log(`📄 Found ${rows.length} receipts`);
    // Normalize rows: ensure count_boxes is numeric to avoid UI NaN issues
    const normalized = rows.map(r => ({
      ...r,
      count_boxes: Number(r.count_boxes ?? 0)
    }));
    // Return plain array (not wrapped) for compatibility with frontend expectations
    res.json(normalized);
  } catch (err) {
    console.error('❌ Error fetching receipts:', err);
    res.status(500).json({ error: 'Failed to fetch receipts', details: err.message });
  }
});

app.get('/api/receipts/:id', async (req, res) => {
  try {
    const row = await dbGet('SELECT * FROM receipts WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Receipt not found' });
    // fetch labtests
    const labtests = await dbAll('SELECT * FROM labtests WHERE receipt_id = ?', [req.params.id]);
    res.json({ ...row, lab_tests: labtests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

// Create new receipt
app.post('/api/receipts', async (req, res) => {
  try {
    const {
      receiver_name,
      contact_number,
      branch,
      company,
      count_boxes,
      receiving_mode,
      forward_to_central,
      courier_awb,
      receipt_date
    } = req.body;

    console.log('📝 Creating new receipt:', req.body);

    // Validate required fields
    if (!receiver_name || !contact_number || !branch || !company || !count_boxes || !receiving_mode || !receipt_date) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['receiver_name', 'contact_number', 'branch', 'company', 'count_boxes', 'receiving_mode', 'receipt_date']
      });
    }

    // Validate receiving mode
    if (!['PERSON', 'COURIER'].includes(receiving_mode)) {
      return res.status(400).json({ 
        error: 'Invalid receiving mode. Must be PERSON or COURIER' 
      });
    }

    // Business rule validation for AWB
    const needsAwb = 
      receiving_mode === 'COURIER' || 
      (branch.toLowerCase() !== 'central' && forward_to_central === 1);

    if (needsAwb && (!courier_awb || courier_awb.trim() === '')) {
      return res.status(400).json({ 
        error: 'AWB number is required when receiving mode is COURIER or when forwarding to Central from non-Central branch' 
      });
    }

    // Generate new receipt ID
    const currentYear = new Date().getFullYear();
    const existingCount = await dbGet('SELECT COUNT(*) as count FROM receipts WHERE id LIKE ?', [`LAB-${currentYear}-%`]);
    const nextNumber = (existingCount?.count || 0) + 1;
    const newId = `LAB-${currentYear}-${String(nextNumber).padStart(3, '0')}`;

    console.log(`📋 Generated new receipt ID: ${newId}`);

    // Insert receipt
    const result = await dbRun(`
      INSERT INTO receipts (
        id, receiver_name, contact_number, branch, company, count_boxes,
        receiving_mode, forward_to_central, courier_awb, receipt_date,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      newId,
      receiver_name,
      contact_number,
      branch,
      company,
      parseInt(count_boxes),
      receiving_mode,
      forward_to_central ? 1 : 0,
      courier_awb || null,
      receipt_date
    ]);

    console.log(`✅ Receipt created successfully with ID: ${newId}`);

    // Fetch and return the created receipt
    const createdReceipt = await dbGet('SELECT * FROM receipts WHERE id = ?', [newId]);
    
    res.status(201).json(createdReceipt);
  } catch (err) {
    console.error('❌ Error creating receipt:', err);
    res.status(500).json({ 
      error: 'Failed to create receipt', 
      details: err.message 
    });
  }
});

// Labtests
app.get('/api/labtests', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM labtests ORDER BY created_at DESC LIMIT 500');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch labtests' });
  }
});

// Get labtests that don't have reports yet (for report creation form)
app.get('/api/labtests/available-for-reports', async (req, res) => {
  console.log('🔍 Available labtests endpoint called');
  try {
    const query = `
      SELECT l.* 
      FROM labtests l
      LEFT JOIN reports r ON l.id = r.labtest_id
      WHERE r.id IS NULL
      ORDER BY l.created_at DESC
    `;
    const rows = await dbAll(query);
    console.log(`🔍 Found ${rows.length} available labtests`);
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching available labtests:', err);
    res.status(500).json({ error: 'Failed to fetch available labtests' });
  }
});

app.get('/api/labtests/:id', async (req, res) => {
  try {
    const row = await dbGet('SELECT * FROM labtests WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'LabTest not found' });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch labtest' });
  }
});

// Create new labtest
app.post('/api/labtests', async (req, res) => {
  try {
    const {
      receipt_id,
      lab_doc_no,
      lab_person,
      test_status,
      lab_report_status,
      remarks
    } = req.body;

    console.log('📝 Creating new labtest:', req.body);

    // Validate required fields
    if (!receipt_id) {
      return res.status(400).json({ 
        error: 'receipt_id is required' 
      });
    }

    // Check if receipt exists
    const receipt = await dbGet('SELECT id FROM receipts WHERE id = ?', [receipt_id]);
    if (!receipt) {
      return res.status(400).json({ 
        error: 'Receipt not found with the provided receipt_id' 
      });
    }

    // Generate new labtest ID
    const existingCount = await dbGet('SELECT COUNT(*) as count FROM labtests');
    const nextNumber = (existingCount?.count || 0) + 1;
    const newId = `LT-${String(nextNumber).padStart(3, '0')}`;

    console.log(`📋 Generated new labtest ID: ${newId}`);

    // Insert labtest
    await dbRun(`
      INSERT INTO labtests (
        id, receipt_id, lab_doc_no, lab_person, test_status, lab_report_status, remarks,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      newId,
      receipt_id,
      lab_doc_no || null,
      lab_person || null,
      test_status || 'PENDING',
      lab_report_status || 'PENDING',
      remarks || null
    ]);

    console.log(`✅ Labtest created successfully with ID: ${newId}`);

    // Fetch and return the created labtest
    const createdLabtest = await dbGet('SELECT * FROM labtests WHERE id = ?', [newId]);
    
    res.status(201).json(createdLabtest);
  } catch (err) {
    console.error('❌ Error creating labtest:', err);
    res.status(500).json({ 
      error: 'Failed to create labtest', 
      details: err.message 
    });
  }
});

// Reports with joined data (lab tests and receipts)
app.get('/api/reports', async (req, res) => {
  try {
    // Disable caching to ensure fresh data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    // Check the actual receipt IDs that exist
    const existingReceipts = await dbAll('SELECT id, company, count_boxes FROM receipts');
    console.log('🔍 Existing receipts:', existingReceipts);
    
    // Check what receipt IDs the labtests are referencing
    const labtestReceiptRefs = await dbAll('SELECT id, receipt_id FROM labtests');
    console.log('🔍 Labtest receipt references:', labtestReceiptRefs);
    
    // Check for orphaned labtests (labtests without valid receipts)
    const orphanedLabtests = await dbAll(`
      SELECT l.id, l.receipt_id 
      FROM labtests l 
      LEFT JOIN receipts r ON l.receipt_id = r.id 
      WHERE r.id IS NULL
    `);
    console.log('🔍 Orphaned labtests (no matching receipts):', orphanedLabtests);
    
    const query = `
      SELECT 
        r.*,
        l.receipt_id,
        l.lab_doc_no,
        l.lab_person,
        l.test_status,
        l.lab_report_status,
        l.remarks as lab_remarks,
        rec.receiver_name,
        rec.contact_number,
        rec.branch,
        rec.company,
        rec.count_boxes,
        rec.receiving_mode,
        rec.receipt_date
      FROM reports r
      LEFT JOIN labtests l ON r.labtest_id = l.id
      LEFT JOIN receipts rec ON l.receipt_id = rec.id
      ORDER BY r.created_at DESC 
      LIMIT 500
    `;
    const rows = await dbAll(query);
    
    console.log(`🔍 Reports API: Found ${rows.length} reports`);
    if (rows.length > 0) {
      console.log('🔍 First report data:', {
        id: rows[0].id,
        labtest_id: rows[0].labtest_id,
        receipt_id: rows[0].receipt_id,
        company: rows[0].company,
        count_boxes: rows[0].count_boxes,
        receiver_name: rows[0].receiver_name
      });
    }
    
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.get('/api/reports/:id', async (req, res) => {
  try {
    // Disable caching to ensure fresh data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    const query = `
      SELECT 
        r.*,
        l.receipt_id,
        l.lab_doc_no,
        l.lab_person,
        l.test_status,
        l.lab_report_status,
        l.remarks as lab_remarks,
        rec.receiver_name,
        rec.contact_number,
        rec.branch,
        rec.company,
        rec.count_boxes,
        rec.receiving_mode,
        rec.receipt_date
      FROM reports r
      LEFT JOIN labtests l ON r.labtest_id = l.id
      LEFT JOIN receipts rec ON l.receipt_id = rec.id
      WHERE r.id = ?
    `;
    const row = await dbGet(query, [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Report not found' });
    
    console.log(`🔍 Individual report data for ${req.params.id}:`, {
      id: row.id,
      company: row.company,
      count_boxes: row.count_boxes,
      receiver_name: row.receiver_name
    });
    
    res.json(row);
  } catch (err) {
    console.error('❌ Error fetching report:', err);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Create new report
app.post('/api/reports', async (req, res) => {
  try {
    const {
      labtest_id,
      retesting_requested,
      final_status,
      approved_by,
      comm_status,
      comm_channel,
      communicated_to_accounts
    } = req.body;

    console.log('📝 Creating new report:', req.body);

    // Validate required fields
    if (!labtest_id) {
      return res.status(400).json({ 
        error: 'labtest_id is required' 
      });
    }

    // Check if labtest exists
    console.log(`🔍 Checking if labtest exists with ID: ${labtest_id}`);
    const labtest = await dbGet('SELECT id FROM labtests WHERE id = ?', [labtest_id]);
    console.log(`🔍 Labtest found:`, labtest);
    if (!labtest) {
      console.log(`❌ Labtest not found with ID: ${labtest_id}`);
      return res.status(400).json({ 
        error: 'Labtest not found with the provided labtest_id' 
      });
    }

    // Check if report already exists for this labtest
    console.log(`🔍 Checking if report already exists for labtest: ${labtest_id}`);
    const existingReport = await dbGet('SELECT id FROM reports WHERE labtest_id = ?', [labtest_id]);
    console.log(`🔍 Existing report found:`, existingReport);
    if (existingReport) {
      console.log(`❌ Report already exists for labtest: ${labtest_id}`);
      return res.status(400).json({ 
        error: 'Report already exists for this labtest' 
      });
    }

    // Generate new report ID
    const existingCount = await dbGet('SELECT COUNT(*) as count FROM reports');
    const nextNumber = (existingCount?.count || 0) + 1;
    const newId = `RPT-${String(nextNumber).padStart(3, '0')}`;

    console.log(`📋 Generated new report ID: ${newId}`);

    // Insert report
    await dbRun(`
      INSERT INTO reports (
        id, labtest_id, retesting_requested, final_status, approved_by, 
        comm_status, comm_channel, communicated_to_accounts,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      newId,
      labtest_id,
      retesting_requested ? 1 : 0,
      final_status || 'DRAFT',
      approved_by || null,
      comm_status || 'PENDING',
      comm_channel || 'EMAIL',
      communicated_to_accounts ? 1 : 0
    ]);

    console.log(`✅ Report created successfully with ID: ${newId}`);

    // Fetch and return the created report with joined data
    const query = `
      SELECT 
        r.*,
        l.receipt_id,
        l.lab_doc_no,
        l.lab_person,
        l.test_status,
        l.lab_report_status,
        l.remarks as lab_remarks,
        rec.receiver_name,
        rec.contact_number,
        rec.branch,
        rec.company,
        rec.count_boxes,
        rec.receiving_mode,
        rec.receipt_date
      FROM reports r
      LEFT JOIN labtests l ON r.labtest_id = l.id
      LEFT JOIN receipts rec ON l.receipt_id = rec.id
      WHERE r.id = ?
    `;
    const createdReport = await dbGet(query, [newId]);
    
    res.status(201).json(createdReport);
  } catch (err) {
    console.error('❌ Error creating report:', err);
    res.status(500).json({ 
      error: 'Failed to create report', 
      details: err.message 
    });
  }
});

// Invoices
app.get('/api/invoices', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM invoices ORDER BY created_at DESC LIMIT 500');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

app.get('/api/invoices/:id', async (req, res) => {
  try {
    const row = await dbGet('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Invoice not found' });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Create new invoice
app.post('/api/invoices', async (req, res) => {
  try {
    const {
      report_id,
      amount,
      status,
      issued_at
    } = req.body;

    console.log('📝 Creating new invoice:', req.body);

    // Validate required fields
    if (!report_id || !amount) {
      return res.status(400).json({ 
        error: 'report_id and amount are required' 
      });
    }

    // Check if report exists
    const report = await dbGet('SELECT id FROM reports WHERE id = ?', [report_id]);
    if (!report) {
      return res.status(400).json({ 
        error: 'Report not found with the provided report_id' 
      });
    }

    // Generate new invoice ID and invoice number
    const existingCount = await dbGet('SELECT COUNT(*) as count FROM invoices');
    const nextNumber = (existingCount?.count || 0) + 1;
    const newId = `INV-${String(nextNumber).padStart(3, '0')}`;
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(nextNumber).padStart(4, '0')}`;

    console.log(`📋 Generated new invoice ID: ${newId}, Invoice No: ${invoiceNo}`);

    // Insert invoice with correct schema (matching alembic migration)
    await dbRun(`
      INSERT INTO invoices (
        id, report_id, invoice_no, status, amount, issued_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      newId,
      report_id,
      invoiceNo,
      status || 'DRAFT',
      parseFloat(amount),
      issued_at || new Date().toISOString()
    ]);

    console.log(`✅ Invoice created successfully with ID: ${newId}`);

    // Fetch and return the created invoice
    const createdInvoice = await dbGet('SELECT * FROM invoices WHERE id = ?', [newId]);
    
    res.status(201).json(createdInvoice);
  } catch (err) {
    console.error('❌ Error creating invoice:', err);
    res.status(500).json({ 
      error: 'Failed to create invoice', 
      details: err.message 
    });
  }
});

// PUT/PATCH endpoints for updates
// Update receipt
app.put('/api/receipts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log(`📝 Updating receipt ${id}:`, updates);
    
    // Build update query dynamically based on provided fields
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id); // Add id for WHERE clause
    
    await dbRun(`UPDATE receipts SET ${setClause}, updated_at = datetime('now') WHERE id = ?`, values);
    
    // Fetch and return updated record
    const updatedRecord = await dbGet('SELECT * FROM receipts WHERE id = ?', [id]);
    console.log(`✅ Receipt ${id} updated successfully`);
    
    res.json(updatedRecord);
  } catch (err) {
    console.error('❌ Error updating receipt:', err);
    res.status(500).json({ error: 'Failed to update receipt', details: err.message });
  }
});

// Also accept PATCH for partial updates (frontend may use PATCH)
app.patch('/api/receipts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log(`📝 PATCH updating receipt ${id}:`, updates);

    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);

    await dbRun(`UPDATE receipts SET ${setClause}, updated_at = datetime('now') WHERE id = ?`, values);
    const updatedRecord = await dbGet('SELECT * FROM receipts WHERE id = ?', [id]);
    console.log(`✅ Receipt ${id} patched successfully`);
    res.json(updatedRecord);
  } catch (err) {
    console.error('❌ Error patching receipt:', err);
    res.status(500).json({ error: 'Failed to patch receipt', details: err.message });
  }
});

// Update labtest
app.put('/api/labtests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log(`📝 Updating labtest ${id}:`, updates);
    
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);
    
    await dbRun(`UPDATE labtests SET ${setClause}, updated_at = datetime('now') WHERE id = ?`, values);
    
    const updatedRecord = await dbGet('SELECT * FROM labtests WHERE id = ?', [id]);
    console.log(`✅ Labtest ${id} updated successfully`);
    
    res.json(updatedRecord);
  } catch (err) {
    console.error('❌ Error updating labtest:', err);
    res.status(500).json({ error: 'Failed to update labtest', details: err.message });
  }
});

// Also accept PATCH for partial updates (frontend may use PATCH)
app.patch('/api/labtests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log(`📝 PATCH updating labtest ${id}:`, updates);

    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);

    await dbRun(`UPDATE labtests SET ${setClause}, updated_at = datetime('now') WHERE id = ?`, values);
    const updatedRecord = await dbGet('SELECT * FROM labtests WHERE id = ?', [id]);
    console.log(`✅ Labtest ${id} patched successfully`);
    res.json(updatedRecord);
  } catch (err) {
    console.error('❌ Error patching labtest:', err);
    res.status(500).json({ error: 'Failed to patch labtest', details: err.message });
  }
});

// Labtest transfer endpoint
app.post('/api/labtests/:id/transfer', async (req, res) => {
  try {
    const { id } = req.params;
    const { destination_lab, transfer_notes, estimated_arrival } = req.body;

    console.log(`📝 Transferring labtest ${id}:`, req.body);

    // Validate required fields
    if (!destination_lab) {
      return res.status(400).json({ 
        error: 'destination_lab is required' 
      });
    }

    // Check if labtest exists
    const labtest = await dbGet('SELECT * FROM labtests WHERE id = ?', [id]);
    if (!labtest) {
      return res.status(404).json({ error: 'Labtest not found' });
    }

    // Update labtest with transfer information
    const updates = {
      test_status: 'TRANSFERRED',
      lab_report_status: 'PENDING',
      remarks: `Transferred to ${destination_lab}. ${transfer_notes || ''}`.trim()
    };

    await dbRun(`
      UPDATE labtests 
      SET test_status = ?, lab_report_status = ?, remarks = ?, updated_at = datetime('now') 
      WHERE id = ?
    `, [updates.test_status, updates.lab_report_status, updates.remarks, id]);

    console.log(`✅ Labtest ${id} transferred to ${destination_lab}`);

    // Return updated labtest
    const updatedLabtest = await dbGet('SELECT * FROM labtests WHERE id = ?', [id]);
    
    res.json({
      message: `Labtest transferred to ${destination_lab} successfully`,
      labtest: updatedLabtest,
      transfer_details: {
        destination_lab,
        transfer_notes,
        estimated_arrival,
        transferred_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('❌ Error transferring labtest:', err);
    res.status(500).json({ error: 'Failed to transfer labtest', details: err.message });
  }
});

// Update report
app.put('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log(`📝 Updating report ${id}:`, updates);
    
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);
    
    await dbRun(`UPDATE reports SET ${setClause}, updated_at = datetime('now') WHERE id = ?`, values);
    
    const updatedRecord = await dbGet('SELECT * FROM reports WHERE id = ?', [id]);
    console.log(`✅ Report ${id} updated successfully`);
    
    res.json(updatedRecord);
  } catch (err) {
    console.error('❌ Error updating report:', err);
    res.status(500).json({ error: 'Failed to update report', details: err.message });
  }
});

// Also accept PATCH for partial updates (frontend may use PATCH)
app.patch('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log(`📝 PATCH updating report ${id}:`, updates);

    // Separate report fields from labtest fields
    const reportFields = ['retesting_requested', 'final_status', 'approved_by', 'comm_status', 'comm_channel', 'communicated_to_accounts'];
    const labtestFields = ['test_status', 'lab_report_status', 'lab_remarks'];
    
    const reportUpdates = {};
    const labtestUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (reportFields.includes(key)) {
        reportUpdates[key] = updates[key];
      } else if (labtestFields.includes(key)) {
        // Map lab_remarks back to remarks for the labtests table
        const fieldName = key === 'lab_remarks' ? 'remarks' : key;
        labtestUpdates[fieldName] = updates[key];
      }
    });

    // Update reports table if there are report fields to update
    if (Object.keys(reportUpdates).length > 0) {
      const reportFieldKeys = Object.keys(reportUpdates);
      const reportSetClause = reportFieldKeys.map(field => `${field} = ?`).join(', ');
      const reportValues = reportFieldKeys.map(field => reportUpdates[field]);
      reportValues.push(id);
      
      await dbRun(`UPDATE reports SET ${reportSetClause}, updated_at = datetime('now') WHERE id = ?`, reportValues);
      console.log(`✅ Report table updated for ${id}`);
    }

    // Update labtests table if there are labtest fields to update
    if (Object.keys(labtestUpdates).length > 0) {
      // First get the labtest_id from the report
      const report = await dbGet('SELECT labtest_id FROM reports WHERE id = ?', [id]);
      if (report && report.labtest_id) {
        const labtestFieldKeys = Object.keys(labtestUpdates);
        const labtestSetClause = labtestFieldKeys.map(field => `${field} = ?`).join(', ');
        const labtestValues = labtestFieldKeys.map(field => labtestUpdates[field]);
        labtestValues.push(report.labtest_id);
        
        await dbRun(`UPDATE labtests SET ${labtestSetClause}, updated_at = datetime('now') WHERE id = ?`, labtestValues);
        console.log(`✅ Labtest table updated for ${report.labtest_id}`);
      }
    }

    // Return the updated record with all joined data
    const query = `
      SELECT 
        r.*,
        l.receipt_id,
        l.lab_doc_no,
        l.lab_person,
        l.test_status,
        l.lab_report_status,
        l.remarks as lab_remarks,
        rec.receiver_name,
        rec.contact_number,
        rec.branch,
        rec.company,
        rec.count_boxes,
        rec.receiving_mode,
        rec.receipt_date
      FROM reports r
      LEFT JOIN labtests l ON r.labtest_id = l.id
      LEFT JOIN receipts rec ON l.receipt_id = rec.id
      WHERE r.id = ?
    `;
    const updatedRecord = await dbGet(query, [id]);
    console.log(`✅ Report ${id} patched successfully`);
    res.json(updatedRecord);
  } catch (err) {
    console.error('❌ Error patching report:', err);
    res.status(500).json({ error: 'Failed to patch report', details: err.message });
  }
});

// Approve report
app.post('/api/reports/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { approved_by } = req.body;
    
    console.log(`✅ Approving report ${id} by ${approved_by}`);
    
    // Update report status to approved
    await dbRun(
      `UPDATE reports SET 
        final_status = 'APPROVED', 
        approved_by = ?, 
        updated_at = datetime('now') 
      WHERE id = ?`, 
      [approved_by, id]
    );
    
    // Get updated report
    const updatedReport = await dbGet('SELECT * FROM reports WHERE id = ?', [id]);
    
    if (!updatedReport) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    console.log(`✅ Report ${id} approved successfully by ${approved_by}`);
    res.json(updatedReport);
  } catch (err) {
    console.error('❌ Error approving report:', err);
    res.status(500).json({ error: 'Failed to approve report', details: err.message });
  }
});

// Update invoice
app.put('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log(`📝 Updating invoice ${id}:`, updates);
    
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);
    
    await dbRun(`UPDATE invoices SET ${setClause}, updated_at = datetime('now') WHERE id = ?`, values);
    
    const updatedRecord = await dbGet('SELECT * FROM invoices WHERE id = ?', [id]);
    console.log(`✅ Invoice ${id} updated successfully`);
    
    res.json(updatedRecord);
  } catch (err) {
    console.error('❌ Error updating invoice:', err);
    res.status(500).json({ error: 'Failed to update invoice', details: err.message });
  }
});

// Also accept PATCH for partial updates (frontend may use PATCH)
app.patch('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    console.log(`📝 PATCH updating invoice ${id}:`, updates);

    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);

    await dbRun(`UPDATE invoices SET ${setClause}, updated_at = datetime('now') WHERE id = ?`, values);
    const updatedRecord = await dbGet('SELECT * FROM invoices WHERE id = ?', [id]);
    console.log(`✅ Invoice ${id} patched successfully`);
    res.json(updatedRecord);
  } catch (err) {
    console.error('❌ Error patching invoice:', err);
    res.status(500).json({ error: 'Failed to patch invoice', details: err.message });
  }
});

// Owner track
app.get('/api/owner/track/:query', async (req, res) => {
  const q = req.params.query;
  console.log(`🔍 Owner tracking search for: "${q}"`);
  try {
    // Search in multiple fields: id, courier_awb, contact_number, company, receiver_name
    const receipt = await dbGet(`
      SELECT * FROM receipts 
      WHERE id = ? 
        OR courier_awb = ? 
        OR contact_number = ? 
        OR company LIKE ? 
        OR receiver_name LIKE ?
    `, [q, q, q, `%${q}%`, `%${q}%`]);
    
    if (!receipt) {
      console.log(`❌ No receipt found for query: "${q}"`);
      
      // Get some sample data to help with debugging
      const samples = await dbAll('SELECT id, company, contact_number FROM receipts LIMIT 3');
      console.log('📋 Available sample data:', samples);
      
      return res.status(404).json({ 
        found: false, 
        message: `No records found for "${q}"`,
        suggestions: samples.map(s => ({
          searchBy: 'company',
          value: s.company,
          example: `Try searching for "${s.company}"`
        }))
      });
    }

    console.log(`✅ Found receipt: ${receipt.id} for ${receipt.receiver_name}`);
    
    // Get COMPLETE workflow data from ALL tables
    console.log(`📊 Building complete workflow for receipt ${receipt.id}...`);
    
    // Build comprehensive timeline from actual lab workflow
    const workflowQuery = `
      SELECT 
        'receipt' as step_type,
        r.id as step_id,
        r.created_at as timestamp,
        'received' as status,
        'Sample received at ' || r.branch as description,
        r.receiver_name || ' - ' || r.count_boxes || ' boxes' as details,
        1 as sort_order
      FROM receipts r WHERE r.id = ?
      
      UNION ALL
      
      SELECT 
        'labtest' as step_type,
        l.id as step_id,
        l.created_at as timestamp,
        l.test_status as status,
        CASE 
          WHEN l.test_status = 'STARTED' THEN 'Lab testing started by ' || COALESCE(l.lab_person, 'Lab Team')
          WHEN l.test_status = 'IN_PROGRESS' THEN 'Analysis in progress - ' || COALESCE(l.remarks, 'Testing ongoing')
          WHEN l.test_status = 'COMPLETED' THEN 'Lab analysis completed - ' || COALESCE(l.remarks, 'Results ready for review')
          WHEN l.test_status = 'PENDING' THEN 'Test assigned - ' || COALESCE(l.remarks, 'Waiting to start')
          ELSE 'Lab test ' || l.test_status
        END as description,
        'Doc: ' || COALESCE(l.lab_doc_no, 'TBD') as details,
        2 as sort_order
      FROM labtests l WHERE l.receipt_id = ?
      
      UNION ALL
      
      SELECT 
        'report' as step_type,
        rp.id as step_id,
        rp.created_at as timestamp,
        rp.final_status as status,
        CASE 
          WHEN rp.final_status = 'DRAFT' THEN 'Report being prepared'
          WHEN rp.final_status = 'READY_FOR_APPROVAL' THEN 'Report ready for review'
          WHEN rp.final_status = 'APPROVED' THEN 'Report approved by ' || COALESCE(rp.approved_by, 'Lab Manager')
          WHEN rp.final_status = 'REJECTED' THEN 'Report requires revision'
          ELSE 'Report ' || rp.final_status
        END as description,
        CASE 
          WHEN rp.comm_status = 'DISPATCHED' THEN 'Report dispatched via ' || rp.comm_channel
          WHEN rp.comm_status = 'DELIVERED' THEN 'Report delivered successfully'
          ELSE 'Status: ' || rp.comm_status
        END as details,
        3 as sort_order
      FROM reports rp 
      JOIN labtests l2 ON rp.labtest_id = l2.id 
      WHERE l2.receipt_id = ?
      
      ORDER BY sort_order ASC, timestamp ASC
    `;
    
    const workflowSteps = await dbAll(workflowQuery, [receipt.id, receipt.id, receipt.id]);
    console.log(`📊 Found ${workflowSteps.length} workflow steps for receipt ${receipt.id}`);
    
    // Transform workflow steps into owner-friendly timeline
    const timeline = workflowSteps.map((step, index) => ({
      step: step.description,
      status: 'completed', // All past steps are completed
      timestamp: step.timestamp,
      description: step.details,
      step_type: step.step_type,
      order: index + 1
    }));
    
    // Get current status from latest workflow step
    const currentStep = workflowSteps.length > 0 ? 
      workflowSteps[workflowSteps.length - 1].description : 
      'Sample Received';
    
    // Get associated documents from reports
    const documents = await dbAll(`
      SELECT 
        'lab_report' as doc_type,
        rp.id as doc_id,
        'Lab Report - ' || COALESCE(l.lab_doc_no, 'Pending') as title,
        rp.final_status as status,
        rp.created_at as date,
        rp.comm_status as delivery_status
      FROM reports rp
      JOIN labtests l ON rp.labtest_id = l.id
      WHERE l.receipt_id = ?
      ORDER BY rp.created_at DESC
    `, [receipt.id]);
    
    console.log(`📋 Found ${documents.length} documents for receipt ${receipt.id}`);
    
    return res.json({ 
      found: true, 
      type: 'receipt', 
      id: receipt.id, 
      current_step: currentStep,
      workflow_progress: {
        total_steps: timeline.length,
        completed_steps: timeline.filter(t => t.status === 'completed').length,
        current_phase: workflowSteps.length > 0 ? workflowSteps[workflowSteps.length - 1].step_type : 'receipt'
      },
      timeline,
      documents: documents || [],
      receipt: {
        id: receipt.id,
        receiver_name: receipt.receiver_name,
        company: receipt.company,
        contact_number: receipt.contact_number,
        count_boxes: receipt.count_boxes,
        branch: receipt.branch,
        receipt_date: receipt.receipt_date,
        receiving_mode: receipt.receiving_mode,
        courier_awb: receipt.courier_awb
      }
    });
  } catch (err) {
    console.error('❌ Error in owner tracking:', err);
    res.status(500).json({ error: 'Failed to track', message: err.message });
  }
});

// Simple health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint to see current receipts
app.get('/api/debug/receipts', async (req, res) => {
  try {
    const receipts = await dbAll('SELECT id, company, contact_number, courier_awb FROM receipts LIMIT 10');
    res.json({ receipts, count: receipts.length });
  } catch (err) {
    console.error('❌ Error fetching debug receipts:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fix existing receipts with readable IDs
app.get('/api/fix-receipt-ids', async (req, res) => {
  try {
    const receipts = await dbAll('SELECT id, company FROM receipts ORDER BY created_at');
    
    const updates = [
      { oldId: receipts[0]?.id, newId: 'LAB-2024-001' },
      { oldId: receipts[1]?.id, newId: 'LAB-2024-002' },
      { oldId: receipts[2]?.id, newId: 'LAB-2024-003' }
    ];
    
    let updated = 0;
    for (const update of updates) {
      if (update.oldId) {
        await new Promise((resolve, reject) => {
          db.run('UPDATE receipts SET id = ? WHERE id = ?', [update.newId, update.oldId], function(err) {
            if (err) reject(err);
            else {
              console.log(`✅ Updated receipt ${update.oldId} → ${update.newId}`);
              updated++;
              resolve();
            }
          });
        });
      }
    }
    
    res.json({ message: `Updated ${updated} receipt IDs`, updates });
  } catch (err) {
    console.error('❌ Error fixing receipt IDs:', err);
    res.status(500).json({ error: err.message });
  }
});

// Demo data reset endpoint - Complete workflow
app.post('/api/reset-demo-data', async (req, res) => {
  try {
    console.log('🔄 Resetting complete workflow demo data...');
    
    // Clear existing data in proper order (due to foreign keys)
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM reports', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM labtests', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM receipts', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('🗑️ Cleared existing workflow data');
    
    // Load complete demo workflow
    await loadDemoData();
    
    res.json({ 
      message: 'Complete workflow demo data reset successfully',
      workflow: {
        receipts_loaded: 3,
        labtests_loaded: 3,
        reports_loaded: 1,
        demonstration: [
          'LAB-2024-001: Complete workflow (Receipt → Lab Test → Report → Dispatched)',
          'LAB-2024-002: Testing in progress (Receipt → Lab Test in progress)',
          'LAB-2024-003: Testing started (Receipt → Lab Test started)'
        ]
      }
    });
  } catch (error) {
    console.error('❌ Error resetting demo data:', error);
    res.status(500).json({ error: 'Failed to reset demo data' });
  }
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const tables = await dbAll("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    const tableNames = tables.map(t => t.name);
    
    let receiptCount = 0;
    try {
      const countResult = await dbGet('SELECT COUNT(*) as count FROM receipts');
      receiptCount = countResult.count;
    } catch (err) {
      console.log('⚠️  Receipts table might not exist:', err.message);
    }
    
    res.json({ 
      database: 'connected', 
      tables: tableNames,
      receiptCount: receiptCount,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Database test error:', err);
    res.status(500).json({ error: 'Database test failed', details: err.message });
  }
});

// Check specific table schema
app.get('/api/schema/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const columns = await dbAll(`PRAGMA table_info(${tableName})`);
    
    res.json({
      table: tableName,
      columns: columns,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error(`❌ Error checking schema for ${req.params.tableName}:`, err);
    res.status(500).json({ error: 'Schema check failed', details: err.message });
  }
});

// Clear all data and reinitialize database
app.post('/api/admin/reset-database', async (req, res) => {
  try {
    console.log('🔄 Starting database reset...');
    
    // Delete all data from tables (in reverse order of dependencies)
    await dbRun('DELETE FROM invoices');
    console.log('✅ Cleared invoices table');
    
    await dbRun('DELETE FROM reports');
    console.log('✅ Cleared reports table');
    
    await dbRun('DELETE FROM labtests');
    console.log('✅ Cleared labtests table');
    
    await dbRun('DELETE FROM receipts');
    console.log('✅ Cleared receipts table');
    
    // Reset auto-increment counters if using AUTOINCREMENT (only if table exists)
    try {
      await dbRun('DELETE FROM sqlite_sequence WHERE name IN ("receipts", "labtests", "reports", "invoices")');
      console.log('✅ Reset sequence counters');
    } catch (err) {
      console.log('ℹ️ No sequence counters to reset (table not using AUTOINCREMENT)');
    }
    
    // Reload demo data
    await loadDemoData();
    console.log('✅ Demo data reloaded');
    
    // Get counts to verify
    const receiptCount = await dbGet('SELECT COUNT(*) as count FROM receipts');
    const labtestCount = await dbGet('SELECT COUNT(*) as count FROM labtests');
    const reportCount = await dbGet('SELECT COUNT(*) as count FROM reports');
    const invoiceCount = await dbGet('SELECT COUNT(*) as count FROM invoices');
    
    res.json({
      message: 'Database reset and reinitialized successfully',
      counts: {
        receipts: receiptCount.count,
        labtests: labtestCount.count,
        reports: reportCount.count,
        invoices: invoiceCount.count
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Database reset error:', err);
    res.status(500).json({ error: 'Database reset failed', details: err.message });
  }
});

// Catch-all handler: send back React's index.html file for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Tracelite unified server listening on http://localhost:${port}`);
  console.log(`Frontend: http://localhost:${port}`);
  console.log(`API: http://localhost:${port}/api`);
});
