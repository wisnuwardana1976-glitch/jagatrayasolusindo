import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function check() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await odbc.connect(connectionString);

        // Check if table exists
        try {
            const r = await connection.query('SELECT TOP 1 * FROM LocationTransfers');
            console.log('✅ LocationTransfers table exists');
            console.log('Columns:', r.length > 0 ? Object.keys(r[0]) : 'No data');
        } catch (e) {
            console.log('❌ LocationTransfers table error:', e.message);
        }

        // Check LocationTransferDetails
        try {
            const r = await connection.query('SELECT TOP 1 * FROM LocationTransferDetails');
            console.log('✅ LocationTransferDetails table exists');
            console.log('Columns:', r.length > 0 ? Object.keys(r[0]) : 'No data');
        } catch (e) {
            console.log('❌ LocationTransferDetails table error:', e.message);
        }

        // Check Locations
        try {
            const r = await connection.query('SELECT TOP 3 id, code, name FROM Locations');
            console.log('✅ Locations table exists with data:', r);
        } catch (e) {
            console.log('❌ Locations table error:', e.message);
        }

    } catch (e) {
        console.error('Connection error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

check();
