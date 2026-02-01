
import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkColumns() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('--- JournalVouchers Table ---');
        const jvCols = await connection.query("select list(column_name) as cols from syscolumn key join systable where table_name = 'JournalVouchers'");
        console.log(jvCols[0].cols);

        console.log('\n--- JournalVoucherDetails Table ---');
        const jvdCols = await connection.query("select list(column_name) as cols from syscolumn key join systable where table_name = 'JournalVoucherDetails'");
        console.log(jvdCols[0].cols);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

checkColumns();
