import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkReceivingColumns() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Checking Receiving columns...');

        try {
            const result = await conn.query(`SELECT TOP 1 * FROM Receivings`);
            console.log('Receivings columns:', Object.keys(result[0] || {}).join(', '));
            if (result.length === 0) console.log('Receivings table exists but depends on driver if columns show for empty result. If empty list, means table might be empty but we query top 1.');
        } catch (e) {
            console.log('Error querying Receivings: ' + e.message);
        }

        try {
            const result = await conn.query(`SELECT TOP 1 * FROM ReceivingDetails`);
            console.log('ReceivingDetails columns:', Object.keys(result[0] || {}).join(', '));
        } catch (e) {
            console.log('Error querying ReceivingDetails: ' + e.message);
        }

        await conn.close();
        await pool.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkReceivingColumns();
