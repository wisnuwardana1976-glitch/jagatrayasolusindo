import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function run() {
    let connection;
    try {
        console.log('Connecting to Sybase...');
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // Test 1: Full Parameterized (as in server)
        try {
            console.log('\nTest 1: Parameterized [6, "Cancelled"]');
            const res1 = await connection.query("SELECT COUNT(*) as count FROM Receivings WHERE po_id = ? AND status <> ?", [6, 'Cancelled']);
            console.log('Result 1:', res1);
        } catch (err) {
            console.error('Test 1 Failed:', err.message);
            if (err.odbcErrors) console.error('ODBC Verify:', err.odbcErrors);
        }

        // Test 2: Hardcoded
        try {
            console.log('\nTest 2: Hardcoded ID=6, Status=\'Cancelled\'');
            const res2 = await connection.query("SELECT COUNT(*) as count FROM Receivings WHERE po_id = 6 AND status <> 'Cancelled'");
            console.log('Result 2:', res2);
        } catch (err) {
            console.error('Test 2 Failed:', err.message);
        }

        // Test 3: Mixed (ID param, Status literal)
        try {
            console.log('\nTest 3: Mixed ID param, Status literal');
            const res3 = await connection.query("SELECT COUNT(*) as count FROM Receivings WHERE po_id = ? AND status <> 'Cancelled'", [6]);
            console.log('Result 3:', res3);
        } catch (err) {
            console.error('Test 3 Failed:', err.message);
        }

    } catch (error) {
        console.error('Connection Failed:', error);
    } finally {
        if (connection) await connection.close();
    }
}

run();
