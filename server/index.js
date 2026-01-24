import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connection String
const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

let dbPool = null;
let isConnected = false;

async function connectDatabase() {
  try {
    console.log('🔄 Mencoba koneksi ke database...');
    dbPool = await odbc.pool(connectionString);
    isConnected = true;
    console.log('✅ Koneksi ke database Sybase berhasil!');
    return true;
  } catch (error) {
    isConnected = false;
    console.error('❌ Gagal koneksi ke database:', error.message);
    return false;
  }
}

async function executeQuery(sql, params = []) {
  if (!dbPool || !isConnected) {
    throw new Error('Database tidak terhubung');
  }
  const connection = await dbPool.connect();
  try {
    const result = await connection.query(sql, params);
    return result;
  } finally {
    await connection.close();
  }
}

// ==================== STATUS ====================
app.get('/api/test', async (req, res) => {
  if (!isConnected) await connectDatabase();
  try {
    const result = await executeQuery('SELECT 1 as test');
    res.json({ success: true, message: 'Koneksi database berhasil!', data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/tables', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT t.table_name, u.user_name as owner
      FROM SYSTABLE t
      JOIN SYSUSERPERM u ON t.creator = u.user_id
      WHERE t.table_type = 'BASE' 
        AND u.user_name NOT IN ('SYS', 'rs_systabgroup', 'dbo')
        AND t.table_name NOT LIKE 'sa_%'
        AND t.table_name NOT LIKE 'spt_%'
        AND t.table_name NOT LIKE 'ix_%'
        AND t.table_name NOT LIKE 'rs_%'
        AND t.table_name NOT LIKE 'migrate_%'
        AND t.table_name NOT LIKE 'jdbc_%'
      ORDER BY t.table_name
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== UNITS (MASTER SATUAN) ====================
app.get('/api/units', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Units ORDER BY code');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/units/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Units WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: result[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/units', async (req, res) => {
  try {
    const { code, name, description } = req.body;
    await executeQuery(
      'INSERT INTO Units (code, name, description) VALUES (?, ?, ?)',
      [code, name, description || '']
    );
    const result = await executeQuery('SELECT * FROM Units WHERE code = ?', [code]);
    res.json({ success: true, data: result[0], message: 'Satuan berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/units/:id', async (req, res) => {
  try {
    const { code, name, description } = req.body;
    await executeQuery(
      'UPDATE Units SET code = ?, name = ?, description = ? WHERE id = ?',
      [code, name, description, req.params.id]
    );
    res.json({ success: true, message: 'Satuan berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/units/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM Units WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Satuan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== TRANSACTIONS (MASTER TRANSAKSI) ====================
app.get('/api/transactions', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Transactions ORDER BY nomortranscode');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/transactions/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Transactions WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: result[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { nomortranscode, description } = req.body;
    await executeQuery(
      'INSERT INTO Transactions (nomortranscode, description) VALUES (?, ?)',
      [nomortranscode, description]
    );
    const result = await executeQuery('SELECT * FROM Transactions WHERE nomortranscode = ?', [nomortranscode]);
    res.json({ success: true, data: result[0], message: 'Transaksi berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { nomortranscode, description } = req.body;
    await executeQuery(
      'UPDATE Transactions SET nomortranscode = ?, description = ? WHERE id = ?',
      [nomortranscode, description, req.params.id]
    );
    res.json({ success: true, message: 'Transaksi berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM Transactions WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Transaksi berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== TRANSCODES (MASTER KODE TRANSAKSI) ====================
app.get('/api/transcodes', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Transcodes ORDER BY code');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/transcodes/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Transcodes WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: result[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/transcodes', async (req, res) => {
  try {
    const { code, name, prefix, format, description, nomortranscode } = req.body;
    await executeQuery(
      'INSERT INTO Transcodes (code, name, prefix, format, description, nomortranscode) VALUES (?, ?, ?, ?, ?, ?)',
      [code, name, prefix, format || '{PREFIX}/{MM}{YYYY}/{SEQ}', description || '', nomortranscode || null]
    );
    const result = await executeQuery('SELECT * FROM Transcodes WHERE code = ?', [code]);
    res.json({ success: true, data: result[0], message: 'Transcode berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/transcodes/:id', async (req, res) => {
  try {
    const { code, name, prefix, format, description, active, nomortranscode } = req.body;
    await executeQuery(
      'UPDATE Transcodes SET code = ?, name = ?, prefix = ?, format = ?, description = ?, active = ?, nomortranscode = ? WHERE id = ?',
      [code, name, prefix, format, description, active || 'Y', nomortranscode || null, req.params.id]
    );
    res.json({ success: true, message: 'Transcode berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/transcodes/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM Transcodes WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Transcode berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate document number based on transcode
app.get('/api/transcodes/:code/generate', async (req, res) => {
  try {
    const transcode = await executeQuery('SELECT * FROM Transcodes WHERE code = ?', [req.params.code]);
    if (!transcode[0]) {
      return res.status(404).json({ success: false, error: 'Transcode tidak ditemukan' });
    }

    const tc = transcode[0];
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const seq = String(tc.last_number + 1).padStart(4, '0');

    // Generate based on format
    let docNumber = tc.format
      .replace('{PREFIX}', tc.prefix)
      .replace('{YYYY}', year)
      .replace('{YY}', year.slice(-2))
      .replace('{MM}', month)
      .replace('{DD}', day)
      .replace('{SEQ}', seq);

    // Update last number
    await executeQuery('UPDATE Transcodes SET last_number = last_number + 1 WHERE code = ?', [req.params.code]);

    res.json({ success: true, doc_number: docNumber, transcode: tc });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ITEMS (MASTER ITEM) ====================
app.get('/api/items', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Items ORDER BY code');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Items WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: result[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const { code, name, unit, standard_cost, standard_price } = req.body;
    await executeQuery(
      'INSERT INTO Items (code, name, unit, standard_cost, standard_price) VALUES (?, ?, ?, ?, ?)',
      [code, name, unit || '', standard_cost || 0, standard_price || 0]
    );
    const result = await executeQuery('SELECT * FROM Items WHERE code = ?', [code]);
    res.json({ success: true, data: result[0], message: 'Item berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    const { code, name, unit, standard_cost, standard_price } = req.body;
    await executeQuery(
      'UPDATE Items SET code = ?, name = ?, unit = ?, standard_cost = ?, standard_price = ? WHERE id = ?',
      [code, name, unit, standard_cost, standard_price, req.params.id]
    );
    res.json({ success: true, message: 'Item berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM Items WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Item berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PARTNERS (SUPPLIER & CUSTOMER) ====================
app.get('/api/partners', async (req, res) => {
  try {
    const { type } = req.query;
    let sql = 'SELECT * FROM Partners';
    const params = [];
    if (type) {
      sql += ' WHERE type = ?';
      params.push(type);
    }
    sql += ' ORDER BY code';
    const result = await executeQuery(sql, params);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/partners/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Partners WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: result[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/partners', async (req, res) => {
  try {
    const { code, name, type, address, phone } = req.body;
    await executeQuery(
      'INSERT INTO Partners (code, name, type, address, phone) VALUES (?, ?, ?, ?, ?)',
      [code, name, type, address || '', phone || '']
    );
    const result = await executeQuery('SELECT * FROM Partners WHERE code = ?', [code]);
    res.json({ success: true, data: result[0], message: 'Partner berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/partners/:id', async (req, res) => {
  try {
    const { code, name, type, address, phone } = req.body;
    await executeQuery(
      'UPDATE Partners SET code = ?, name = ?, type = ?, address = ?, phone = ? WHERE id = ?',
      [code, name, type, address, phone, req.params.id]
    );
    res.json({ success: true, message: 'Partner berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/partners/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM Partners WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Partner berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SALESPERSONS ====================
app.get('/api/salespersons', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM SalesPersons ORDER BY code');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/salespersons', async (req, res) => {
  try {
    const { code, name, phone, email } = req.body;
    await executeQuery(
      'INSERT INTO SalesPersons (code, name, phone, email) VALUES (?, ?, ?, ?)',
      [code, name, phone || '', email || '']
    );
    const result = await executeQuery('SELECT * FROM SalesPersons WHERE code = ?', [code]);
    res.json({ success: true, data: result[0], message: 'Sales Person berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/salespersons/:id', async (req, res) => {
  try {
    const { code, name, phone, email, active } = req.body;
    await executeQuery(
      'UPDATE SalesPersons SET code = ?, name = ?, phone = ?, email = ?, active = ? WHERE id = ?',
      [code, name, phone, email, active || 'Y', req.params.id]
    );
    res.json({ success: true, message: 'Sales Person berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/salespersons/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM SalesPersons WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Sales Person berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PURCHASE ORDERS ====================
app.get('/api/purchase-orders', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT po.*, p.name as partner_name, p.code as partner_code, t.name as transcode_name
      FROM PurchaseOrders po
      LEFT JOIN Partners p ON po.partner_id = p.id
      LEFT JOIN Transcodes t ON po.transcode_id = t.id
      ORDER BY po.doc_date DESC, po.doc_number DESC
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/purchase-orders/:id', async (req, res) => {
  try {
    const po = await executeQuery(`
      SELECT po.*, p.name as partner_name
      FROM PurchaseOrders po
      LEFT JOIN Partners p ON po.partner_id = p.id
      WHERE po.id = ?
    `, [req.params.id]);

    const details = await executeQuery(`
      SELECT d.*, i.code as item_code, i.name as item_name
      FROM PurchaseOrderDetails d
      LEFT JOIN Items i ON d.item_id = i.id
      WHERE d.po_id = ?
    `, [req.params.id]);

    res.json({ success: true, data: { ...po[0], details } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/purchase-orders', async (req, res) => {
  try {
    const { doc_number, doc_date, partner_id, status, details, transcode_id } = req.body;

    // Calculate total
    const total = details?.reduce((sum, d) => sum + (d.quantity * d.unit_price), 0) || 0;

    // Insert header
    await executeQuery(
      'INSERT INTO PurchaseOrders (doc_number, doc_date, partner_id, status, total_amount, transcode_id) VALUES (?, ?, ?, ?, ?, ?)',
      [doc_number, doc_date, partner_id, status || 'Draft', total, transcode_id || null]
    );

    // Get inserted ID
    const poResult = await executeQuery('SELECT * FROM PurchaseOrders WHERE doc_number = ?', [doc_number]);
    const poId = poResult[0]?.id;

    // Insert details
    if (details && details.length > 0 && poId) {
      for (const d of details) {
        await executeQuery(
          'INSERT INTO PurchaseOrderDetails (po_id, item_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)',
          [poId, d.item_id, d.quantity, d.unit_price, d.quantity * d.unit_price]
        );
      }
    }

    res.json({ success: true, data: poResult[0], message: 'Purchase Order berhasil dibuat' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/purchase-orders/:id', async (req, res) => {
  try {
    const { doc_number, doc_date, partner_id, status, details, transcode_id } = req.body;
    const total = details?.reduce((sum, d) => sum + (d.quantity * d.unit_price), 0) || 0;

    await executeQuery(
      'UPDATE PurchaseOrders SET doc_number = ?, doc_date = ?, partner_id = ?, status = ?, total_amount = ?, transcode_id = ? WHERE id = ?',
      [doc_number, doc_date, partner_id, status, total, transcode_id || null, req.params.id]
    );

    // Update details - delete old and insert new
    await executeQuery('DELETE FROM PurchaseOrderDetails WHERE po_id = ?', [req.params.id]);
    if (details && details.length > 0) {
      for (const d of details) {
        await executeQuery(
          'INSERT INTO PurchaseOrderDetails (po_id, item_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)',
          [req.params.id, d.item_id, d.quantity, d.unit_price, d.quantity * d.unit_price]
        );
      }
    }

    res.json({ success: true, message: 'Purchase Order berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/purchase-orders/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM PurchaseOrderDetails WHERE po_id = ?', [req.params.id]);
    await executeQuery('DELETE FROM PurchaseOrders WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Purchase Order berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/purchase-orders/:id/approve', async (req, res) => {
  try {
    // Optional: Validate status is Draft before approving
    await executeQuery('UPDATE PurchaseOrders SET status = ? WHERE id = ?', ['Approved', req.params.id]);
    res.json({ success: true, message: 'Purchase Order berhasil di-approve' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SALES ORDERS ====================
app.get('/api/sales-orders', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT so.*, p.name as partner_name, p.code as partner_code, sp.name as salesperson_name, t.name as transcode_name
      FROM SalesOrders so
      LEFT JOIN Partners p ON so.partner_id = p.id
      LEFT JOIN SalesPersons sp ON so.salesperson_id = sp.id
      LEFT JOIN Transcodes t ON so.transcode_id = t.id
      ORDER BY so.doc_date DESC, so.doc_number DESC
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/sales-orders/:id', async (req, res) => {
  try {
    const so = await executeQuery(`
      SELECT so.*, p.name as partner_name, sp.name as salesperson_name
      FROM SalesOrders so
      LEFT JOIN Partners p ON so.partner_id = p.id
      LEFT JOIN SalesPersons sp ON so.salesperson_id = sp.id
      WHERE so.id = ?
    `, [req.params.id]);

    const details = await executeQuery(`
      SELECT d.*, i.code as item_code, i.name as item_name
      FROM SalesOrderDetails d
      LEFT JOIN Items i ON d.item_id = i.id
      WHERE d.so_id = ?
    `, [req.params.id]);

    res.json({ success: true, data: { ...so[0], details } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/sales-orders', async (req, res) => {
  try {
    const { doc_number, doc_date, partner_id, salesperson_id, status, details, transcode_id } = req.body;
    const total = details?.reduce((sum, d) => sum + (d.quantity * d.unit_price), 0) || 0;

    await executeQuery(
      'INSERT INTO SalesOrders (doc_number, doc_date, partner_id, salesperson_id, status, total_amount, transcode_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [doc_number, doc_date, partner_id, salesperson_id, status || 'Draft', total, transcode_id || null]
    );

    const soResult = await executeQuery('SELECT * FROM SalesOrders WHERE doc_number = ?', [doc_number]);
    const soId = soResult[0]?.id;

    if (details && details.length > 0 && soId) {
      for (const d of details) {
        await executeQuery(
          'INSERT INTO SalesOrderDetails (so_id, item_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)',
          [soId, d.item_id, d.quantity, d.unit_price, d.quantity * d.unit_price]
        );
      }
    }

    res.json({ success: true, data: soResult[0], message: 'Sales Order berhasil dibuat' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/sales-orders/:id', async (req, res) => {
  try {
    const { doc_number, doc_date, partner_id, salesperson_id, status, details, transcode_id } = req.body;
    const total = details?.reduce((sum, d) => sum + (d.quantity * d.unit_price), 0) || 0;

    await executeQuery(
      'UPDATE SalesOrders SET doc_number = ?, doc_date = ?, partner_id = ?, salesperson_id = ?, status = ?, total_amount = ?, transcode_id = ? WHERE id = ?',
      [doc_number, doc_date, partner_id, salesperson_id, status, total, transcode_id, req.params.id]
    );

    await executeQuery('DELETE FROM SalesOrderDetails WHERE so_id = ?', [req.params.id]);
    if (details && details.length > 0) {
      for (const d of details) {
        await executeQuery(
          'INSERT INTO SalesOrderDetails (so_id, item_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)',
          [req.params.id, d.item_id, d.quantity, d.unit_price, d.quantity * d.unit_price]
        );
      }
    }

    res.json({ success: true, message: 'Sales Order berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/sales-orders/:id/approve', async (req, res) => {
  try {
    await executeQuery('UPDATE SalesOrders SET status = ? WHERE id = ?', ['Approved', req.params.id]);
    res.json({ success: true, message: 'Sales Order berhasil di-approve' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/sales-orders/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM SalesOrderDetails WHERE so_id = ?', [req.params.id]);
    await executeQuery('DELETE FROM SalesOrders WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Sales Order berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== RECEIVINGS ====================
app.get('/api/receivings', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT r.*, p.name as partner_name, po.doc_number as po_number
      FROM Receivings r
      LEFT JOIN Partners p ON r.partner_id = p.id
      LEFT JOIN PurchaseOrders po ON r.po_id = po.id
      ORDER BY r.doc_date DESC
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/receivings', async (req, res) => {
  try {
    const { doc_number, doc_date, po_id, partner_id, status, details } = req.body;

    await executeQuery(
      'INSERT INTO Receivings (doc_number, doc_date, po_id, partner_id, status) VALUES (?, ?, ?, ?, ?)',
      [doc_number, doc_date, po_id, partner_id, status || 'Draft']
    );

    const result = await executeQuery('SELECT * FROM Receivings WHERE doc_number = ?', [doc_number]);
    const recId = result[0]?.id;

    if (details && details.length > 0 && recId) {
      for (const d of details) {
        await executeQuery(
          'INSERT INTO ReceivingDetails (receiving_id, item_id, quantity) VALUES (?, ?, ?)',
          [recId, d.item_id, d.quantity]
        );
      }
    }

    res.json({ success: true, data: result[0], message: 'Receiving berhasil dibuat' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SHIPMENTS ====================
app.get('/api/shipments', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT s.*, p.name as partner_name, so.doc_number as so_number
      FROM Shipments s
      LEFT JOIN Partners p ON s.partner_id = p.id
      LEFT JOIN SalesOrders so ON s.so_id = so.id
      ORDER BY s.doc_date DESC
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/shipments', async (req, res) => {
  try {
    const { doc_number, doc_date, so_id, partner_id, status, details } = req.body;

    await executeQuery(
      'INSERT INTO Shipments (doc_number, doc_date, so_id, partner_id, status) VALUES (?, ?, ?, ?, ?)',
      [doc_number, doc_date, so_id, partner_id, status || 'Draft']
    );

    const result = await executeQuery('SELECT * FROM Shipments WHERE doc_number = ?', [doc_number]);
    const shipId = result[0]?.id;

    if (details && details.length > 0 && shipId) {
      for (const d of details) {
        await executeQuery(
          'INSERT INTO ShipmentDetails (shipment_id, item_id, quantity) VALUES (?, ?, ?)',
          [shipId, d.item_id, d.quantity]
        );
      }
    }

    res.json({ success: true, data: result[0], message: 'Shipment berhasil dibuat' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AR INVOICES ====================
app.get('/api/ar-invoices', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT ar.*, p.name as partner_name
      FROM ARInvoices ar
      LEFT JOIN Partners p ON ar.partner_id = p.id
      ORDER BY ar.doc_date DESC
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ar-invoices', async (req, res) => {
  try {
    const { doc_number, doc_date, due_date, partner_id, shipment_id, total_amount, status } = req.body;

    await executeQuery(
      'INSERT INTO ARInvoices (doc_number, doc_date, due_date, partner_id, shipment_id, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [doc_number, doc_date, due_date, partner_id, shipment_id, total_amount || 0, status || 'Unpaid']
    );

    const result = await executeQuery('SELECT * FROM ARInvoices WHERE doc_number = ?', [doc_number]);
    res.json({ success: true, data: result[0], message: 'AR Invoice berhasil dibuat' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AP INVOICES ====================
app.get('/api/ap-invoices', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT ap.*, p.name as partner_name
      FROM APInvoices ap
      LEFT JOIN Partners p ON ap.partner_id = p.id
      ORDER BY ap.doc_date DESC
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ap-invoices', async (req, res) => {
  try {
    const { doc_number, doc_date, due_date, partner_id, receiving_id, total_amount, status } = req.body;

    await executeQuery(
      'INSERT INTO APInvoices (doc_number, doc_date, due_date, partner_id, receiving_id, total_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [doc_number, doc_date, due_date, partner_id, receiving_id, total_amount || 0, status || 'Unpaid']
    );

    const result = await executeQuery('SELECT * FROM APInvoices WHERE doc_number = ?', [doc_number]);
    res.json({ success: true, data: result[0], message: 'AP Invoice berhasil dibuat' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== JOURNAL VOUCHERS ====================
app.get('/api/journal-vouchers', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM JournalVouchers ORDER BY doc_date DESC');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CHART OF ACCOUNTS ====================
app.get('/api/accounts', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM ChartOfAccounts ORDER BY code');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== BANK ACCOUNTS ====================
app.get('/api/bank-accounts', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM BankAccounts ORDER BY code');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== DASHBOARD STATS ====================
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const items = await executeQuery('SELECT COUNT(*) as count FROM Items');
    const partners = await executeQuery('SELECT COUNT(*) as count FROM Partners');
    const po = await executeQuery('SELECT COUNT(*) as count FROM PurchaseOrders');
    const so = await executeQuery('SELECT COUNT(*) as count FROM SalesOrders');

    res.json({
      success: true,
      data: {
        items: items[0]?.count || 0,
        partners: partners[0]?.count || 0,
        purchaseOrders: po[0]?.count || 0,
        salesOrders: so[0]?.count || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  await connectDatabase();
});

export { executeQuery };
