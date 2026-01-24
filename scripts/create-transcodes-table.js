import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createTranscodeTable() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Creating Transcodes table...');

        try {
            await conn.query(`
        CREATE TABLE Transcodes (
          id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
          code VARCHAR(10) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          prefix VARCHAR(10) NOT NULL,
          last_number INTEGER DEFAULT 0,
          format VARCHAR(50) DEFAULT '{PREFIX}-{YYYY}{MM}{DD}-{SEQ}',
          description VARCHAR(200),
          active CHAR(1) DEFAULT 'Y'
        )
      `);
            console.log('✅ Transcodes table created');

            // Insert sample data
            await conn.query(`INSERT INTO Transcodes (code, name, prefix, last_number, description) VALUES ('PO', 'Purchase Order', 'PO', 0, 'Kode transaksi pembelian')`);
            await conn.query(`INSERT INTO Transcodes (code, name, prefix, last_number, description) VALUES ('SO', 'Sales Order', 'SO', 0, 'Kode transaksi penjualan')`);
            await conn.query(`INSERT INTO Transcodes (code, name, prefix, last_number, description) VALUES ('RCV', 'Receiving', 'RCV', 0, 'Kode penerimaan barang')`);
            await conn.query(`INSERT INTO Transcodes (code, name, prefix, last_number, description) VALUES ('SHP', 'Shipment', 'SHP', 0, 'Kode pengiriman barang')`);
            await conn.query(`INSERT INTO Transcodes (code, name, prefix, last_number, description) VALUES ('PRT', 'Purchase Return', 'PRT', 0, 'Kode retur pembelian')`);
            await conn.query(`INSERT INTO Transcodes (code, name, prefix, last_number, description) VALUES ('SRT', 'Sales Return', 'SRT', 0, 'Kode retur penjualan')`);
            await conn.query(`INSERT INTO Transcodes (code, name, prefix, last_number, description) VALUES ('API', 'AP Invoice', 'API', 0, 'Invoice hutang dagang')`);
            await conn.query(`INSERT INTO Transcodes (code, name, prefix, last_number, description) VALUES ('ARI', 'AR Invoice', 'ARI', 0, 'Invoice piutang dagang')`);
            await conn.query(`INSERT INTO Transcodes (code, name, prefix, last_number, description) VALUES ('JV', 'Journal Voucher', 'JV', 0, 'Jurnal voucher umum')`);
            await conn.query(`INSERT INTO Transcodes (code, name, prefix, last_number, description) VALUES ('CSH', 'Cash Transaction', 'CSH', 0, 'Transaksi kas')`);
            await conn.query(`INSERT INTO Transcodes (code, name, prefix, last_number, description) VALUES ('BNK', 'Bank Transaction', 'BNK', 0, 'Transaksi bank')`);
            console.log('✅ Sample data inserted');

        } catch (e) {
            console.log('❌ Error:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        await conn.close();
        await pool.close();
        console.log('\nDone!');
    } catch (error) {
        console.error('Error:', error);
    }
}

createTranscodeTable();
