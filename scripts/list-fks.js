import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function listFK() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        // Query specific to Sybase SQL Anywhere (or standard SQL info schema)
        // SYS.SYSFOREIGNKEY, SYS.SYSTABLE
        const query = `
            SELECT f.role, t.table_name, p.table_name as primary_table_name
            FROM SYS.SYSFOREIGNKEY f
            JOIN SYS.SYSTABLE t ON f.foreign_table_id = t.table_id
            JOIN SYS.SYSTABLE p ON f.primary_table_id = p.table_id
            WHERE t.table_name = 'ARInvoices'
        `;
        const res = await connection.query(query);
        console.log(JSON.stringify(res, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

listFK();
