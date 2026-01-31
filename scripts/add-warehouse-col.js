import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function addColumn() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Adding warehouse_id column...');
        await connection.query('ALTER TABLE InventoryAdjustments ADD warehouse_id INTEGER');
        console.log('✅ Added warehouse_id');
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('Column already exists');
        } else {
            console.error('Error:', error.message);
        }
    } finally {
        if (connection) await connection.close();
    }
}

addColumn();
