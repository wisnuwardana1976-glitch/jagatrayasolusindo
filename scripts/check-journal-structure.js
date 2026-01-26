// Script to inspect JournalVouchers table structure
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkJournalStructure() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await odbc.connect(connectionString);

        const cols = await connection.query(`
            SELECT c.column_name, d.domain_name 
            FROM SYSCOLUMN c 
            JOIN SYSDOMAIN d ON c.domain_id = d.domain_id 
            JOIN SYSTABLE t ON c.table_id = t.table_id 
            WHERE t.table_name = 'JournalVouchers' 
            ORDER BY c.column_id
        `);
        console.log('JournalVouchers Columns:');
        cols.forEach(c => console.log(`  - ${c.column_name}: ${c.domain_name}`));

        const dcols = await connection.query(`
            SELECT c.column_name, d.domain_name 
            FROM SYSCOLUMN c 
            JOIN SYSDOMAIN d ON c.domain_id = d.domain_id 
            JOIN SYSTABLE t ON c.table_id = t.table_id 
            WHERE t.table_name = 'JournalVoucherDetails' 
            ORDER BY c.column_id
        `);
        console.log('\nJournalVoucherDetails Columns:');
        dcols.forEach(c => console.log(`  - ${c.column_name}: ${c.domain_name}`));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

checkJournalStructure();
