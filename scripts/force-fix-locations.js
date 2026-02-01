import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function forceFix() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('Forcing update of stock locations...');

        // Fix Warehouse 1 -> Location 1 (Default L1-01)
        const res1 = await connection.query(`
            UPDATE ItemStocks 
            SET location_id = 1 
            WHERE warehouse_id = 1 AND (location_id IS NULL OR location_id NOT IN (1, 2))
        `);
        console.log('Fixed Warehouse 1 stocks:', res1);

        // Fix Warehouse 2 -> Location 4 (Default L2-01)
        const res2 = await connection.query(`
            UPDATE ItemStocks 
            SET location_id = 4 
            WHERE warehouse_id = 2 AND (location_id IS NULL OR location_id NOT IN (4, 5))
        `);
        console.log('Fixed Warehouse 2 stocks:', res2);

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

forceFix();
