
import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkMoreColumns() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('--- SalesOrders Table ---');
        const soCols = await connection.query("select list(column_name) as cols from syscolumn key join systable where table_name = 'SalesOrders'");
        console.log(soCols[0].cols);

        console.log('--- ShipmentDetails Table ---');
        const sdCols = await connection.query("select list(column_name) as cols from syscolumn key join systable where table_name = 'ShipmentDetails'");
        console.log(sdCols[0].cols);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

checkMoreColumns();
