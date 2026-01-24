import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function createGroupTable() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Creating AccountGroups table...');

        try {
            await conn.query(`
        CREATE TABLE AccountGroups (
            id INTEGER NOT NULL DEFAULT AUTOINCREMENT PRIMARY KEY,
            code INTEGER NOT NULL UNIQUE,
            description VARCHAR(100) NOT NULL,
            active CHAR(1) NOT NULL DEFAULT 'Y'
        )
      `);
            console.log('✅ Table AccountGroups created successfully');
        } catch (e) {
            console.log('ℹ️ AccountGroups creation failed (might already exist): ' + (e.odbcErrors ? e.odbcErrors[0].message : e.message));
        }

        await conn.close();
        await pool.close();
        console.log('\nDone!');
    } catch (error) {
        console.error('Error:', error);
    }
}

createGroupTable();
