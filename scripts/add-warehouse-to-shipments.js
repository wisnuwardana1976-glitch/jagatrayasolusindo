// Script to add warehouse_id column to Shipments table
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function addColumn() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await odbc.connect(connectionString);
        console.log('✅ Connected!\n');

        // Check if column exists
        try {
            await connection.query('SELECT warehouse_id FROM Shipments WHERE 1=0');
            console.log('✅ Column warehouse_id already exists in Shipments table.');
        } catch (e) {
            console.log('Adding warehouse_id column to Shipments table...');
            try {
                await connection.query('ALTER TABLE Shipments ADD warehouse_id INTEGER NULL');
                console.log('✅ Column warehouse_id added successfully!');
            } catch (alterErr) {
                console.error('❌ Failed to add column:', alterErr.odbcErrors?.[0]?.message || alterErr.message);
            }
        }

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

addColumn();
