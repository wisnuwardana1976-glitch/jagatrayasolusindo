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

// ==================== PAYMENT TERMS (MASTER TOP) ====================
app.get('/api/payment-terms', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM PaymentTerms ORDER BY days, code');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/payment-terms/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM PaymentTerms WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: result[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/payment-terms', async (req, res) => {
  try {
    const { code, name, days, description, active } = req.body;
    await executeQuery(
      'INSERT INTO PaymentTerms (code, name, days, description, active) VALUES (?, ?, ?, ?, ?)',
      [code, name, days || 0, description || '', active || 'Y']
    );
    const result = await executeQuery('SELECT * FROM PaymentTerms WHERE code = ?', [code]);
    res.json({ success: true, data: result[0], message: 'Term of Payment berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/payment-terms/:id', async (req, res) => {
  try {
    const { code, name, days, description, active } = req.body;
    await executeQuery(
      'UPDATE PaymentTerms SET code = ?, name = ?, days = ?, description = ?, active = ? WHERE id = ?',
      [code, name, days, description, active, req.params.id]
    );
    res.json({ success: true, message: 'Term of Payment berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/payment-terms/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM PaymentTerms WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Term of Payment berhasil dihapus' });
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

// ==================== ENTITIES (MASTER ENTITY) ====================
app.get('/api/entities', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Entities ORDER BY code');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/entities/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Entities WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: result[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/entities', async (req, res) => {
  try {
    const { code, name, address, phone, email, tax_id, active } = req.body;
    await executeQuery(
      'INSERT INTO Entities (code, name, address, phone, email, tax_id, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [code, name, address || '', phone || '', email || '', tax_id || '', active || 'Y']
    );
    const result = await executeQuery('SELECT * FROM Entities WHERE code = ?', [code]);
    res.json({ success: true, data: result[0], message: 'Entity berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/entities/:id', async (req, res) => {
  try {
    const { code, name, address, phone, email, tax_id, active } = req.body;
    await executeQuery(
      'UPDATE Entities SET code = ?, name = ?, address = ?, phone = ?, email = ?, tax_id = ?, active = ? WHERE id = ?',
      [code, name, address, phone, email, tax_id, active || 'Y', req.params.id]
    );
    res.json({ success: true, message: 'Entity berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/entities/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM Entities WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Entity berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SITES (MASTER SITE) ====================
app.get('/api/sites', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT s.*, e.name as entity_name 
      FROM Sites s
      LEFT JOIN Entities e ON s.entity_id = e.id
      ORDER BY s.code
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/sites/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Sites WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: result[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/sites', async (req, res) => {
  try {
    const { code, name, entity_id, address, phone, active } = req.body;
    await executeQuery(
      'INSERT INTO Sites (code, name, entity_id, address, phone, active) VALUES (?, ?, ?, ?, ?, ?)',
      [code, name, entity_id || null, address || '', phone || '', active || 'Y']
    );
    const result = await executeQuery('SELECT * FROM Sites WHERE code = ?', [code]);
    res.json({ success: true, data: result[0], message: 'Site berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/sites/:id', async (req, res) => {
  try {
    const { code, name, entity_id, address, phone, active } = req.body;
    await executeQuery(
      'UPDATE Sites SET code = ?, name = ?, entity_id = ?, address = ?, phone = ?, active = ? WHERE id = ?',
      [code, name, entity_id || null, address, phone, active || 'Y', req.params.id]
    );
    res.json({ success: true, message: 'Site berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/sites/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM Sites WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Site berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== WAREHOUSES (MASTER WAREHOUSE) ====================
app.get('/api/warehouses', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT w.*, s.name as site_name 
      FROM Warehouses w
      LEFT JOIN Sites s ON w.site_id = s.id
      ORDER BY w.code
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/warehouses/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Warehouses WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: result[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/warehouses', async (req, res) => {
  try {
    const { code, description, site_id, active } = req.body;
    await executeQuery(
      'INSERT INTO Warehouses (code, description, site_id, active) VALUES (?, ?, ?, ?)',
      [code, description, site_id || null, active || 'Y']
    );
    const result = await executeQuery('SELECT * FROM Warehouses WHERE code = ?', [code]);
    res.json({ success: true, data: result[0], message: 'Warehouse berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/warehouses/:id', async (req, res) => {
  try {
    const { code, description, site_id, active } = req.body;
    await executeQuery(
      'UPDATE Warehouses SET code = ?, description = ?, site_id = ?, active = ? WHERE id = ?',
      [code, description, site_id || null, active || 'Y', req.params.id]
    );
    res.json({ success: true, message: 'Warehouse berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/warehouses/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM Warehouses WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Warehouse berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SUB WAREHOUSES (MASTER SUB WAREHOUSE) ====================
app.get('/api/sub-warehouses', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT sw.*, w.description as warehouse_name 
      FROM SubWarehouses sw
      LEFT JOIN Warehouses w ON sw.warehouse_id = w.id
      ORDER BY sw.code
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/sub-warehouses/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM SubWarehouses WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: result[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/sub-warehouses', async (req, res) => {
  try {
    const { code, name, warehouse_id, active } = req.body;
    await executeQuery(
      'INSERT INTO SubWarehouses (code, name, warehouse_id, active) VALUES (?, ?, ?, ?)',
      [code, name, warehouse_id || null, active || 'Y']
    );
    const result = await executeQuery('SELECT * FROM SubWarehouses WHERE code = ?', [code]);
    res.json({ success: true, data: result[0], message: 'Sub Warehouse berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/sub-warehouses/:id', async (req, res) => {
  try {
    const { code, name, warehouse_id, active } = req.body;
    await executeQuery(
      'UPDATE SubWarehouses SET code = ?, name = ?, warehouse_id = ?, active = ? WHERE id = ?',
      [code, name, warehouse_id || null, active || 'Y', req.params.id]
    );
    res.json({ success: true, message: 'Sub Warehouse berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/sub-warehouses/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM SubWarehouses WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Sub Warehouse berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== LOCATIONS (MASTER LOCATION) ====================
app.get('/api/locations', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT l.*, sw.name as sub_warehouse_name 
      FROM Locations l
      LEFT JOIN SubWarehouses sw ON l.sub_warehouse_id = sw.id
      ORDER BY l.code
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/locations/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Locations WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: result[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/locations', async (req, res) => {
  try {
    const { code, name, sub_warehouse_id, active } = req.body;
    await executeQuery(
      'INSERT INTO Locations (code, name, sub_warehouse_id, active) VALUES (?, ?, ?, ?)',
      [code, name, sub_warehouse_id || null, active || 'Y']
    );
    const result = await executeQuery('SELECT * FROM Locations WHERE code = ?', [code]);
    res.json({ success: true, data: result[0], message: 'Location berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/locations/:id', async (req, res) => {
  try {
    const { code, name, sub_warehouse_id, active } = req.body;
    await executeQuery(
      'UPDATE Locations SET code = ?, name = ?, sub_warehouse_id = ?, active = ? WHERE id = ?',
      [code, name, sub_warehouse_id || null, active || 'Y', req.params.id]
    );
    res.json({ success: true, message: 'Location berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/locations/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM Locations WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Location berhasil dihapus' });
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
      SELECT po.*, p.name as partner_name, t.name as transcode_name, pt.name as payment_term_name
      FROM PurchaseOrders po
      LEFT JOIN Partners p ON po.partner_id = p.id
      LEFT JOIN Transcodes t ON po.transcode_id = t.id
      LEFT JOIN PaymentTerms pt ON po.payment_term_id = pt.id
      WHERE po.id = ?
    `, [req.params.id]);

    const details = await executeQuery(`
      SELECT d.*, i.code as item_code, i.name as item_name, i.unit as unit_code,
      (
        SELECT COALESCE(SUM(rd.quantity), 0)
        FROM ReceivingDetails rd
        JOIN Receivings r ON rd.receiving_id = r.id
        WHERE r.po_id = d.po_id AND rd.item_id = d.item_id AND r.status != 'Cancelled'
      ) as qty_received
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
    const { doc_number, doc_date, partner_id, status, details, transcode_id, payment_term_id, tax_type } = req.body;

    // Calculate total
    const total = details?.reduce((sum, d) => sum + (d.quantity * d.unit_price), 0) || 0;

    // Insert header
    await executeQuery(
      'INSERT INTO PurchaseOrders (doc_number, doc_date, partner_id, status, total_amount, transcode_id, payment_term_id, tax_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [doc_number, doc_date, partner_id, status || 'Draft', total, transcode_id || null, payment_term_id || null, tax_type || 'Exclude']
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
    const { doc_number, doc_date, partner_id, status, details, transcode_id, payment_term_id, tax_type } = req.body;
    const total = details?.reduce((sum, d) => sum + (d.quantity * d.unit_price), 0) || 0;

    // Validation: Check if linked to Receiving
    const hasReceiving = await executeQuery('SELECT COUNT(*) as count FROM Receivings WHERE po_id = ? AND status != "Cancelled"', [req.params.id]);
    if (hasReceiving[0].count > 0) {
      // If updating details, block it.
      // For now, simpler: Block any update except Status change to 'Closed' (which might happen via system)
      // actually, if user is editing, we should block.
      // But wait, what if they just want to change Remarks? We don't have remarks in PO update yet? 
      // Let's safe block critical updates.

      // If the request is trying to update details (which effectively replaces them), block it.
      // Even header updates like Partner ID should be blocked if received.
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat mengedit PO karena sudah ada dokumen Receiving yang terhubung. Hapus Receiving terlebih dahulu jika ingin mengubah PO.'
      });
    }

    await executeQuery(
      'UPDATE PurchaseOrders SET doc_number = ?, doc_date = ?, partner_id = ?, status = ?, total_amount = ?, transcode_id = ?, payment_term_id = ?, tax_type = ? WHERE id = ?',
      [doc_number, doc_date, partner_id, status, total, transcode_id || null, payment_term_id || null, tax_type || 'Exclude', req.params.id]
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
    // Validation: Check if linked to Receiving
    const hasReceiving = await executeQuery('SELECT COUNT(*) as count FROM Receivings WHERE po_id = ? AND status != "Cancelled"', [req.params.id]);
    if (hasReceiving[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus PO karena sudah ada dokumen Receiving yang terhubung. Hapus Receiving terlebih dahulu.'
      });
    }

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

app.put('/api/purchase-orders/:id/unapprove', async (req, res) => {
  try {
    // Validation: Check if linked to Receiving
    const hasReceiving = await executeQuery('SELECT COUNT(*) as count FROM Receivings WHERE po_id = ? AND status != "Cancelled"', [req.params.id]);
    if (hasReceiving[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat meng-unapprove PO karena sudah ada dokumen Receiving yang terhubung. Hapus Receiving terlebih dahulu.'
      });
    }

    // Optional: Check if already processed (e.g. received)
    await executeQuery('UPDATE PurchaseOrders SET status = ? WHERE id = ?', ['Draft', req.params.id]);
    res.json({ success: true, message: 'Purchase Order berhasil di-unapprove (Kembali ke Draft)' });
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
      LEFT JOIN SalesPersons sp ON so.sales_person_id = sp.id
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
      SELECT so.*, p.name as partner_name, sp.name as salesperson_name, pt.name as payment_term_name
      FROM SalesOrders so
      LEFT JOIN Partners p ON so.partner_id = p.id
      LEFT JOIN SalesPersons sp ON so.sales_person_id = sp.id
      LEFT JOIN PaymentTerms pt ON so.payment_term_id = pt.id
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
    const { doc_number, doc_date, partner_id, salesperson_id, status, details, transcode_id, payment_term_id, tax_type } = req.body;
    const total = details?.reduce((sum, d) => sum + (d.quantity * d.unit_price), 0) || 0;

    await executeQuery(
      'INSERT INTO SalesOrders (doc_number, doc_date, partner_id, sales_person_id, status, total_amount, transcode_id, payment_term_id, tax_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [doc_number, doc_date, partner_id, salesperson_id, status || 'Draft', total, transcode_id || null, payment_term_id || null, tax_type || 'Exclude']
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
    const { doc_number, doc_date, partner_id, salesperson_id, status, details, transcode_id, payment_term_id, tax_type } = req.body;
    const total = details?.reduce((sum, d) => sum + (d.quantity * d.unit_price), 0) || 0;

    await executeQuery(
      'UPDATE SalesOrders SET doc_number = ?, doc_date = ?, partner_id = ?, salesperson_id = ?, status = ?, total_amount = ?, transcode_id = ?, payment_term_id = ?, tax_type = ? WHERE id = ?',
      [doc_number, doc_date, partner_id, salesperson_id, status, total, transcode_id, payment_term_id || null, tax_type || 'Exclude', req.params.id]
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

app.put('/api/sales-orders/:id/unapprove', async (req, res) => {
  try {
    await executeQuery('UPDATE SalesOrders SET status = ? WHERE id = ?', ['Draft', req.params.id]);
    res.json({ success: true, message: 'Sales Order berhasil di-unapprove (Kembali ke Draft)' });
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
      SELECT r.*, p.name as partner_name, po.doc_number as po_number, w.code as warehouse_code, l.name as location_name, t.name as transcode_name
      FROM Receivings r
      LEFT JOIN Partners p ON r.partner_id = p.id
      LEFT JOIN PurchaseOrders po ON r.po_id = po.id
      LEFT JOIN Warehouses w ON r.warehouse_id = w.id
      LEFT JOIN Locations l ON r.location_id = l.id
      LEFT JOIN Transcodes t ON r.transcode_id = t.id
      ORDER BY r.doc_date DESC, r.doc_number DESC
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/receivings/:id', async (req, res) => {
  console.log('GET /api/receivings/:id hit for ID:', req.params.id);
  try {
    const header = await executeQuery(`
      SELECT r.*, p.name as partner_name, po.doc_number as po_number, w.description as warehouse_name, l.name as location_name
      FROM Receivings r
      LEFT JOIN Partners p ON r.partner_id = p.id
      LEFT JOIN PurchaseOrders po ON r.po_id = po.id
      LEFT JOIN Warehouses w ON r.warehouse_id = w.id
      LEFT JOIN Locations l ON r.location_id = l.id
      WHERE r.id = ?
    `, [req.params.id]);

    const details = await executeQuery(`
      SELECT d.*, i.code as item_code, i.name as item_name, i.unit as unit_code
      FROM ReceivingDetails d
      LEFT JOIN Items i ON d.item_id = i.id
      WHERE d.receiving_id = ?
    `, [req.params.id]);

    res.json({ success: true, data: { ...header[0], details } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/receivings', async (req, res) => {
  try {
    const { doc_number, doc_date, po_id, partner_id, warehouse_id, location_id, status, items, transcode_id, remarks } = req.body;

    await executeQuery(
      'INSERT INTO Receivings (doc_number, doc_date, po_id, partner_id, warehouse_id, location_id, status, transcode_id, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [doc_number, doc_date, po_id || null, partner_id, warehouse_id || null, location_id || null, status || 'Draft', transcode_id || null, remarks || '']
    );

    const result = await executeQuery('SELECT * FROM Receivings WHERE doc_number = ?', [doc_number]);
    const recId = result[0]?.id;

    if (items && items.length > 0 && recId) {
      for (const d of items) {
        await executeQuery(
          'INSERT INTO ReceivingDetails (receiving_id, item_id, quantity, remarks) VALUES (?, ?, ?, ?)',
          [recId, d.item_id, d.quantity, d.remarks || '']
        );
      }
    }

    res.json({ success: true, data: result[0], message: 'Receiving berhasil dibuat' });

    // Auto-update PO status
    if (po_id) await updatePOStatus(po_id);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/receivings/:id', async (req, res) => {
  try {
    const { doc_number, doc_date, po_id, partner_id, warehouse_id, location_id, status, items, transcode_id, remarks } = req.body;

    await executeQuery(
      'UPDATE Receivings SET doc_number = ?, doc_date = ?, po_id = ?, partner_id = ?, warehouse_id = ?, location_id = ?, status = ?, transcode_id = ?, remarks = ? WHERE id = ?',
      [doc_number, doc_date, po_id || null, partner_id, warehouse_id || null, location_id || null, status, transcode_id || null, remarks || '', req.params.id]
    );

    await executeQuery('DELETE FROM ReceivingDetails WHERE receiving_id = ?', [req.params.id]);
    if (items && items.length > 0) {
      for (const d of items) {
        await executeQuery(
          'INSERT INTO ReceivingDetails (receiving_id, item_id, quantity, remarks) VALUES (?, ?, ?, ?)',
          [req.params.id, d.item_id, d.quantity, d.remarks || '']
        );
      }
    }

    res.json({ success: true, message: 'Receiving berhasil diupdate' });

    // Auto-update PO status (using submitted PO ID)
    if (po_id) await updatePOStatus(po_id);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/receivings/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT status, po_id FROM Receivings WHERE id = ?', [req.params.id]);
    if (result[0]?.status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Hanya dokumen Draft yang bisa dihapus' });
    }
    await executeQuery('DELETE FROM ReceivingDetails WHERE receiving_id = ?', [req.params.id]);
    await executeQuery('DELETE FROM Receivings WHERE id = ?', [req.params.id]);

    if (result[0]?.po_id) await updatePOStatus(result[0].po_id);

    res.json({ success: true, message: 'Receiving berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/receivings/:id/approve', async (req, res) => {
  try {
    // In future: Add inventory transaction logic here
    await executeQuery('UPDATE Receivings SET status = ? WHERE id = ?', ['Approved', req.params.id]);
    res.json({ success: true, message: 'Receiving berhasil di-approve' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/receivings/:id/unapprove', async (req, res) => {
  try {
    await executeQuery('UPDATE Receivings SET status = ? WHERE id = ?', ['Draft', req.params.id]);
    res.json({ success: true, message: 'Receiving berhasil di-unapprove (Kembali ke Draft)' });
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
// ==================== CHART OF ACCOUNTS ====================
app.get('/api/accounts', async (req, res) => {
  try {
    // Left join self for parent name if needed, or just fetch all
    const result = await executeQuery(`
      SELECT a.*, p.name as parent_name 
      FROM Accounts a
      LEFT JOIN Accounts p ON a.parent_id = p.id
      ORDER BY a.code
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/accounts/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Accounts WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: result[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    const { code, name, type, level, parent_id, active } = req.body;
    await executeQuery(
      'INSERT INTO Accounts (code, name, type, level, parent_id, active) VALUES (?, ?, ?, ?, ?, ?)',
      [code, name, type, level || 1, parent_id || null, active || 'Y']
    );
    const result = await executeQuery('SELECT * FROM Accounts WHERE code = ?', [code]);
    res.json({ success: true, data: result[0], message: 'Akun berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error: ' + error.message });
  }
});

app.put('/api/accounts/:id', async (req, res) => {
  try {
    const { code, name, type, level, parent_id, active } = req.body;
    await executeQuery(
      'UPDATE Accounts SET code = ?, name = ?, type = ?, level = ?, parent_id = ?, active = ? WHERE id = ?',
      [code, name, type, level, parent_id || null, active, req.params.id]
    );
    res.json({ success: true, message: 'Akun berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  try {
    // Check for children
    const children = await executeQuery('SELECT COUNT(*) as count FROM Accounts WHERE parent_id = ?', [req.params.id]);
    if (children[0].count > 0) {
      return res.status(400).json({ success: false, error: 'Tidak bisa menghapus akun yang memiliki sub-akun.' });
    }

    await executeQuery('DELETE FROM Accounts WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Akun berhasil dihapus' });
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

// ==================== ACCOUNT GROUPS ====================
app.get('/api/account-groups', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM AccountGroups ORDER BY code');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/account-groups', async (req, res) => {
  try {
    const { code, description, active } = req.body;
    await executeQuery(
      'INSERT INTO AccountGroups (code, description, active) VALUES (?, ?, ?)',
      [code, description, active || 'Y']
    );
    const result = await executeQuery('SELECT * FROM AccountGroups WHERE code = ?', [code]);
    res.json({ success: true, data: result[0], message: 'Group Akun berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/account-groups/:id', async (req, res) => {
  try {
    const { code, description, active } = req.body;
    await executeQuery(
      'UPDATE AccountGroups SET code = ?, description = ?, active = ? WHERE id = ?',
      [code, description, active, req.params.id]
    );
    res.json({ success: true, message: 'Group Akun berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/account-groups/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM AccountGroups WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Group Akun berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== COA SEGMENTS ====================
app.get('/api/coa-segments', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM CoaSegments ORDER BY segment_number');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/coa-segments/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM CoaSegments WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: result[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/coa-segments', async (req, res) => {
  try {
    const { segment_number, segment_name, description, active } = req.body;
    await executeQuery(
      'INSERT INTO CoaSegments (segment_number, segment_name, description, active) VALUES (?, ?, ?, ?)',
      [segment_number, segment_name, description || '', active || 'Y']
    );
    const result = await executeQuery('SELECT * FROM CoaSegments WHERE segment_number = ?', [segment_number]);
    res.json({ success: true, data: result[0], message: 'COA Segment berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/coa-segments/:id', async (req, res) => {
  try {
    const { segment_number, segment_name, description, active } = req.body;
    await executeQuery(
      'UPDATE CoaSegments SET segment_number = ?, segment_name = ?, description = ?, active = ? WHERE id = ?',
      [segment_number, segment_name, description, active || 'Y', req.params.id]
    );
    res.json({ success: true, message: 'COA Segment berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/coa-segments/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM CoaSegments WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'COA Segment berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper to update PO status
async function updatePOStatus(poId) {
  if (!poId) return;

  try {
    // 1. Get all PO items and their ordered quantities
    const poItems = await executeQuery(
      'SELECT item_id, quantity FROM PurchaseOrderDetails WHERE po_id = ?',
      [poId]
    );

    if (poItems.length === 0) return;

    // 2. Get total received quantities for this PO
    const receivedItems = await executeQuery(`
      SELECT rd.item_id, SUM(rd.quantity) as total_received
      FROM ReceivingDetails rd
      JOIN Receivings r ON rd.receiving_id = r.id
      WHERE r.po_id = ? AND r.status != 'Cancelled'
      GROUP BY rd.item_id
    `, [poId]);

    // Map received quantities for easy lookup
    const receivedMap = {};
    receivedItems.forEach(item => {
      receivedMap[item.item_id] = item.total_received;
    });

    // 3. Check if all items are fully received
    let allReceived = true;
    for (const item of poItems) {
      const receivedQty = receivedMap[item.item_id] || 0;
      if (receivedQty < item.quantity) {
        allReceived = false;
        break;
      }
    }

    // 4. Update PO status
    const currentPO = await executeQuery('SELECT status FROM PurchaseOrders WHERE id = ?', [poId]);
    const currentStatus = currentPO[0]?.status;

    if (allReceived && currentStatus !== 'Closed') {
      await executeQuery("UPDATE PurchaseOrders SET status = 'Closed' WHERE id = ?", [poId]);
      console.log(`PO ${poId} status updated to Closed`);
    } else if (!allReceived && currentStatus === 'Closed') {
      await executeQuery("UPDATE PurchaseOrders SET status = 'Approved' WHERE id = ?", [poId]);
      console.log(`PO ${poId} status reverted to Approved`);
    }

  } catch (error) {
    console.error('Error updating PO status:', error);
  }
}

// ==================== REPORTS ====================
app.get('/api/reports/po-outstanding', async (req, res) => {
  try {
    const query = `
      SELECT 
        po.id as po_id,
        po.doc_number,
        po.doc_date,
        p.name as partner_name,
        i.code as item_code,
        i.name as item_name,
        i.unit,
        pod.quantity as qty_ordered,
        (
          SELECT COALESCE(SUM(rd.quantity), 0)
          FROM ReceivingDetails rd
          JOIN Receivings r ON rd.receiving_id = r.id
          WHERE r.po_id = po.id AND rd.item_id = pod.item_id AND r.status != 'Cancelled'
        ) as qty_received
      FROM PurchaseOrderDetails pod
      JOIN PurchaseOrders po ON pod.po_id = po.id
      JOIN Items i ON pod.item_id = i.id
      LEFT JOIN Partners p ON po.partner_id = p.id
      WHERE po.status = 'Approved'
      ORDER BY po.doc_date ASC, po.doc_number ASC
    `;

    const results = await executeQuery(query);

    // Filter outstanding > 0
    const outstandingItems = results.filter(item => item.qty_ordered > item.qty_received).map(item => ({
      ...item,
      qty_outstanding: item.qty_ordered - item.qty_received
    }));

    res.json({ success: true, data: outstandingItems });
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
