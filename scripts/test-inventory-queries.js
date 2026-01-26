// Script to test each SQL query individually
import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function testQueries() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await odbc.connect(connectionString);
        console.log('✅ Connected!\n');

        // Test 1: DELETE FROM ItemStocks
        console.log('Test 1: DELETE FROM ItemStocks');
        try {
            await connection.query('DELETE FROM ItemStocks');
            console.log('✅ Test 1 Passed!\n');
        } catch (e) {
            console.error('❌ Test 1 Failed:', e.odbcErrors?.[0]?.message || e.message);
        }

        // Test 2: Query Receivings
        console.log('Test 2: Query Receivings');
        try {
            const result = await connection.query(`
                SELECT rd.item_id, rd.quantity, pod.unit_price, r.warehouse_id, r.doc_date
                FROM ReceivingDetails rd
                JOIN Receivings r ON rd.receiving_id = r.id
                LEFT JOIN PurchaseOrderDetails pod ON r.po_id = pod.po_id AND rd.item_id = pod.item_id
                WHERE r.status = 'Approved'
                ORDER BY r.doc_date ASC, r.id ASC
            `);
            console.log('✅ Test 2 Passed! Found:', result.length, 'records\n');
        } catch (e) {
            console.error('❌ Test 2 Failed:', e.odbcErrors?.[0]?.message || e.message);
        }

        // Test 3: Query Shipments
        console.log('Test 3: Query Shipments');
        try {
            const result = await connection.query(`
                SELECT sd.item_id, sd.quantity, s.warehouse_id, s.doc_date
                FROM ShipmentDetails sd
                JOIN Shipments s ON sd.shipment_id = s.id
                WHERE s.status = 'Approved' OR s.status = 'Closed'
                ORDER BY s.doc_date ASC, s.id ASC
            `);
            console.log('✅ Test 3 Passed! Found:', result.length, 'records\n');
        } catch (e) {
            console.error('❌ Test 3 Failed:', e.odbcErrors?.[0]?.message || e.message);
        }

        // Test 4: INSERT INTO ItemStocks
        console.log('Test 4: INSERT INTO ItemStocks');
        try {
            await connection.query('INSERT INTO ItemStocks (item_id, warehouse_id, quantity) VALUES (1, 1, 10)');
            console.log('✅ Test 4 Passed!\n');
            // Clean up test data
            await connection.query('DELETE FROM ItemStocks WHERE item_id = 1 AND warehouse_id = 1');
        } catch (e) {
            console.error('❌ Test 4 Failed:', e.odbcErrors?.[0]?.message || e.message);
        }

        // Test 5: UPDATE Items SET standard_cost
        console.log('Test 5: UPDATE Items SET standard_cost');
        try {
            // Just test the syntax without changing data
            const items = await connection.query('SELECT TOP 1 id, standard_cost FROM Items');
            if (items.length > 0) {
                const originalCost = items[0].standard_cost;
                await connection.query('UPDATE Items SET standard_cost = ? WHERE id = ?', [originalCost, items[0].id]);
                console.log('✅ Test 5 Passed!\n');
            } else {
                console.log('⚠️  Test 5 Skipped: No items found\n');
            }
        } catch (e) {
            console.error('❌ Test 5 Failed:', e.odbcErrors?.[0]?.message || e.message);
        }

        console.log('=== All tests completed ===');

    } catch (e) {
        console.error('Connection Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

testQueries();
