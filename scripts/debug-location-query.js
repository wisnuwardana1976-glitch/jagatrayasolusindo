import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function check() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await odbc.connect(connectionString);

        // Check SubWarehouses data
        console.log('SubWarehouses data:');
        try {
            const r = await connection.query('SELECT * FROM SubWarehouses');
            console.log(r);
        } catch (e) {
            console.log('Error:', e.message);
        }

        // Check Warehouses columns
        console.log('\nWarehouses columns:');
        try {
            const r = await connection.query('SELECT * FROM Warehouses');
            console.log(r);
        } catch (e) {
            console.log('Error:', e.message);
        }

        // Check if Warehouses has 'name' column
        console.log('\n--- Does Warehouses have "name" column? ---');
        try {
            const r = await connection.query('SELECT name FROM Warehouses');
            console.log('✅ Has name column');
        } catch (e) {
            console.log('❌ Error:', e.message);
        }

        // Try with 'description' instead of 'name'
        console.log('\n--- Try with "description" column ---');
        try {
            const r = await connection.query(`
                SELECT lt.id, lt.doc_number, w_src.description
                FROM LocationTransfers lt
                LEFT JOIN Locations l_src ON lt.source_location_id = l_src.id
                LEFT JOIN SubWarehouses sw_src ON l_src.sub_warehouse_id = sw_src.id
                LEFT JOIN Warehouses w_src ON sw_src.warehouse_id = w_src.id
            `);
            console.log('✅ Works with description! Rows:', r.length);
        } catch (e) {
            console.log('❌ Error:', e.message);
        }

    } catch (e) {
        console.error('Connection error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

check();
