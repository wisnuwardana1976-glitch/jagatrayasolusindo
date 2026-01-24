import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function alterTables() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Adding transcode_id column to PurchaseOrders and SalesOrders...');

        try {
            await conn.query(`ALTER TABLE PurchaseOrders ADD transcode_id INTEGER DEFAULT NULL`);
            console.log('✅ Column transcode_id added to PurchaseOrders');
        } catch (e) {
            console.log('ℹ️ PurchaseOrders: ' + (e.odbcErrors ? e.odbcErrors[0].message : e.message));
        }

        try {
            await conn.query(`ALTER TABLE SalesOrders ADD transcode_id INTEGER DEFAULT NULL`);
            console.log('✅ Column transcode_id added to SalesOrders');
        } catch (e) {
            console.log('ℹ️ SalesOrders: ' + (e.odbcErrors ? e.odbcErrors[0].message : e.message));
        }

        await conn.close();
        await pool.close();
        console.log('\nDone!');
    } catch (error) {
        console.error('Error:', error);
    }
}

alterTables();
