import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkData() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('=== InventoryAdjustments ===');
        const adjs = await connection.query('SELECT * FROM InventoryAdjustments');
        adjs.forEach(a => console.log(a));

        console.log('\n=== InventoryAdjustmentDetails ===');
        const details = await connection.query('SELECT * FROM InventoryAdjustmentDetails');
        details.forEach(d => console.log(d));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.close();
    }
}

checkData();
