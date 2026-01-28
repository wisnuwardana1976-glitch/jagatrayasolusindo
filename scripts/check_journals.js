
import odbc from 'odbc';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkJournals() {
    try {
        const connection = await odbc.connect(connectionString);

        console.log('--- Journal Vouchers ---');
        const count = await connection.query('SELECT COUNT(*) as count FROM JournalVouchers');
        console.log('Total Journals:', count[0].count);

        const statuses = await connection.query('SELECT status, COUNT(*) as count FROM JournalVouchers GROUP BY status');
        console.log('By Status:', JSON.stringify(statuses, null, 2));

        if (count[0].count > 0) {
            const sample = await connection.query('SELECT TOP 1 * FROM JournalVouchers ORDER BY id DESC');
            console.log('Latest Journal:', JSON.stringify(sample[0], null, 2));

            const details = await connection.query(`SELECT * FROM JournalVoucherDetails WHERE jv_id = ${sample[0].id}`);
            console.log('Details for latest:', JSON.stringify(details, null, 2));
        }

        await connection.close();
    } catch (e) {
        console.error(e);
    }
}
checkJournals();
