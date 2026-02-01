
import odbc from 'odbc';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};Uid=${process.env.DB_USER};Pwd=${process.env.DB_PASSWORD};`;

async function checkPOSchema() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // Get one PO detail to see columns
        const pod = await connection.query(`SELECT TOP 1 * FROM PurchaseOrderDetails`);
        console.log('PO Detail Sample:', pod);

        if (pod.length > 0) {
            console.log('Columns:', Object.keys(pod[0]));
        } else {
            // If empty, try desc query if possible or create dummy
            console.log('Table exists but empty.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) await connection.close();
    }
}

checkPOSchema();
