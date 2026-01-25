import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkColumns() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Checking columns...');

        const resultPO = await conn.query(`SELECT TOP 1 * FROM PurchaseOrders`);
        console.log('PurchaseOrders columns:', Object.keys(resultPO[0] || {}).join(', '));

        const resultSO = await conn.query(`SELECT TOP 1 * FROM SalesOrders`);
        console.log('SalesOrders columns:', Object.keys(resultSO[0] || {}).join(', '));

        await conn.close();
        await pool.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkColumns();
