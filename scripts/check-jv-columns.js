
import dotenv from 'dotenv';
import odbc from 'odbc';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkColumns() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('Connected to DB.');

        const result = await connection.query(`
            SELECT cname, coltype, length, syslength
            FROM sys.syscolumns 
            WHERE tname = 'JournalVouchers'
        `);

        console.log('=== JournalVouchers Columns ===');
        console.table(result); // console.table might not show in run_command output well, better iterating
        result.forEach(r => console.log(`${r.cname}: ${r.coltype} (len: ${r.length})`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

checkColumns();
