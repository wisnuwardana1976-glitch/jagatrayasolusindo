import dotenv from 'dotenv';
import odbc from 'odbc';

dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};UID=${process.env.DB_USER};PWD=${process.env.DB_PASSWORD}`;

async function fixLocationsCorrectly() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);

        console.log('Fetching ALL stocks...');
        const allStocks = await connection.query(`SELECT id, warehouse_id, location_id FROM ItemStocks`);

        for (const stock of allStocks) {
            // Check if current location belongs to the warehouse
            let isValid = false;
            let currentLocationWhId = null;

            if (stock.location_id) {
                const locCheck = await connection.query(`
                    SELECT sw.warehouse_id
                    FROM Locations l
                    JOIN SubWarehouses sw ON l.sub_warehouse_id = sw.id
                    WHERE l.id = ?
                `, [stock.location_id]);

                if (locCheck.length > 0) {
                    currentLocationWhId = locCheck[0].warehouse_id;
                    if (currentLocationWhId == stock.warehouse_id) {
                        isValid = true;
                    }
                }
            }

            if (!isValid) {
                console.log(`Stock ID ${stock.id} has invalid/null location ${stock.location_id} (Host WH: ${stock.warehouse_id}, Loc WH: ${currentLocationWhId}). Fixing...`);

                // Find correct location
                const correctLocs = await connection.query(`
                    SELECT TOP 1 l.id
                    FROM Locations l
                    JOIN SubWarehouses sw ON l.sub_warehouse_id = sw.id
                    WHERE sw.warehouse_id = ?
                `, [stock.warehouse_id]);

                if (correctLocs.length > 0) {
                    const newLocationId = correctLocs[0].id;
                    await connection.query(`UPDATE ItemStocks SET location_id = ? WHERE id = ?`, [newLocationId, stock.id]);
                    console.log(`-> Fixed: Updated to Location ID ${newLocationId}`);
                } else {
                    console.log(`-> Failed: No valid location found for Warehouse ${stock.warehouse_id}`);
                }
            } else {
                // console.log(`Stock ID ${stock.id} is valid.`);
            }
        }

        console.log('Correction complete.');

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

fixLocationsCorrectly();
