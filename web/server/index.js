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
      id: generateId(),
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
      id: generateId(),
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
      id: generateId(),
      receiver_name: 'GreenEnergy Coordinator',
      contact_number: '+1-555-123-0103',
      branch: 'Environmental Lab',
      company: 'GreenEnergy Solutions',
      count_boxes: 1,
      receiving_mode: 'PERSON',
      forward_to_central: 0,
      courier_awb: null,
      receipt_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 5 days ago
    },
    {
      id: generateId(),
      receiver_name: 'BioMed Lab Technician',
      contact_number: '+1-555-123-0104',
      branch: 'Medical Lab',
      company: 'BioMed Research',
      count_boxes: 4,
      receiving_mode: 'COURIER',
      forward_to_central: 1,
      courier_awb: 'AWB987654321',
      receipt_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3 days ago
    },
    {
      id: generateId(),
      receiver_name: 'PharmaTech Quality Control',
      contact_number: '+1-555-123-0105',
      branch: 'Quality Control Lab',
      company: 'PharmaTech Industries',
      count_boxes: 2,
      receiving_mode: 'PERSON',
      forward_to_central: 0,
      courier_awb: null,
      receipt_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 day ago
    }
  ];

  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`INSERT INTO receipts (
      id, receiver_name, contact_number, branch, company, count_boxes,
      receiving_mode, forward_to_central, courier_awb, receipt_date,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`);

    let completed = 0;
    demoReceipts.forEach(receipt => {
      stmt.run([
        receipt.id,
        receipt.receiver_name,
        receipt.contact_number,
        receipt.branch,
        receipt.company,
        receipt.count_boxes,
        receipt.receiving_mode,
        receipt.forward_to_central,
        receipt.courier_awb,
        receipt.receipt_date
      ], (err) => {
        if (err) {
          console.error('❌ Error inserting demo receipt:', err);
        } else {
          console.log(`✅ Created demo receipt: ${receipt.receiver_name}`);
        }
        
        completed++;
        if (completed === demoReceipts.length) {
          stmt.finalize();
          console.log(`🎉 Demo data loaded: ${demoReceipts.length} receipts created`);
          resolve();
        }
      });
    });
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

// Reports with joined data (lab tests and receipts)
app.get('/api/reports', async (req, res) => {
  try {
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
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.get('/api/reports/:id', async (req, res) => {
  try {
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
    res.json(row);
  } catch (err) {
    console.error('❌ Error fetching report:', err);
    res.status(500).json({ error: 'Failed to fetch report' });
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

    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);

    await dbRun(`UPDATE reports SET ${setClause}, updated_at = datetime('now') WHERE id = ?`, values);
    const updatedRecord = await dbGet('SELECT * FROM reports WHERE id = ?', [id]);
    console.log(`✅ Report ${id} patched successfully`);
    res.json(updatedRecord);
  } catch (err) {
    console.error('❌ Error patching report:', err);
    res.status(500).json({ error: 'Failed to patch report', details: err.message });
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
  try {
    // try to find receipt by tracking number or awb_no or id
    const receipt = await dbGet('SELECT * FROM receipts WHERE id = ? OR courier_awb = ? OR courier_awb = ?', [q, q, q]);
    if (!receipt) return res.status(404).json({ found: false });

    const labtests = await dbAll('SELECT * FROM labtests WHERE receipt_id = ?', [receipt.id]);
    return res.json({ 
      found: true, 
      type: 'receipt', 
      id: receipt.id, 
      current_step: labtests.length ? labtests[0].test_status : null, 
      timeline: labtests.map(lt => ({ 
        step: lt.test_status, 
        timestamp: lt.created_at, 
        description: lt.remarks 
      })), 
      documents: [] 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to track' });
  }
});

// Simple health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Demo data reset endpoint
app.post('/api/reset-demo-data', async (req, res) => {
  try {
    console.log('🔄 Resetting demo data...');
    
    // Clear existing receipts
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM receipts', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('🗑️ Cleared existing receipts');
    
    // Load demo data
    await loadDemoData();
    
    res.json({ 
      message: 'Demo data reset successfully',
      receipts_loaded: 5
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
