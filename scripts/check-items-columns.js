import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // Check columns from SYSCOLUMN
        const query = `
      SELECT column_name 
      FROM SYSCOLUMN 
      WHERE table_id = (SELECT table_id FROM SYSTABLE WHERE table_name = 'Items')
    `;
        const cols = await connection.query(query);
        console.log('Items Columns:');
        cols.forEach(c => console.log(c.column_name));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

run();
