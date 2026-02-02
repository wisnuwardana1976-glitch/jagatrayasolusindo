
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to DB');

        const items = [7, 6]; // Harddisk, Casing
        const warehouseId = 2; // Assuming WH ID 2

        for (const itemId of items) {
            console.log(`\nChecking Item ID: ${itemId}`);

            let convQuery = `
                SELECT 
                  CASE WHEN icd.detail_type = 'OUTPUT' THEN 'IN' ELSE 'OUT' END as dir,
                  icd.detail_type,
                  'CNV' as type, ic.doc_date, ic.created_at,
                  icd.quantity,
                  icd.unit_cost as cost,
                  w.id as warehouse_id,
                  icd.location_id,
                  ic.status
                FROM ItemConversionDetails icd
                JOIN ItemConversions ic ON icd.conversion_id = ic.id
                LEFT JOIN Locations l ON icd.location_id = l.id
                LEFT JOIN SubWarehouses sw ON l.sub_warehouse_id = sw.id
                LEFT JOIN Warehouses w ON sw.warehouse_id = w.id
                WHERE icd.item_id = ? AND ic.status = 'Posted'
              `;

            const res1 = await connection.query(convQuery, [itemId]);
            console.log(`Found ${res1.length} conversions (No WH Filter).`);
            res1.forEach(r => console.log(`  - DetailType: '${r.detail_type}' -> Dir: ${r.dir}, Qty: ${r.quantity}, Loc: ${r.location_id}`));

            if (warehouseId) {
                const queryWithWh = convQuery + ` AND w.id = ${warehouseId}`;
                const res2 = await connection.query(queryWithWh, [itemId]);
                console.log(`Found ${res2.length} conversions (WITH WH Filter ID ${warehouseId}).`);
            }
        }

        await connection.close();

    } catch (e) {
        console.error(e);
    }
}

run();
