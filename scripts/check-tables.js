// Script to check tables and fix FK
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkTablesAndFix() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        // Check for ChartOfAccounts table
        const coaTable = await connection.query(`
            SELECT table_name FROM SYSTABLE WHERE table_name = 'ChartOfAccounts'
        `);
        console.log('\n=== ChartOfAccounts table exists? ===');
        console.log(coaTable.length > 0 ? 'YES' : 'NO');

        // Check for Accounts table
        const accountsTable = await connection.query(`
            SELECT table_name FROM SYSTABLE WHERE table_name = 'Accounts'
        `);
        console.log('\n=== Accounts table exists? ===');
        console.log(accountsTable.length > 0 ? 'YES' : 'NO');

        // If ChartOfAccounts exists, check its content
        if (coaTable.length > 0) {
            const coaContent = await connection.query('SELECT TOP 5 * FROM ChartOfAccounts');
            console.log('\n=== ChartOfAccounts content (top 5) ===');
            console.log(coaContent);
        }

        // Check Accounts content
        if (accountsTable.length > 0) {
            const accountsContent = await connection.query('SELECT TOP 5 id, code, name FROM Accounts');
            console.log('\n=== Accounts content (top 5) ===');
            accountsContent.forEach(a => console.log(`ID: ${a.id}, Code: ${a.code}, Name: ${a.name}`));
        }

        // Get FK details
        const fkDetails = await connection.query(`
            SELECT 
                fk.foreign_key_id,
                fk.role as fk_name,
                pt.table_name as parent_table
            FROM SYSFOREIGNKEY fk
            JOIN SYSTABLE ft ON fk.foreign_table_id = ft.table_id
            JOIN SYSTABLE pt ON fk.primary_table_id = pt.table_id
            WHERE ft.table_name = 'JournalVoucherDetails'
        `);
        console.log('\n=== FK Details ===');
        fkDetails.forEach(fk => console.log(`FK ID: ${fk.foreign_key_id}, Name: ${fk.fk_name}, Parent: ${fk.parent_table}`));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

checkTablesAndFix();
