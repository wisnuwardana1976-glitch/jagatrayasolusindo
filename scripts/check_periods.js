
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    try {
        const connection = await odbc.connect(connectionString);
        console.log('Connected to DB');

        console.log('Checking for Periods table:');
        const tables = await connection.query(`SELECT table_name FROM systable WHERE table_name = 'Periods' OR table_name = 'AccountingPeriods'`);

        console.log('Tables:', tables);

        await connection.close();

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();
