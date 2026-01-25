import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function alterTables() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Altering tables to add payment_term_id...');

        try {
            // Add payment_term_id to PurchaseOrders
            await conn.query(`ALTER TABLE PurchaseOrders ADD payment_term_id INTEGER NULL`);
            console.log('✅ Added payment_term_id to PurchaseOrders');
        } catch (e) {
            console.log('ℹ️ PurchaseOrders: ' + (e.odbcErrors ? e.odbcErrors[0].message : e.message));
        }

        try {
            // Add payment_term_id to SalesOrders
            await conn.query(`ALTER TABLE SalesOrders ADD payment_term_id INTEGER NULL`);
            console.log('✅ Added payment_term_id to SalesOrders');
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
