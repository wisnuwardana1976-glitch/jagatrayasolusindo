
import odbc from 'odbc';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function debugData() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log("=== Debugging COM001 Transactions V3 ===");

        const itemRes = await connection.query("SELECT id, code, name FROM Items WHERE code = 'COM001'");
        if (itemRes.length === 0) { console.log("COM001 not found"); return; }
        const itemId = itemRes[0].id;
        console.log(`Item ID: ${itemId}`);

        // 1. Receivings
        console.log("\n--- Receivings ---");
        const recs = await connection.query(`
            SELECT r.id, r.doc_number, r.doc_date, rd.quantity, rd.po_detail_id, pod.unit_price 
            FROM ReceivingDetails rd
            JOIN Receivings r ON rd.receiving_id = r.id
            LEFT JOIN PurchaseOrderDetails pod ON rd.po_detail_id = pod.id
            WHERE rd.item_id = ${itemId}
        `);
        console.log(JSON.stringify(recs, null, 2));

        // 2. Adjustments
        console.log("\n--- Adjustments ---");
        const adjs = await connection.query(`
            SELECT ia.doc_number, iad.quantity, iad.unit_cost 
            FROM InventoryAdjustmentDetails iad
            JOIN InventoryAdjustments ia ON iad.adjustment_id = ia.id
            WHERE iad.item_id = ${itemId}
        `);
        console.log(JSON.stringify(adjs, null, 2));

        // 3. Conversions
        console.log("\n--- Conversions ---");
        const convs = await connection.query(`
            SELECT ic.doc_number, icd.quantity, icd.unit_cost, icd.detail_type
            FROM ItemConversionDetails icd
            JOIN ItemConversions ic ON icd.conversion_id = ic.id
            WHERE icd.item_id = ${itemId}
        `);
        console.log(JSON.stringify(convs, null, 2));

        // 4. Shipments
        console.log("\n--- Shipments ---");
        const ships = await connection.query(`
            SELECT s.doc_number, sd.quantity 
            FROM ShipmentDetails sd
            JOIN Shipments s ON sd.shipment_id = s.id
            WHERE sd.item_id = ${itemId}
        `);
        console.log(JSON.stringify(ships, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

debugData();
