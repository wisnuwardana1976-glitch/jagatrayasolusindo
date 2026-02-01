import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkLocations() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        const result = await connection.query("sa_describe_query 'SELECT * FROM Locations'");
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        if (connection) await connection.close();
    }
}

checkLocations();
