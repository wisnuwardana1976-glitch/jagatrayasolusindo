
import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkStock() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('--- ItemStocks Count ---');
        const count = await connection.query("SELECT COUNT(*) as count FROM ItemStocks");
        console.log('Count:', count[0].count);

        console.log('--- Sample ItemStocks ---');
        const sample = await connection.query("SELECT TOP 5 * FROM ItemStocks");
        console.log(sample);

        console.log('--- Warehouses ---');
        const wars = await connection.query("SELECT * FROM Warehouses");
        console.log(wars);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

checkStock();
