import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkColumns() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // Check ARInvoices columns
        const arInvoices = await connection.query(`
            SELECT cname 
            FROM SYS.SYSCOLUMNS 
            WHERE tname = 'ARInvoices' 
            AND creator = 'dba'
        `);
        console.log('Columns in ARInvoices:', arInvoices.map(r => r.cname));

        // Check ARInvoiceDetails columns
        const arDetails = await connection.query(`
            SELECT cname 
            FROM SYS.SYSCOLUMNS 
            WHERE tname = 'ARInvoiceDetails' 
            AND creator = 'dba'
        `);
        console.log('Columns in ARInvoiceDetails:', arDetails.map(r => r.cname));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

checkColumns();
