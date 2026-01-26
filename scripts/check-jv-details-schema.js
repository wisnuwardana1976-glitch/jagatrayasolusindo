
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkSchema() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await odbc.connect(connectionString);

        // Check JournalVoucherDetails Columns
        const cols = await connection.query(`
            SELECT c.column_name, c.width, d.domain_name 
            FROM SYSCOLUMN c 
            JOIN SYSTABLE t ON c.table_id = t.table_id 
            JOIN SYSDOMAIN d ON c.domain_id = d.domain_id 
            WHERE t.table_name = 'JournalVoucherDetails'
        `);
        console.log('Columns:', cols);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

checkSchema();
