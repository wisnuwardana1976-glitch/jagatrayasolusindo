// Script to check invalid warehouse references
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function checkData() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await odbc.connect(connectionString);
        console.log('✅ Connected!\n');

        // Get valid warehouse IDs
        const warehouses = await connection.query('SELECT id, code FROM Warehouses');
        console.log('Valid Warehouses:', warehouses.map(w => `${w.id}=${w.code}`).join(', '));
        const validWarehouseIds = new Set(warehouses.map(w => w.id));

        // Check Receivings with invalid warehouse_id
        console.log('\n--- Checking Receivings ---');
        const receivings = await connection.query('SELECT id, doc_number, warehouse_id FROM Receivings');
        console.log('Total Receivings:', receivings.length);

        const invalidReceivings = receivings.filter(r => r.warehouse_id && !validWarehouseIds.has(r.warehouse_id));
        if (invalidReceivings.length > 0) {
            console.log('❌ Invalid Warehouse IDs in Receivings:');
            invalidReceivings.forEach(r => console.log(`   - Receiving #${r.id} (${r.doc_number}): warehouse_id = ${r.warehouse_id}`));
        } else {
            console.log('✅ All Receivings have valid warehouse IDs');
        }

        // Check Shipments with invalid warehouse_id
        console.log('\n--- Checking Shipments ---');
        const shipments = await connection.query('SELECT id, doc_number, warehouse_id FROM Shipments');
        console.log('Total Shipments:', shipments.length);

        const invalidShipments = shipments.filter(s => s.warehouse_id && !validWarehouseIds.has(s.warehouse_id));
        if (invalidShipments.length > 0) {
            console.log('❌ Invalid Warehouse IDs in Shipments:');
            invalidShipments.forEach(s => console.log(`   - Shipment #${s.id} (${s.doc_number}): warehouse_id = ${s.warehouse_id}`));
        } else {
            console.log('✅ All Shipments have valid warehouse IDs');
        }

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

checkData();
