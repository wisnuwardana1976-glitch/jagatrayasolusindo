import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function check() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        // Check ItemStocks
        const r = await connection.query('SELECT TOP 1 * FROM ItemStocks');
        console.log('ItemStocks columns:', Object.keys(r[0] || {}));

        // Check Items
        const items = await connection.query('SELECT TOP 1 * FROM Items');
        console.log('Items columns:', Object.keys(items[0] || {}));

        // Check Warehouses
        const wh = await connection.query('SELECT TOP 1 * FROM Warehouses');
        console.log('Warehouses columns:', Object.keys(wh[0] || {}));

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

check();
