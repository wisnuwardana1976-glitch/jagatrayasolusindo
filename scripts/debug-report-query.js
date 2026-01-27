import odbc from 'odbc';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // Test 1: Full Query
        console.log('\nTest 1: Full Query');
        try {
            const res = await connection.query(`
          SELECT 
            so.doc_number, 
            so.doc_date, 
            p.name as partner_name,
            i.code as item_code, 
            i.name as item_name, 
            u.name as unit,
            sod.quantity as qty_ordered,
            COALESCE(SUM(sd.quantity), 0) as qty_shipped,
            (sod.quantity - COALESCE(SUM(sd.quantity), 0)) as qty_outstanding
          FROM SalesOrderDetails sod
          JOIN SalesOrders so ON sod.so_id = so.id
          JOIN Items i ON sod.item_id = i.id
          JOIN Partners p ON so.partner_id = p.id
          LEFT JOIN Units u ON i.unit_id = u.id
          LEFT JOIN Shipments s ON s.so_id = so.id AND s.status IN ('Approved', 'Closed')
          LEFT JOIN ShipmentDetails sd ON s.id = sd.shipment_id AND sd.item_id = sod.item_id
          WHERE so.status IN ('Approved', 'Partial', 'Open') 
          GROUP BY so.doc_number, so.doc_date, p.name, i.code, i.name, u.name, sod.quantity
          HAVING (sod.quantity - COALESCE(SUM(sd.quantity), 0)) > 0
          ORDER BY so.doc_date ASC, so.doc_number ASC
        `);
            console.log('Test 1 Success! Rows:', res.length);
        } catch (e) {
            console.error('Test 1 Failed:', e.message);
        }

        // Test 2: Calc Alias usage
        console.log('\nTest 2: Using Alias in HAVING');
        try {
            const res = await connection.query(`
          SELECT 
            so.doc_number, 
            sod.quantity as qty_ordered,
            COALESCE(SUM(sd.quantity), 0) as qty_shipped,
            (sod.quantity - COALESCE(SUM(sd.quantity), 0)) as qty_outstanding
          FROM SalesOrderDetails sod
          JOIN SalesOrders so ON sod.so_id = so.id
          LEFT JOIN Shipments s ON s.so_id = so.id AND s.status IN ('Approved', 'Closed')
          LEFT JOIN ShipmentDetails sd ON s.id = sd.shipment_id AND sd.item_id = sod.item_id
          WHERE so.status IN ('Approved', 'Partial', 'Open') 
          GROUP BY so.doc_number, sod.quantity
          HAVING qty_outstanding > 0
        `);
            console.log('Test 2 Success! Rows:', res.length);
        } catch (e) {
            console.error('Test 2 Failed:', e.message);
        }

    } catch (error) {
        console.error('Connection Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

run();
