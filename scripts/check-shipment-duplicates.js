import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkDuplicates() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // Check for the specific doc_number seen in logs
        const docResult = await connection.query("SELECT * FROM Shipments WHERE doc_number = 'SHP/012026/0003'");
        console.log("Existing Shipment with 'SHP/012026/0003':", docResult.length > 0 ? docResult[0] : 'None');

        // Check for any Shipments
        const all = await connection.query("SELECT TOP 5 * FROM Shipments ORDER BY id DESC");
        console.log("Recent Shipments:", all);

        // Check indices/constraints (Sybase system tables)
        const indices = await connection.query(`
            SELECT i.index_name, c.column_name 
            FROM sysiphone i 
            JOIN syscolumn c ON i.table_id = c.table_id
            JOIN systable t ON i.table_id = t.table_id
            WHERE t.table_name = 'Shipments'
        `);
        // Note: Sybase system tables vary by version (ASA vs ASE). 
        // Simpler: Just rely on data check.

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

checkDuplicates();
