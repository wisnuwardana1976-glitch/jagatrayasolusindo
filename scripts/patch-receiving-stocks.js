
import odbc from 'odbc';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};Uid=${process.env.DB_USER};Pwd=${process.env.DB_PASSWORD};`;

async function patchStocks() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // Get all Receivings that are 'Approved'
        const recs = await connection.query("SELECT id, doc_number, location_id FROM Receivings WHERE status = 'Approved'");
        console.log(`Found ${recs.length} Approved receivings to process.`);

        for (const rec of recs) {
            console.log(`Processing ${rec.doc_number}...`);

            // Get Warehouse ID
            const [loc] = await connection.query(`
                SELECT sw.warehouse_id 
                FROM Locations l 
                JOIN SubWarehouses sw ON l.sub_warehouse_id = sw.id 
                WHERE l.id = ?
            `, [rec.location_id]);

            const warehouseId = loc ? Number(loc.warehouse_id) : null;
            if (!warehouseId) {
                console.log(`Skip ${rec.doc_number}: warehouse not found for location ${rec.location_id}`);
                continue;
            }

            const details = await connection.query('SELECT * FROM ReceivingDetails WHERE receiving_id = ?', [rec.id]);

            for (const item of details) {
                // 1. Determine Unit Cost
                let unitCost = 0;
                if (item.po_detail_id) {
                    const [poDetail] = await connection.query('SELECT unit_price FROM PurchaseOrderDetails WHERE id = ?', [item.po_detail_id]);
                    unitCost = poDetail ? Number(poDetail.unit_price) : 0;
                } else {
                    const [itemMaster] = await connection.query('SELECT standard_cost FROM Items WHERE id = ?', [item.item_id]);
                    unitCost = itemMaster ? Number(itemMaster.standard_cost) : 0;
                }

                // 2. Update Stock
                const stockResult = await connection.query(`
                    SELECT quantity, average_cost FROM ItemStocks 
                    WHERE item_id = ? AND warehouse_id = ? AND location_id = ?
                `, [item.item_id, warehouseId, item.location_id || rec.location_id]);

                let newQty = Number(item.quantity);
                let newAvgCost = unitCost;

                if (stockResult.length > 0) {
                    const currentQty = Number(stockResult[0].quantity);
                    const currentAvgCost = Number(stockResult[0].average_cost || 0);

                    const totalQty = currentQty + newQty;
                    if (totalQty > 0) {
                        newAvgCost = ((currentQty * currentAvgCost) + (newQty * unitCost)) / totalQty;
                    } else {
                        newAvgCost = currentAvgCost;
                    }

                    await connection.query(`
                        UPDATE ItemStocks 
                        SET quantity = quantity + ?, average_cost = ?, last_updated = CURRENT TIMESTAMP 
                        WHERE item_id = ? AND warehouse_id = ? AND location_id = ?
                    `, [newQty, newAvgCost, item.item_id, warehouseId, item.location_id || rec.location_id]);
                } else {
                    await connection.query(`
                        INSERT INTO ItemStocks (item_id, warehouse_id, location_id, quantity, average_cost)
                        VALUES (?, ?, ?, ?, ?)
                    `, [item.item_id, warehouseId, item.location_id || rec.location_id, newQty, newAvgCost]);
                }
            }

            // 3. Update Status to 'Posted' to match new logic convention
            await connection.query("UPDATE Receivings SET status = 'Posted' WHERE id = ?", [rec.id]);
            console.log(`Done patching ${rec.doc_number}.`);
        }

        console.log('Finished patching stocks.');

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) await connection.close();
    }
}

patchStocks();
