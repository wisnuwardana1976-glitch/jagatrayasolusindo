
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function listAccounts() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        const accounts = await connection.query("SELECT id, code, name FROM Accounts WHERE name LIKE '%Kas%' OR name LIKE '%Bank%' OR name LIKE '%Cash%' ORDER BY code");
        console.log(JSON.stringify(accounts, null, 2));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

listAccounts();
