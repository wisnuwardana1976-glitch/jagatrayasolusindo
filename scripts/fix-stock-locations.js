import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function fixLocations() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('Fetching stocks with NULL location_id...');
        const nullStocks = await connection.query(`
            SELECT id, item_id, warehouse_id 
            FROM ItemStocks 
            WHERE location_id IS NULL
        `);

        console.log(`Found ${nullStocks.length} records with NULL location_id.`);

        for (const stock of nullStocks) {
            console.log(`Processing stock ID ${stock.id}, Warehouse ID ${stock.warehouse_id}...`);

            // Find a valid location for this warehouse
            const locParams = await connection.query(`
                SELECT TOP 1 l.id
                FROM Locations l
                JOIN SubWarehouses sw ON l.sub_warehouse_id = sw.id
                WHERE sw.warehouse_id = ?
            `, [stock.warehouse_id]);

            if (locParams.length > 0) {
                const newLocationId = locParams[0].id;
                await connection.query(`
                    UPDATE ItemStocks 
                    SET location_id = ? 
                    WHERE id = ?
                `, [newLocationId, stock.id]);
                console.log(`Updated stock ID ${stock.id} to Location ID ${newLocationId}`);
            } else {
                console.log(`No location found for Warehouse ID ${stock.warehouse_id}`);
            }
        }

        console.log('Fix complete.');

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

fixLocations();
