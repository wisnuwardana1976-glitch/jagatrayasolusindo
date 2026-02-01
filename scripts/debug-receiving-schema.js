
import odbc from 'odbc';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};Uid=${process.env.DB_USER};Pwd=${process.env.DB_PASSWORD};`;

async function checkReceivingSchema() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // Check Receivings columns
        const r = await connection.query(`SELECT TOP 1 * FROM Receivings`);
        if (r.length > 0) {
            console.log('Receivings Columns:', Object.keys(r[0]));
        } else {
            console.log('Receivings table empty. Trying to query syscolumns logic via checking insert error? No, just console log.');
            // Fallback: Try select specific columns to see if they exist
            try {
                await connection.query('SELECT partner_id, location_id FROM Receivings WHERE 1=0');
                console.log('partner_id and location_id exist in Receivings');
            } catch (e) {
                console.log('Error selecting partner_id/location_id:', e.message);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) await connection.close();
    }
}

checkReceivingSchema();
