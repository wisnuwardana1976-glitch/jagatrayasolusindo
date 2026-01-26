// Script to create ItemStocks table (simplified without FK)
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createTable() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await odbc.connect(connectionString);

        // Check if table exists first
        try {
            await connection.query("SELECT TOP 1 * FROM ItemStocks");
            console.log('✅ Table ItemStocks already exists.');
        } catch (e) {
            console.log('Table does not exist. Creating ItemStocks table...');

            // Create Table (No Foreign Keys for simplicity)
            await connection.query(`
                CREATE TABLE ItemStocks (
                    id INTEGER NOT NULL DEFAULT AUTOINCREMENT PRIMARY KEY,
                    item_id INTEGER NOT NULL,
                    warehouse_id INTEGER,
                    quantity NUMERIC(18, 2) DEFAULT 0,
                    last_updated TIMESTAMP DEFAULT CURRENT TIMESTAMP
                )
            `);
            console.log('✅ Table ItemStocks created successfully!');
        }

    } catch (e) {
        console.error('Error:', e.message);
        if (e.odbcErrors) {
            console.error('ODBC Error:', e.odbcErrors[0]?.message);
        }
    } finally {
        if (connection) await connection.close();
    }
}

createTable();
