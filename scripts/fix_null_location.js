
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to DB');

        const itemId = 1;
        const defaultLocId = 2; // L1-01 (Standard)

        console.log('Updating ReceivingDetails with NULL location...');

        const res = await connection.query(`
            UPDATE ReceivingDetails 
            SET location_id = ? 
            WHERE item_id = ? AND (location_id IS NULL OR location_id = 0)
        `, [defaultLocId, itemId]);

        console.log('Update Result:', res);

        await connection.close();
        console.log('Done.');

    } catch (e) {
        console.error(e);
    }
}

run();
