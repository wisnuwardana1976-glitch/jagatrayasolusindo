import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import odbc from 'odbc';
import fs from 'fs';

const logDebug = (msg) => {
  const timestamp = new Date().toISOString();
  fs.appendFileSync('journal_debug.log', `[${timestamp}] ${msg}\n`);
};

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - MUST be before routes
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

async function executeQuery(query, params = []) {
  let connection;
  try {
    connection = await odbc.connect(connectionString);
    const result = await connection.query(query, params);
    return result;
  } catch (error) {
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function validatePeriod(date) {
  // Check if any period exists. If none, allow for now.
  const allPeriods = await executeQuery("SELECT count(*) as count FROM AccountingPeriods WHERE active = 'Y'");
  if (allPeriods[0].count === 0) return true;

  const result = await executeQuery(
    "SELECT count(*) as count FROM AccountingPeriods WHERE ? BETWEEN start_date AND end_date AND status = 'Open' AND active = 'Y'",
    [date]
  );
  return result[0].count > 0;
}

// ==================== ACCOUNTING PERIODS ====================
app.get('/api/accounting-periods', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM AccountingPeriods ORDER BY start_date DESC');
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/accounting-periods', async (req, res) => {
  try {
    const { code, name, start_date, end_date, status, active, is_starting } = req.body;

    // If this is a starting period, clear any existing starting periods
    if (is_starting === 'Y') {
      await executeQuery("UPDATE AccountingPeriods SET is_starting = 'N' WHERE is_starting = 'Y'");
    }

    await executeQuery(
      'INSERT INTO AccountingPeriods (code, name, start_date, end_date, status, active, is_starting) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [code, name, start_date, end_date, status || 'Open', active || 'Y', is_starting || 'N']
    );
    res.json({ success: true, message: 'Accounting Period berhasil ditambahkan' });
  } catch (error) {
    console.error('Error adding accounting period:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/accounting-periods/:id', async (req, res) => {
  try {
    const { code, name, start_date, end_date, status, active, is_starting } = req.body;

    // If this is a starting period, clear any existing starting periods
    if (is_starting === 'Y') {
      await executeQuery("UPDATE AccountingPeriods SET is_starting = 'N' WHERE is_starting = 'Y' AND id != ?", [req.params.id]);
    }

    await executeQuery(
      'UPDATE AccountingPeriods SET code = ?, name = ?, start_date = ?, end_date = ?, status = ?, active = ?, is_starting = ? WHERE id = ?',
      [code, name, start_date, end_date, status, active, is_starting || 'N', req.params.id]
    );
    res.json({ success: true, message: 'Accounting Period berhasil diupdate' });
  } catch (error) {
    console.error('Error updating accounting period:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/accounting-periods/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM AccountingPeriods WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Accounting Period berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

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

app.delete('/api/warehouses/:id', async (req, res) => {
  try {
    await executeQuery('DELETE FROM Warehouses WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Warehouse berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SHIPMENTS ====================
app.get('/api/shipments', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT s.*, p.name as customer_name, so.doc_number as so_number
      FROM Shipments s
      LEFT JOIN Partners p ON s.partner_id = p.id
      LEFT JOIN SalesOrders so ON s.so_id = so.id
      ORDER BY s.doc_date DESC, s.doc_number DESC
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});



app.post('/api/shipments', async (req, res) => {
  try {
    const { doc_number, doc_date, so_id, partner_id, status, notes, items, transcode_id } = req.body;
    console.log('Creating Shipment:', req.body);

    await executeQuery(
      'INSERT INTO Shipments (doc_number, doc_date, so_id, partner_id, status, notes, transcode_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [doc_number, doc_date, so_id || null, partner_id, status || 'Draft', notes || null, transcode_id || null]
    );

    const result = await executeQuery('SELECT * FROM Shipments WHERE doc_number = ?', [doc_number]);
    const shipmentId = result[0]?.id;

    if (items && items.length > 0 && shipmentId) {
      for (const item of items) {
        await executeQuery(
          'INSERT INTO ShipmentDetails (shipment_id, item_id, quantity, remarks) VALUES (?, ?, ?, ?)',
          [shipmentId, item.item_id, item.quantity, item.remarks]
        );
      }
    }

    res.json({ success: true, data: result[0], message: 'Shipment berhasil dibuat' });

    // Auto-update SO status
    if (so_id) await updateSOStatus(so_id);

  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/shipments/:id', async (req, res) => {
  try {
    const { doc_number, doc_date, so_id, partner_id, status, notes, items, transcode_id } = req.body;

    await executeQuery(
      'UPDATE Shipments SET doc_number = ?, doc_date = ?, so_id = ?, partner_id = ?, status = ?, notes = ?, transcode_id = ? WHERE id = ?',
      [doc_number, doc_date, so_id || null, partner_id, status, notes, transcode_id || null, req.params.id]
    );

    await executeQuery('DELETE FROM ShipmentDetails WHERE shipment_id = ?', [req.params.id]);
    if (items && items.length > 0) {
      for (const item of items) {
        await executeQuery(
          'INSERT INTO ShipmentDetails (shipment_id, item_id, quantity, remarks) VALUES (?, ?, ?, ?)',
          [req.params.id, item.item_id, item.quantity, item.remarks]
        );
      }
    }

    res.json({ success: true, message: 'Shipment berhasil diupdate' });

    // Auto-update SO status
    if (so_id) await updateSOStatus(so_id);

  } catch (error) {
    console.error('Error updating shipment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/shipments/:id/approve', async (req, res) => {
  try {
    const shId = req.params.id;
    await executeQuery('UPDATE Shipments SET status = ? WHERE id = ?', ['Approved', shId]);

    // ================== AUTOMATED JOURNAL (SHIPMENT) ==================
    // Debit: Uninvoice Shipment
    // Credit: Penjualan Temporary

    try {
      const uninvoiceShipmentAcc = await getGlAccount('uninvoice_shipment_account');
      const salesTempAcc = await getGlAccount('sales_temp_account');

      if (uninvoiceShipmentAcc && salesTempAcc) {
        // Get Data (Qty * Price from SO)
        const items = await executeQuery(`
                SELECT sd.quantity, sod.unit_price, (sd.quantity * sod.unit_price) as total_value
                FROM ShipmentDetails sd
                JOIN Shipments s ON sd.shipment_id = s.id
                JOIN SalesOrderDetails sod ON s.so_id = sod.so_id AND sd.item_id = sod.item_id
                WHERE s.id = ?
            `, [shId]);

        const totalAmount = items.reduce((sum, item) => sum + (Number(item.total_value) || 0), 0);

        if (totalAmount > 0) {
          const shDoc = await executeQuery('SELECT doc_number, doc_date FROM Shipments WHERE id = ?', [shId]);

          await createAutomatedJournal('Shipment', shId, shDoc[0].doc_number, shDoc[0].doc_date, [
            { coa_id: uninvoiceShipmentAcc, debit: totalAmount, credit: 0, description: 'Uninvoiced Shipment' },
            { coa_id: salesTempAcc, debit: 0, credit: totalAmount, description: 'Sales Temporary' }
          ]);
        }
      }
    } catch (jErr) {
      console.error('Failed to generate shipment journal:', jErr);
    }

    res.json({ success: true, message: 'Shipment berhasil di-approve' });
  } catch (error) {
    console.error('Error approving shipment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/shipments/:id/unapprove', async (req, res) => {
  try {
    await executeQuery('UPDATE Shipments SET status = ? WHERE id = ?', ['Draft', req.params.id]);
    res.json({ success: true, message: 'Shipment berhasil di-unapprove (Kembali ke Draft)' });
  } catch (error) {
    console.error('Error unapproving shipment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/shipments/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT status, so_id FROM Shipments WHERE id = ?', [req.params.id]);
    if (result[0]?.status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Hanya dokumen Draft yang bisa dihapus' });
    }
    await executeQuery('DELETE FROM ShipmentDetails WHERE shipment_id = ?', [req.params.id]);

    // Delete associated Journals (Auto Journal cleanup)
    // 1. Delete Journal Items linked to the Journal Header
    await executeQuery("DELETE FROM JournalVoucherDetails WHERE jv_id IN (SELECT id FROM JournalVouchers WHERE source_type = 'Shipment' AND ref_id = ?)", [req.params.id]);
    // 2. Delete Journal Header
    await executeQuery("DELETE FROM JournalVouchers WHERE source_type = 'Shipment' AND ref_id = ?", [req.params.id]);

    await executeQuery('DELETE FROM Shipments WHERE id = ?', [req.params.id]);

    if (result[0]?.so_id) await updateSOStatus(result[0].so_id);

    res.json({ success: true, message: 'Shipment berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== RECEIVINGS ====================
app.put('/api/receivings/:id/approve', async (req, res) => {
  try {
    const rxId = req.params.id;
    await executeQuery('UPDATE Receivings SET status = ? WHERE id = ?', ['Approved', rxId]);

    // ================== AUTOMATED JOURNAL (RECEIVING) ==================
    // Debit: Persediaan (Inventory)
    // Credit: Hutang Dagang Temporary (AP Temporary)

    try {
      logDebug(`Attempting Journal for Receiving #${rxId}`);
      // 1. Get Accounts
      const inventoryAcc = await getGlAccount('inventory_account');
      const apTempAcc = await getGlAccount('ap_temp_account');
      logDebug(`Accounts: Inv=${inventoryAcc}, AP=${apTempAcc}`);

      if (inventoryAcc && apTempAcc) {
        // 2. Get Data (Qty * Unit Price)
        const items = await executeQuery(`
                SELECT rd.item_id, rd.quantity, pod.unit_price, (rd.quantity * pod.unit_price) as total_value
                FROM ReceivingDetails rd
                JOIN Receivings r ON rd.receiving_id = r.id
                JOIN PurchaseOrderDetails pod ON r.po_id = pod.po_id AND rd.item_id = pod.item_id
                WHERE r.id = ?
            `, [rxId]);

        logDebug(`Items found: ${JSON.stringify(items)}`);

        const totalAmount = items.reduce((sum, item) => sum + (Number(item.total_value) || 0), 0);
        logDebug(`Total Amount: ${totalAmount}`);

        if (totalAmount > 0) {
          // 3. Create Journal
          const rxDoc = await executeQuery('SELECT doc_number, doc_date FROM Receivings WHERE id = ?', [rxId]);

          const result = await createAutomatedJournal('Receiving', rxId, rxDoc[0].doc_number, rxDoc[0].doc_date, [
            { coa_id: inventoryAcc, debit: totalAmount, credit: 0, description: 'Inventory Receipt' },
            { coa_id: apTempAcc, debit: 0, credit: totalAmount, description: 'AP Temporary' }
          ]);
          logDebug(`Journal specific creation result: ${result}`);
        } else {
          logDebug('Total amount is 0, skipping journal.');
        }
      } else {
        logDebug('Missing GL Accounts settings.');
      }
    } catch (jErr) {
      logDebug(`ERROR: ${jErr.message}`);
      console.error('Failed to generate receiving journal:', jErr);
    }

    res.json({ success: true, message: 'Receiving berhasil di-approve' });
  } catch (error) {
    console.error('Error approving receiving:', error);
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

// ==================== JOURNAL VOUCHERS ====================
app.get('/api/journals', async (req, res) => {
  try {
    const { source_type } = req.query;
    let sql = 'SELECT * FROM JournalVouchers';
    const params = [];

    if (source_type) {
      // Filter by source type (for System Generated Journals)
      if (source_type === 'SYSTEM') {
        sql += ' WHERE source_type IS NOT NULL';
      } else if (source_type === 'MANUAL') {
        sql += ' WHERE source_type IS NULL';
      } else {
        sql += ' WHERE source_type = ?';
        params.push(source_type);
      }
    } else {
      // Default: Show all (or strictly manual if desired? User asked for separate menu)
      // If no filter provided, maybe return all.
    }

    sql += ' ORDER BY doc_date DESC, doc_number DESC';

    const result = await executeQuery(sql, params);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/journals/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM JournalVouchers WHERE id = ?', [req.params.id]);
    if (result.length === 0) return res.status(404).json({ success: false, message: 'Journal not found' });

    const details = await executeQuery(`
      SELECT d.*, a.code as coa_code, a.name as coa_name 
      FROM JournalVoucherDetails d
      LEFT JOIN Accounts a ON d.coa_id = a.id
      WHERE d.jv_id = ?
    `, [req.params.id]);

    const journal = result[0];
    journal.details = details;

    res.json({ success: true, data: journal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Outstanding Invoices (AP/AR)
app.get('/api/invoices/outstanding', async (req, res) => {
  try {
    const { type } = req.query; // 'AP' or 'AR'
    if (!type || (type !== 'AP' && type !== 'AR')) {
      return res.status(400).json({ success: false, error: 'Invalid type. Use AP or AR.' });
    }

    const table = type === 'AP' ? 'APInvoices' : 'ARInvoices';

    const query = `
      SELECT i.id, i.doc_number, i.doc_date, i.total_amount, i.paid_amount, (i.total_amount - i.paid_amount) as balance, 
             p.name as partner_name, i.partner_id
      FROM ${table} i
      LEFT JOIN Partners p ON i.partner_id = p.id
      WHERE i.status IN ('Posted', 'Partial') 
      AND (i.total_amount - i.paid_amount) > 0
      ORDER BY i.doc_date ASC
    `;

    const result = await executeQuery(query);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching outstanding invoices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create Journal Voucher (Manual)
app.post('/api/journals', async (req, res) => {
  try {
    const { doc_number, doc_date, description, transcode_id, details, is_giro, giro_number, giro_due_date } = req.body;

    // Basic validation
    let totalDebit = 0;
    let totalCredit = 0;
    details.forEach(d => {
      totalDebit += parseFloat(d.debit) || 0;
      totalCredit += parseFloat(d.credit) || 0;
    });

    if (Math.abs(totalDebit - totalCredit) > 0.01) { // Allowing small float diff
      return res.status(400).json({ success: false, error: 'Total Debit and Credit must be equal (Balanced).' });
    }

    const docNum = doc_number === 'AUTO' ? `JV/${new Date().getTime()}` : String(doc_number);

    const p_is_giro = is_giro ? 1 : 0;
    const p_giro_number = giro_number ? String(giro_number) : null;
    const p_giro_due_date = giro_due_date ? String(giro_due_date) : null;
    const p_giro_bank_name = req.body.giro_bank_name ? String(req.body.giro_bank_name) : null;

    const params = [docNum, String(doc_date), String(description), parseInt(transcode_id), p_is_giro, p_giro_number, p_giro_due_date, p_giro_bank_name];
    // logDebug(`Insert Params: ${JSON.stringify(params)}`);

    const result = await executeQuery(
      `INSERT INTO JournalVouchers (doc_number, doc_date, description, status, transcode_id, source_type, is_giro, giro_number, giro_due_date, giro_bank_name) 
       VALUES (?, ?, ?, 'Draft', ?, 'MANUAL', ?, ?, ?, ?)`,
      params
    );

    const jvId = result.insertId || (await executeQuery('SELECT @@IDENTITY')).id || (await executeQuery('SELECT MAX(id) from JournalVouchers'))[0]['MAX(id)'];

    for (const det of details) {
      const refId = det.ref_id ? parseInt(det.ref_id) : null;
      const refType = det.ref_type ? String(det.ref_type) : null;

      await executeQuery(
        `INSERT INTO JournalVoucherDetails (jv_id, coa_id, description, debit, credit, ref_id, ref_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [jvId, det.coa_id, det.description || '', det.debit, det.credit, refId, refType]
      );

      // Allocation Update
      if (refId && refType) {
        const table = refType === 'AP' ? 'APInvoices' : (refType === 'AR' ? 'ARInvoices' : null);
        if (table) {
          const amount = parseFloat(det.debit) || parseFloat(det.credit) || 0; // Simplified. Logic: Payment reduces balance.
          // For AP Payment (Cash Out), we Debit AP Account. So amount is det.debit.
          // For AR Receipt (Cash In), we Credit AR Account. So amount is det.credit.
          // We'll trust the amount passed is the reduction amount.

          await executeQuery(`UPDATE ${table} SET paid_amount = paid_amount + ? WHERE id = ?`, [amount, refId]);
          // Update status if Paid
          await executeQuery(`UPDATE ${table} SET status = 'Paid' WHERE id = ? AND paid_amount >= total_amount`, [refId]);
          // Update status if Partial
          await executeQuery(`UPDATE ${table} SET status = 'Partial' WHERE id = ? AND paid_amount < total_amount AND paid_amount > 0`, [refId]);
        }
      }
    }

    res.json({ success: true, message: 'Journal created successfully', id: jvId, doc_number: docNum });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update Journal Voucher
app.put('/api/journals/:id', async (req, res) => {
  try {
    const { doc_date, description, details, is_giro, giro_number, giro_due_date } = req.body;
    const jvId = req.params.id;

    // Check status
    const current = await executeQuery('SELECT status FROM JournalVouchers WHERE id = ?', [jvId]);
    if (current.length === 0) return res.status(404).json({ success: false, error: 'Journal not found' });
    if (current[0].status !== 'Draft') return res.status(400).json({ success: false, error: 'Cannot edit posted journal' });

    // Validate Balance
    let totalDebit = 0;
    let totalCredit = 0;
    details.forEach(d => {
      totalDebit += parseFloat(d.debit) || 0;
      totalCredit += parseFloat(d.credit) || 0;
    });

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ success: false, error: 'Total Debit and Credit must be equal.' });
    }

    // Update Header
    const p_is_giro = is_giro ? 1 : 0;
    const p_giro_number = giro_number ? String(giro_number) : null;
    const p_giro_due_date = giro_due_date ? String(giro_due_date) : null;
    const p_giro_bank_name = req.body.giro_bank_name ? String(req.body.giro_bank_name) : null;

    await executeQuery(
      'UPDATE JournalVouchers SET doc_date = ?, description = ?, is_giro = ?, giro_number = ?, giro_due_date = ?, giro_bank_name = ? WHERE id = ?',
      [String(doc_date), String(description), p_is_giro, p_giro_number, p_giro_due_date, p_giro_bank_name, req.params.id]
    );

    // Revert Allocation from Old Details
    const oldDetails = await executeQuery('SELECT ref_id, ref_type, debit, credit FROM JournalVoucherDetails WHERE jv_id = ?', [jvId]);
    for (const old of oldDetails) {
      if (old.ref_id && old.ref_type) {
        const table = old.ref_type === 'AP' ? 'APInvoices' : (old.ref_type === 'AR' ? 'ARInvoices' : null);
        if (table) {
          const amount = parseFloat(old.debit) || parseFloat(old.credit) || 0;
          await executeQuery(`UPDATE ${table} SET paid_amount = paid_amount - ? WHERE id = ?`, [amount, old.ref_id]);
          // Revert status to Posted (or Partial)
          // If paid_amount becomes < total but > 0 -> Partial. If <= 0 -> Posted.
          // We'll simplisticly set to Posted if currently Paid. The insert loop will re-check.
          // Better: check logic.
          await executeQuery(`UPDATE ${table} SET status = 'Posted' WHERE id = ? AND paid_amount <= 0`, [old.ref_id]);
          await executeQuery(`UPDATE ${table} SET status = 'Partial' WHERE id = ? AND paid_amount > 0 AND paid_amount < total_amount`, [old.ref_id]);
          // If it remains paid? (e.g. overpayment revert). Logic handles it.
        }
      }
    }

    // Delete existing details
    await executeQuery('DELETE FROM JournalVoucherDetails WHERE jv_id = ?', [jvId]);

    // Insert new details
    for (const det of details) {
      const refId = det.ref_id ? parseInt(det.ref_id) : null;
      const refType = det.ref_type ? String(det.ref_type) : null;

      await executeQuery(
        `INSERT INTO JournalVoucherDetails (jv_id, coa_id, description, debit, credit, ref_id, ref_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [jvId, det.coa_id, det.description || '', det.debit, det.credit, refId, refType]
      );

      // Allocation Update (New)
      if (refId && refType) {
        const table = refType === 'AP' ? 'APInvoices' : (refType === 'AR' ? 'ARInvoices' : null);
        if (table) {
          const amount = parseFloat(det.debit) || parseFloat(det.credit) || 0;
          await executeQuery(`UPDATE ${table} SET paid_amount = paid_amount + ? WHERE id = ?`, [amount, refId]);
          await executeQuery(`UPDATE ${table} SET status = 'Paid' WHERE id = ? AND paid_amount >= total_amount`, [refId]);
          await executeQuery(`UPDATE ${table} SET status = 'Partial' WHERE id = ? AND paid_amount < total_amount AND paid_amount > 0`, [refId]);
        }
      }
    }

    res.json({ success: true, message: 'Journal updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete Journal Voucher
app.delete('/api/journals/:id', async (req, res) => {
  try {
    const jvId = req.params.id;
    const current = await executeQuery('SELECT status FROM JournalVouchers WHERE id = ?', [jvId]);
    if (current.length === 0) return res.status(404).json({ success: false, error: 'Journal not found' });
    if (current[0].status !== 'Draft') return res.status(400).json({ success: false, error: 'Cannot delete posted journal' });

    // Revert Allocation
    const oldDetails = await executeQuery('SELECT ref_id, ref_type, debit, credit FROM JournalVoucherDetails WHERE jv_id = ?', [jvId]);
    for (const old of oldDetails) {
      if (old.ref_id && old.ref_type) {
        const table = old.ref_type === 'AP' ? 'APInvoices' : (old.ref_type === 'AR' ? 'ARInvoices' : null);
        if (table) {
          const amount = parseFloat(old.debit) || parseFloat(old.credit) || 0;
          await executeQuery(`UPDATE ${table} SET paid_amount = paid_amount - ? WHERE id = ?`, [amount, old.ref_id]);
          await executeQuery(`UPDATE ${table} SET status = 'Posted' WHERE id = ? AND paid_amount <= 0`, [old.ref_id]);
          await executeQuery(`UPDATE ${table} SET status = 'Partial' WHERE id = ? AND paid_amount > 0 AND paid_amount < total_amount`, [old.ref_id]);
        }
      }
    }

    await executeQuery('DELETE FROM JournalVoucherDetails WHERE jv_id = ?', [jvId]);
    await executeQuery('DELETE FROM JournalVouchers WHERE id = ?', [jvId]);

    res.json({ success: true, message: 'Journal deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Post Journal Voucher
app.put('/api/journals/:id/post', async (req, res) => {
  try {
    const jvId = req.params.id;
    await executeQuery("UPDATE JournalVouchers SET status = 'Posted' WHERE id = ?", [jvId]);
    res.json({ success: true, message: 'Journal posted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unpost Journal Voucher
app.put('/api/journals/:id/unpost', async (req, res) => {
  try {
    const jvId = req.params.id;
    await executeQuery("UPDATE JournalVouchers SET status = 'Draft' WHERE id = ?", [jvId]);
    res.json({ success: true, message: 'Journal unposted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== GL SETTINGS ====================
app.get('/api/gl-settings', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT s.*, a.code as account_code, a.name as account_name 
      FROM GeneralLedgerSettings s
      LEFT JOIN Accounts a ON s.account_id = a.id
    `);

    // Transform to key-value object for easier frontend consumption
    const settings = {};
    result.forEach(row => {
      settings[row.setting_key] = {
        account_id: row.account_id,
        account_code: row.account_code,
        account_name: row.account_name
      };
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/gl-settings', async (req, res) => {
  try {
    const settings = req.body; // Expecting array of { key, account_id } or object

    // If object { key: account_id, ... }
    for (const [key, account_id] of Object.entries(settings)) {
      if (!account_id) continue;

      // Check if exists
      const exists = await executeQuery('SELECT count(*) as count FROM GeneralLedgerSettings WHERE setting_key = ?', [key]);

      if (exists[0].count > 0) {
        await executeQuery('UPDATE GeneralLedgerSettings SET account_id = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?', [account_id, key]);
      } else {
        await executeQuery('INSERT INTO GeneralLedgerSettings (setting_key, account_id) VALUES (?, ?)', [key, account_id]);
      }
    }

    res.json({ success: true, message: 'GL Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to create automated journal (will be used by transaction updates)
async function createAutomatedJournal(type, ref_id, doc_number, doc_date, details) {
  let connection;
  try {
    connection = await odbc.connect(connectionString);

    // await connection.beginTransaction(); // Calling SQL directly for safety
    await connection.query('BEGIN TRANSACTION');

    // 1. Check if journal already exists
    // Note: This check can be separate or same connection. Same is safer.
    const existing = await connection.query('SELECT id FROM JournalVouchers WHERE source_type = ? AND ref_id = ?', [type, ref_id]);
    let jvId;

    // For now using source doc number prefixed
    const jvNumber = `JV-${doc_number}`;

    if (existing.length > 0) {
      logDebug(`Existing Journal found for ${type} #${doc_number} (ID: ${existing[0].id}). Replacing details.`);
      jvId = existing[0].id;
      // Update existing
      await connection.query('UPDATE JournalVouchers SET doc_number = ?, doc_date = ? WHERE id = ?', [jvNumber, doc_date, jvId]);
      await connection.query('DELETE FROM JournalVoucherDetails WHERE jv_id = ?', [jvId]);
    } else {
      // Create new
      logDebug(`Creating new JournalVoucher ${jvNumber}`);
      await connection.query(
        'INSERT INTO JournalVouchers (doc_number, doc_date, description, status, source_type, ref_id) VALUES (?, ?, ?, ?, ?, ?)',
        [jvNumber, doc_date, `Auto Journal for ${type} #${doc_number}`, 'Posted', type, ref_id]
      );

      const res = await connection.query('SELECT @@IDENTITY as id');
      jvId = res[0].id;
      logDebug(`New Journal ID: ${jvId}`);
    }

    // 2. Insert Details
    logDebug(`Inserting ${details.length} details for JV #${jvId}`);
    for (const det of details) {
      if (!det.coa_id) {
        logDebug(`Skipping detail due to missing coa_id: ${JSON.stringify(det)}`);
        continue;
      }
      logDebug(`Inserting detail: Debit=${det.debit}, Credit=${det.credit}, COA=${det.coa_id}`);
      await connection.query(
        'INSERT INTO JournalVoucherDetails (jv_id, coa_id, debit, credit, description) VALUES (?, ?, ?, ?, ?)',
        [jvId, det.coa_id, det.debit || 0, det.credit || 0, det.description || '']
      );
    }

    await connection.query('COMMIT');
    // await connection.commit();
    logDebug(`Transaction Committed for JV #${jvId}`);

    console.log(`✅ Automated Journal created for ${type} #${doc_number}`);
    return true;
  } catch (error) {
    if (connection) {
      try { await connection.query('ROLLBACK'); } catch (e) { }
    }
    logDebug(`ERROR in createAutomatedJournal: ${error.message}`);
    console.error(`❌ Failed to create automated journal for ${type} #${doc_number}:`, error);
    return false;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

// Function to get GL Account ID by setting key
async function getGlAccount(key) {
  const res = await executeQuery('SELECT account_id FROM GeneralLedgerSettings WHERE setting_key = ?', [key]);
  return res.length > 0 ? res[0].account_id : null;
}

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
    const hasReceiving = await executeQuery("SELECT COUNT(*) as count FROM Receivings WHERE po_id = ? AND status <> ?", [parseInt(req.params.id), 'Cancelled']);
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
    const hasReceiving = await executeQuery("SELECT COUNT(*) as count FROM Receivings WHERE po_id = ? AND status <> ?", [parseInt(req.params.id), 'Cancelled']);
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
    console.log(`Unapproving PO ID: ${req.params.id}`);
    const hasReceiving = await executeQuery("SELECT COUNT(*) as count FROM Receivings WHERE po_id = ? AND status <> ?", [parseInt(req.params.id), 'Cancelled']);
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
      SELECT d.*, i.code as item_code, i.name as item_name, i.unit as unit_code,
      (
        SELECT COALESCE(SUM(sd.quantity), 0)
        FROM ShipmentDetails sd
        JOIN Shipments s ON sd.shipment_id = s.id
        WHERE s.so_id = d.so_id AND sd.item_id = d.item_id AND s.status != 'Cancelled'
      ) as qty_shipped
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
      'UPDATE SalesOrders SET doc_number = ?, doc_date = ?, partner_id = ?, sales_person_id = ?, status = ?, total_amount = ?, transcode_id = ?, payment_term_id = ?, tax_type = ? WHERE id = ?',
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
    // Validation: Check if linked to Shipment
    console.log(`Unapproving SO ID: ${req.params.id}`);
    const hasShipment = await executeQuery("SELECT COUNT(*) as count FROM Shipments WHERE so_id = ? AND status <> ?", [req.params.id, 'Cancelled']);
    if (hasShipment[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat meng-unapprove SO karena sudah ada dokumen Shipment yang terhubung. Hapus Shipment terlebih dahulu.'
      });
    }

    // Post: Unapprove Sales Order
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
      SELECT d.*, i.code as item_code, i.name as item_name, i.unit as unit_code,
             COALESCE(pod.unit_price, 0) as unit_price,
             COALESCE(po.tax_type, 'Exclude') as tax_type
      FROM ReceivingDetails d
      LEFT JOIN Items i ON d.item_id = i.id
      LEFT JOIN Receivings r ON d.receiving_id = r.id
      LEFT JOIN PurchaseOrders po ON r.po_id = po.id
      LEFT JOIN PurchaseOrderDetails pod ON r.po_id = pod.po_id AND d.item_id = pod.item_id
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
    const rxId = req.params.id;
    const result = await executeQuery('SELECT * FROM Receivings WHERE id = ?', [rxId]);

    if (result.length === 0) return res.status(404).json({ success: false, message: 'Receiving not found' });
    if (result[0].status !== 'Draft') { // Should strictly be Draft, but let's check
      return res.status(400).json({ success: false, message: 'Hanya dokumen Draft yang bisa dihapus' });
    }

    // Check if used in other tables (logic exists?)

    // Cleanup Journal (Safety measure)
    try {
      const checkJurnal = await executeQuery('SELECT id FROM JournalVouchers WHERE source_type = ? AND ref_id = ?', ['Receiving', rxId]);
      if (checkJurnal.length > 0) {
        const jvId = checkJurnal[0].id;
        await executeQuery('DELETE FROM JournalVoucherDetails WHERE jv_id = ?', [jvId]);
        await executeQuery('DELETE FROM JournalVouchers WHERE id = ?', [jvId]);
      }
    } catch (jErr) {
      console.error('Error cleaning up journal:', jErr);
    }

    await executeQuery('DELETE FROM ReceivingDetails WHERE receiving_id = ?', [rxId]);
    await executeQuery('DELETE FROM Receivings WHERE id = ?', [rxId]);

    if (result[0].po_id) await updatePOStatus(result[0].po_id);

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
    const rxId = req.params.id;
    await executeQuery('UPDATE Receivings SET status = ? WHERE id = ?', ['Draft', rxId]);

    // ================== DELETE AUTOMATED JOURNAL ==================
    try {
      const checkJurnal = await executeQuery('SELECT id FROM JournalVouchers WHERE source_type = ? AND ref_id = ?', ['Receiving', rxId]);
      if (checkJurnal.length > 0) {
        const jvId = checkJurnal[0].id;
        await executeQuery('DELETE FROM JournalVoucherDetails WHERE jv_id = ?', [jvId]);
        await executeQuery('DELETE FROM JournalVouchers WHERE id = ?', [jvId]);
        console.log(`✅ Automated Journal deleted for Receiving #${rxId}`);
      }
    } catch (jErr) {
      console.error('Failed to delete receiving journal:', jErr);
    }

    res.json({ success: true, message: 'Receiving berhasil di-unpost (Kembali ke Draft)' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ==================== AP INVOICES ====================
app.get('/api/ap-invoices', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT ap.*, p.name as partner_name, t.name as transcode_name, r.doc_number as receiving_number
      FROM APInvoices ap
      LEFT JOIN Partners p ON ap.partner_id = p.id
      LEFT JOIN Transcodes t ON ap.transcode_id = t.id
      LEFT JOIN Receivings r ON ap.receiving_id = r.id
      ORDER BY ap.doc_date DESC, ap.doc_number DESC
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/ap-invoices/:id', async (req, res) => {
  try {
    const header = await executeQuery(`
      SELECT ap.*, p.name as partner_name
      FROM APInvoices ap
      LEFT JOIN Partners p ON ap.partner_id = p.id
      WHERE ap.id = ?
    `, [req.params.id]);

    const details = await executeQuery(`
      SELECT d.*, i.code as item_code, i.name as item_name
      FROM APInvoiceDetails d
      LEFT JOIN Items i ON d.item_id = i.id
      WHERE d.ap_invoice_id = ?
    `, [req.params.id]);

    res.json({ success: true, data: { ...header[0], details } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ap-invoices', async (req, res) => {
  try {
    const { doc_number, doc_date, partner_id, due_date, status, notes, transcode_id, tax_type, items, receiving_id } = req.body;

    await executeQuery(
      'INSERT INTO APInvoices (doc_number, doc_date, partner_id, due_date, status, notes, transcode_id, tax_type, receiving_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [doc_number, doc_date, partner_id, due_date || null, status || 'Draft', notes || '', transcode_id || null, tax_type || 'Exclude', receiving_id || null]
    );

    const result = await executeQuery('SELECT * FROM APInvoices WHERE doc_number = ?', [doc_number]);
    const apId = result[0]?.id;

    if (items && items.length > 0 && apId) {
      for (const d of items) {
        await executeQuery(
          'INSERT INTO APInvoiceDetails (ap_invoice_id, item_id, description, quantity, unit_price, amount, receiving_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [apId, d.item_id || null, d.description || '', d.quantity || 0, d.unit_price || 0, d.amount || 0, d.receiving_id || null]
        );
      }
    }

    res.json({ success: true, data: result[0], message: 'AP Invoice berhasil dibuat' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/ap-invoices/:id', async (req, res) => {
  try {
    const { doc_number, doc_date, partner_id, due_date, status, notes, transcode_id, tax_type, items, receiving_id } = req.body;

    await executeQuery(
      'UPDATE APInvoices SET doc_number = ?, doc_date = ?, partner_id = ?, due_date = ?, status = ?, notes = ?, transcode_id = ?, tax_type = ?, receiving_id = ? WHERE id = ?',
      [doc_number, doc_date, partner_id, due_date || null, status, notes || '', transcode_id || null, tax_type || 'Exclude', receiving_id || null, req.params.id]
    );

    await executeQuery('DELETE FROM APInvoiceDetails WHERE ap_invoice_id = ?', [req.params.id]);

    if (items && items.length > 0) {
      for (const d of items) {
        await executeQuery(
          'INSERT INTO APInvoiceDetails (ap_invoice_id, item_id, description, quantity, unit_price, amount, receiving_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [req.params.id, d.item_id || null, d.description || '', d.quantity || 0, d.unit_price || 0, d.amount || 0, d.receiving_id || null]
        );
      }
    }

    res.json({ success: true, message: 'AP Invoice berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/ap-invoices/:id', async (req, res) => {
  try {
    const apId = req.params.id;
    const result = await executeQuery('SELECT status FROM APInvoices WHERE id = ?', [apId]);
    if (result[0]?.status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Hanya dokumen Draft yang bisa dihapus' });
    }

    // Cleanup Journal (Safety measure)
    try {
      const checkJurnal = await executeQuery('SELECT id FROM JournalVouchers WHERE source_type = ? AND ref_id = ?', ['APInvoice', apId]);
      if (checkJurnal.length > 0) {
        const jvId = checkJurnal[0].id;
        await executeQuery('DELETE FROM JournalVoucherDetails WHERE jv_id = ?', [jvId]);
        await executeQuery('DELETE FROM JournalVouchers WHERE id = ?', [jvId]);
      }
    } catch (jErr) {
      console.error('Error cleaning up journal:', jErr);
    }

    await executeQuery('DELETE FROM APInvoiceDetails WHERE ap_invoice_id = ?', [apId]);
    await executeQuery('DELETE FROM APInvoices WHERE id = ?', [apId]);
    res.json({ success: true, message: 'AP Invoice berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/ap-invoices/:id/post', async (req, res) => {
  try {
    const apId = req.params.id;
    await executeQuery('UPDATE APInvoices SET status = ? WHERE id = ?', ['Posted', apId]);

    // ================== AUTOMATED JOURNAL (AP INVOICE) ==================
    // Debit: Hutang Dagang Temporary (AP Temporary)
    // Credit: Hutang Dagang (AP Trade)
    // Debit: PPN Masukan (VAT In) - if applicable
    try {
      const apTempAcc = await getGlAccount('ap_temp_account');
      const apTradeAcc = await getGlAccount('ap_trade_account');
      const vatInAcc = await getGlAccount('vat_in_account');

      if (apTempAcc && apTradeAcc) {
        const apDoc = await executeQuery('SELECT * FROM APInvoices WHERE id = ?', [apId]);
        const inv = apDoc[0];

        const items = await executeQuery('SELECT * FROM APInvoiceDetails WHERE ap_invoice_id = ?', [apId]);

        // Calculate Totals
        let totalNet = 0;
        let totalVAT = 0;

        items.forEach(item => {
          totalNet += (Number(item.quantity) * Number(item.unit_price)) || 0;
        });

        if (inv.tax_type === 'Include') {
          totalVAT = totalNet - (totalNet / 1.11);
          totalNet = totalNet / 1.11;
        } else if (inv.tax_type === 'Exclude') {
          totalVAT = totalNet * 0.11;
        } else {
          totalVAT = 0;
        }

        const totalAP = totalNet + totalVAT;

        if (totalAP > 0) {
          const journalDetails = [
            { coa_id: apTempAcc, debit: totalNet, credit: 0, description: 'AP Temporary Reversal' },
            { coa_id: apTradeAcc, debit: 0, credit: totalAP, description: 'Accounts Payable' }
          ];

          if (totalVAT > 0 && vatInAcc) {
            journalDetails.push({ coa_id: vatInAcc, debit: totalVAT, credit: 0, description: 'VAT In' });
          }

          await createAutomatedJournal('APInvoice', apId, inv.doc_number, inv.doc_date, journalDetails);
        }
      }
    } catch (jErr) {
      console.error('Failed to generate AP Invoice journal:', jErr);
    }

    res.json({ success: true, message: 'AP Invoice berhasil di-post' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/ap-invoices/:id/unpost', async (req, res) => {
  try {
    const apId = req.params.id;
    await executeQuery('UPDATE APInvoices SET status = ? WHERE id = ?', ['Draft', apId]);

    // ================== DELETE AUTOMATED JOURNAL ==================
    try {
      const checkJurnal = await executeQuery('SELECT id FROM JournalVouchers WHERE source_type = ? AND ref_id = ?', ['APInvoice', apId]);
      if (checkJurnal.length > 0) {
        const jvId = checkJurnal[0].id;
        await executeQuery('DELETE FROM JournalVoucherDetails WHERE jv_id = ?', [jvId]);
        await executeQuery('DELETE FROM JournalVouchers WHERE id = ?', [jvId]);
        console.log(`✅ Automated Journal deleted for AP Invoice #${apId}`);
      }
    } catch (jErr) {
      console.error('Failed to delete AP Invoice journal:', jErr);
    }

    res.json({ success: true, message: 'AP Invoice berhasil di-unpost (Kembali ke Draft)' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/ar-invoices', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT ar.*, p.name as partner_name, sp.name as sales_person_name, pt.name as payment_term_name
      FROM ARInvoices ar
      LEFT JOIN Partners p ON ar.partner_id = p.id
      LEFT JOIN SalesPersons sp ON ar.sales_person_id = sp.id
      LEFT JOIN PaymentTerms pt ON ar.payment_term_id = pt.id
      ORDER BY ar.doc_date DESC
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ar-invoices', async (req, res) => {
  try {
    const { doc_number, doc_date, due_date, partner_id, shipment_id, total_amount, status, notes, transcode_id, tax_type, items, sales_person_id, payment_term_id } = req.body;

    console.log('AR Invoice POST - Request body:', JSON.stringify(req.body, null, 2));

    // Validate Accounting Period
    const isPeriodOpen = await validatePeriod(doc_date);
    if (!isPeriodOpen) {
      return res.status(400).json({ success: false, error: 'Tanggal transaksi berada di luar periode akuntansi yang sedang aktif (Open).' });
    }

    console.log('Inserting AR Invoice header...');
    await executeQuery(
      'INSERT INTO ARInvoices (doc_number, doc_date, due_date, partner_id, shipment_id, total_amount, status, notes, transcode_id, tax_type, sales_person_id, payment_term_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [doc_number, doc_date, due_date || null, partner_id, shipment_id || null, total_amount || 0, status || 'Draft', notes || '', transcode_id || null, tax_type || 'Exclude', sales_person_id || null, payment_term_id || null]
    );
    console.log('AR Invoice header inserted successfully');

    const result = await executeQuery('SELECT * FROM ARInvoices WHERE doc_number = ?', [doc_number]);
    const arId = result[0]?.id;
    console.log('AR Invoice ID:', arId);

    if (items && items.length > 0 && arId) {
      console.log('Inserting', items.length, 'detail items...');
      for (const item of items) {
        const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
        console.log('Inserting item:', { arId, item_id: item.item_id, description: item.description, quantity: item.quantity, unit_price: item.unit_price, lineTotal });
        await executeQuery(
          'INSERT INTO ARInvoiceDetails (ar_invoice_id, item_id, description, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)',
          [arId, item.item_id || null, item.description || '', parseFloat(item.quantity) || 0, parseFloat(item.unit_price) || 0, lineTotal]
        );
      }
      console.log('All detail items inserted successfully');
    }

    res.json({ success: true, data: result[0], message: 'AR Invoice berhasil dibuat' });
  } catch (error) {
    console.error('AR Invoice POST Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/ar-invoices/:id', async (req, res) => {
  try {
    const { doc_number, doc_date, due_date, partner_id, shipment_id, total_amount, status, notes, transcode_id, tax_type, items, sales_person_id, payment_term_id } = req.body;

    // Validate Accounting Period
    const isPeriodOpen = await validatePeriod(doc_date);
    if (!isPeriodOpen) {
      return res.status(400).json({ success: false, error: 'Tanggal transaksi berada di luar periode akuntansi yang sedang aktif (Open).' });
    }

    await executeQuery(
      'UPDATE ARInvoices SET doc_number = ?, doc_date = ?, due_date = ?, partner_id = ?, shipment_id = ?, total_amount = ?, status = ?, notes = ?, transcode_id = ?, tax_type = ?, sales_person_id = ?, payment_term_id = ? WHERE id = ?',
      [doc_number, doc_date, due_date, partner_id, shipment_id || null, total_amount || 0, status, notes || '', transcode_id || null, tax_type || 'Exclude', sales_person_id || null, payment_term_id || null, req.params.id]
    );

    await executeQuery('DELETE FROM ARInvoiceDetails WHERE ar_invoice_id = ?', [req.params.id]);

    if (items && items.length > 0) {
      for (const d of items) {
        await executeQuery(
          'INSERT INTO ARInvoiceDetails (ar_invoice_id, item_id, description, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?, ?)',
          [req.params.id, d.item_id || null, d.description || '', d.quantity || 0, d.unit_price || 0, (d.quantity || 0) * (d.unit_price || 0)]
        );
      }
    }

    res.json({ success: true, message: 'AR Invoice berhasil diupdate' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/ar-invoices/:id', async (req, res) => {
  try {
    const arId = req.params.id;
    const result = await executeQuery('SELECT status FROM ARInvoices WHERE id = ?', [arId]);
    if (result[0]?.status !== 'Draft') {
      return res.status(400).json({ success: false, message: 'Hanya dokumen Draft yang bisa dihapus' });
    }

    // Cleanup Journal (Safety measure)
    try {
      const checkJurnal = await executeQuery('SELECT id FROM JournalVouchers WHERE source_type = ? AND ref_id = ?', ['ARInvoice', arId]);
      if (checkJurnal.length > 0) {
        const jvId = checkJurnal[0].id;
        await executeQuery('DELETE FROM JournalVoucherDetails WHERE jv_id = ?', [jvId]);
        await executeQuery('DELETE FROM JournalVouchers WHERE id = ?', [jvId]);
      }
    } catch (jErr) {
      console.error('Error cleaning up journal:', jErr);
    }

    await executeQuery('DELETE FROM ARInvoiceDetails WHERE ar_invoice_id = ?', [arId]);
    await executeQuery('DELETE FROM ARInvoices WHERE id = ?', [arId]);
    res.json({ success: true, message: 'AR Invoice berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/ar-invoices/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM ARInvoices WHERE id = ?', [req.params.id]);
    if (result.length === 0) return res.status(404).json({ success: false, message: 'AR Invoice not found' });

    const details = await executeQuery(`
      SELECT d.*, i.name as item_name, i.code as item_code
      FROM ARInvoiceDetails d
      LEFT JOIN Items i ON d.item_id = i.id
      WHERE d.ar_invoice_id = ?
    `, [req.params.id]);

    const data = { ...result[0], details };
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/ar-invoices/:id/post', async (req, res) => {
  try {
    const arId = req.params.id;
    await executeQuery('UPDATE ARInvoices SET status = ? WHERE id = ?', ['Posted', arId]);

    // ================== AUTOMATED JOURNAL (AR INVOICE) ==================
    // 1. Dr Piutang / Cr Sales & VAT
    // 2. Reversal: Dr Sales Temp / Cr Uninvoice Shipment
    // 3. COGS: Dr COGS / Cr Inventory

    try {
      const arTradeAcc = await getGlAccount('ar_trade_account');
      const salesAcc = await getGlAccount('sales_account');
      const vatOutAcc = await getGlAccount('vat_out_account');

      const salesTempAcc = await getGlAccount('sales_temp_account');
      const uninvoiceShipmentAcc = await getGlAccount('uninvoice_shipment_account');

      const cogsAcc = await getGlAccount('cogs_account');
      const inventoryAcc = await getGlAccount('inventory_account');

      if (arTradeAcc && salesAcc && vatOutAcc && salesTempAcc && uninvoiceShipmentAcc && cogsAcc && inventoryAcc) {

        const arDoc = await executeQuery('SELECT * FROM ARInvoices WHERE id = ?', [arId]);
        const inv = arDoc[0];

        // Get Invoice Details
        const items = await executeQuery('SELECT * FROM ARInvoiceDetails WHERE ar_invoice_id = ?', [arId]);

        // Calculate Totals
        let totalSales = 0;
        let totalVAT = 0; // Simplified. Ideally calculate from tax_type or detail
        // For simplicity, let's assume total_amount includes tax, and we need to derive details
        // Or better: use item.line_total for Sales, and diff is VAT?
        // user schema has 'tax_type' header.

        // Helper calc
        items.forEach(item => {
          totalSales += (Number(item.quantity) * Number(item.unit_price)) || 0;
        });

        if (inv.tax_type === 'Include') {
          totalVAT = totalSales - (totalSales / 1.11);
          totalSales = totalSales / 1.11;
        } else if (inv.tax_type === 'Exclude') {
          totalVAT = totalSales * 0.11;
        } else {
          totalVAT = 0;
        }

        const totalAR = totalSales + totalVAT;

        // Reversal Amount (Shipment Value) & COGS
        // We need to fetch item standard cost for COGS
        // We assume Shipment Value = Invoice Sales Value? User wants flow linkage.
        // Actually Shipment journal was: Qty * UnitPrice (from SO). 
        // AR Invoice usually matches SO Price. So we can use Invoice Amount for reversal too.
        const reversalAmount = totalSales; // Assuming Uninvoiced Shipment used same value

        let totalCOGS = 0;
        // Calculate COGS using Average Cost from Purchase History
        for (const item of items) {
          if (item.item_id) {
            // Priority 1: Calculate Average Cost from Approved POs
            const avgCostResult = await executeQuery(`
                SELECT AVG(pod.unit_price) as avg_cost 
                FROM PurchaseOrderDetails pod
                JOIN PurchaseOrders po ON pod.po_id = po.id
                WHERE pod.item_id = ? AND po.status IN ('Approved', 'Closed')
            `, [item.item_id]);

            let cost = Number(avgCostResult[0]?.avg_cost);

            // Priority 2: If no PO history, use Item Standard Cost
            if (!cost || isNaN(cost)) {
              const itemData = await executeQuery('SELECT standard_cost FROM Items WHERE id = ?', [item.item_id]);
              cost = Number(itemData[0]?.standard_cost) || 0;
            }

            totalCOGS += (cost * Number(item.quantity));
          }
        }

        const journalDetails = [
          // 1. AR & Revenue
          { coa_id: arTradeAcc, debit: totalAR, credit: 0, description: 'Accounts Receivable' },
          { coa_id: salesAcc, debit: 0, credit: totalSales, description: 'Sales Revenue' },

          // 2. Shipment Reversal
          { coa_id: salesTempAcc, debit: reversalAmount, credit: 0, description: 'Sales Temporary Reversal' },
          { coa_id: uninvoiceShipmentAcc, debit: 0, credit: reversalAmount, description: 'Uninvoiced Shipment Reversal' },

          // 3. COGS / Inventory
          { coa_id: cogsAcc, debit: totalCOGS, credit: 0, description: 'Cost of Goods Sold' },
          { coa_id: inventoryAcc, debit: 0, credit: totalCOGS, description: 'Inventory' }
        ];

        if (totalVAT > 0) {
          journalDetails.push({ coa_id: vatOutAcc, debit: 0, credit: totalVAT, description: 'VAT Out' });
        }

        await createAutomatedJournal('ARInvoice', arId, inv.doc_number, inv.doc_date, journalDetails);
      }
    } catch (jErr) {
      console.error('Failed to generate AR Invoice journal:', jErr);
    }

    res.json({ success: true, message: 'AR Invoice berhasil di-post' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/ar-invoices/:id/unpost', async (req, res) => {
  try {
    const arId = req.params.id;
    await executeQuery('UPDATE ARInvoices SET status = ? WHERE id = ?', ['Draft', arId]);

    // ================== DELETE AUTOMATED JOURNAL ==================
    try {
      const checkJurnal = await executeQuery('SELECT id FROM JournalVouchers WHERE source_type = ? AND ref_id = ?', ['ARInvoice', arId]);
      if (checkJurnal.length > 0) {
        const jvId = checkJurnal[0].id;
        await executeQuery('DELETE FROM JournalVoucherDetails WHERE jv_id = ?', [jvId]);
        await executeQuery('DELETE FROM JournalVouchers WHERE id = ?', [jvId]);
        console.log(`✅ Automated Journal deleted for AR Invoice #${arId}`);
      }
    } catch (jErr) {
      console.error('Failed to delete AR Invoice journal:', jErr);
    }

    res.json({ success: true, message: 'AR Invoice berhasil di-unpost (Kembali ke Draft)' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Note: GET /api/shipments is defined earlier in the file (around line 540)

app.get('/api/shipments/:id', async (req, res) => {
  try {
    const result = await executeQuery('SELECT * FROM Shipments WHERE id = ?', [req.params.id]);
    if (result.length === 0) return res.status(404).json({ success: false, message: 'Shipment not found' });

    const details = await executeQuery(`
        SELECT d.*, i.code as item_code, i.name as item_name, i.unit as unit_code,
               COALESCE(sod.unit_price, 0) as unit_price,
               COALESCE(so.tax_type, 'Exclude') as tax_type,
               so.sales_person_id,
               so.payment_term_id
        FROM ShipmentDetails d
        LEFT JOIN Items i ON d.item_id = i.id
        LEFT JOIN Shipments s ON d.shipment_id = s.id
        LEFT JOIN SalesOrders so ON s.so_id = so.id
        LEFT JOIN SalesOrderDetails sod ON s.so_id = sod.so_id AND d.item_id = sod.item_id
        WHERE d.shipment_id = ?
      `, [req.params.id]);

    res.json({ success: true, data: { ...result[0], details } });
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

async function updateSOStatus(soId) {
  if (!soId) return;

  try {
    const soItems = await executeQuery(
      'SELECT item_id, quantity FROM SalesOrderDetails WHERE so_id = ?',
      [soId]
    );

    if (soItems.length === 0) return;

    const shippedItems = await executeQuery(`
      SELECT sd.item_id, SUM(sd.quantity) as total_shipped
      FROM ShipmentDetails sd
      JOIN Shipments s ON sd.shipment_id = s.id
      WHERE s.so_id = ? AND s.status != 'Cancelled'
      GROUP BY sd.item_id
    `, [soId]);

    const shippedMap = {};
    shippedItems.forEach(item => {
      shippedMap[item.item_id] = item.total_shipped;
    });

    let allShipped = true;
    for (const item of soItems) {
      const shippedQty = shippedMap[item.item_id] || 0;
      if (shippedQty < item.quantity) {
        allShipped = false;
        break;
      }
    }

    const currentSO = await executeQuery('SELECT status FROM SalesOrders WHERE id = ?', [soId]);
    const currentStatus = currentSO[0]?.status;

    if (allShipped && currentStatus !== 'Closed') {
      await executeQuery("UPDATE SalesOrders SET status = 'Closed' WHERE id = ?", [soId]);
      console.log(`SO ${soId} status updated to Closed`);
    } else if (!allShipped && currentStatus === 'Closed') {
      await executeQuery("UPDATE SalesOrders SET status = 'Approved' WHERE id = ?", [soId]);
      console.log(`SO ${soId} status reverted to Approved`);
    }

  } catch (error) {
    console.error('Error updating SO status:', error);
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


// ==================== INVENTORY ====================
app.post('/api/inventory/recalculate', async (req, res) => {
  try {
    console.log('Starting Inventory Recalculation...');

    // 1. Clear existing stocks (DELETE instead of TRUNCATE for MS Access compatibility)
    console.log('Step 1: Clearing existing stocks...');
    try {
      await executeQuery('DELETE FROM ItemStocks');
      console.log('Step 1: ✅ Complete');
    } catch (e) {
      console.error('Step 1 Error:', e.message);
      throw new Error('Gagal menghapus data ItemStocks: ' + e.message);
    }

    // 2. Fetch all Approved Receivings (IN) - Ordered by Date
    console.log('Step 2: Fetching receivings...');
    let receivings = [];
    try {
      receivings = await executeQuery(`
        SELECT rd.item_id, rd.quantity, pod.unit_price, r.warehouse_id, r.doc_date
        FROM ReceivingDetails rd
        JOIN Receivings r ON rd.receiving_id = r.id
        LEFT JOIN PurchaseOrderDetails pod ON r.po_id = pod.po_id AND rd.item_id = pod.item_id
        WHERE r.status = 'Approved'
        ORDER BY r.doc_date ASC, r.id ASC
      `);
      console.log('Step 2: ✅ Complete, found', receivings.length, 'receivings');
    } catch (e) {
      console.error('Step 2 Error:', e.message);
      throw new Error('Gagal mengambil data Receiving: ' + e.message);
    }

    // 3. Fetch all Shipments (OUT) - Ordered by Date
    console.log('Step 3: Fetching shipments...');
    let shipments = [];
    try {
      shipments = await executeQuery(`
        SELECT sd.item_id, sd.quantity, NULL as warehouse_id, s.doc_date
        FROM ShipmentDetails sd
        JOIN Shipments s ON sd.shipment_id = s.id
        WHERE s.status = 'Approved' OR s.status = 'Closed'
        ORDER BY s.doc_date ASC, s.id ASC
      `);
      console.log('Step 3: ✅ Complete, found', shipments.length, 'shipments');
    } catch (e) {
      console.error('Step 3 Error:', e.message);
      throw new Error('Gagal mengambil data Shipment: ' + e.message);
    }


    // Processing Logic (In-Memory for simplicity, could be optimized)
    const stockMap = {}; // Key: item_id, Value: { totalQty: 0, totalValue: 0 }
    const warehouseStockMap = {}; // Key: item_id-warehouse_id, Value: qty

    // Process Receivings (IN) - Calculate Weighted Average Cost
    for (const rec of receivings) {
      if (!rec.item_id) continue;

      const key = rec.item_id;
      const wareKey = `${rec.item_id}-${rec.warehouse_id}`;

      if (!stockMap[key]) stockMap[key] = { totalQty: 0, totalValue: 0 };
      if (!warehouseStockMap[wareKey]) warehouseStockMap[wareKey] = 0;

      const qty = Number(rec.quantity);
      const cost = Number(rec.unit_price || 0);

      // Add to Warehouse Stock
      warehouseStockMap[wareKey] += qty;

      // Update Global Average Cost (Simple Moving Average)
      // Only update cost if we have valid price. If price is 0 (e.g. bonus), it dilutes cost.
      // Logic: New Avg = ((OldQty * OldAvg) + (NewQty * NewPrice)) / (OldQty + NewQty)
      // Here we track total Value and total Qty
      stockMap[key].totalQty += qty;
      stockMap[key].totalValue += (qty * cost);
    }

    // Process Shipments (OUT)
    for (const shp of shipments) {
      if (!shp.item_id) continue;

      const key = shp.item_id;
      const wareKey = `${shp.item_id}-${shp.warehouse_id}`;

      if (!warehouseStockMap[wareKey]) warehouseStockMap[wareKey] = 0;
      if (!stockMap[key]) stockMap[key] = { totalQty: 0, totalValue: 0 };

      const qty = Number(shp.quantity);

      // Deduct from Warehouse Stock
      warehouseStockMap[wareKey] -= qty;

      // Deduct from Global Total Qty (Value decreases proportionally to Avg Cost)
      // We don't need to adjust TotalValue for Cost Calculation purpose for *future* entries if we use Moving Average 
      // but for "Current Inventory Value" we would.
      // For Standard Cost update, we actually care about Buying History.
      // Shipment shouldn't change Average COST per unit, only Total Value.
      // But if we track (Value / Qty), reducing both Qty and Value (at current avg rate) keeps Avg same.

      if (stockMap[key].totalQty > 0) {
        const currentAvg = stockMap[key].totalValue / stockMap[key].totalQty;
        stockMap[key].totalValue -= (qty * currentAvg);
        stockMap[key].totalQty -= qty;
      } else {
        stockMap[key].totalQty -= qty; // Negative stock
      }
    }

    // 4. Update Database
    console.log('Step 4: Updating ItemStocks...');
    let itemsUpdated = 0;
    let stocksInserted = 0;

    // Get valid warehouse IDs from database
    let validWarehouses = new Set();
    try {
      const warehouses = await executeQuery('SELECT id FROM Warehouses');
      warehouses.forEach(w => validWarehouses.add(String(w.id)));
      console.log('Valid warehouses:', validWarehouses.size);
    } catch (e) {
      console.error('Failed to fetch warehouses:', e.message);
    }

    // Update ItemStocks table
    for (const [wKey, qty] of Object.entries(warehouseStockMap)) {
      const [itemId, warehouseId] = wKey.split('-');
      // Only insert if warehouse is known AND exists in Warehouses table
      if (warehouseId && warehouseId !== 'null' && warehouseId !== 'undefined' && validWarehouses.has(warehouseId)) {
        try {
          await executeQuery(
            'INSERT INTO ItemStocks (item_id, warehouse_id, quantity) VALUES (?, ?, ?)',
            [itemId, warehouseId, qty]
          );
          stocksInserted++;
        } catch (insertErr) {
          console.error(`Failed to insert stock for item ${itemId}, warehouse ${warehouseId}:`, insertErr.message);
        }
      }
    }
    console.log('Step 4: ✅ Complete, inserted', stocksInserted, 'stock records');

    // Update Items Standard Cost
    console.log('Step 5: Updating Item Costs...');
    for (const [itemId, data] of Object.entries(stockMap)) {
      if (data.totalQty > 0) {
        const avgCost = data.totalValue / data.totalQty;
        try {
          // Update item standard cost
          await executeQuery('UPDATE Items SET standard_cost = ? WHERE id = ?', [avgCost, itemId]);
          itemsUpdated++;
        } catch (updateErr) {
          console.error(`Failed to update cost for item ${itemId}:`, updateErr.message);
        }
      }
    }
    console.log('Step 5: ✅ Complete, updated', itemsUpdated, 'item costs');

    console.log(`Recalculation Complete. Updated ${itemsUpdated} items costs.`);
    res.json({ success: true, message: `Stok berhasil dihitung ulang. ${itemsUpdated} item cost telah diupdate.` });

  } catch (error) {
    console.error('Recalculate Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== REPORTS ====================
app.get('/api/reports/so-outstanding', async (req, res) => {
  try {
    // Query tanpa HAVING - filter di JavaScript untuk kompatibilitas database yang lebih baik
    const result = await executeQuery(`
      SELECT 
        so.doc_number, 
        so.doc_date, 
        p.name as partner_name,
        i.code as item_code, 
        i.name as item_name, 
        i.unit as unit,
        sod.quantity as qty_ordered
      FROM SalesOrderDetails sod
      JOIN SalesOrders so ON sod.so_id = so.id
      JOIN Items i ON sod.item_id = i.id
      JOIN Partners p ON so.partner_id = p.id
      WHERE so.status IN ('Approved', 'Partial', 'Open')
      ORDER BY so.doc_date ASC, so.doc_number ASC
    `);

    // Calculate shipped quantities separately for each item
    const outstandingData = [];
    for (const row of result) {
      // Get shipped quantity for this specific SO + Item combination
      const shippedResult = await executeQuery(`
        SELECT COALESCE(SUM(sd.quantity), 0) as qty_shipped
        FROM ShipmentDetails sd
        JOIN Shipments s ON sd.shipment_id = s.id
        JOIN SalesOrders so ON s.so_id = so.id
        WHERE so.doc_number = ? AND sd.item_id = (SELECT id FROM Items WHERE code = ?) AND s.status IN ('Approved', 'Closed')
      `, [row.doc_number, row.item_code]);

      const qty_shipped = Number(shippedResult[0]?.qty_shipped) || 0;
      const qty_ordered = Number(row.qty_ordered) || 0;
      const qty_outstanding = qty_ordered - qty_shipped;

      if (qty_outstanding > 0) {
        outstandingData.push({
          doc_number: row.doc_number,
          doc_date: row.doc_date,
          partner_name: row.partner_name,
          item_code: row.item_code,
          item_name: row.item_name,
          unit: row.unit,
          qty_ordered: qty_ordered,
          qty_shipped: qty_shipped,
          qty_outstanding: qty_outstanding
        });
      }
    }

    res.json({ success: true, data: outstandingData });
  } catch (error) {
    console.error('Error fetching SO Outstanding report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== RECEIVING OUTSTANDING REPORT ====================
// Receiving yang belum dibuat AP Invoice
app.get('/api/reports/receiving-outstanding', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        r.id,
        r.doc_number,
        r.doc_date,
        r.status,
        p.name as partner_name,
        po.doc_number as po_number,
        (
          SELECT SUM(rd.quantity * COALESCE(pod.unit_price, 0))
          FROM ReceivingDetails rd
          LEFT JOIN PurchaseOrderDetails pod ON r.po_id = pod.po_id AND rd.item_id = pod.item_id
          WHERE rd.receiving_id = r.id
        ) as total_amount
      FROM Receivings r
      LEFT JOIN Partners p ON r.partner_id = p.id
      LEFT JOIN PurchaseOrders po ON r.po_id = po.id
      WHERE r.status = 'Approved'
        AND r.id NOT IN (SELECT COALESCE(receiving_id, 0) FROM APInvoices WHERE receiving_id IS NOT NULL)
      ORDER BY r.doc_date ASC
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching Receiving Outstanding report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SHIPMENT OUTSTANDING REPORT ====================
// Shipment yang belum dibuat AR Invoice
app.get('/api/reports/shipment-outstanding', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        s.id,
        s.doc_number,
        s.doc_date,
        s.status,
        p.name as partner_name,
        so.doc_number as so_number,
        (
          SELECT SUM(sd.quantity * COALESCE(sod.unit_price, 0))
          FROM ShipmentDetails sd
          LEFT JOIN SalesOrderDetails sod ON s.so_id = sod.so_id AND sd.item_id = sod.item_id
          WHERE sd.shipment_id = s.id
        ) as total_amount
      FROM Shipments s
      LEFT JOIN Partners p ON s.partner_id = p.id
      LEFT JOIN SalesOrders so ON s.so_id = so.id
      WHERE s.status IN ('Approved', 'Closed')
        AND s.id NOT IN (SELECT COALESCE(shipment_id, 0) FROM ARInvoices WHERE shipment_id IS NOT NULL)
      ORDER BY s.doc_date ASC
    `);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching Shipment Outstanding report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AP OUTSTANDING REPORT ====================
// Hutang yang belum dibayar (AP Invoice Posted)
app.get('/api/reports/ap-outstanding', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        ap.id,
        ap.doc_number,
        ap.doc_date,
        ap.due_date,
        ap.status,
        p.name as partner_name,
        (
          SELECT SUM(d.quantity * d.unit_price)
          FROM APInvoiceDetails d
          WHERE d.ap_invoice_id = ap.id
        ) as total_amount
      FROM APInvoices ap
      LEFT JOIN Partners p ON ap.partner_id = p.id
      WHERE ap.status = 'Posted'
      ORDER BY ap.due_date ASC, ap.doc_date ASC
    `);

    // Calculate days overdue
    const today = new Date();
    const dataWithAging = result.map(item => {
      const dueDate = item.due_date ? new Date(item.due_date) : null;
      let daysOverdue = 0;
      if (dueDate && dueDate < today) {
        daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      }
      return { ...item, days_overdue: daysOverdue };
    });

    res.json({ success: true, data: dataWithAging });
  } catch (error) {
    console.error('Error fetching AP Outstanding report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AR OUTSTANDING REPORT ====================
// Piutang yang belum dibayar (AR Invoice Posted)
app.get('/api/reports/ar-outstanding', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        ar.id,
        ar.doc_number,
        ar.doc_date,
        ar.due_date,
        ar.status,
        p.name as partner_name,
        (
          SELECT SUM(d.quantity * d.unit_price)
          FROM ARInvoiceDetails d
          WHERE d.ar_invoice_id = ar.id
        ) as total_amount
      FROM ARInvoices ar
      LEFT JOIN Partners p ON ar.partner_id = p.id
      WHERE ar.status = 'Posted'
      ORDER BY ar.due_date ASC, ar.doc_date ASC
    `);

    // Calculate days overdue
    const today = new Date();
    const dataWithAging = result.map(item => {
      const dueDate = item.due_date ? new Date(item.due_date) : null;
      let daysOverdue = 0;
      if (dueDate && dueDate < today) {
        daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      }
      return { ...item, days_overdue: daysOverdue };
    });

    res.json({ success: true, data: dataWithAging });
  } catch (error) {
    console.error('Error fetching AR Outstanding report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AP AGING REPORT ====================
// Analisis umur hutang
app.get('/api/reports/ap-aging', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        ap.id,
        ap.doc_number,
        ap.doc_date,
        ap.due_date,
        p.name as partner_name,
        p.id as partner_id,
        (
          SELECT SUM(d.quantity * d.unit_price)
          FROM APInvoiceDetails d
          WHERE d.ap_invoice_id = ap.id
        ) as total_amount
      FROM APInvoices ap
      LEFT JOIN Partners p ON ap.partner_id = p.id
      WHERE ap.status = 'Posted'
      ORDER BY p.name ASC, ap.due_date ASC
    `);

    // Calculate aging buckets
    const today = new Date();
    const dataWithAging = result.map(item => {
      const dueDate = item.due_date ? new Date(item.due_date) : new Date(item.doc_date);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      const amount = Number(item.total_amount) || 0;

      let bucket = 'current';
      let current = 0, days1_30 = 0, days31_60 = 0, days61_90 = 0, days90plus = 0;

      if (daysOverdue <= 0) {
        bucket = 'current';
        current = amount;
      } else if (daysOverdue <= 30) {
        bucket = '1-30';
        days1_30 = amount;
      } else if (daysOverdue <= 60) {
        bucket = '31-60';
        days31_60 = amount;
      } else if (daysOverdue <= 90) {
        bucket = '61-90';
        days61_90 = amount;
      } else {
        bucket = '>90';
        days90plus = amount;
      }

      return {
        ...item,
        days_overdue: daysOverdue,
        bucket,
        current,
        days1_30,
        days31_60,
        days61_90,
        days90plus
      };
    });

    res.json({ success: true, data: dataWithAging });
  } catch (error) {
    console.error('Error fetching AP Aging report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AR AGING REPORT ====================
// Analisis umur piutang
app.get('/api/reports/ar-aging', async (req, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        ar.id,
        ar.doc_number,
        ar.doc_date,
        ar.due_date,
        p.name as partner_name,
        p.id as partner_id,
        (
          SELECT SUM(d.quantity * d.unit_price)
          FROM ARInvoiceDetails d
          WHERE d.ar_invoice_id = ar.id
        ) as total_amount
      FROM ARInvoices ar
      LEFT JOIN Partners p ON ar.partner_id = p.id
      WHERE ar.status = 'Posted'
      ORDER BY p.name ASC, ar.due_date ASC
    `);

    // Calculate aging buckets
    const today = new Date();
    const dataWithAging = result.map(item => {
      const dueDate = item.due_date ? new Date(item.due_date) : new Date(item.doc_date);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      const amount = Number(item.total_amount) || 0;

      let bucket = 'current';
      let current = 0, days1_30 = 0, days31_60 = 0, days61_90 = 0, days90plus = 0;

      if (daysOverdue <= 0) {
        bucket = 'current';
        current = amount;
      } else if (daysOverdue <= 30) {
        bucket = '1-30';
        days1_30 = amount;
      } else if (daysOverdue <= 60) {
        bucket = '31-60';
        days31_60 = amount;
      } else if (daysOverdue <= 90) {
        bucket = '61-90';
        days61_90 = amount;
      } else {
        bucket = '>90';
        days90plus = amount;
      }

      return {
        ...item,
        days_overdue: daysOverdue,
        bucket,
        current,
        days1_30,
        days31_60,
        days61_90,
        days90plus
      };
    });

    res.json({ success: true, data: dataWithAging });
  } catch (error) {
    console.error('Error fetching AR Aging report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  await connectDatabase();
});

export { executeQuery };
