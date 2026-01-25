import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function recreateReceivingTables() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Recreating Receiving tables...');

        try {
            await conn.query(`DROP TABLE IF EXISTS ReceivingDetails`);
            console.log('🗑️ Dropped ReceivingDetails');
        } catch (e) {
            console.log('Info: ' + e.message);
        }

        try {
            await conn.query(`DROP TABLE IF EXISTS Receivings`);
            console.log('🗑️ Dropped Receivings');
        } catch (e) {
            console.log('Info: ' + e.message);
        }

        // Receivings table
        try {
            await conn.query(`
                CREATE TABLE Receivings (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    doc_number VARCHAR(50) NOT NULL,
                    doc_date DATE NOT NULL,
                    po_id INTEGER,
                    warehouse_id INTEGER,
                    status VARCHAR(20) DEFAULT 'Draft',
                    transcode_id INTEGER,
                    remarks VARCHAR(255)
                )
            `);
            console.log('✅ Receivings table created');
        } catch (e) {
            console.error('❌ Receivings error: ' + (e.odbcErrors ? e.odbcErrors[0].message : e.message));
        }

        // ReceivingDetails table
        try {
            await conn.query(`
                CREATE TABLE ReceivingDetails (
                    id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
                    receiving_id INTEGER,
                    item_id INTEGER,
                    quantity NUMERIC(18,4) DEFAULT 0,
                    po_detail_id INTEGER,
                    location_id INTEGER,
                    remarks VARCHAR(255)
                )
            `);
            console.log('✅ ReceivingDetails table created');
        } catch (e) {
            console.error('❌ ReceivingDetails error: ' + (e.odbcErrors ? e.odbcErrors[0].message : e.message));
        }

        await conn.close();
        await pool.close();
        console.log('\nDone!');
    } catch (error) {
        console.error('Error:', error);
    }
}

recreateReceivingTables();
