
import odbc from 'odbc';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function backfill() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log("Backfilling unit_price for PO-based Receivings...");

        // Update unit_price from PurchaseOrderDetails
        // Logic: 
        // 1. Join ReceivingDetails (rd) -> Receiving (r) -> PurchaseOrderDetails (pod) 
        // 2. WHERE rd.po_detail_id MATCHES pod.id (Best connection)
        // 3. OR if po_detail_id is null, match by Item ID and PO ID (Fallback)

        // Method 1: Update using po_detail_id
        const update1 = await connection.query(`
            UPDATE ReceivingDetails 
            SET unit_price = pod.unit_price
            FROM ReceivingDetails rd
            JOIN PurchaseOrderDetails pod ON rd.po_detail_id = pod.id
            WHERE rd.unit_price IS NULL OR rd.unit_price = 0
        `);
        console.log("Method 1 (po_detail_id) complete.");

        // Method 2: Fallback for older data?
        const update2 = await connection.query(`
            UPDATE ReceivingDetails 
            SET unit_price = pod.unit_price
            FROM ReceivingDetails rd
            JOIN Receivings r ON rd.receiving_id = r.id
            JOIN PurchaseOrderDetails pod ON r.po_id = pod.po_id AND rd.item_id = pod.item_id
            WHERE (rd.unit_price IS NULL OR rd.unit_price = 0)
              AND rd.po_detail_id IS NULL
        `);
        console.log("Method 2 (Item match) complete.");

        // Verification
        const check = await connection.query(`
            SELECT count(*) as total, sum(case when unit_price > 0 then 1 else 0 end) as filled 
            FROM ReceivingDetails
        `);
        console.log("Status:", check);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

backfill();
