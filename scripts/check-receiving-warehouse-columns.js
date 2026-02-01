
import odbc from 'odbc';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkCols() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        const tables = ['ReceivingDetails', 'PurchaseOrderDetails', 'Warehouses'];

        for (const table of tables) {
            console.log(`\n--- ${table} ---`);
            const cols = await connection.query(`select list(column_name) as cols from syscolumn key join systable where table_name = '${table}'`);
            console.log(cols[0].cols);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

checkCols();
