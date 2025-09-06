const path = require('path');
const express = require('express');
const morgan = require('morgan');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());
app.use(morgan('dev'));

// Serve static frontend files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Database file - point to repo data db if exists
const dbFile = path.resolve(__dirname, '..', '..', 'data', 'tracelite.db');
const db = new Database(dbFile, { readonly: true });

// Helpers
function rowToObj(row) {
  return row;
}

// Receipts
app.get('/api/receipts', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM receipts ORDER BY created_at DESC LIMIT 500').all();
    res.json(rows.map(rowToObj));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

app.get('/api/receipts/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM receipts WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Receipt not found' });
    // fetch labtests
    const labtests = db.prepare('SELECT * FROM labtests WHERE receipt_id = ?').all(req.params.id);
    res.json({ ...row, lab_tests: labtests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

// Labtests
app.get('/api/labtests', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM labtests ORDER BY created_at DESC LIMIT 500').all();
    res.json(rows.map(rowToObj));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch labtests' });
  }
});

app.get('/api/labtests/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM labtests WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'LabTest not found' });
    res.json(rowToObj(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch labtest' });
  }
});

// Reports
app.get('/api/reports', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM reports ORDER BY created_at DESC LIMIT 500').all();
    res.json(rows.map(rowToObj));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.get('/api/reports/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Report not found' });
    res.json(rowToObj(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Invoices
app.get('/api/invoices', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC LIMIT 500').all();
    res.json(rows.map(rowToObj));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

app.get('/api/invoices/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Invoice not found' });
    res.json(rowToObj(row));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Owner track
app.get('/api/owner/track/:query', (req, res) => {
  const q = req.params.query;
  try {
    // try to find receipt by tracking number or awb_no or id
    const receipt = db.prepare('SELECT * FROM receipts WHERE id = ? OR courier_awb = ? OR courier_awb = ?').get(q, q, q);
    if (!receipt) return res.status(404).json({ found: false });

    const labtests = db.prepare('SELECT * FROM labtests WHERE receipt_id = ?').all(receipt.id);
    return res.json({ found: true, type: 'receipt', id: receipt.id, current_step: labtests.length ? labtests[0].test_status : null, timeline: labtests.map(lt => ({ step: lt.test_status, timestamp: lt.created_at, description: lt.remarks })), documents: [] });
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
