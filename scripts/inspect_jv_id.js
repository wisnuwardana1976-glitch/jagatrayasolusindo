import odbc from 'odbc';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        const id = 108;
        console.log(`Inspecting JV ID ${id}...`);
        const details = await connection.query(`SELECT * FROM JournalVoucherDetails WHERE jv_id = ${id}`);
        console.log('Details:', JSON.stringify(details, null, 2));
        await connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}
run();
