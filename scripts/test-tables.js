// Script to test table existence and query
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function testTables() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await odbc.connect(connectionString);
        console.log('✅ Connected!\n');

        // Test tables existence
        const tables = ['Items', 'Receivings', 'ReceivingDetails', 'Shipments', 'ShipmentDetails', 'PurchaseOrderDetails', 'ItemStocks', 'Warehouses'];

        for (const table of tables) {
            try {
                const result = await connection.query(`SELECT TOP 1 * FROM ${table}`);
                console.log(`✅ ${table} - exists, has columns:`, result.columns ? result.columns.map(c => c.name).join(', ') : 'unknown');
            } catch (e) {
                console.error(`❌ ${table} - ERROR:`, e.odbcErrors?.[0]?.message || e.message);
            }
        }

    } catch (e) {
        console.error('Connection Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

testTables();
