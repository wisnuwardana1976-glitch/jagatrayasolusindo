import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function check() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        // Check Locations Columns
        const loc = await connection.query('SELECT TOP 1 * FROM Locations');
        console.log('Locations columns:', Object.keys(loc[0] || {}));

        // Check ItemStocks Data Raw
        const stocks = await connection.query('SELECT TOP 10 * FROM ItemStocks');
        console.log('ItemStocks Data:', stocks);

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

check();
