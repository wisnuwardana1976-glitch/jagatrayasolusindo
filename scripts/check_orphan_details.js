import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Checking details...');

        // Check details for adjustment_id = 1
        const details = await connection.query(`SELECT * FROM InventoryAdjustmentDetails WHERE adjustment_id = 1`);
        console.log('Orphaned Details:', JSON.stringify(details, null, 2));

        await connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
