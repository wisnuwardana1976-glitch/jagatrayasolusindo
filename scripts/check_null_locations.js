
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        console.log('\n--- Checking Receivings with NULL location_id ---');
        const rxNull = await connection.query(`
            SELECT r.id, r.doc_number, r.location_id as header_loc, rd.location_id as detail_loc, rd.item_id, i.code
            FROM Receivings r
            JOIN ReceivingDetails rd ON r.id = rd.receiving_id
            JOIN Items i ON rd.item_id = i.id
            WHERE r.location_id IS NULL AND rd.location_id IS NULL
        `);
        console.log('Receivings with NULL Loc:', rxNull.length);
        if (rxNull.length > 0) console.log(JSON.stringify(rxNull.slice(0, 5), null, 2));

        console.log('\n--- Checking Item Conversions with NULL location_id ---');
        const cnvNull = await connection.query(`
            SELECT ic.id, ic.doc_number, icd.location_id, icd.item_id, i.code
            FROM ItemConversions ic
            JOIN ItemConversionDetails icd ON ic.id = icd.conversion_id
            JOIN Items i ON icd.item_id = i.id
            WHERE icd.location_id IS NULL
        `);
        console.log('Conversions with NULL Loc:', cnvNull.length);
        if (cnvNull.length > 0) console.log(JSON.stringify(cnvNull.slice(0, 5), null, 2));

        console.log('\n--- Checking Adjusted Inventory with NULL location_id ---');
        const adjNull = await connection.query(`
            SELECT h.id, h.doc_number, d.location_id, d.item_id, i.code
            FROM InventoryAdjustments h
            JOIN InventoryAdjustmentDetails d ON h.id = d.adjustment_id
            JOIN Items i ON d.item_id = i.id
            WHERE d.location_id IS NULL
        `);
        console.log('Adjustments with NULL Loc:', adjNull.length);
        if (adjNull.length > 0) console.log(JSON.stringify(adjNull.slice(0, 5), null, 2));

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

run();
