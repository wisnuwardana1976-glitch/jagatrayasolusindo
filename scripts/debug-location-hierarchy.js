import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function check() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('--- Hierarchy for Warehouse ID 2 ---');
        const hierarchy = await connection.query(`
            SELECT 
                w.id as wh_id, 
                w.code as wh_code, 
                sw.id as sw_id, 
                sw.code as sw_code, 
                l.id as loc_id, 
                l.code as loc_code
            FROM Warehouses w
            JOIN SubWarehouses sw ON w.id = sw.warehouse_id
            JOIN Locations l ON sw.id = l.sub_warehouse_id
            WHERE w.id = 2
        `);
        console.table(hierarchy);

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

check();
