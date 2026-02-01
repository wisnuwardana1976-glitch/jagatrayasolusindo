import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function check() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        // Check SubWarehouses Columns
        const sw = await connection.query('SELECT TOP 1 * FROM SubWarehouses');
        console.log('SubWarehouses columns:', Object.keys(sw[0] || {}));

        // LIST ALL Warehouses
        const wh = await connection.query('SELECT id, code, description FROM Warehouses');
        console.table(wh);

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

check();
