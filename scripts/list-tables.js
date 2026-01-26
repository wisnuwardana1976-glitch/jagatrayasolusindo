// List all tables
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function listTables() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await odbc.connect(connectionString);

        const tables = await connection.query(`
            SELECT table_name 
            FROM SYSTABLE 
            WHERE table_type = 'BASE' AND creator = 1 
            ORDER BY table_name
        `); // creator=1 usually filters user tables in Sybase/SQL Anywhere, or just filtering system tables manually

        // Filter out obviously system tables if needed, but SQL Anywhere usually mixes them if not careful
        // The above query is approximate. Let's cleaner query:
        // "SELECT table_name FROM SYSTABLE WHERE server_type = 'ASA' AND table_type = 'BASE'"

        // Let's stick to simple select and filter in JS
        const allTables = await connection.query("SELECT table_name FROM SYSTABLE WHERE table_type = 'BASE'");

        console.log('Tables found:');
        const userTables = allTables.filter(t => !t.table_name.startsWith('sys') && !t.table_name.startsWith('rs_'));
        userTables.forEach(t => console.log(t.table_name));

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) await connection.close();
    }
}

listTables();
