// Check Items table schema
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkItemsSchema() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('Checking Items table columns...');
        const cols = await connection.query(`
            SELECT c.column_name, d.domain_name 
            FROM SYSCOLUMN c 
            JOIN SYSDOMAIN d ON c.domain_id = d.domain_id 
            JOIN SYSTABLE t ON c.table_id = t.table_id 
            WHERE t.table_name = 'Items' 
            ORDER BY c.column_id
        `);
        cols.forEach(c => console.log(`  - ${c.column_name}: ${c.domain_name}`));

        // Also check if there is any data
        const data = await connection.query('SELECT TOP 1 * FROM Items');
        console.log('\nSample Data:', data[0]);

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) await connection.close();
    }
}

checkItemsSchema();
