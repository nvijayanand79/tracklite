const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file
const dbFile = path.resolve(__dirname, '..', '..', 'tracelite.db');
const db = new sqlite3.Database(dbFile);

console.log('🔍 Checking reports data...');

// Query to check reports with joined data (same as API)
const query = `
  SELECT 
    r.id as report_id,
    r.labtest_id,
    l.receipt_id,
    rec.company,
    rec.count_boxes,
    rec.receiver_name
  FROM reports r
  LEFT JOIN labtests l ON r.labtest_id = l.id
  LEFT JOIN receipts rec ON l.receipt_id = rec.id
  LIMIT 5
`;

db.all(query, [], (err, rows) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.close();
    return;
  }
  
  console.log(`Found ${rows.length} reports:`);
  rows.forEach((row, index) => {
    console.log(`\nReport ${index + 1}:`);
    console.log(`  Report ID: ${row.report_id}`);
    console.log(`  Lab Test ID: ${row.labtest_id}`);
    console.log(`  Receipt ID: ${row.receipt_id}`);
    console.log(`  Company: ${row.company || 'NULL/EMPTY'}`);
    console.log(`  Count Boxes: ${row.count_boxes || 'NULL/EMPTY'}`);
    console.log(`  Receiver Name: ${row.receiver_name || 'NULL/EMPTY'}`);
  });
  
  // Also check if we have any receipts at all
  db.all('SELECT COUNT(*) as count FROM receipts', [], (err, result) => {
    if (!err) {
      console.log(`\n📊 Total receipts in database: ${result[0].count}`);
    }
    
    // Check lab tests
    db.all('SELECT COUNT(*) as count FROM labtests', [], (err, result) => {
      if (!err) {
        console.log(`📊 Total lab tests in database: ${result[0].count}`);
      }
      
      // Check reports
      db.all('SELECT COUNT(*) as count FROM reports', [], (err, result) => {
        if (!err) {
          console.log(`📊 Total reports in database: ${result[0].count}`);
        }
        db.close();
      });
    });
  });
});
