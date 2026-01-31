import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to database');

        const result = await connection.query(`SELECT TOP 1 * FROM JournalVoucherDetails`);
        console.log('Columns:', Object.keys(result[0]));

        await connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
