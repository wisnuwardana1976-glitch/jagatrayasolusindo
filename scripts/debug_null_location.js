
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to DB');

        const itemId = 1; // COM001

        // 1. Check ItemStocks
        console.log('\n--- ItemStocks ---');
        const stocks = await connection.query(`SELECT * FROM ItemStocks WHERE item_id = ?`, [itemId]);
        stocks.forEach(s => console.log(JSON.stringify(s)));

        // 2. Check Receivings (IN)
        console.log('\n--- Receivings (Missing Location) ---');
        const rx = await connection.query(`
            SELECT r.doc_number, rd.quantity, rd.location_id 
            FROM ReceivingDetails rd JOIN Receivings r ON rd.receiving_id = r.id 
            WHERE rd.item_id = ? AND (rd.location_id IS NULL OR rd.location_id = 0)
        `, [itemId]);
        if (rx.length > 0) {
            rx.forEach(r => console.log(JSON.stringify(r)));
        } else {
            console.log('None.');
        }

        // 3. Check Conversions (IN/OUT)
        console.log('\n--- Conversions (Missing Location) ---');
        const conv = await connection.query(`
            SELECT ic.doc_number, icd.quantity, icd.detail_type, icd.location_id 
            FROM ItemConversionDetails icd JOIN ItemConversions ic ON icd.conversion_id = ic.id 
            WHERE icd.item_id = ? AND (icd.location_id IS NULL OR icd.location_id = 0)
        `, [itemId]);
        if (conv.length > 0) {
            conv.forEach(r => console.log(JSON.stringify(r)));
        } else {
            console.log('None.');
        }

        // 4. Check Adjustments
        console.log('\n--- Adjustments (Missing Location) ---');
        const adj = await connection.query(`
            SELECT h.doc_number, d.quantity, d.location_id 
            FROM InventoryAdjustmentDetails d JOIN InventoryAdjustments h ON d.adjustment_id = h.id 
            WHERE d.item_id = ? AND (d.location_id IS NULL OR d.location_id = 0)
        `, [itemId]);
        if (adj.length > 0) {
            adj.forEach(r => console.log(JSON.stringify(r)));
        } else {
            console.log('None.');
        }

        await connection.close();

    } catch (e) {
        console.error(e);
    }
}

run();
