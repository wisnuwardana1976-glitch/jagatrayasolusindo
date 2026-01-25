import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createPaymentTermsTable() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Creating PaymentTerms table...');

        try {
            await conn.query(`
                CREATE TABLE PaymentTerms (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    code VARCHAR(20) NOT NULL UNIQUE,
                    name VARCHAR(100) NOT NULL,
                    days INTEGER NOT NULL DEFAULT 0,
                    description VARCHAR(200),
                    active CHAR(1) DEFAULT 'Y'
                )
            `);
            console.log('✅ PaymentTerms table created');

            // Insert sample data
            await conn.query(`INSERT INTO PaymentTerms (code, name, days, description) VALUES ('COD', 'Cash on Delivery', 0, 'Pembayaran saat barang diterima')`);
            await conn.query(`INSERT INTO PaymentTerms (code, name, days, description) VALUES ('CBD', 'Cash Before Delivery', 0, 'Pembayaran sebelum barang dikirim')`);
            await conn.query(`INSERT INTO PaymentTerms (code, name, days, description) VALUES ('NET7', 'Net 7 Days', 7, 'Pembayaran dalam 7 hari')`);
            await conn.query(`INSERT INTO PaymentTerms (code, name, days, description) VALUES ('NET14', 'Net 14 Days', 14, 'Pembayaran dalam 14 hari')`);
            await conn.query(`INSERT INTO PaymentTerms (code, name, days, description) VALUES ('NET30', 'Net 30 Days', 30, 'Pembayaran dalam 30 hari')`);
            await conn.query(`INSERT INTO PaymentTerms (code, name, days, description) VALUES ('NET45', 'Net 45 Days', 45, 'Pembayaran dalam 45 hari')`);
            await conn.query(`INSERT INTO PaymentTerms (code, name, days, description) VALUES ('NET60', 'Net 60 Days', 60, 'Pembayaran dalam 60 hari')`);
            await conn.query(`INSERT INTO PaymentTerms (code, name, days, description) VALUES ('NET90', 'Net 90 Days', 90, 'Pembayaran dalam 90 hari')`);
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

createPaymentTermsTable();
