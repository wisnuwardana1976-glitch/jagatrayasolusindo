
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');
        const itemId = 6;

        console.log('Testing Rx Query (Exactly as in RecalculateInventory)...');
        let rxQuery = `
        SELECT 'IN' as dir, 'RCV' as type, r.doc_date, NULL as created_at, 
               rd.quantity, 
               COALESCE(rd.unit_price, pod.unit_price, i.standard_cost, 0) as cost,
               w.id as warehouse_id, 
               COALESCE(rd.location_id, r.location_id) as location_id
        FROM ReceivingDetails rd
        JOIN Receivings r ON rd.receiving_id = r.id
        LEFT JOIN Locations l ON COALESCE(rd.location_id, r.location_id) = l.id
        LEFT JOIN SubWarehouses sw ON l.sub_warehouse_id = sw.id
        LEFT JOIN Warehouses w ON sw.warehouse_id = w.id
        LEFT JOIN PurchaseOrderDetails pod ON rd.po_detail_id = pod.id
        JOIN Items i ON rd.item_id = i.id
        WHERE rd.item_id = ? AND r.status = 'Posted'
      `;
        try {
            const res = await connection.query(rxQuery, [itemId]);
            console.log('Rx OK, count:', res.length);
        } catch (e) { console.error('Rx Fail:', e.message); }

        console.log('Testing Sh Query...');
        let shQuery = `
        SELECT 'OUT' as dir, 'SHP' as type, s.doc_date, NULL as created_at,
               sd.quantity, 0 as cost,
               (SELECT TOP 1 id FROM Warehouses) as warehouse_id, NULL as location_id
        FROM ShipmentDetails sd
        JOIN Shipments s ON sd.shipment_id = s.id
        WHERE sd.item_id = ? AND s.status = 'Posted'
      `;
        try {
            const res = await connection.query(shQuery, [itemId]);
            console.log('Sh OK, count:', res.length);
        } catch (e) { console.error('Sh Fail:', e.message); }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (connection) await connection.close();
    }
}

run();
