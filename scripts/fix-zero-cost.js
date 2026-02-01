
import odbc from 'odbc';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};Uid=${process.env.DB_USER};Pwd=${process.env.DB_PASSWORD};`;

async function fixZeroCosts() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected to database. Scanning for zero cost items...');

        // 1. Get items with 0 cost but positive quantity
        const zeroCostItems = await connection.query(`
            SELECT item_id, warehouse_id, location_id, quantity 
            FROM ItemStocks 
            WHERE quantity > 0 AND (average_cost IS NULL OR average_cost = 0)
        `);

        console.log(`Found ${zeroCostItems.length} items with zero cost.`);

        let updatedCount = 0;

        for (const stock of zeroCostItems) {
            // 2. Find reference cost for this item in the same warehouse (or typically any warehouse, but same warehouse is safer)
            // Prioritize same warehouse.
            let refCostResult = await connection.query(`
                SELECT TOP 1 average_cost 
                FROM ItemStocks 
                WHERE item_id = ? AND average_cost > 0 AND warehouse_id = ?
                ORDER BY last_updated DESC
            `, [stock.item_id, stock.warehouse_id]);

            if (refCostResult.length === 0) {
                // Try any warehouse
                refCostResult = await connection.query(`
                    SELECT TOP 1 average_cost 
                    FROM ItemStocks 
                    WHERE item_id = ? AND average_cost > 0
                    ORDER BY last_updated DESC
                `, [stock.item_id]);
            }

            // Fallback to Item Standard Cost
            if (refCostResult.length === 0) {
                refCostResult = await connection.query(`
                    SELECT standard_cost as average_cost
                    FROM Items
                    WHERE id = ?
                 `, [stock.item_id]);
            }

            if (refCostResult.length > 0 && refCostResult[0].average_cost > 0) {
                const newCost = refCostResult[0].average_cost;

                // 3. Update
                await connection.query(`
                    UPDATE ItemStocks 
                    SET average_cost = ? 
                    WHERE item_id = ? AND warehouse_id = ? AND location_id = ?
                `, [newCost, stock.item_id, stock.warehouse_id, stock.location_id]);

                console.log(`Updated ItemID ${stock.item_id} at WH ${stock.warehouse_id} Loc ${stock.location_id}. Cost: 0 -> ${newCost}`);
                updatedCount++;
            } else {
                console.log(`Could not find reference cost for ItemID ${stock.item_id}.`);
            }
        }

        console.log(`Finished. Updated ${updatedCount} records.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.close();
    }
}

fixZeroCosts();
