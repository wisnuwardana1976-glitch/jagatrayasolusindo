import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function recreateTransactionsTable() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Recreating Transactions table with INTEGER nomortranscode...');

        try {
            // Drop old table
            await conn.query('DROP TABLE Transactions');
            console.log('✅ Old table dropped');
        } catch (e) {
            console.log('Table not exists, creating new...');
        }

        try {
            await conn.query(`
        CREATE TABLE Transactions (
          id INTEGER NOT NULL PRIMARY KEY DEFAULT AUTOINCREMENT,
          nomortranscode INTEGER NOT NULL,
          description VARCHAR(200) NOT NULL
        )
      `);
            console.log('✅ Transactions table created with INTEGER nomortranscode');

            // Insert sample data with numeric codes
            await conn.query(`INSERT INTO Transactions (nomortranscode, description) VALUES (1, 'Purchase Order')`);
            await conn.query(`INSERT INTO Transactions (nomortranscode, description) VALUES (2, 'Sales Order')`);
            await conn.query(`INSERT INTO Transactions (nomortranscode, description) VALUES (3, 'Receiving')`);
            await conn.query(`INSERT INTO Transactions (nomortranscode, description) VALUES (4, 'Shipment')`);
            await conn.query(`INSERT INTO Transactions (nomortranscode, description) VALUES (5, 'Purchase Return')`);
            await conn.query(`INSERT INTO Transactions (nomortranscode, description) VALUES (6, 'Sales Return')`);
            await conn.query(`INSERT INTO Transactions (nomortranscode, description) VALUES (7, 'AP Invoice')`);
            await conn.query(`INSERT INTO Transactions (nomortranscode, description) VALUES (8, 'AR Invoice')`);
            await conn.query(`INSERT INTO Transactions (nomortranscode, description) VALUES (9, 'Journal Voucher')`);
            await conn.query(`INSERT INTO Transactions (nomortranscode, description) VALUES (10, 'Cash Transaction')`);
            await conn.query(`INSERT INTO Transactions (nomortranscode, description) VALUES (11, 'Bank Transaction')`);
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

recreateTransactionsTable();
