
import dotenv from 'dotenv';
import odbc from 'odbc';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function addAllocationColumns() {
    let connection;
    try {
        console.log('Connecting to DB...');
        connection = await odbc.connect(connectionString);

        // 1. APInvoices: paid_amount
        const checkAP = await connection.query(`SELECT cname FROM sys.syscolumns WHERE tname = 'APInvoices' AND cname = 'paid_amount'`);
        if (checkAP.length === 0) {
            console.log('Adding paid_amount to APInvoices...');
            await connection.query(`ALTER TABLE APInvoices ADD paid_amount NUMERIC(15,2) DEFAULT 0`);
        } else {
            console.log('APInvoices.paid_amount exists.');
        }

        // 2. ARInvoices: paid_amount
        const checkAR = await connection.query(`SELECT cname FROM sys.syscolumns WHERE tname = 'ARInvoices' AND cname = 'paid_amount'`);
        if (checkAR.length === 0) {
            console.log('Adding paid_amount to ARInvoices...');
            await connection.query(`ALTER TABLE ARInvoices ADD paid_amount NUMERIC(15,2) DEFAULT 0`);
        } else {
            console.log('ARInvoices.paid_amount exists.');
        }

        // 3. JournalVoucherDetails: ref_id, ref_type
        const checkJVRef = await connection.query(`SELECT cname FROM sys.syscolumns WHERE tname = 'JournalVoucherDetails' AND cname = 'ref_id'`);
        if (checkJVRef.length === 0) {
            console.log('Adding ref_id, ref_type to JournalVoucherDetails...');
            await connection.query(`ALTER TABLE JournalVoucherDetails ADD ref_id INTEGER NULL`);
            await connection.query(`ALTER TABLE JournalVoucherDetails ADD ref_type VARCHAR(20) NULL`);
        } else {
            console.log('JournalVoucherDetails.ref_id exists.');
        }

        console.log('Migration Complete.');

    } catch (e) {
        console.error('Migration Error:', e);
    } finally {
        if (connection) await connection.close();
    }
}

addAllocationColumns();
