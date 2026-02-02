
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        console.log('Dropping FK Warehouses...');
        try {
            await connection.query(`ALTER TABLE ItemConversions DROP FOREIGN KEY Warehouses`);
            console.log('FK Dropped.');
        } catch (e) {
            console.log('FK Drop Error (maybe already gone):', e.message);
        }

        console.log('Dropping Column warehouse_id...');
        try {
            await connection.query(`ALTER TABLE ItemConversions DROP warehouse_id`);
            console.log('Column Dropped.');
        } catch (e) {
            console.error('Column Drop Error:', e.message);
        }

    } catch (e) {
        console.error('Connection Error:', e);
    } finally {
        if (connection) await connection.close();
    }
}

run();
