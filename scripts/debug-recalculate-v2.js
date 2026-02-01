
import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function debugRecalculateV2() {
    let connection;
    try {
        console.log('🔄 Connecting...');
        connection = await odbc.connect(connectionString);

        // 1. Fetch ALL "IN" Transactions (Receivings + Conversion Output + Adjustment Positive)
        console.log('Step 2: Fetching IN transactions (CORRECTED QUERY)...');
        let receivings = [];
        try {
            receivings = await connection.query(`
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
            SELECT iad.item_id, iad.quantity, iad.unit_cost as unit_price, ia.warehouse_id, ia.doc_date
            FROM InventoryAdjustmentDetails iad
            JOIN InventoryAdjustments ia ON iad.adjustment_id = ia.id
            WHERE ia.status = 'Posted' AND iad.quantity > 0

            ORDER BY doc_date ASC
            `);
            console.log('Step 2: ✅ Complete, found', receivings.length, 'IN transactions');
            console.log('First 5 IN:', receivings.slice(0, 5));
        } catch (e) {
            console.error('Step 2 Error:', e.message);
            // return;
        }

        // 3. Fetch ALL "OUT" Transactions (Shipments + Conversion Input + Adjustment Negative)
        console.log('Step 3: Fetching OUT transactions (CORRECTED QUERY)...');
        let shipments = [];
        try {
            shipments = await connection.query(`
            -- Shipments
            SELECT sd.item_id, sd.quantity, NULL as warehouse_id, s.doc_date
            FROM ShipmentDetails sd
            JOIN Shipments s ON sd.shipment_id = s.id
            WHERE s.status = 'Approved' OR s.status = 'Closed'

            UNION ALL

            -- Conversion Input
            SELECT icd.item_id, icd.quantity, w.id as warehouse_id, ic.doc_date
            FROM ItemConversionDetails icd
            JOIN ItemConversions ic ON icd.conversion_id = ic.id
            JOIN Locations l ON icd.location_id = l.id
            JOIN SubWarehouses sw ON l.sub_warehouse_id = sw.id
            JOIN Warehouses w ON sw.warehouse_id = w.id
            WHERE ic.status = 'Posted' AND icd.detail_type = 'INPUT'

            UNION ALL

            -- Inventory Adjustments (Negative)
            SELECT iad.item_id, ABS(iad.quantity) as quantity, ia.warehouse_id, ia.doc_date
            FROM InventoryAdjustmentDetails iad
            JOIN InventoryAdjustments ia ON iad.adjustment_id = ia.id
            WHERE ia.status = 'Posted' AND iad.quantity < 0

            ORDER BY doc_date ASC
            `);
            console.log('Step 3: ✅ Complete, found', shipments.length, 'OUT transactions');
            console.log('First 5 OUT:', shipments.slice(0, 5));
        } catch (e) {
            console.error('Step 3 Error:', e.message);
            // return;
        }

        const stockMap = {};
        const warehouseStockMap = {};

        // Process IN
        for (const rec of receivings) {
            if (!rec.item_id) continue;
            const key = String(rec.item_id); // Ensure string key
            const wareKey = `${rec.item_id}-${rec.warehouse_id}`;

            if (!stockMap[key]) stockMap[key] = { totalQty: 0, totalValue: 0 };
            if (!warehouseStockMap[wareKey]) warehouseStockMap[wareKey] = 0;

            const qty = Number(rec.quantity);
            const cost = Number(rec.unit_price || 0);

            if (rec.warehouse_id) {
                warehouseStockMap[wareKey] += qty;
            } else {
                console.log('WARNING: IN transaction missing warehouse_id:', rec);
            }

            stockMap[key].totalQty += qty;
            stockMap[key].totalValue += (qty * cost);
        }

        // Process OUT
        for (const shp of shipments) {
            if (!shp.item_id) continue;
            const key = String(shp.item_id);
            const wareKey = `${shp.item_id}-${shp.warehouse_id}`;

            if (!warehouseStockMap[wareKey]) warehouseStockMap[wareKey] = 0;
            if (!stockMap[key]) stockMap[key] = { totalQty: 0, totalValue: 0 };

            const qty = Number(shp.quantity);

            if (shp.warehouse_id) {
                warehouseStockMap[wareKey] -= qty;
            }

            if (stockMap[key].totalQty > 0) {
                const currentAvg = stockMap[key].totalValue / stockMap[key].totalQty;
                stockMap[key].totalValue -= (qty * currentAvg);
                stockMap[key].totalQty -= qty;
            } else {
                stockMap[key].totalQty -= qty;
            }
        }

        console.log('--- Warehouse Stock Map ---');
        console.log(warehouseStockMap);

        // 4. Update Database SImulation
        console.log('Step 4: Update Simulation...');

        let validWarehouses = new Set();
        const warehouses = await connection.query('SELECT id FROM Warehouses');
        warehouses.forEach(w => validWarehouses.add(String(w.id)));
        console.log('Valid Warehouses (String):', validWarehouses);

        for (const [wKey, qty] of Object.entries(warehouseStockMap)) {
            const [itemId, warehouseId] = wKey.split('-');

            if (warehouseId && warehouseId !== 'null' && warehouseId !== 'undefined' && validWarehouses.has(String(warehouseId))) {
                console.log(`✅ WOULD INSERT: Item ${itemId}, Warehouse ${warehouseId}, Qty ${qty}`);
            } else {
                console.log(`❌ SKIP INSERT: Item ${itemId}, Warehouse ${warehouseId}, Qty ${qty}`);
                console.log(`DETAILS: warehouseId value: '${warehouseId}', in Set? ${validWarehouses.has(String(warehouseId))}`);
            }
        }

    } catch (error) {
        console.error('❌ Error details:', error);
    } finally {
        if (connection) await connection.close();
    }
}

debugRecalculateV2();
