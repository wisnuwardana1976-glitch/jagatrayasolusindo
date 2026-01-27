
import dotenv from 'dotenv';
import odbc from 'odbc';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function alterTable() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // Add is_giro
        try {
            console.log('Adding is_giro...');
            await connection.query("ALTER TABLE JournalVouchers ADD is_giro BIT DEFAULT 0");
            console.log('Added is_giro successfully');
        } catch (e) {
            console.log('Skipping is_giro (might exist):', e.message);
        }

        // Add giro_number
        try {
            console.log('Adding giro_number...');
            await connection.query("ALTER TABLE JournalVouchers ADD giro_number VARCHAR(50) NULL");
            console.log('Added giro_number successfully');
        } catch (e) {
            console.log('Skipping giro_number (might exist):', e.message);
        }

        // Add giro_due_date
        try {
            console.log('Adding giro_due_date...');
            await connection.query("ALTER TABLE JournalVouchers ADD giro_due_date DATE NULL");
            console.log('Added giro_due_date successfully');
        } catch (e) {
            console.log('Skipping giro_due_date (might exist):', e.message);
        }

    } catch (e) {
        console.error('Connection Error:', e);
    } finally {
        if (connection) await connection.close();
    }
}

alterTable();
