import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createMissingTables() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Creating missing tables...');

        // SalesPerson table
        try {
            await conn.query(`
        CREATE TABLE SalesPersons (
          id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
          code VARCHAR(50) NOT NULL,
          name VARCHAR(200) NOT NULL,
          phone VARCHAR(50),
          email VARCHAR(100),
          active CHAR(1) DEFAULT 'Y'
        )
      `);
            console.log('✅ SalesPersons table created');
        } catch (e) {
            console.log('❌ SalesPersons error:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // SalesOrders table
        try {
            await conn.query(`
        CREATE TABLE SalesOrders (
          id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
          doc_number VARCHAR(50) NOT NULL,
          doc_date DATE NOT NULL,
          partner_id INTEGER,
          salesperson_id INTEGER,
          status VARCHAR(20) DEFAULT 'Draft',
          total_amount NUMERIC(18,2) DEFAULT 0
        )
      `);
            console.log('✅ SalesOrders table created');
        } catch (e) {
            console.log('❌ SalesOrders error:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        // SalesOrderDetails table
        try {
            await conn.query(`
        CREATE TABLE SalesOrderDetails (
          id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
          so_id INTEGER,
          item_id INTEGER,
          quantity NUMERIC(18,4) DEFAULT 0,
          unit_price NUMERIC(18,2) DEFAULT 0,
          line_total NUMERIC(18,2) DEFAULT 0
        )
      `);
            console.log('✅ SalesOrderDetails table created');
        } catch (e) {
            console.log('❌ SalesOrderDetails error:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        await conn.close();
        await pool.close();
        console.log('\nDone!');
    } catch (error) {
        console.error('Error:', error);
    }
}

createMissingTables();
