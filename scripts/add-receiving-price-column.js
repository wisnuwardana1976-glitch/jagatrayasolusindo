
import odbc from 'odbc';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function migrate() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log("Checking ReceivingDetails columns...");
        const check = await connection.query(`select list(column_name) as cols from syscolumn key join systable where table_name = 'ReceivingDetails'`);
        const cols = check[0].cols.split(',');

        if (!cols.includes('unit_price')) {
            console.log("Adding unit_price column...");
            await connection.query('ALTER TABLE ReceivingDetails ADD unit_price NUMERIC(18,2) DEFAULT 0');
            console.log("Column added.");
        } else {
            console.log("Column unit_price already exists.");
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

migrate();
