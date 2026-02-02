
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    let connection;
    try {
        const itemCode = process.argv[2];
        if (!itemCode) throw new Error('Usage: node scripts/debug_stock_flow.js <ItemCode>');

        connection = await odbc.connect(connectionString);
        console.log(`Connected. Searching for ${itemCode}...`);

        const items = await connection.query('SELECT id, code, name FROM Items WHERE code = ?', [itemCode]);
        if (items.length === 0) throw new Error('Item not found');
        const item = items[0];
        console.log(`Item Found: ${item.id} - ${item.name}`);

        // Fetch Transactions
        console.log('Fetching Transactions...');

        // 1. Receivings
        const rxs = await connection.query(`
            SELECT 'IN' as dir, 'RCV' as type, r.doc_date, NULL as created_at, rd.quantity, rd.location_id
            FROM ReceivingDetails rd JOIN Receivings r ON rd.receiving_id = r.id
            WHERE rd.item_id = ? AND r.status = 'Posted'
        `, [item.id]);

        // 2. Shipments
        const shs = await connection.query(`
            SELECT 'OUT' as dir, 'SHP' as type, s.doc_date, NULL as created_at, sd.quantity
            FROM ShipmentDetails sd JOIN Shipments s ON sd.shipment_id = s.id
            WHERE sd.item_id = ? AND s.status = 'Posted'
        `, [item.id]);

        // 3. Adjustments
        const adjs = await connection.query(`
            SELECT CASE WHEN d.quantity > 0 THEN 'IN' ELSE 'OUT' END as dir, 
                   'ADJ' as type, h.doc_date, h.created_at, ABS(d.quantity) as quantity, d.location_id
            FROM InventoryAdjustmentDetails d JOIN InventoryAdjustments h ON d.adjustment_id = h.id
            WHERE d.item_id = ? AND h.status = 'Posted'
        `, [item.id]);

        // 4. Conversions
        const convs = await connection.query(`
            SELECT CASE WHEN icd.detail_type = 'OUTPUT' THEN 'IN' ELSE 'OUT' END as dir,
                   'CNV' as type, ic.doc_date, ic.created_at, icd.quantity, icd.location_id
            FROM ItemConversionDetails icd JOIN ItemConversions ic ON icd.conversion_id = ic.id
            WHERE icd.item_id = ? AND ic.status = 'Posted'
        `, [item.id]);

        const all = [...rxs, ...shs, ...adjs, ...convs];
        all.sort((a, b) => new Date(a.doc_date) - new Date(b.doc_date));

        let balance = 0;
        console.log('\n--- STOCK FLOW ---');
        console.log('Date       | Type | Dir | Qty | Bal | Loc');
        console.log('-------------------------------------------');
        all.forEach(t => {
            const qty = Number(t.quantity);
            if (t.dir === 'IN') balance += qty; else balance -= qty;
            console.log(`${new Date(t.doc_date).toISOString().slice(0, 10)} | ${t.type}  | ${t.dir} | ${qty}   | ${balance}   | ${t.location_id || '-'}`);
        });

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

run();
