
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);

        console.log(`\nChecking Adjustments for Item 1:`);
        const adj = await connection.query(`
            SELECT h.doc_number, d.quantity
            FROM InventoryAdjustmentDetails d JOIN InventoryAdjustments h ON d.adjustment_id = h.id 
            WHERE d.item_id = 1 AND h.status = 'Posted'
        `);
        console.log(`Found ${adj.length} adjustments.`);
        adj.forEach(a => console.log(JSON.stringify(a)));

        await connection.close();
    } catch (e) { console.error(e); }
}

run();
