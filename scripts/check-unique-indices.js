import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkUnique() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // Use sp_helpindex for safer parsing if standard query fails
        // Or inspect sys table carefully
        // Trying to blindly DROP specific predicted names might be faster if standard
        // e.g. Shipments_so_id_key

        const result = await connection.query("SELECT * FROM SYS.SYSINDEX WHERE table_id = OBJECT_ID('Shipments') AND \"unique\" = 'Y'");
        console.log('Unique Indices:', result);

    } catch (error) {
        console.log('Error:', error.message);
    } finally {
        if (connection) await connection.close();
    }
}

checkUnique();
