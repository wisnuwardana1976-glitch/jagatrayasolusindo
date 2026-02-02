
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to DB');
        const itemId = 1; // Assuming COM001 is ID 1 based on context

        // --- Logic copied from RecalculateInventory (server/index.js) ---

        // RECEIVINGS
        let rxQuery = `
        SELECT 'IN' as dir, 'RCV' as type, r.doc_number, r.doc_date, 
               rd.quantity, 
               w.id as warehouse_id, 
               COALESCE(rd.location_id, r.location_id) as location_id
        FROM ReceivingDetails rd
        JOIN Receivings r ON rd.receiving_id = r.id
        LEFT JOIN Locations l ON COALESCE(rd.location_id, r.location_id) = l.id
        LEFT JOIN SubWarehouses sw ON l.sub_warehouse_id = sw.id
        LEFT JOIN Warehouses w ON sw.warehouse_id = w.id
        WHERE rd.item_id = ? AND r.status = 'Posted'
        `;

        // SHIPMENTS
        let shQuery = `
        SELECT 'OUT' as dir, 'SHP' as type, s.doc_number, s.doc_date,
               sd.quantity, 
               (SELECT TOP 1 id FROM Warehouses) as warehouse_id, 
               NULL as location_id
        FROM ShipmentDetails sd
        JOIN Shipments s ON sd.shipment_id = s.id
        WHERE sd.item_id = ? AND s.status = 'Posted'
        `;

        // ADJUSTMENTS
        let adjQuery = `
        SELECT 
          CASE WHEN d.quantity > 0 THEN 'IN' ELSE 'OUT' END as dir,
          'ADJ' as type, h.doc_number, h.doc_date,
          ABS(d.quantity) as quantity,
          h.warehouse_id, NULL as location_id
        FROM InventoryAdjustmentDetails d
        JOIN InventoryAdjustments h ON d.adjustment_id = h.id
        WHERE d.item_id = ? AND h.status = 'Posted'
        `;

        // CONVERSIONS
        let convQuery = `
        SELECT 
          CASE WHEN icd.detail_type = 'OUTPUT' THEN 'IN' ELSE 'OUT' END as dir,
          'CNV' as type, ic.doc_number, ic.doc_date,
          icd.quantity,
          w.id as warehouse_id,
          icd.location_id
        FROM ItemConversionDetails icd
        JOIN ItemConversions ic ON icd.conversion_id = ic.id
        LEFT JOIN Locations l ON icd.location_id = l.id
        LEFT JOIN SubWarehouses sw ON l.sub_warehouse_id = sw.id
        LEFT JOIN Warehouses w ON sw.warehouse_id = w.id
        WHERE icd.item_id = ? AND ic.status = 'Posted'
        `;

        const rxs = await connection.query(rxQuery, [itemId]);
        const shs = await connection.query(shQuery, [itemId]);
        const adjs = await connection.query(adjQuery, [itemId]);
        const convs = await connection.query(convQuery, [itemId]);

        const transactions = [...rxs, ...shs, ...adjs, ...convs];

        console.log(`Total Transactions: ${transactions.length}`);

        const nullLocs = transactions.filter(t => !t.location_id);
        if (nullLocs.length > 0) {
            console.log('--- Transactions with NULL Location ---');
            console.log(JSON.stringify(nullLocs, null, 2));
        } else {
            console.log('No transactions with NULL location found.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (connection) await connection.close();
    }
}

run();
