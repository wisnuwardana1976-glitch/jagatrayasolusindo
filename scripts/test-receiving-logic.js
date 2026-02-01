
import odbc from 'odbc';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = `Driver={SQL Anywhere 17};Host=${process.env.DB_HOST}:${process.env.DB_PORT};DatabaseName=${process.env.DB_NAME};Uid=${process.env.DB_USER};Pwd=${process.env.DB_PASSWORD};`;

async function testReceiving() {
    let connection;
    try {
        connection = await odbc.connect(connectionString);
        console.log('Connected.');

        // 1. Setup Test Data
        // Let's use Cas001 (ID 4) for testing.
        const itemId = 4;
        const locationId = 1; // Default location
        const warehouseId = 1; // Default warehouse for location 1

        console.log('--- Initial Stock ---');
        const initialStock = await connection.query(`SELECT quantity, average_cost FROM ItemStocks WHERE item_id = ? AND location_id = ?`, [itemId, locationId]);
        console.log(initialStock);

        // 2. Create Receiving Draft
        console.log('--- Creating Receiving ---');
        const resHeader = await connection.query(`
            INSERT INTO Receivings (doc_number, doc_date, location_id, status)
            VALUES (?, ?, ?, ?)
        `, ['REC-TEST-001', '2026-02-01', locationId, 'Draft']);
        const idHeaderRes = await connection.query('SELECT @@IDENTITY as id');
        const recId = Number(idHeaderRes[0].id);

        await connection.query(`
            INSERT INTO ReceivingDetails (receiving_id, item_id, quantity)
            VALUES (?, ?, ?)
        `, [recId, itemId, 10]);

        // 3. Trigger Approve (Simulating the API logic manually since I can't easily fetch from localhost:3001 in this environment without axios/fetch, better to call the DB logic or just use fetch if available)
        // I will use fetch to call the actual API I just created to ensure it's working end-to-end.
        console.log('--- Approving Receiving (API Call) ---');
        const approveResp = await fetch(`http://localhost:3001/api/receivings/${recId}/approve`, { method: 'PUT' });
        const approveData = await approveResp.json();
        console.log('Approve result:', approveData);

        // 4. Verify Stock
        console.log('--- Stock After Approve ---');
        const stockAfterApprove = await connection.query(`SELECT quantity, average_cost FROM ItemStocks WHERE item_id = ? AND location_id = ?`, [itemId, locationId]);
        console.log(stockAfterApprove);

        // 5. Trigger Unapprove
        console.log('--- Unapproving Receiving (API Call) ---');
        const unapproveResp = await fetch(`http://localhost:3001/api/receivings/${recId}/unapprove`, { method: 'PUT' });
        const unapproveData = await unapproveResp.json();
        console.log('Unapprove result:', unapproveData);

        // 6. Verify Stock
        console.log('--- Stock After Unapprove ---');
        const stockAfterUnapprove = await connection.query(`SELECT quantity, average_cost FROM ItemStocks WHERE item_id = ? AND location_id = ?`, [itemId, locationId]);
        console.log(stockAfterUnapprove);

        // Cleanup
        await connection.query('DELETE FROM ReceivingDetails WHERE receiving_id = ?', [recId]);
        await connection.query('DELETE FROM Receivings WHERE id = ?', [recId]);

    } catch (e) {
        console.error(e);
    } finally {
        if (connection) await connection.close();
    }
}

testReceiving();
