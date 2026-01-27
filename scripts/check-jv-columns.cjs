
require('dotenv').config();
const odbc = require('odbc');

async function checkColumns() {
    let connection;
    try {
        connection = await odbc.connect(process.env.DB_CONNECTION_STRING);

        // Check JournalVouchers columns
        const result = await connection.query(`
            SELECT cname as column_name, coltype as domain_name, length as width, prec as scale
            FROM sys.syscolumns 
            WHERE tname = 'JournalVouchers'
        `);

        console.log('=== JournalVouchers Columns ===');
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

checkColumns();
