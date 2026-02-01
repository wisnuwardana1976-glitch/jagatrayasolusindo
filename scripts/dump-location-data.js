import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function check() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('--- WAREHOUSES ---');
        console.table(await connection.query('SELECT * FROM Warehouses'));

        console.log('--- SUB WAREHOUSES ---');
        console.table(await connection.query('SELECT * FROM SubWarehouses'));

        console.log('--- LOCATIONS ---');
        console.table(await connection.query('SELECT * FROM Locations'));

        console.log('--- ITEM STOCKS ---');
        console.table(await connection.query('SELECT * FROM ItemStocks'));

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

check();
