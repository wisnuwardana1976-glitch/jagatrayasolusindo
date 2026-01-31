import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to database');

        const jvId = 96; // ID dari hasil inspect sebelumnya

        console.log(`Deleting Journal Voucher Details for JV ID ${jvId}...`);
        await connection.query(`DELETE FROM JournalVoucherDetails WHERE jv_id = ${jvId}`);

        console.log(`Deleting Journal Voucher ID ${jvId}...`);
        await connection.query(`DELETE FROM JournalVouchers WHERE id = ${jvId}`);

        console.log('Orphaned Journal deleted successfully.');
        await connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
