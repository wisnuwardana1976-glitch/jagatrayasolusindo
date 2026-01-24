import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createUnitsTable() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Creating Units table...');

        try {
            await conn.query(`
        CREATE TABLE Units (
          id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
          code VARCHAR(20) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          description VARCHAR(200)
        )
      `);
            console.log('✅ Units table created');

            // Insert sample data
            await conn.query(`INSERT INTO Units (code, name, description) VALUES ('PCS', 'Pieces', 'Satuan per buah')`);
            await conn.query(`INSERT INTO Units (code, name, description) VALUES ('BOX', 'Box', 'Satuan per kotak')`);
            await conn.query(`INSERT INTO Units (code, name, description) VALUES ('KG', 'Kilogram', 'Satuan berat kilogram')`);
            await conn.query(`INSERT INTO Units (code, name, description) VALUES ('LTR', 'Liter', 'Satuan volume liter')`);
            await conn.query(`INSERT INTO Units (code, name, description) VALUES ('MTR', 'Meter', 'Satuan panjang meter')`);
            await conn.query(`INSERT INTO Units (code, name, description) VALUES ('SET', 'Set', 'Satuan per set')`);
            await conn.query(`INSERT INTO Units (code, name, description) VALUES ('PACK', 'Pack', 'Satuan per kemasan')`);
            await conn.query(`INSERT INTO Units (code, name, description) VALUES ('UNIT', 'Unit', 'Satuan per unit')`);
            console.log('✅ Sample data inserted');

        } catch (e) {
            console.log('❌ Error:', e.odbcErrors ? e.odbcErrors[0].message : e.message);
        }

        await conn.close();
        await pool.close();
        console.log('\nDone!');
    } catch (error) {
        console.error('Error:', error);
    }
}

createUnitsTable();
