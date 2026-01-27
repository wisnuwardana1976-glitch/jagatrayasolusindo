
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function inspectSchema() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        // Check JournalVoucherDetails Structure
        const jvDetailsCols = await connection.query(`
            SELECT c.column_name, d.domain_name, c.width, c.scale 
            FROM SYSCOLUMN c
            JOIN SYSDOMAIN d ON c.domain_id = d.domain_id
            JOIN SYSTABLE t ON c.table_id = t.table_id
            WHERE t.table_name = 'JournalVoucherDetails'
            ORDER BY c.column_id
        `);
        console.log('\n=== JournalVoucherDetails Columns ===');
        console.table(jvDetailsCols.map(c => ({
            name: c.column_name,
            type: c.domain_name,
            width: c.width,
            scale: c.scale
        })));

        // Check Transcodes
        const transcodes = await connection.query("SELECT * FROM Transcodes WHERE active = 'Y'");
        console.log('\n=== Transcodes ===');
        console.table(transcodes.map(t => ({
            id: t.id,
            code: t.code,
            name: t.name,
            prefix: t.prefix,
            nomortranscode: t.nomortranscode
        })));

        // Check Accounts (Top 10)
        const accounts = await connection.query("SELECT TOP 10 id, code, name, type FROM Accounts");
        console.log('\n=== Accounts (Top 10) ===');
        console.table(accounts);

        // Check BankAccounts
        const bankAccounts = await connection.query("SELECT * FROM BankAccounts");
        console.log('\n=== BankAccounts ===');
        console.table(bankAccounts);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

inspectSchema();
