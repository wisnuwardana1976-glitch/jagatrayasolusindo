import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function resetWarehouseTable() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Resetting Warehouses table...');

        // Drop existing table
        try {
            await conn.query('DROP TABLE IF EXISTS Warehouses');
            console.log('✅ Dropped Warehouses table');
        } catch (e) {
            console.log('⚠️ Error dropping table:', e.message);
        }

        // Create new table
        try {
            await conn.query(`
        CREATE TABLE Warehouses (
          id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
          code VARCHAR(50) NOT NULL,
          description VARCHAR(200) NOT NULL,
          site_id INTEGER,
          active CHAR(1) DEFAULT 'Y'
        )
      `);
            console.log('✅ Created Warehouses table with description field');
        } catch (e) {
            console.log('❌ Error creating table:', e.message);
        }

        await conn.close();
        await pool.close();
        console.log('\nDone!');
    } catch (error) {
        console.error('Error:', error);
    }
}

resetWarehouseTable();
