import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function updateFormat() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Updating format for all Transcodes...');

        await conn.query(`UPDATE Transcodes SET format = '{PREFIX}/{MM}{YYYY}/{SEQ}'`);

        console.log('✅ Format updated to: {PREFIX}/{MM}{YYYY}/{SEQ}');
        console.log('   Example: PO/012026/0001');

        await conn.close();
        await pool.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

updateFormat();
