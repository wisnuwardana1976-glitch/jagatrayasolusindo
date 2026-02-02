
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        console.log('Location 2 details:');
        const loc = await connection.query(`
            SELECT l.id, l.name, sw.id as sw_id, sw.warehouse_id as wh_id
            FROM Locations l
            LEFT JOIN SubWarehouses sw ON l.sub_warehouse_id = sw.id
            WHERE l.id = 2
        `);
        console.log(JSON.stringify(loc, null, 2));

        console.log('Location 4 details:');
        const loc4 = await connection.query(`
            SELECT l.id, l.name, sw.id as sw_id, sw.warehouse_id as wh_id
            FROM Locations l
            LEFT JOIN SubWarehouses sw ON l.sub_warehouse_id = sw.id
            WHERE l.id = 4
        `);
        console.log(JSON.stringify(loc4, null, 2));

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (connection) await connection.close();
    }
}

run();
