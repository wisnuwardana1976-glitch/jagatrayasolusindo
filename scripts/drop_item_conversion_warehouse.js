
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to DB');

        console.log('Dropping warehouse_id from ItemConversions...');
        await connection.query(`ALTER TABLE ItemConversions DROP warehouse_id`);
        console.log('Column dropped successfully.');

        await connection.close();

    } catch (e) {
        console.error('Error dropping column:', e.message);
    }
}

run();
