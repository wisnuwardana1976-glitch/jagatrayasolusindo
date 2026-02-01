
import odbc from 'odbc';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function debugPost() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        connection = await odbc.connect(connectionString);

        // 1. Get the latest Draft item conversion
        const [conv] = await connection.query(`SELECT TOP 1 * FROM ItemConversions WHERE status = 'Draft' ORDER BY id DESC`);
        if (!conv) {
            console.log('No draft conversion found.');
            return;
        }
        console.log(`Found conversion ID: ${conv.id}`);

        // 2. Get details
        const details = await connection.query('SELECT * FROM ItemConversionDetails WHERE conversion_id = ?', [conv.id]);
        console.log(`Found ${details.length} details.`);

        // 3. Simulate processing
        for (const item of details) {
            console.log(`Processing item ${item.item_id}, location: ${item.location_id}, type: ${item.detail_type}`);

            if (!item.location_id) {
                console.log('Skipping item with no location_id');
                continue;
            }

            const [locInfo] = await connection.query(`
                SELECT w.id as warehouse_id
                FROM Locations l
                JOIN SubWarehouses sw ON l.sub_warehouse_id = sw.id
                JOIN Warehouses w ON sw.warehouse_id = w.id
                WHERE l.id = ?
            `, [item.location_id]);

            if (!locInfo) {
                console.error(`❌ Warehouse not found for location ID ${item.location_id}`);
                continue;
            }
            console.log(`✅ Found warehouse_id: ${locInfo.warehouse_id}`);

            // Check stock query
            console.log('Querying stock...');
            const [existingStock] = await connection.query(
                'SELECT * FROM ItemStocks WHERE item_id = ? AND warehouse_id = ?',
                [item.item_id, locInfo.warehouse_id]
            );
            console.log(`Stock found: ${existingStock ? existingStock.quantity : 'None'}`);

            if (existingStock) {
                console.log(`Current Avg Cost: ${existingStock.average_cost}`);

                // Try UPDATE simulation
                try {
                    console.log('Simulating UPDATE...');
                    await connection.query('BEGIN TRANSACTION');
                    await connection.query(
                        'UPDATE ItemStocks SET quantity = quantity, last_updated = CURRENT TIMESTAMP WHERE item_id = ? AND warehouse_id = ?',
                        [item.item_id, locInfo.warehouse_id]
                    );
                    console.log('✅ UPDATE success!');
                    await connection.query('ROLLBACK');
                } catch (e) {
                    console.error('❌ UPDATE failed:', e.message);
                    await connection.query('ROLLBACK');
                }
            } else {
                console.log('No existing stock, skipping Update test.');
            }
        }

    } catch (error) {
        console.error('❌ Error details:', error);
    } finally {
        if (connection) await connection.close();
    }
}

debugPost();
