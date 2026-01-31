import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkItemStocks() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('=== ItemStocks columns ===');
        const cols = await connection.query(`
            SELECT c.column_name, c.domain_id 
            FROM syscolumn c 
            JOIN systable t ON c.table_id = t.table_id 
            WHERE t.table_name = 'ItemStocks'
        `);
        console.log(cols.map(c => c.column_name).join(', '));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.close();
    }
}

checkItemStocks();
