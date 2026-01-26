// Script to check Journal tables and Invoice tables
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkTables() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        const journalTables = await connection.query("SELECT table_name FROM SYSTABLE WHERE table_name LIKE 'Journal%'");
        console.log('Journal Tables:', journalTables);

        const apInvoices = await connection.query("SELECT table_name FROM SYSTABLE WHERE table_name = 'APInvoices'");
        console.log('APInvoices Table:', apInvoices.length > 0 ? 'Exists' : 'Missing');

        const arInvoices = await connection.query("SELECT table_name FROM SYSTABLE WHERE table_name = 'ARInvoices'");
        console.log('ARInvoices Table:', arInvoices.length > 0 ? 'Exists' : 'Missing');

        const glSettings = await connection.query("SELECT table_name FROM SYSTABLE WHERE table_name = 'GeneralLedgerSettings'");
        console.log('GeneralLedgerSettings Table:', glSettings.length > 0 ? 'Exists' : 'Missing');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

checkTables();
