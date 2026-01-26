// Script to create ItemStocks table
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createTable() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await odbc.connect(connectionString);

        // Check if table exists
        try {
            await connection.query("SELECT * FROM ItemStocks LIMIT 1");
            console.log('Table ItemStocks already exists.');
        } catch (e) {
            console.log('Creating ItemStocks table...');

            // Create Table
            await connection.query(`
                CREATE TABLE ItemStocks (
                    id INTEGER NOT NULL DEFAULT AUTOINCREMENT,
                    item_id INTEGER NOT NULL,
                    warehouse_id INTEGER NULL,
                    quantity NUMERIC(18, 2) DEFAULT 0,
                    last_updated TIMESTAMP DEFAULT CURRENT TIMESTAMP,
                    PRIMARY KEY (id),
                    FOREIGN KEY (item_id) REFERENCES Items(id),
                    FOREIGN KEY (warehouse_id) REFERENCES Warehouses(id)
                )
            `);
            console.log('Table ItemStocks created successfully.');

            // Add Unique Constraint (item + warehouse)
            await connection.query(`
                CREATE UNIQUE INDEX UQ_ItemWarehouse ON ItemStocks (item_id, warehouse_id)
            `);
            console.log('Unique index created.');
        }

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

createTable();
