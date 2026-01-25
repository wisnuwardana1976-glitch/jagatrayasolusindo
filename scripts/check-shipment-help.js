import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkHelp() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // sp_help returns multiple result sets. odbc might only get the first one (columns).
        // Indices are usually in the 2nd or 3rd result set.
        // But let's try.
        const result = await connection.query("sp_help 'Shipments'");
        console.log('Help Result:', result);

        // Also try querying sysindexes directly just in case
        const indices = await connection.query(`
            SELECT t.table_name, i.index_name, i."unique"
            FROM sys.sysindexes i 
            JOIN sys.systable t ON i.table_id = t.table_id 
            WHERE t.table_name = 'Shipments'
        `);
        console.log('Indices Query:', indices);

    } catch (error) {
        // console.error('Error:', error); 
        // Log basic error message to avoid flooding
        console.log('Error:', error.message);
    } finally {
        if (connection) await connection.close();
    }
}

checkHelp();
