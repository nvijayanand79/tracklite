const path = require('path');
const express = require('express');
const morgan = require('morgan');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());
app.use(morgan('dev'));

// Serve static frontend files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Database file - point to repo data db if exists
const dbFile = path.resolve(__dirname, '..', '..', 'tracelite.db');
const db = new sqlite3.Database(dbFile, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database:', dbFile);
  }
});

// Helper to promisify database operations
function dbAll(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbGet(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Receipts
app.get('/api/receipts', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM receipts ORDER BY created_at DESC LIMIT 500');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch receipts' });
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

// Reports
app.get('/api/reports', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM reports ORDER BY created_at DESC LIMIT 500');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.get('/api/reports/:id', async (req, res) => {
  try {
    const row = await dbGet('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Report not found' });
    res.json(row);
  } catch (err) {
    console.error(err);
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
  res.json({ status: 'ok' });
});

// Catch-all handler: send back React's index.html file for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 5173;
app.listen(port, () => {
  console.log(`Tracelite unified server listening on http://localhost:${port}`);
  console.log(`Frontend: http://localhost:${port}`);
  console.log(`API: http://localhost:${port}/api`);
});
