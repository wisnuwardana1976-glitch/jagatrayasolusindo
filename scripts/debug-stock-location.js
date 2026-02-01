import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function check() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('--- Checking ItemStocks Data ---');
        // Check ItemStocks content
        const stocks = await connection.query(`
            SELECT TOP 10 
                s.item_id, 
                s.warehouse_id, 
                s.location_id, 
                s.quantity,
                w.code as wh_code,
                l.code as loc_code,
                l.name as loc_name
            FROM ItemStocks s
            LEFT JOIN Warehouses w ON s.warehouse_id = w.id
            LEFT JOIN Locations l ON s.location_id = l.id
        `);
        console.table(stocks);

        console.log('--- Checking Locations Table ---');
        const locations = await connection.query(`SELECT TOP 5 id, code, name, warehouse_id FROM Locations`);
        console.table(locations);

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

check();
