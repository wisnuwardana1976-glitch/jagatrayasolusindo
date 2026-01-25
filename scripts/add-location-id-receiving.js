import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function addLocationIdToReceivings() {
    try {
        const pool = await odbc.pool(connectionString);
        const conn = await pool.connect();

        console.log('Adding location_id to Receivings...');

        try {
            await conn.query(`ALTER TABLE Receivings ADD location_id INTEGER`);
            console.log('✅ Added location_id to Receivings');
        } catch (e) {
            console.log('ℹ️ Receivings error: ' + (e.odbcErrors ? e.odbcErrors[0].message : e.message));
        }

        await conn.close();
        await pool.close();
        console.log('\nDone!');
    } catch (error) {
        console.error('Error:', error);
    }
}

addLocationIdToReceivings();
