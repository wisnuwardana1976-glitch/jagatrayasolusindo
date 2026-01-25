import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function listTables() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        const result = await connection.query(`SELECT table_name FROM SYS.SYSTABLE WHERE creator = 1`);
        // creator=1 usually filters for user tables in Sybase/SQL Anywhere, but might vary. 
        // Let's just select all and filter in JS if needed or use a broader query.
        // Better: sa_describe_query or sp_tables

        const tables = await connection.query("sp_tables");
        console.log('Tables found:');
        tables.forEach(t => {
            if (t.TABLE_TYPE === 'TABLE') console.log(t.TABLE_NAME);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

listTables();
