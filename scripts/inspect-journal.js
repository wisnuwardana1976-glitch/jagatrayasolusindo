
import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function executeQuery(query, params = []) {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        const result = await connection.query(query, params);
        return result;
    } catch (error) {
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {
                console.error('Error closing connection:', e);
            }
        }
    }
}

async function run() {
    try {
        console.log('Fetching manual journals...');
        const res = await executeQuery(`
            SELECT TOP 5 * FROM JournalVouchers 
            WHERE source_type = 'MANUAL' 
            ORDER BY id DESC
        `);
        console.log('Journals found:', res.length);

        for (const j of res) {
            console.log(`\nJournal ID: ${j.id}, Doc: ${j.doc_number}`);
            const details = await executeQuery(`SELECT * FROM JournalVoucherDetails WHERE jv_id = ?`, [j.id]);
            console.log('Details:', JSON.stringify(details, null, 2));
        }

    } catch (e) {
        console.error(e);
    }
}
run();
