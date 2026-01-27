
import dotenv from 'dotenv';
import odbc from 'odbc';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkSchemas() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('=== APInvoices ===');
        const apCols = await connection.query(`SELECT cname, coltype FROM sys.syscolumns WHERE tname = 'APInvoices'`);
        apCols.forEach(c => console.log(`${c.cname}: ${c.coltype}`));

        console.log('\n=== ARInvoices ===');
        const arCols = await connection.query(`SELECT cname, coltype FROM sys.syscolumns WHERE tname = 'ARInvoices'`);
        arCols.forEach(c => console.log(`${c.cname}: ${c.coltype}`));

        console.log('\n=== JournalVoucherDetails ===');
        const jvDetCols = await connection.query(`SELECT cname, coltype FROM sys.syscolumns WHERE tname = 'JournalVoucherDetails'`);
        jvDetCols.forEach(c => console.log(`${c.cname}: ${c.coltype}`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

checkSchemas();
