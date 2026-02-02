
import odbc from 'odbc';

const connectionString = `Driver={SQL Anywhere 17};Host=localhost:2638;DatabaseName=JAGATRAYA_V17;UID=dba;PWD=sql123`;

async function run() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');
        const itemId = 1;
        const endDate = '2026-01-31';

        console.log('Testing Rx Minimal...');
        try {
            await connection.query(`
                SELECT r.doc_date
                FROM Receivings r
                WHERE r.doc_date <= ?
            `, [endDate]);
            console.log('Rx Minimal OK');
        } catch (e) { console.error('Rx Minimal Fail:', e.message); }

        console.log('Testing Rx With CreatedAt...');
        try {
            await connection.query(`
                SELECT r.created_at
                FROM Receivings r
                WHERE r.doc_date <= ?
            `, [endDate]);
            console.log('Rx CreatedAt OK');
        } catch (e) { console.error('Rx CreatedAt Fail:', e.message); }

        console.log('Testing Sh Minimal...');
        try {
            await connection.query(`
                SELECT s.doc_date
                FROM Shipments s
                WHERE s.doc_date <= ?
            `, [endDate]);
            console.log('Sh Minimal OK');
        } catch (e) { console.error('Sh Minimal Fail:', e.message); }

        console.log('Testing Sh With CreatedAt...');
        try {
            await connection.query(`
                SELECT s.created_at
                FROM Shipments s
                WHERE s.doc_date <= ?
            `, [endDate]);
            console.log('Sh CreatedAt OK');
        } catch (e) { console.error('Sh CreatedAt Fail:', e.message); }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (connection) await connection.close();
    }
}

run();
