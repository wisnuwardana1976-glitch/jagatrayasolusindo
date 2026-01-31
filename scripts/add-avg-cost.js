import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function fixItemStocks() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('Adding average_cost to ItemStocks...');
        try {
            await connection.query('ALTER TABLE ItemStocks ADD average_cost DECIMAL(18,2) DEFAULT 0');
            console.log('✅ Added average_cost column');
        } catch (e) {
            console.log('ℹ️  Column average_cost might already exist or error: ' + e.message);
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (connection) await connection.close();
    }
}

fixItemStocks();
