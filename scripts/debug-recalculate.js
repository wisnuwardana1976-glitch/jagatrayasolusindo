
import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function debugRecalculate() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        try {
            connection = await odbc.connect(connectionString);
        } catch (e) {
            console.error("Connection failed", e);
            return;
        }

        console.log('Fetching IN transactions...');
        const receivings = await connection.query(`
        -- Receivings
        SELECT rd.item_id, rd.quantity, pod.unit_price, r.warehouse_id, r.doc_date
        FROM ReceivingDetails rd
        JOIN Receivings r ON rd.receiving_id = r.id
        LEFT JOIN PurchaseOrderDetails pod ON r.po_id = pod.po_id AND rd.item_id = pod.item_id
        WHERE r.status = 'Approved'
        
        UNION ALL
        
        -- Conversion Output
        SELECT icd.item_id, icd.quantity, icd.unit_cost as unit_price, w.id as warehouse_id, ic.doc_date
        FROM ItemConversionDetails icd
        JOIN ItemConversions ic ON icd.conversion_id = ic.id
        JOIN Locations l ON icd.location_id = l.id
        JOIN SubWarehouses sw ON l.sub_warehouse_id = sw.id
        JOIN Warehouses w ON sw.warehouse_id = w.id
        WHERE ic.status = 'Posted' AND icd.detail_type = 'OUTPUT'

        UNION ALL

        -- Inventory Adjustments (Positive)
        SELECT iad.item_id, iad.quantity, iad.unit_cost as unit_price, w.id as warehouse_id, ia.doc_date
        FROM InventoryAdjustmentDetails iad
        JOIN InventoryAdjustments ia ON iad.adjustment_id = ia.id
        JOIN Locations l ON iad.location_id = l.id
        JOIN SubWarehouses sw ON l.sub_warehouse_id = sw.id
        JOIN Warehouses w ON sw.warehouse_id = w.id
        WHERE ia.status = 'Posted' AND iad.quantity > 0

        ORDER BY doc_date ASC
        `);
        console.log(`Found ${receivings.length} IN transactions.`);
        if (receivings.length > 0) {
            console.log('First 3 IN:', receivings.slice(0, 3));
        }

        console.log('Fetching Warehouses...');
        const warehouses = await connection.query('SELECT id FROM Warehouses');
        let validWarehouses = new Set();
        warehouses.forEach(w => validWarehouses.add(String(w.id)));
        console.log('Valid Warehouses:', Array.from(validWarehouses));

        // Logic Check
        const stockMap = {};
        const warehouseStockMap = {};

        for (const rec of receivings) {
            if (!rec.item_id) continue;

            const key = rec.item_id;
            const wareKey = `${rec.item_id}-${rec.warehouse_id}`; // Check if rec.warehouse_id is null/undefined here

            console.log(`Processing Rec Item ${rec.item_id}, Warehouse: ${rec.warehouse_id}, Key: ${wareKey}`);

            if (!stockMap[key]) stockMap[key] = { totalQty: 0, totalValue: 0 };
            if (!warehouseStockMap[wareKey]) warehouseStockMap[wareKey] = 0;

            const qty = Number(rec.quantity);
            const cost = Number(rec.unit_price || 0);

            if (rec.warehouse_id) {
                warehouseStockMap[wareKey] += qty;
            }

            stockMap[key].totalQty += qty;
            stockMap[key].totalValue += (qty * cost);
        }

        console.log('Warehouse Stock Map keys:', Object.keys(warehouseStockMap));

        for (const [wKey, qty] of Object.entries(warehouseStockMap)) {
            const [itemId, warehouseId] = wKey.split('-');
            console.log(`Checking insert: Item ${itemId}, Warehouse ${warehouseId}, Qty ${qty}`);

            if (warehouseId && warehouseId !== 'null' && warehouseId !== 'undefined' && validWarehouses.has(warehouseId)) {
                console.log('>>> WOULD INSERT');
            } else {
                console.log('>>> SKIP INSERT');
                console.log(`Reason: null? ${warehouseId === 'null'}, undefined? ${warehouseId === 'undefined'}, inValid? ${validWarehouses.has(warehouseId)}`);
            }
        }


    } catch (error) {
        console.error('❌ Error details:', error);
    } finally {
        if (connection) await connection.close();
    }
}

debugRecalculate();
