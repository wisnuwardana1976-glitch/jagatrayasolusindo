// Script to update database schema for Automated Journals
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function updateSchema() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        // 1. Create GeneralLedgerSettings table
        console.log('Checking GeneralLedgerSettings table...');
        const glTable = await connection.query("SELECT table_name FROM SYSTABLE WHERE table_name = 'GeneralLedgerSettings'");

        if (glTable.length === 0) {
            console.log('Creating GeneralLedgerSettings table...');
            await connection.query(`
                CREATE TABLE GeneralLedgerSettings (
                    id INTEGER PRIMARY KEY DEFAULT AUTOINCREMENT,
                    setting_key VARCHAR(50) NOT NULL UNIQUE,
                    account_id INTEGER NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (account_id) REFERENCES Accounts(id)
                )
            `);
            console.log('✅ GeneralLedgerSettings table created.');

            // Insert default keys if needed (optional, logic will handle empty settings)
        } else {
            console.log('ℹ️ GeneralLedgerSettings table already exists.');
        }

        // 2. Add columns to JournalVouchers table
        console.log('Checking JournalVouchers columns...');
        const jvCols = await connection.query(`
            SELECT c.column_name 
            FROM SYSCOLUMN c 
            JOIN SYSTABLE t ON c.table_id = t.table_id 
            WHERE t.table_name = 'JournalVouchers'
        `);

        const existingCols = jvCols.map(c => c.column_name.toLowerCase());

        if (!existingCols.includes('source_type')) {
            console.log('Adding source_type to JournalVouchers...');
            await connection.query("ALTER TABLE JournalVouchers ADD source_type VARCHAR(50) NULL");
            console.log('✅ source_type added.');
        } else {
            console.log('ℹ️ source_type already exists.');
        }

        if (!existingCols.includes('ref_id')) {
            console.log('Adding ref_id to JournalVouchers...');
            await connection.query("ALTER TABLE JournalVouchers ADD ref_id INTEGER NULL");
            console.log('✅ ref_id added.');
        } else {
            console.log('ℹ️ ref_id already exists.');
        }

        if (!existingCols.includes('transcode_id')) {
            console.log('Adding transcode_id to JournalVouchers...');
            await connection.query("ALTER TABLE JournalVouchers ADD transcode_id INTEGER NULL"); // Link to Transcodes table if needed
            console.log('✅ transcode_id added.');
        } else {
            console.log('ℹ️ transcode_id already exists.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

updateSchema();
