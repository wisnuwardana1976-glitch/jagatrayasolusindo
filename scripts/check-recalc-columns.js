import odbc from 'odbc';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkColumns() {
    try {
        const conn = await odbc.connect(connectionString);

        console.log('Checking ReceivingDetails...');
        try {
            const r = await conn.query('SELECT TOP 1 * FROM ReceivingDetails');
            console.log('RD Columns:', Object.keys(r[0]));
        } catch (e) { console.log('RD Error:', e.message); }

        console.log('Checking Shipments...');
        try {
            const s = await conn.query('SELECT TOP 1 * FROM Shipments');
            console.log('Shipment Columns:', Object.keys(s[0]));
        } catch (e) { console.log('Shipment Error:', e.message); }

        await conn.close();
    } catch (e) {
        console.error(e);
    }
}
checkColumns();
