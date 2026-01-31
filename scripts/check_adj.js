import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to database');

        const docNumber = 'INAD/012026/0003';
        let result = await connection.query(`SELECT id, doc_number, status FROM InventoryAdjustments WHERE doc_number = '${docNumber}'`);

        console.log(JSON.stringify(result, null, 2));
        await connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
