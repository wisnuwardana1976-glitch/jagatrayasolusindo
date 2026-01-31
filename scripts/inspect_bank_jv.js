import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to database');

        const docNum = 'BCAO/012026/0009';
        console.log(`Searching for Journal ${docNum}...`);

        // Get JV ID
        const jv = await connection.query(`SELECT * FROM JournalVouchers WHERE doc_number = '${docNum}'`);
        if (jv.length === 0) {
            console.log('Journal not found.');
            return;
        }
        const jvId = jv[0].id;
        console.log('JV ID:', jvId);

        // Get Details
        const details = await connection.query(`SELECT * FROM JournalVoucherDetails WHERE jv_id = ${jvId}`);
        console.log('Details:', JSON.stringify(details, null, 2));

        await connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
