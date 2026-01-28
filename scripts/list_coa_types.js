
import odbc from 'odbc';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function listTypes() {
    try {
        const connection = await odbc.connect(connectionString);
        const result = await connection.query('SELECT DISTINCT type FROM Accounts');
        console.log('Account Types:', JSON.stringify(result, null, 2));
        await connection.close();
    } catch (e) { console.error(e); }
}
listTypes();
